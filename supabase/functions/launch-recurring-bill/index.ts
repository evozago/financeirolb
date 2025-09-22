import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { billId } = await req.json()

    if (!billId) {
      return new Response(
        JSON.stringify({ error: 'billId é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 1. Buscar os dados da conta recorrente
    const { data: bills, error: fetchError } = await supabaseAdmin
      .from('recurring_bills')
      .select(`
        *,
        supplier:fornecedores(nome),
        category:categorias_produtos(nome)
      `)
      .eq('id', billId)

    if (fetchError) {
      console.error('Erro ao buscar conta recorrente:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar conta recorrente' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!bills || bills.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Conta recorrente não encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const bill = bills[0]

    // 2. Calcular a data de vencimento para o mês atual
    const today = new Date()
    const dueDay = bill.due_day
    let dueDate: Date

    // Se o dia já passou no mês atual, usar o próximo mês
    if (today.getDate() > dueDay) {
      if (today.getMonth() === 11) {
        dueDate = new Date(today.getFullYear() + 1, 0, dueDay)
      } else {
        dueDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay)
      }
    } else {
      dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay)
    }

    // 3. Verificar se já existe uma conta a pagar para este mês (só se não for recorrente livre)
    if (!bill.recorrente_livre) {
      const { data: existing } = await supabaseAdmin
        .from('ap_installments')
        .select('id')
        .eq('fornecedor_id', bill.supplier_id)
        .eq('data_vencimento', dueDate.toISOString().split('T')[0])
        .eq('eh_recorrente', true)

      if (existing && existing.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Já existe uma conta a pagar para este fornecedor neste mês' }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // 4. Criar a nova conta a pagar
    const newPayable = {
      descricao: bill.name,
      fornecedor_id: bill.supplier_id,
      fornecedor: bill.supplier?.nome || 'N/A',
      valor: bill.expected_amount,
      data_vencimento: dueDate.toISOString().split('T')[0],
      data_emissao: today.toISOString().split('T')[0],
      categoria: bill.category?.nome || 'Geral',
      status: 'aberto',
      numero_parcela: 1,
      total_parcelas: 1,
      valor_total_titulo: bill.expected_amount,
      eh_recorrente: true,
      filial_id: bill.filial_id,
      observacoes: `Lançamento automático da conta recorrente: ${bill.name}${bill.recorrente_livre ? ' (Recorrente Livre)' : ''}`,
    }

    // 5. Inserir na tabela ap_installments
    const { data, error: insertError } = await supabaseAdmin
      .from('ap_installments')
      .insert(newPayable)
      .select()

    if (insertError) {
      console.error('Erro ao inserir conta a pagar:', insertError)
      return new Response(
        JSON.stringify({ error: 'Erro ao criar conta a pagar' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data[0],
        message: `Conta "${bill.name}" lançada com sucesso para ${dueDate.toLocaleDateString('pt-BR')}!`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro interno:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})