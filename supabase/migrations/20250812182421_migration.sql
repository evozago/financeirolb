-- Exclude soft-deleted records from financial functions and listings
CREATE OR REPLACE FUNCTION public.get_financial_panel_stats_extended()
RETURNS TABLE(
  contas_vencendo_hoje numeric,
  contas_vencendo_hoje_count bigint,
  contas_pagas_hoje numeric,
  contas_pagas_hoje_count bigint,
  contas_vencendo_ate_fim_mes numeric,
  contas_vencendo_ate_fim_mes_count bigint,
  contas_vencidas numeric,
  contas_vencidas_count bigint,
  contas_pendentes_nao_recorrentes numeric,
  contas_pendentes_nao_recorrentes_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento = CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) AS contas_vencendo_hoje,
    COALESCE(COUNT(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento = CURRENT_DATE 
      THEN 1 END), 0) AS contas_vencendo_hoje_count,

    COALESCE(SUM(CASE 
      WHEN status = 'pago' AND data_pagamento = CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) AS contas_pagas_hoje,
    COALESCE(COUNT(CASE 
      WHEN status = 'pago' AND data_pagamento = CURRENT_DATE 
      THEN 1 END), 0) AS contas_pagas_hoje_count,

    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) 
           AND data_vencimento >= CURRENT_DATE 
           AND data_vencimento <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
      THEN valor ELSE 0 
    END), 0) AS contas_vencendo_ate_fim_mes,
    COALESCE(COUNT(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) 
           AND data_vencimento >= CURRENT_DATE 
           AND data_vencimento <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
      THEN 1 END), 0) AS contas_vencendo_ate_fim_mes_count,

    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento < CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) AS contas_vencidas,
    COALESCE(COUNT(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento < CURRENT_DATE 
      THEN 1 END), 0) AS contas_vencidas_count,

    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) 
           AND (eh_recorrente = false OR eh_recorrente IS NULL)
      THEN valor ELSE 0 
    END), 0) AS contas_pendentes_nao_recorrentes,
    COALESCE(COUNT(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) 
           AND (eh_recorrente = false OR eh_recorrente IS NULL)
      THEN 1 END), 0) AS contas_pendentes_nao_recorrentes_count
  FROM ap_installments
  WHERE deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_financial_panel_stats()
RETURNS TABLE(
  contas_vencendo_hoje numeric,
  contas_pagas_hoje numeric,
  contas_vencendo_ate_fim_mes numeric,
  contas_vencidas numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento = CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) as contas_vencendo_hoje,
    COALESCE(SUM(CASE 
      WHEN status = 'pago' AND data_pagamento = CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) as contas_pagas_hoje,
    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) 
           AND data_vencimento >= CURRENT_DATE 
           AND data_vencimento <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
      THEN valor ELSE 0 
    END), 0) as contas_vencendo_ate_fim_mes,
    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento < CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) as contas_vencidas
  FROM ap_installments
  WHERE deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(total_aberto numeric, vencendo_hoje numeric, vencidos numeric, pagos_mes_atual numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE 
      WHEN status = 'aberto' OR (status != 'pago' AND data_pagamento IS NULL) 
      THEN valor ELSE 0 
    END), 0) as total_aberto,
    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento = CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) as vencendo_hoje,
    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento < CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) as vencidos,
    COALESCE(SUM(CASE 
      WHEN status = 'pago' AND data_pagamento IS NOT NULL AND 
           EXTRACT(MONTH FROM data_pagamento) = EXTRACT(MONTH FROM CURRENT_DATE) AND 
           EXTRACT(YEAR FROM data_pagamento) = EXTRACT(YEAR FROM CURRENT_DATE) 
      THEN valor ELSE 0 
    END), 0) as pagos_mes_atual
  FROM ap_installments
  WHERE deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_expenses_by_category(
  p_start_date date DEFAULT (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))::date,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(categoria text, total_valor numeric, count_items bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ap.categoria, 'Sem Categoria') as categoria,
    COALESCE(SUM(ap.valor), 0) as total_valor,
    COUNT(*) as count_items
  FROM ap_installments ap
  WHERE ap.deleted_at IS NULL
    AND ap.data_vencimento >= p_start_date 
    AND ap.data_vencimento <= p_end_date
  GROUP BY COALESCE(ap.categoria, 'Sem Categoria')
  ORDER BY total_valor DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ap_installments_complete()
RETURNS TABLE(
  id uuid, descricao text, fornecedor text, categoria text, valor numeric, data_vencimento date, data_pagamento date, status text, status_calculado text, numero_documento text, numero_nfe_display text, banco text, forma_pagamento text, observacoes text, comprovante_path text, numero_parcela integer, total_parcelas integer, valor_total_titulo numeric, eh_recorrente boolean, tipo_recorrencia text, dados_pagamento text, data_hora_pagamento timestamp with time zone, funcionario_id uuid, funcionario_nome text, conta_bancaria_id uuid, conta_banco_nome text, entidade_id uuid, entidade_nome text, entidade_tipo text, nfe_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, valor_fixo boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.descricao,
    ap.fornecedor,
    ap.categoria,
    ap.valor,
    ap.data_vencimento,
    ap.data_pagamento,
    ap.status,
    CASE 
      WHEN ap.data_pagamento IS NOT NULL THEN 'pago'::text
      WHEN ap.data_vencimento < CURRENT_DATE THEN 'vencido'::text
      ELSE 'aberto'::text
    END as status_calculado,
    ap.numero_documento,
    COALESCE(nfe.numero_nfe, ap.numero_documento) as numero_nfe_display,
    ap.banco,
    ap.forma_pagamento,
    ap.observacoes,
    ap.comprovante_path,
    ap.numero_parcela,
    ap.total_parcelas,
    ap.valor_total_titulo,
    ap.eh_recorrente,
    ap.tipo_recorrencia,
    ap.dados_pagamento,
    ap.data_hora_pagamento,
    ap.funcionario_id,
    f.nome as funcionario_nome,
    ap.conta_bancaria_id,
    cb.nome_banco as conta_banco_nome,
    ap.entidade_id,
    e.nome as entidade_nome,
    e.tipo as entidade_tipo,
    ap.numero_nfe as nfe_id,
    ap.created_at,
    ap.updated_at,
    ap.valor_fixo
  FROM ap_installments ap
  LEFT JOIN funcionarios f ON ap.funcionario_id = f.id
  LEFT JOIN contas_bancarias cb ON ap.conta_bancaria_id = cb.id
  LEFT JOIN entidades e ON ap.entidade_id = e.id
  LEFT JOIN nfe_data nfe ON ap.numero_nfe = nfe.id
  WHERE ap.deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_ap_installments(
  p_limit integer DEFAULT 5000,
  p_offset integer DEFAULT 0,
  p_status text DEFAULT NULL::text,
  p_fornecedor text DEFAULT NULL::text,
  p_data_inicio date DEFAULT NULL::date,
  p_data_fim date DEFAULT NULL::date,
  p_categoria text DEFAULT NULL::text,
  p_search_term text DEFAULT NULL::text
)
RETURNS TABLE(data jsonb, total_count bigint, total_aberto numeric, total_vencido numeric, total_pago numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  where_clause TEXT := 'WHERE 1=1';
  count_query TEXT;
  main_query TEXT;
BEGIN
  IF p_status IS NOT NULL THEN
    where_clause := where_clause || ' AND status = ''' || p_status || '''';
  END IF;
  IF p_fornecedor IS NOT NULL THEN
    where_clause := where_clause || ' AND fornecedor ILIKE ''%' || p_fornecedor || '%''';
  END IF;
  IF p_data_inicio IS NOT NULL THEN
    where_clause := where_clause || ' AND data_vencimento >= ''' || p_data_inicio || '''';
  END IF;
  IF p_data_fim IS NOT NULL THEN
    where_clause := where_clause || ' AND data_vencimento <= ''' || p_data_fim || '''';
  END IF;
  IF p_categoria IS NOT NULL THEN
    where_clause := where_clause || ' AND categoria ILIKE ''%' || p_categoria || '%''';
  END IF;
  IF p_search_term IS NOT NULL THEN
    where_clause := where_clause || ' AND (descricao ILIKE ''%' || p_search_term || '%'' OR numero_documento ILIKE ''%' || p_search_term || '%'')';
  END IF;

  main_query := 'SELECT jsonb_agg(row_to_json(sub.*)) as data FROM (
    SELECT * FROM get_ap_installments_complete() ' || where_clause || '
    ORDER BY data_vencimento DESC, created_at DESC
    LIMIT ' || p_limit || ' OFFSET ' || p_offset || '
  ) sub';

  RETURN QUERY EXECUTE 'WITH main_data AS (' || main_query || '),
    totals AS (
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(CASE WHEN status = ''aberto'' THEN valor ELSE 0 END), 0) as total_aberto,
        COALESCE(SUM(CASE WHEN status = ''vencido'' THEN valor ELSE 0 END), 0) as total_vencido,
        COALESCE(SUM(CASE WHEN status = ''pago'' THEN valor ELSE 0 END), 0) as total_pago
      FROM ap_installments ' || where_clause || ' AND deleted_at IS NULL'
    || ')
    SELECT 
      COALESCE(main_data.data, ''[]''::jsonb) as data,
      totals.total_count,
      totals.total_aberto,
      totals.total_vencido,
      totals.total_pago
    FROM main_data, totals';
END;
$$;