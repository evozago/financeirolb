-- Create function to get financial panel statistics
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
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    -- Contas a vencer hoje
    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento = CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) as contas_vencendo_hoje,
    
    -- Contas pagas hoje
    COALESCE(SUM(CASE 
      WHEN status = 'pago' AND data_pagamento = CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) as contas_pagas_hoje,
    
    -- Contas a vencer até o final do mês vigente
    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) 
           AND data_vencimento >= CURRENT_DATE 
           AND data_vencimento <= DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day'
      THEN valor ELSE 0 
    END), 0) as contas_vencendo_ate_fim_mes,
    
    -- Contas vencidas (em atraso)
    COALESCE(SUM(CASE 
      WHEN (status = 'aberto' OR data_pagamento IS NULL) AND data_vencimento < CURRENT_DATE 
      THEN valor ELSE 0 
    END), 0) as contas_vencidas
  FROM ap_installments;
END;
$function$