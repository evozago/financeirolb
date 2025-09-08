-- Fix Security Definer Views issue
-- Change functions from SECURITY DEFINER to SECURITY INVOKER where appropriate
-- Keep SECURITY DEFINER only for functions that truly need elevated privileges

-- Functions that can safely be changed to SECURITY INVOKER
-- These functions work with data that users already have access to via RLS

CREATE OR REPLACE FUNCTION public.get_expenses_by_category()
RETURNS TABLE(categoria text, total_valor numeric, count_items bigint)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(categoria, 'Sem Categoria') as categoria,
    SUM(valor) as total_valor,
    COUNT(*)::bigint as count_items
  FROM ap_installments
  WHERE deleted_at IS NULL
  GROUP BY categoria
  ORDER BY total_valor DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_pessoa_duplicates()
RETURNS TABLE(nome text, quantidade bigint, ids text)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.nome,
    COUNT(*)::bigint as quantidade,
    string_agg(p.id::text, ', ' ORDER BY p.created_at) as ids
  FROM pessoas p
  WHERE p.ativo = true
  GROUP BY p.nome
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC, p.nome;
END;
$function$;

-- Functions that need to remain SECURITY DEFINER due to complex cross-table operations
-- but we'll add comments to document why

CREATE OR REPLACE FUNCTION public.get_ap_installments_complete()
RETURNS TABLE(id uuid, descricao text, fornecedor text, categoria text, valor numeric, data_vencimento date, data_pagamento date, status text, status_calculado text, numero_documento text, numero_nfe_display text, banco text, forma_pagamento text, observacoes text, comprovante_path text, numero_parcela integer, total_parcelas integer, valor_total_titulo numeric, eh_recorrente boolean, tipo_recorrencia text, dados_pagamento text, data_hora_pagamento timestamp with time zone, funcionario_id uuid, funcionario_nome text, conta_bancaria_id uuid, conta_banco_nome text, entidade_id uuid, entidade_nome text, entidade_tipo text, nfe_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, valor_fixo boolean)
LANGUAGE plpgsql
SECURITY DEFINER  -- Kept as SECURITY DEFINER - needs to join across multiple tables with different RLS policies
SET search_path TO ''
AS $function$
BEGIN
  -- SECURITY DEFINER required: This function performs complex joins across
  -- multiple tables (ap_installments, funcionarios, contas_bancarias, entidades, nfe_data)
  -- that may have different RLS policies
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
$function$;

CREATE OR REPLACE FUNCTION public.search_ap_installments(p_limit integer DEFAULT 5000, p_offset integer DEFAULT 0, p_status text DEFAULT NULL::text, p_fornecedor text DEFAULT NULL::text, p_data_inicio date DEFAULT NULL::date, p_data_fim date DEFAULT NULL::date, p_categoria text DEFAULT NULL::text, p_search_term text DEFAULT NULL::text)
RETURNS TABLE(data jsonb, total_count bigint, total_aberto numeric, total_vencido numeric, total_pago numeric)
LANGUAGE plpgsql
SECURITY DEFINER  -- Kept as SECURITY DEFINER - needs to perform complex aggregations and dynamic queries
SET search_path TO 'public'
AS $function$
DECLARE
  where_clause TEXT := 'WHERE 1=1';
  count_query TEXT;
  main_query TEXT;
BEGIN
  -- SECURITY DEFINER required: This function builds dynamic SQL queries
  -- and needs to access get_ap_installments_complete() which also requires SECURITY DEFINER
  
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
$function$;