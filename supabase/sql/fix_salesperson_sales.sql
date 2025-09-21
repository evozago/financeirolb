-- Fix para adicionar tabela salesperson_sales que está faltando
-- Esta tabela é necessária para o funcionamento do painel de vendedoras

-- Criar tabela salesperson_sales se não existir
CREATE TABLE IF NOT EXISTS public.salesperson_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  salesperson_id uuid NOT NULL,
  year integer NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  sales_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Criar índice único para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS uq_salesperson_sales_entity_salesperson_year_month
  ON public.salesperson_sales (entity_id, salesperson_id, year, month);

-- Habilitar RLS
ALTER TABLE public.salesperson_sales ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "salesperson_sales_read" ON public.salesperson_sales;
DROP POLICY IF EXISTS "salesperson_sales_write" ON public.salesperson_sales;
DROP POLICY IF EXISTS "salesperson_sales_write_update" ON public.salesperson_sales;

CREATE POLICY "salesperson_sales_read"
  ON public.salesperson_sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "salesperson_sales_write"
  ON public.salesperson_sales FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "salesperson_sales_write_update"
  ON public.salesperson_sales FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Permissões
GRANT SELECT, INSERT, UPDATE ON public.salesperson_sales TO authenticated;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_set_updated_at_salesperson_sales ON public.salesperson_sales;
CREATE TRIGGER trg_set_updated_at_salesperson_sales
  BEFORE UPDATE ON public.salesperson_sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Migrar dados existentes da tabela vendas para salesperson_sales
-- Isso vai popular a nova tabela com os dados históricos
INSERT INTO public.salesperson_sales (entity_id, salesperson_id, year, month, sales_amount)
SELECT 
  (SELECT id FROM public.entidades_corporativas LIMIT 1) as entity_id, -- usar primeira entidade como padrão
  v.vendedora_id,
  EXTRACT(YEAR FROM v.data_venda)::integer as year,
  EXTRACT(MONTH FROM v.data_venda)::integer as month,
  SUM(v.valor_venda) as sales_amount
FROM public.vendas v
WHERE v.vendedora_id IS NOT NULL
GROUP BY v.vendedora_id, EXTRACT(YEAR FROM v.data_venda), EXTRACT(MONTH FROM v.data_venda)
ON CONFLICT (entity_id, salesperson_id, year, month) DO UPDATE SET
  sales_amount = EXCLUDED.sales_amount,
  updated_at = now();

-- Também migrar dados da tabela metas_mensais para sales_goals se necessário
INSERT INTO public.sales_goals (entity_id, salesperson_id, year, month, goal_amount)
SELECT 
  (SELECT id FROM public.entidades_corporativas LIMIT 1) as entity_id, -- usar primeira entidade como padrão
  mm.vendedora_id,
  mm.ano,
  mm.mes,
  mm.meta_valor
FROM public.metas_mensais mm
WHERE mm.vendedora_id IS NOT NULL
ON CONFLICT (salesperson_id, entity_id, year, month) DO UPDATE SET
  goal_amount = EXCLUDED.goal_amount,
  updated_at = now();
