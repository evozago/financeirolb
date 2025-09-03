-- Fix security issues with materialized view
-- Make the materialized view only accessible to admins
ALTER TABLE public.sales_monthly_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access sales_monthly_summary" 
ON public.sales_monthly_summary 
FOR SELECT 
USING (is_admin());

-- Fix search_path for the refresh function
CREATE OR REPLACE FUNCTION refresh_sales_summary()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.sales_monthly_summary;
  RETURN NULL;
END;
$$;