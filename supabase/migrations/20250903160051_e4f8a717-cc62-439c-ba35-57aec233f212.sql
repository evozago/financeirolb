-- Remove the materialized view that's causing security issues
-- We'll use the functions directly instead
DROP MATERIALIZED VIEW public.sales_monthly_summary;
DROP FUNCTION refresh_sales_summary();

-- Create a regular view instead (which can have RLS)
CREATE VIEW public.sales_monthly_summary AS
SELECT 
  EXTRACT(YEAR FROM v.data_venda)::integer as ano,
  EXTRACT(MONTH FROM v.data_venda)::integer as mes,
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