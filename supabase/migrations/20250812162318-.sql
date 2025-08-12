-- Extend financial panel stats function to also return counts for each category
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
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    -- Due today (open)
    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento = CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) AS contas_vencendo_hoje,
    COALESCE(COUNT(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento = CURRENT_DATE 
      THEN 1 END), 0) AS contas_vencendo_hoje_count,

    -- Paid today
    COALESCE(SUM(CASE 
      WHEN status = 'pago' AND data_pagamento = CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) AS contas_pagas_hoje,
    COALESCE(COUNT(CASE 
      WHEN status = 'pago' AND data_pagamento = CURRENT_DATE 
      THEN 1 END), 0) AS contas_pagas_hoje_count,

    -- Due until end of current month (open)
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

    -- Overdue (open, past due date)
    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento < CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) AS contas_vencidas,
    COALESCE(COUNT(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento < CURRENT_DATE 
      THEN 1 END), 0) AS contas_vencidas_count,

    -- Non-recurring pending (all periods)
    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) 
           AND (eh_recorrente = false OR eh_recorrente IS NULL)
      THEN valor ELSE 0 
    END), 0) AS contas_pendentes_nao_recorrentes,
    COALESCE(COUNT(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) 
           AND (eh_recorrente = false OR eh_recorrente IS NULL)
      THEN 1 END), 0) AS contas_pendentes_nao_recorrentes_count
  FROM ap_installments;
END;
$function$;