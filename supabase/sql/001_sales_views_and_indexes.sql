-- Cria view simples de vendedoras ativas (fonte: public.vendedoras)
-- e índices únicos para evitar duplicidades de vendas/metas.

create or replace view public.vendedoras_view as
select
  v.id,
  v.nome,
  v.email,
  v.telefone,
  v.ativo,
  v.created_at,
  v.updated_at
from public.vendedoras v
where coalesce(v.ativo, true) = true;

comment on view public.vendedoras_view is
'Lista de vendedoras ativas (fonte: public.vendedoras).';

-- Índice único para não repetir mês/ano por entidade (loja)
create unique index if not exists ux_store_monthly_sales_entity_year_month
  on public.store_monthly_sales(entity_id, year, month);

-- Índice único para não repetir meta por vendedora/mês/ano/entidade
create unique index if not exists ux_sales_goals_person_entity_year_month
  on public.sales_goals(salesperson_id, entity_id, year, month);
