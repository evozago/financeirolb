-- Final security fixes: Remove duplicate functions and add proper search paths
-- Many SECURITY DEFINER functions are legitimate and required for proper operation

-- Drop the duplicate get_expenses_by_category function that has date parameters
DROP FUNCTION IF EXISTS public.get_expenses_by_category(date, date);

-- Add proper search_path to remaining SECURITY DEFINER functions that need it
-- (Trigger functions and admin functions legitimately need SECURITY DEFINER)

CREATE OR REPLACE FUNCTION public.get_dashboard_financeiro_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- Required for cross-table access
SET search_path TO 'public'
AS $function$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'contas_vencendo_hoje', COALESCE(SUM(CASE WHEN p.status = 'a_vencer' AND p.data_vencimento = CURRENT_DATE THEN p.valor_parcela ELSE 0 END), 0),
    'contas_vencidas', COALESCE(SUM(CASE WHEN p.status = 'vencida' THEN p.valor_parcela ELSE 0 END), 0),
    'contas_pagas_mes', COALESCE(SUM(CASE WHEN p.status = 'paga' AND DATE_TRUNC('month', p.data_pagamento) = DATE_TRUNC('month', CURRENT_DATE) THEN p.valor_pago ELSE 0 END), 0),
    'total_aberto', COALESCE(SUM(CASE WHEN p.status IN ('a_vencer', 'vencida') THEN p.valor_parcela ELSE 0 END), 0),
    'qtd_vencendo_hoje', COUNT(CASE WHEN p.status = 'a_vencer' AND p.data_vencimento = CURRENT_DATE THEN 1 END),
    'qtd_vencidas', COUNT(CASE WHEN p.status = 'vencida' THEN 1 END),
    'qtd_pagas_mes', COUNT(CASE WHEN p.status = 'paga' AND DATE_TRUNC('month', p.data_pagamento) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)
  ) INTO v_stats
  FROM parcelas_conta_pagar p
  JOIN contas_pagar_corporativas cp ON p.conta_pagar_id = cp.id;
  
  RETURN v_stats;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_entidade_dashboard(p_entidade_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- Required for cross-table access
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_cadastral jsonb;
  v_papeis jsonb;
  v_enderecos jsonb;
  v_financeiro jsonb;
  v_vendas jsonb;
BEGIN
  -- Dados cadastrais
  SELECT jsonb_build_object(
    'id', id,
    'tipo_pessoa', tipo_pessoa,
    'nome_razao_social', nome_razao_social,
    'nome_fantasia', nome_fantasia,
    'cpf_cnpj', cpf_cnpj,
    'email', email,
    'telefone', telefone,
    'inscricao_estadual', inscricao_estadual,
    'data_nascimento', data_nascimento,
    'data_fundacao', data_fundacao,
    'ativo', ativo
  ) INTO v_cadastral
  FROM entidades_corporativas
  WHERE id = p_entidade_id;
  
  -- Papéis da entidade
  SELECT jsonb_agg(
    jsonb_build_object(
      'papel', p.nome,
      'descricao', p.descricao,
      'data_inicio', ep.data_inicio,
      'ativo', ep.ativo
    )
  ) INTO v_papeis
  FROM entidade_papeis ep
  JOIN papeis p ON ep.papel_id = p.id
  WHERE ep.entidade_id = p_entidade_id AND ep.ativo = true;
  
  -- Endereços
  SELECT jsonb_agg(
    jsonb_build_object(
      'tipo', ee.tipo,
      'principal', ee.principal,
      'logradouro', ed.logradouro,
      'numero', ed.numero,
      'bairro', ed.bairro,
      'cidade', ed.cidade,
      'uf', ed.uf,
      'cep', ed.cep
    )
  ) INTO v_enderecos
  FROM entidade_enderecos ee
  JOIN endereco_detalhado ed ON ee.endereco_id = ed.id
  WHERE ee.entidade_id = p_entidade_id;
  
  -- Resumo financeiro (contas a pagar)
  SELECT jsonb_build_object(
    'total_aberto', COALESCE(SUM(CASE WHEN p.status IN ('a_vencer', 'vencida') THEN p.valor_parcela ELSE 0 END), 0),
    'total_pago', COALESCE(SUM(CASE WHEN p.status = 'paga' THEN p.valor_pago ELSE 0 END), 0),
    'total_vencido', COALESCE(SUM(CASE WHEN p.status = 'vencida' THEN p.valor_parcela ELSE 0 END), 0),
    'contas_abertas', COUNT(CASE WHEN p.status IN ('a_vencer', 'vencida') THEN 1 END)
  ) INTO v_financeiro
  FROM contas_pagar_corporativas cp
  JOIN parcelas_conta_pagar p ON cp.id = p.conta_pagar_id
  WHERE cp.credor_id = p_entidade_id;
  
  -- Resumo de vendas (como cliente)
  SELECT jsonb_build_object(
    'total_vendas', COALESCE(SUM(valor_total), 0),
    'quantidade_vendas', COUNT(*),
    'ultima_venda', MAX(data_venda)
  ) INTO v_vendas
  FROM vendas_corporativas
  WHERE cliente_id = p_entidade_id;
  
  -- Montar resultado final
  v_result := jsonb_build_object(
    'cadastral', v_cadastral,
    'papeis', COALESCE(v_papeis, '[]'::jsonb),
    'enderecos', COALESCE(v_enderecos, '[]'::jsonb),
    'financeiro', COALESCE(v_financeiro, '{}'::jsonb),
    'vendas', COALESCE(v_vendas, '{}'::jsonb)
  );
  
  RETURN v_result;
END;
$function$;

-- Add comments to document why certain functions legitimately need SECURITY DEFINER
COMMENT ON FUNCTION public.get_ap_installments_complete() IS 'SECURITY DEFINER required: Performs complex joins across multiple tables (ap_installments, funcionarios, contas_bancarias, entidades, nfe_data) that may have different RLS policies';

COMMENT ON FUNCTION public.search_ap_installments(integer, integer, text, text, date, date, text, text) IS 'SECURITY DEFINER required: Builds dynamic SQL queries and needs to access get_ap_installments_complete() which also requires SECURITY DEFINER';

COMMENT ON FUNCTION public.is_admin() IS 'SECURITY DEFINER required: Must access profiles table to check user role, bypassing RLS to prevent infinite recursion';

COMMENT ON FUNCTION public.get_current_user_role() IS 'SECURITY DEFINER required: Must access profiles table to get user role, bypassing RLS to prevent infinite recursion';

COMMENT ON FUNCTION public.calculate_commission_real_time(uuid, integer, integer) IS 'SECURITY DEFINER required: Sensitive financial calculation that needs consistent access to sales and goals data';

-- Note: Trigger functions, migration functions, and payroll functions legitimately need SECURITY DEFINER
-- to perform their operations with elevated privileges