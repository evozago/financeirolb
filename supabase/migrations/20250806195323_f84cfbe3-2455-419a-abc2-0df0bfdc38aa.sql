-- Create function to get expenses by category for pie chart
CREATE OR REPLACE FUNCTION public.get_expenses_by_category(
  p_start_date date DEFAULT date_trunc('month', CURRENT_DATE)::date,
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(categoria text, total_valor numeric, count_items bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ap.categoria, 'Sem Categoria') as categoria,
    COALESCE(SUM(ap.valor), 0) as total_valor,
    COUNT(*) as count_items
  FROM ap_installments ap
  WHERE ap.data_vencimento >= p_start_date 
    AND ap.data_vencimento <= p_end_date
  GROUP BY COALESCE(ap.categoria, 'Sem Categoria')
  ORDER BY total_valor DESC;
END;
$function$