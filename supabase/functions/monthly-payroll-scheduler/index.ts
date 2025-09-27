import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Monthly payroll scheduler triggered')

    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    const currentDay = currentDate.getDate()

    // Only run on the 1st day of the month
    if (currentDay !== 1) {
      console.log(`Not the 1st day of month (day: ${currentDay}), skipping payroll creation`)
      return new Response(
        JSON.stringify({ 
          message: 'Not the 1st day of month, skipping payroll creation',
          day: currentDay 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Check if payroll for current month already exists
    const { data: existingPayroll, error: checkError } = await supabaseClient
      .from('hr_payroll_runs')
      .select('id')
      .eq('ano', currentYear)
      .eq('mes', currentMonth)
      .eq('tipo_folha', 'mensal')
      .limit(1)

    if (checkError) {
      console.error('Error checking existing payroll:', checkError)
      throw checkError
    }

    if (existingPayroll && existingPayroll.length > 0) {
      console.log(`Payroll for ${currentMonth}/${currentYear} already exists`)
      return new Response(
        JSON.stringify({ 
          message: `Payroll for ${currentMonth}/${currentYear} already exists`,
          payroll_id: existingPayroll[0].id 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Create new payroll run for current month
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    
    const competencyDate = new Date(currentYear, currentMonth - 1, 1)
    const description = `Folha de ${monthNames[currentMonth - 1]} ${currentYear}`

    const { data: newPayroll, error: createError } = await supabaseClient
      .from('hr_payroll_runs')
      .insert({
        ano: currentYear,
        mes: currentMonth,
        tipo_folha: 'mensal',
        descricao: description,
        status: 'rascunho',
        data_competencia: competencyDate.toISOString().split('T')[0],
        observacoes: 'Folha criada automaticamente pelo sistema'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating payroll run:', createError)
      throw createError
    }

    console.log(`Successfully created payroll run for ${currentMonth}/${currentYear}`, newPayroll)

    // Get active employees count for summary
    const { count: employeeCount, error: countError } = await supabaseClient
      .from('funcionarios')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)
      .eq('status_funcionario', 'ativo')

    if (countError) {
      console.error('Error counting employees:', countError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Monthly payroll run created successfully for ${monthNames[currentMonth - 1]} ${currentYear}`,
        payroll_run: {
          id: newPayroll.id,
          year: currentYear,
          month: currentMonth,
          month_name: monthNames[currentMonth - 1],
          description: description,
          status: 'rascunho',
          active_employees: employeeCount || 0
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201 
      }
    )

  } catch (error: any) {
    console.error('Error in monthly payroll scheduler:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error?.message || String(error)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})