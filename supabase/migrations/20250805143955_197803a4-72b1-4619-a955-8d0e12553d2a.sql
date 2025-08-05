-- Update the get_dashboard_stats function to ensure it returns correct data
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
 RETURNS TABLE(total_aberto numeric, vencendo_hoje numeric, vencidos numeric, pagos_mes_atual numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
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
  FROM ap_installments;
END;
$function$;

-- Create a trigger to automatically update installment status
CREATE OR REPLACE FUNCTION public.update_installment_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update status based on payment and due dates
  IF NEW.data_pagamento IS NOT NULL THEN
    NEW.status = 'pago';
  ELSIF NEW.data_vencimento < CURRENT_DATE AND NEW.data_pagamento IS NULL THEN
    NEW.status = 'vencido';
  ELSE
    NEW.status = 'aberto';
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for status updates on insert/update
DROP TRIGGER IF EXISTS trigger_update_installment_status ON ap_installments;
CREATE TRIGGER trigger_update_installment_status
  BEFORE INSERT OR UPDATE ON ap_installments
  FOR EACH ROW EXECUTE FUNCTION update_installment_status();