-- Fix the get_expenses_by_category function to resolve column ambiguity
CREATE OR REPLACE FUNCTION public.get_expenses_by_category(
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE(categoria text, total_valor numeric, count_items bigint)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ap.categoria, 'Sem Categoria') as categoria,
    SUM(ap.valor) as total_valor,
    COUNT(*)::bigint as count_items
  FROM ap_installments ap
  WHERE ap.deleted_at IS NULL
    AND (p_start_date IS NULL OR ap.data_vencimento >= p_start_date)
    AND (p_end_date IS NULL OR ap.data_vencimento <= p_end_date)
  GROUP BY ap.categoria
  ORDER BY total_valor DESC;
END;
$function$