-- Continue fixing Security Definer Views issue
-- Convert remaining functions from SECURITY DEFINER to SECURITY INVOKER where safe

-- Sales-related functions that can be SECURITY INVOKER since they work with data users can access
CREATE OR REPLACE FUNCTION public.calculate_mom_growth(p_year integer, p_month integer)
RETURNS TABLE(vendedora_id uuid, vendedora_nome text, current_sales numeric, previous_sales numeric, growth_percentage numeric)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as vendedora_id,
    v.nome as vendedora_nome,
    COALESCE(current_month.total_vendas, 0) as current_sales,
    COALESCE(previous_month.total_vendas, 0) as previous_sales,
    CASE 
      WHEN COALESCE(previous_month.total_vendas, 0) = 0 THEN 0
      ELSE ROUND(((COALESCE(current_month.total_vendas, 0) - COALESCE(previous_month.total_vendas, 0)) / COALESCE(previous_month.total_vendas, 0) * 100), 2)
    END as growth_percentage
  FROM vendedoras v
  LEFT JOIN (
    SELECT 
      vendedora_id,
      SUM(valor_venda) as total_vendas
    FROM vendas
    WHERE EXTRACT(YEAR FROM data_venda) = p_year
      AND EXTRACT(MONTH FROM data_venda) = p_month
    GROUP BY vendedora_id
  ) current_month ON v.id = current_month.vendedora_id
  LEFT JOIN (
    SELECT 
      vendedora_id,
      SUM(valor_venda) as total_vendas
    FROM vendas
    WHERE EXTRACT(YEAR FROM data_venda) = CASE 
        WHEN p_month = 1 THEN p_year - 1
        ELSE p_year
      END
      AND EXTRACT(MONTH FROM data_venda) = CASE 
        WHEN p_month = 1 THEN 12
        ELSE p_month - 1
      END
    GROUP BY vendedora_id
  ) previous_month ON v.id = previous_month.vendedora_id
  WHERE v.ativo = true
  ORDER BY current_sales DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_yoy_growth(p_year integer, p_month integer)
RETURNS TABLE(vendedora_id uuid, vendedora_nome text, current_sales numeric, previous_year_sales numeric, growth_percentage numeric)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    v.id as vendedora_id,
    v.nome as vendedora_nome,
    COALESCE(current_year.total_vendas, 0) as current_sales,
    COALESCE(previous_year.total_vendas, 0) as previous_year_sales,
    CASE 
      WHEN COALESCE(previous_year.total_vendas, 0) = 0 THEN 0
      ELSE ROUND(((COALESCE(current_year.total_vendas, 0) - COALESCE(previous_year.total_vendas, 0)) / COALESCE(previous_year.total_vendas, 0) * 100), 2)
    END as growth_percentage
  FROM vendedoras v
  LEFT JOIN (
    SELECT 
      vendedora_id,
      SUM(valor_venda) as total_vendas
    FROM vendas
    WHERE EXTRACT(YEAR FROM data_venda) = p_year
      AND EXTRACT(MONTH FROM data_venda) = p_month
    GROUP BY vendedora_id
  ) current_year ON v.id = current_year.vendedora_id
  LEFT JOIN (
    SELECT 
      vendedora_id,
      SUM(valor_venda) as total_vendas
    FROM vendas
    WHERE EXTRACT(YEAR FROM data_venda) = p_year - 1
      AND EXTRACT(MONTH FROM data_venda) = p_month
    GROUP BY vendedora_id
  ) previous_year ON v.id = previous_year.vendedora_id
  WHERE v.ativo = true
  ORDER BY current_sales DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(total_aberto numeric, vencendo_hoje numeric, vencidos numeric, pagos_mes_atual numeric)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_financial_panel_stats()
RETURNS TABLE(contas_vencendo_hoje numeric, contas_pagas_hoje numeric, contas_vencendo_ate_fim_mes numeric, contas_vencidas numeric)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_financial_panel_stats_extended()
RETURNS TABLE(contas_vencendo_hoje numeric, contas_vencendo_hoje_count bigint, contas_pagas_hoje numeric, contas_pagas_hoje_count bigint, contas_vencendo_ate_fim_mes numeric, contas_vencendo_ate_fim_mes_count bigint, contas_vencidas numeric, contas_vencidas_count bigint, contas_pendentes_nao_recorrentes numeric, contas_pendentes_nao_recorrentes_count bigint)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;