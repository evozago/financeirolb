-- Final batch of Security Definer Views fixes
-- Convert remaining functions from SECURITY DEFINER to SECURITY INVOKER where safe

CREATE OR REPLACE FUNCTION public.get_sales_kpi_data(p_year integer, p_month integer)
RETURNS TABLE(total_sales numeric, total_goal numeric, goal_achievement_percentage numeric, mom_growth_percentage numeric, yoy_growth_percentage numeric, active_salespeople integer, top_performer_name text, top_performer_sales numeric)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_previous_month_sales numeric;
  v_previous_year_sales numeric;
BEGIN
  -- Get current month totals
  SELECT 
    COALESCE(SUM(v.valor_venda), 0),
    COALESCE(SUM(m.meta_valor), 0)
  INTO total_sales, total_goal
  FROM vendas v
  RIGHT JOIN metas_mensais m ON v.vendedora_id = m.vendedora_id 
    AND EXTRACT(YEAR FROM v.data_venda) = m.ano 
    AND EXTRACT(MONTH FROM v.data_venda) = m.mes
  WHERE m.ano = p_year AND m.mes = p_month;
  
  -- Calculate goal achievement percentage
  goal_achievement_percentage := CASE 
    WHEN total_goal > 0 THEN ROUND((total_sales / total_goal * 100), 2)
    ELSE 0 
  END;
  
  -- Get previous month sales for MoM growth
  SELECT COALESCE(SUM(valor_venda), 0)
  INTO v_previous_month_sales
  FROM vendas
  WHERE EXTRACT(YEAR FROM data_venda) = CASE 
      WHEN p_month = 1 THEN p_year - 1 ELSE p_year 
    END
    AND EXTRACT(MONTH FROM data_venda) = CASE 
      WHEN p_month = 1 THEN 12 ELSE p_month - 1 
    END;
  
  -- Calculate MoM growth
  mom_growth_percentage := CASE 
    WHEN v_previous_month_sales > 0 THEN 
      ROUND(((total_sales - v_previous_month_sales) / v_previous_month_sales * 100), 2)
    ELSE 0 
  END;
  
  -- Get previous year sales for YoY growth
  SELECT COALESCE(SUM(valor_venda), 0)
  INTO v_previous_year_sales
  FROM vendas
  WHERE EXTRACT(YEAR FROM data_venda) = p_year - 1
    AND EXTRACT(MONTH FROM data_venda) = p_month;
  
  -- Calculate YoY growth
  yoy_growth_percentage := CASE 
    WHEN v_previous_year_sales > 0 THEN 
      ROUND(((total_sales - v_previous_year_sales) / v_previous_year_sales * 100), 2)
    ELSE 0 
  END;
  
  -- Get active salespeople count
  SELECT COUNT(*)
  INTO active_salespeople
  FROM vendedoras
  WHERE ativo = true;
  
  -- Get top performer
  SELECT v.nome, COALESCE(SUM(vn.valor_venda), 0)
  INTO top_performer_name, top_performer_sales
  FROM vendedoras v
  LEFT JOIN vendas vn ON v.id = vn.vendedora_id 
    AND EXTRACT(YEAR FROM vn.data_venda) = p_year 
    AND EXTRACT(MONTH FROM vn.data_venda) = p_month
  WHERE v.ativo = true
  GROUP BY v.id, v.nome
  ORDER BY COALESCE(SUM(vn.valor_venda), 0) DESC
  LIMIT 1;
  
  RETURN NEXT;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_entidades_corporativas(p_query text DEFAULT NULL::text, p_papel text DEFAULT NULL::text, p_limite integer DEFAULT 50, p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid, tipo_pessoa text, nome_razao_social text, nome_fantasia text, cpf_cnpj text, email text, telefone text, papeis text[], ativo boolean)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    e.id,
    e.tipo_pessoa,
    e.nome_razao_social,
    e.nome_fantasia,
    e.cpf_cnpj,
    e.email,
    e.telefone,
    ARRAY_AGG(DISTINCT p.nome) as papeis,
    e.ativo
  FROM entidades_corporativas e
  LEFT JOIN entidade_papeis ep ON e.id = ep.entidade_id AND ep.ativo = true
  LEFT JOIN papeis p ON ep.papel_id = p.id
  WHERE (p_query IS NULL OR (
    e.nome_razao_social ILIKE '%' || p_query || '%' OR
    e.nome_fantasia ILIKE '%' || p_query || '%' OR
    e.cpf_cnpj ILIKE '%' || p_query || '%' OR
    e.email ILIKE '%' || p_query || '%'
  ))
  AND (p_papel IS NULL OR p.nome = p_papel)
  AND e.ativo = true
  GROUP BY e.id, e.tipo_pessoa, e.nome_razao_social, e.nome_fantasia, e.cpf_cnpj, e.email, e.telefone, e.ativo
  ORDER BY e.nome_razao_social
  LIMIT p_limite OFFSET p_offset;
END;
$function$;

-- Fix remaining functions by adding proper search_path for those that must remain SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.calculate_commission_real_time(p_vendedora_id uuid, p_year integer, p_month integer)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER  -- Must remain SECURITY DEFINER for commission calculations
SET search_path TO 'public'  -- Fixed search path
AS $function$
DECLARE
  v_total_vendas numeric;
  v_meta_valor numeric;
  v_comissao_base numeric;
  v_comissao_extra numeric;
  v_comissao_total numeric;
BEGIN
  -- Get total sales for the period
  SELECT COALESCE(SUM(valor_venda), 0)
  INTO v_total_vendas
  FROM vendas
  WHERE vendedora_id = p_vendedora_id
    AND EXTRACT(YEAR FROM data_venda) = p_year
    AND EXTRACT(MONTH FROM data_venda) = p_month;
  
  -- Get goal for the period
  SELECT COALESCE(meta_valor, 0)
  INTO v_meta_valor
  FROM metas_mensais
  WHERE vendedora_id = p_vendedora_id
    AND ano = p_year
    AND mes = p_month;
  
  -- Calculate commission
  IF v_total_vendas <= v_meta_valor THEN
    v_comissao_total := v_total_vendas * 0.03; -- 3% on sales up to goal
  ELSE
    v_comissao_base := v_meta_valor * 0.03; -- 3% on goal amount
    v_comissao_extra := (v_total_vendas - v_meta_valor) * 0.05; -- 5% on excess
    v_comissao_total := v_comissao_base + v_comissao_extra;
  END IF;
  
  RETURN COALESCE(v_comissao_total, 0);
END;
$function$;