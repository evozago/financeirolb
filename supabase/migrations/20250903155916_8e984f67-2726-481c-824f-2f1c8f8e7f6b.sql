-- Create vendedora_ferias table for vacation tracking
CREATE TABLE public.vendedora_ferias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedora_id UUID NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  tipo_ferias TEXT NOT NULL DEFAULT 'ferias',
  aprovado BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendedora_ferias ENABLE ROW LEVEL SECURITY;

-- Create policies for vendedora_ferias
CREATE POLICY "Authenticated users can view vendedora_ferias" 
ON public.vendedora_ferias 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert vendedora_ferias" 
ON public.vendedora_ferias 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update vendedora_ferias" 
ON public.vendedora_ferias 
FOR UPDATE 
USING (true);

CREATE POLICY "Only admins can delete vendedora_ferias" 
ON public.vendedora_ferias 
FOR DELETE 
USING (is_admin());

-- Function to calculate month-over-month growth
CREATE OR REPLACE FUNCTION public.calculate_mom_growth(p_year integer, p_month integer)
RETURNS TABLE(vendedora_id uuid, vendedora_nome text, current_sales numeric, previous_sales numeric, growth_percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to calculate year-over-year growth
CREATE OR REPLACE FUNCTION public.calculate_yoy_growth(p_year integer, p_month integer)
RETURNS TABLE(vendedora_id uuid, vendedora_nome text, current_sales numeric, previous_year_sales numeric, growth_percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to calculate real-time commission
CREATE OR REPLACE FUNCTION public.calculate_commission_real_time(p_vendedora_id uuid, p_year integer, p_month integer)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Function to get sales KPI data
CREATE OR REPLACE FUNCTION public.get_sales_kpi_data(p_year integer, p_month integer)
RETURNS TABLE(
  total_sales numeric,
  total_goal numeric,
  goal_achievement_percentage numeric,
  mom_growth_percentage numeric,
  yoy_growth_percentage numeric,
  active_salespeople integer,
  top_performer_name text,
  top_performer_sales numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create materialized view for monthly sales summary
CREATE MATERIALIZED VIEW public.sales_monthly_summary AS
SELECT 
  EXTRACT(YEAR FROM v.data_venda) as ano,
  EXTRACT(MONTH FROM v.data_venda) as mes,
  v.vendedora_id,
  vd.nome as vendedora_nome,
  SUM(v.valor_venda) as total_vendas,
  COUNT(*) as total_vendas_count,
  AVG(v.valor_venda) as ticket_medio,
  COALESCE(m.meta_valor, 0) as meta_mensal,
  CASE 
    WHEN m.meta_valor > 0 THEN ROUND((SUM(v.valor_venda) / m.meta_valor * 100), 2)
    ELSE 0 
  END as percentual_meta
FROM vendas v
JOIN vendedoras vd ON v.vendedora_id = vd.id
LEFT JOIN metas_mensais m ON v.vendedora_id = m.vendedora_id 
  AND EXTRACT(YEAR FROM v.data_venda) = m.ano 
  AND EXTRACT(MONTH FROM v.data_venda) = m.mes
GROUP BY 
  EXTRACT(YEAR FROM v.data_venda),
  EXTRACT(MONTH FROM v.data_venda),
  v.vendedora_id,
  vd.nome,
  m.meta_valor;

-- Create unique index for materialized view refresh
CREATE UNIQUE INDEX sales_monthly_summary_idx 
ON public.sales_monthly_summary (ano, mes, vendedora_id);

-- Create trigger to refresh materialized view on sales changes
CREATE OR REPLACE FUNCTION refresh_sales_summary()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.sales_monthly_summary;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to vendedora_ferias
CREATE TRIGGER update_vendedora_ferias_updated_at
BEFORE UPDATE ON public.vendedora_ferias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();