-- Ajuste de integridade referencial das metas de vendas
-- Raiz do problema: sales_goals.salesperson_id referencia pessoas(id),
-- enquanto o app usa fornecedores (eh_vendedora=true). Isso gera violação de FK.
-- Estratégia: garantir que exista um registro em fornecedores com o MESMO id das pessoas
-- já referenciadas em sales_goals, depois trocar o FK para fornecedores(id).

BEGIN;

-- 1) Criar, se necessário, registros em fornecedores com o MESMO id das pessoas
-- que já estão referenciadas em sales_goals (evita perda/remoção de metas)
INSERT INTO public.fornecedores (id, nome, tipo_pessoa, ativo, eh_vendedora)
SELECT p.id,
       COALESCE(NULLIF(p.nome, ''), 'Sem Nome'),
       COALESCE(NULLIF(p.tipo_pessoa, ''), 'pessoa_fisica'),
       true,
       true
FROM public.pessoas p
WHERE EXISTS (
  SELECT 1 FROM public.sales_goals sg WHERE sg.salesperson_id = p.id
)
AND NOT EXISTS (
  SELECT 1 FROM public.fornecedores f WHERE f.id = p.id
);

-- 2) Remover o FK antigo (para pessoas)
ALTER TABLE public.sales_goals DROP CONSTRAINT IF EXISTS sales_goals_salesperson_id_fkey;

-- 3) Adicionar o FK correto (para fornecedores)
ALTER TABLE public.sales_goals
  ADD CONSTRAINT sales_goals_salesperson_id_fkey
  FOREIGN KEY (salesperson_id) REFERENCES public.fornecedores(id);

-- 4) Garantir unicidade lógica usada pelo app no upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'ux_sales_goals_unique'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX ux_sales_goals_unique ON public.sales_goals (salesperson_id, entity_id, year, month)';
  END IF;
END $$;

COMMIT;