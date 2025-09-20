-- Corrigir funções RPC para usar as tabelas corretas de vendas

-- Primeiro, vamos criar uma view unificada de vendas para compatibilidade
CREATE OR REPLACE VIEW public.vendas AS
SELECT 
  vc.id,
  vc.vendedor_id as vendedora_id,
  vc.data_venda,
  vc.valor_total as valor_venda
FROM public.vendas_corporativas vc
WHERE vc.status_venda = 'concluida'
UNION ALL
SELECT 
  vmd.id,
  vmd.vendedora_id,
  make_date(vmd.ano, vmd.mes, 1) as data_venda,
  vmd.valor_vendas as valor_venda
FROM public.vendas_mensais_detalhadas vmd;

-- Criar tabela de vendedoras se não existir (baseada na estrutura esperada)
CREATE TABLE IF NOT EXISTS public.vendedoras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir vendedoras da tabela vendedoras_completas se existir
INSERT INTO public.vendedoras (id, nome, ativo)
SELECT id, nome, ativo 
FROM public.vendedoras_completas
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  ativo = EXCLUDED.ativo;

-- Criar tabela de metas mensais se não existir
CREATE TABLE IF NOT EXISTS public.metas_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedora_id UUID NOT NULL REFERENCES public.vendedoras(id),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  meta_valor NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendedora_id, ano, mes)
);

-- Inserir algumas metas de exemplo para teste
INSERT INTO public.metas_mensais (vendedora_id, ano, mes, meta_valor)
SELECT 
  v.id,
  2025,
  generate_series(1, 12),
  50000.00
FROM public.vendedoras v
WHERE v.ativo = true
ON CONFLICT (vendedora_id, ano, mes) DO NOTHING;

-- Atualizar função get_sales_kpi_data para usar as tabelas corretas
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
  -- Get current month totals from vendas_mensais_totais
  SELECT COALESCE(vmt.total_vendas, 0)
  INTO total_sales
  FROM vendas_mensais_totais vmt
  WHERE vmt.ano = p_year AND vmt.mes = p_month;
  
  -- If no data in totals table, calculate from detailed data
  IF total_sales IS NULL OR total_sales = 0 THEN
    SELECT COALESCE(SUM(vmd.valor_vendas), 0)
    INTO total_sales
    FROM vendas_mensais_detalhadas vmd
    WHERE vmd.ano = p_year AND vmd.mes = p_month;
  END IF;
  
  -- Get total goal for the month
  SELECT COALESCE(SUM(m.meta_valor), 0)
  INTO total_goal
  FROM metas_mensais m
  WHERE m.ano = p_year AND m.mes = p_month;
  
  -- Calculate goal achievement percentage
  goal_achievement_percentage := CASE 
    WHEN total_goal > 0 THEN ROUND((total_sales / total_goal * 100), 2)
    ELSE 0 
  END;
  
  -- Get previous month sales for MoM growth
  SELECT COALESCE(vmt.total_vendas, 0)
  INTO v_previous_month_sales
  FROM vendas_mensais_totais vmt
  WHERE vmt.ano = CASE 
      WHEN p_month = 1 THEN p_year - 1 ELSE p_year 
    END
    AND vmt.mes = CASE 
      WHEN p_month = 1 THEN 12 ELSE p_month - 1 
    END;
  
  -- Calculate MoM growth
  mom_growth_percentage := CASE 
    WHEN v_previous_month_sales > 0 THEN 
      ROUND(((total_sales - v_previous_month_sales) / v_previous_month_sales * 100), 2)
    ELSE 0 
  END;
  
  -- Get previous year sales for YoY growth
  SELECT COALESCE(vmt.total_vendas, 0)
  INTO v_previous_year_sales
  FROM vendas_mensais_totais vmt
  WHERE vmt.ano = p_year - 1 AND vmt.mes = p_month;
  
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
  SELECT v.nome, COALESCE(vmd.valor_vendas, 0)
  INTO top_performer_name, top_performer_sales
  FROM vendedoras v
  LEFT JOIN vendas_mensais_detalhadas vmd ON v.id = vmd.vendedora_id 
    AND vmd.ano = p_year 
    AND vmd.mes = p_month
  WHERE v.ativo = true
  ORDER BY COALESCE(vmd.valor_vendas, 0) DESC
  LIMIT 1;
  
  RETURN NEXT;
END;
$function$;

-- Atualizar função calculate_mom_growth
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
    COALESCE(current_month.valor_vendas, 0) as current_sales,
    COALESCE(previous_month.valor_vendas, 0) as previous_sales,
    CASE 
      WHEN COALESCE(previous_month.valor_vendas, 0) = 0 THEN 0
      ELSE ROUND(((COALESCE(current_month.valor_vendas, 0) - COALESCE(previous_month.valor_vendas, 0)) / COALESCE(previous_month.valor_vendas, 0) * 100), 2)
    END as growth_percentage
  FROM vendedoras v
  LEFT JOIN vendas_mensais_detalhadas current_month ON v.id = current_month.vendedora_id
    AND current_month.ano = p_year
    AND current_month.mes = p_month
  LEFT JOIN vendas_mensais_detalhadas previous_month ON v.id = previous_month.vendedora_id
    AND previous_month.ano = CASE 
        WHEN p_month = 1 THEN p_year - 1
        ELSE p_year
      END
    AND previous_month.mes = CASE 
      WHEN p_month = 1 THEN 12
      ELSE p_month - 1
    END
  WHERE v.ativo = true
  ORDER BY current_sales DESC;
END;
$function$;

-- Atualizar função calculate_yoy_growth
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
    COALESCE(current_year.valor_vendas, 0) as current_sales,
    COALESCE(previous_year.valor_vendas, 0) as previous_year_sales,
    CASE 
      WHEN COALESCE(previous_year.valor_vendas, 0) = 0 THEN 0
      ELSE ROUND(((COALESCE(current_year.valor_vendas, 0) - COALESCE(previous_year.valor_vendas, 0)) / COALESCE(previous_year.valor_vendas, 0) * 100), 2)
    END as growth_percentage
  FROM vendedoras v
  LEFT JOIN vendas_mensais_detalhadas current_year ON v.id = current_year.vendedora_id
    AND current_year.ano = p_year
    AND current_year.mes = p_month
  LEFT JOIN vendas_mensais_detalhadas previous_year ON v.id = previous_year.vendedora_id
    AND previous_year.ano = p_year - 1
    AND previous_year.mes = p_month
  WHERE v.ativo = true
  ORDER BY current_sales DESC;
END;
$function$;

-- Recriar a materialized view sales_monthly_summary para usar as tabelas corretas
DROP MATERIALIZED VIEW IF EXISTS public.sales_monthly_summary;
CREATE MATERIALIZED VIEW public.sales_monthly_summary AS
SELECT 
  vmd.ano,
  vmd.mes,
  vmd.vendedora_id,
  v.nome as vendedora_nome,
  vmd.valor_vendas as total_vendas,
  1 as total_vendas_count, -- Assumindo 1 registro por mês
  vmd.valor_vendas as ticket_medio,
  COALESCE(m.meta_valor, 0) as meta_mensal,
  CASE 
    WHEN m.meta_valor > 0 THEN ROUND((vmd.valor_vendas / m.meta_valor * 100), 2)
    ELSE 0 
  END as percentual_meta
FROM vendas_mensais_detalhadas vmd
JOIN vendedoras v ON vmd.vendedora_id = v.id
LEFT JOIN metas_mensais m ON vmd.vendedora_id = m.vendedora_id 
  AND vmd.ano = m.ano 
  AND vmd.mes = m.mes;

-- Criar índice único para a materialized view
CREATE UNIQUE INDEX IF NOT EXISTS sales_monthly_summary_idx 
ON public.sales_monthly_summary (ano, mes, vendedora_id);

-- Inserir alguns dados de exemplo para 2025 se não existirem
INSERT INTO public.vendas_mensais_totais (ano, mes, total_vendas) VALUES
(2025, 1, 125000),
(2025, 2, 98000),
(2025, 3, 145000),
(2025, 4, 167000),
(2025, 5, 189000),
(2025, 6, 201000),
(2025, 7, 178000),
(2025, 8, 156000),
(2025, 9, 134000)
ON CONFLICT (ano, mes) DO NOTHING;

-- Habilitar RLS para novas tabelas
ALTER TABLE public.vendedoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_mensais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can manage vendedoras" 
ON public.vendedoras FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage metas_mensais" 
ON public.metas_mensais FOR ALL 
USING (true) WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER update_vendedoras_updated_at
  BEFORE UPDATE ON public.vendedoras
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metas_mensais_updated_at
  BEFORE UPDATE ON public.metas_mensais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
