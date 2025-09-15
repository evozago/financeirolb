-- supabase/sql/001_sales_views_and_indexes.sql
-- Arquivo COMPLETO — pode rodar inteiro no SQL Editor do Supabase
-- Cria view simples de vendedoras ativas e índices únicos de proteção contra duplicidade

-- VIEW de vendedoras ativas (nome e id), baseada na tabela existente public.vendedoras
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

comment on view public.vendedoras_view is 'Lista de vendedoras ativas (fonte: public.vendedoras).';

-- Índice único para store_monthly_sales (não repete o mesmo mês/ano por loja)
create unique index if not exists ux_store_monthly_sales_entity_year_month
  on public.store_monthly_sales(entity_id, year, month);

-- Índice único para sales_goals (não repete meta para a mesma vendedora no mesmo mês/ano/loja)
create unique index if not exists ux_sales_goals_person_entity_year_month
  on public.sales_goals(salesperson_id, entity_id, year, month);
