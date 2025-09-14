-- Lui Bambini - Schema de Vendas (Segurança pronta)
-- Execute no Supabase (SQL Editor). É idempotente.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- 1) Totais por mês/entidade
create table if not exists public.store_monthly_sales (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null,
  year int not null check (year between 2000 and 2100),
  month int not null check (month between 1 and 12),
  total_sales numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_store_monthly_sales_entity_year_month
  on public.store_monthly_sales (entity_id, year, month);

-- 2) Metas mensais por vendedora
create table if not exists public.sales_goals (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null,
  salesperson_id uuid not null,
  year int not null check (year between 2000 and 2100),
  month int not null check (month between 1 and 12),
  goal_amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_sales_goals_salesperson_entity_year_month
  on public.sales_goals (salesperson_id, entity_id, year, month);

-- View "vendedoras" robusta (auto-detecta coluna de nome)
drop view if exists public.vendedoras_view;
do $$
declare name_col text;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='pessoas' and column_name='tipo_pessoa'
  ) then
    if exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='pessoas' and column_name='nome_razao_social'
    ) then
      name_col := 'nome_razao_social';
    else
      name_col := 'nome';
    end if;

    execute format($f$
      create or replace view public.vendedoras_view as
      select id, %I as nome
      from public.pessoas
      where tipo_pessoa in ('Vendedor','Vendedora')
    $f$, name_col);
  end if;
end$$;

-- RLS
alter table public.store_monthly_sales enable row level security;
alter table public.sales_goals enable row level security;

-- limpa políticas antigas pelo nome (se existirem)
do $$ begin
  if exists (select 1 from pg_policies where polname = 'store_monthly_sales_read') then
    drop policy "store_monthly_sales_read" on public.store_monthly_sales;
  end if;
  if exists (select 1 from pg_policies where polname = 'store_monthly_sales_write') then
    drop policy "store_monthly_sales_write" on public.store_monthly_sales;
  end if;
  if exists (select 1 from pg_policies where polname = 'sales_goals_read') then
    drop policy "sales_goals_read" on public.sales_goals;
  end if;
  if exists (select 1 from pg_policies where polname = 'sales_goals_write') then
    drop policy "sales_goals_write" on public.sales_goals;
  end if;
end $$;

create policy "store_monthly_sales_read"
  on public.store_monthly_sales for select to authenticated using (true);
create policy "sales_goals_read"
  on public.sales_goals for select to authenticated using (true);

create policy "store_monthly_sales_write"
  on public.store_monthly_sales for insert to authenticated with check (auth.uid() is not null);
create policy "store_monthly_sales_write_update"
  on public.store_monthly_sales for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "sales_goals_write"
  on public.sales_goals for insert to authenticated with check (auth.uid() is not null);
create policy "sales_goals_write_update"
  on public.sales_goals for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.store_monthly_sales to authenticated;
grant select, insert, update on public.sales_goals to authenticated;

-- trigger updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='trg_set_updated_at_store_monthly_sales') then
    create trigger trg_set_updated_at_store_monthly_sales
      before update on public.store_monthly_sales
      for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname='trg_set_updated_at_sales_goals') then
    create trigger trg_set_updated_at_sales_goals
      before update on public.sales_goals
      for each row execute function public.set_updated_at();
  end if;
end$$;

-- views de apoio
create or replace view public.vw_sales_goals as
select entity_id, salesperson_id, year, month, goal_amount
from public.sales_goals;

create or replace view public.vw_store_monthly_sales as
select entity_id, year, month, total_sales
from public.store_monthly_sales;