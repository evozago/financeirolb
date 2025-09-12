import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NovaContaPagar {
  credor_id: string;
  descricao: string;
  numero_documento?: string;
  categoria_id?: string;
  data_emissao: string;
  valor_total: number;
  filial_id?: string;
  observacoes?: string;
  parcelas: {
    numero_parcela: number;
    valor_parcela: number;
    data_vencimento: string;
  }[];
}

interface PagamentoParcela {
  parcela_id: string;
  valor_pago: number;
  data_pagamento: string;
  meio_pagamento?: string;
  conta_bancaria_id?: string;
  juros?: number;
  multa?: number;
  desconto?: number;
  observacoes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  );

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');

  try {
    // POST /contas-pagar - Criar nova conta a pagar
    if (req.method === 'POST' && pathParts[pathParts.length - 1] === 'contas-pagar') {
      const contaData: NovaContaPagar = await req.json();
      
      // Validar dados
      if (!contaData.credor_id || !contaData.descricao || !contaData.data_emissao || !contaData.valor_total) {
        return new Response(
          JSON.stringify({ error: 'Dados obrigatórios faltando' }),
          { status: 400, headers: corsHeaders }
        );
      }

      if (!contaData.parcelas || contaData.parcelas.length === 0) {
        return new Response(
          JSON.stringify({ error: 'É necessário informar ao menos uma parcela' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Iniciar transação
      const { data: contaPagar, error: contaError } = await supabaseClient
        .from('contas_pagar_corporativas')
        .insert([{
          credor_id: contaData.credor_id,
          descricao: contaData.descricao,
          numero_documento: contaData.numero_documento,
          categoria_id: contaData.categoria_id,
          data_emissao: contaData.data_emissao,
          valor_total: contaData.valor_total,
          filial_id: contaData.filial_id,
          observacoes: contaData.observacoes,
          origem: 'manual',
          status: 'aberto'
        }])
        .select()
        .single();

      if (contaError) {
        console.error('Erro ao criar conta a pagar:', contaError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar conta a pagar' }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Inserir parcelas
      const parcelasData = contaData.parcelas.map(parcela => ({
        conta_pagar_id: contaPagar.id,
        numero_parcela: parcela.numero_parcela,
        total_parcelas: contaData.parcelas.length,
        valor_parcela: parcela.valor_parcela,
        data_vencimento: parcela.data_vencimento,
        status: 'a_vencer'
      }));

      const { error: parcelasError } = await supabaseClient
        .from('parcelas_conta_pagar')
        .insert(parcelasData);

      if (parcelasError) {
        console.error('Erro ao criar parcelas:', parcelasError);
        // Reverter conta criada
        await supabaseClient
          .from('contas_pagar_corporativas')
          .delete()
          .eq('id', contaPagar.id);
          
        return new Response(
          JSON.stringify({ error: 'Erro ao criar parcelas' }),
          { status: 500, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          conta_id: contaPagar.id,
          message: 'Conta a pagar criada com sucesso'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /parcelas - Listar parcelas com filtros
    if (req.method === 'GET' && pathParts[pathParts.length - 1] === 'parcelas') {
      const params = url.searchParams;
      let query = supabaseClient.from('vw_fato_parcelas').select('*');

      // Aplicar filtros
      if (params.get('status')) {
        const statusArray = params.get('status')!.split(',');
        query = query.in('status', statusArray);
      }

      if (params.get('credor_id')) {
        query = query.eq('credor_id', params.get('credor_id'));
      }

      if (params.get('filial_id')) {
        query = query.eq('filial_id', params.get('filial_id'));
      }

      if (params.get('data_inicio')) {
        query = query.gte('data_vencimento', params.get('data_inicio'));
      }

      if (params.get('data_fim')) {
        query = query.lte('data_vencimento', params.get('data_fim'));
      }

      if (params.get('search')) {
        const search = params.get('search')!;
        query = query.or(
          `credor_nome.ilike.%${search}%,conta_descricao.ilike.%${search}%,numero_documento.ilike.%${search}%`
        );
      }

      // Paginação
      const limit = parseInt(params.get('limit') || '50');
      const offset = parseInt(params.get('offset') || '0');
      
      query = query
        .order('data_vencimento', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar parcelas:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar parcelas' }),
          { status: 500, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({ 
          parcelas: data || [],
          total: count,
          limit,
          offset
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /parcelas/:id/pagar - Pagar parcela
    if (req.method === 'POST' && pathParts[pathParts.length - 1] === 'pagar') {
      const parcelaId = pathParts[pathParts.length - 2];
      const pagamentoData: PagamentoParcela = await req.json();

      // Validar dados
      if (!pagamentoData.valor_pago || !pagamentoData.data_pagamento) {
        return new Response(
          JSON.stringify({ error: 'Valor pago e data de pagamento são obrigatórios' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const { error } = await supabaseClient
        .from('parcelas_conta_pagar')
        .update({
          valor_pago: pagamentoData.valor_pago,
          data_pagamento: pagamentoData.data_pagamento,
          meio_pagamento: pagamentoData.meio_pagamento,
          conta_bancaria_id: pagamentoData.conta_bancaria_id,
          juros: pagamentoData.juros || 0,
          multa: pagamentoData.multa || 0,
          desconto: pagamentoData.desconto || 0,
          observacoes: pagamentoData.observacoes,
          status: 'paga',
        })
        .eq('id', parcelaId);

      if (error) {
        console.error('Erro ao processar pagamento:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao processar pagamento' }),
          { status: 500, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Pagamento processado com sucesso'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rota não encontrada
    return new Response(
      JSON.stringify({ error: 'Rota não encontrada' }),
      { status: 404, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Erro na API:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: corsHeaders }
    );
  }
});