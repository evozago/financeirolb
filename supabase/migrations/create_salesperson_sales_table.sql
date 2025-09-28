-- Criar tabela para vendas realizadas por vendedora
create table if not exists public.salesperson_sales (
  id uuid default gen_random_uuid() primary key,
  entity_id uuid not null,
  salesperson_id uuid not null,
  year integer not null,
  month integer not null check (month >= 1 and month <= 12),
  sales_amount numeric(15,2) default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Criar índice único para evitar duplicatas
create unique index if not exists uq_salesperson_sales_entity_salesperson_year_month
  on public.salesperson_sales (entity_id, salesperson_id, year, month);

-- Adicionar trigger para updated_at
create trigger trg_set_updated_at_salesperson_sales
  before update on public.salesperson_sales
  for each row execute function public.set_updated_at();

-- Habilitar RLS
alter table public.salesperson_sales enable row level security;

-- Políticas de segurança
create policy "salesperson_sales_read"
  on public.salesperson_sales for select to authenticated using (true);

create policy "salesperson_sales_write"
  on public.salesperson_sales for insert to authenticated with check (auth.uid() is not null);

create policy "salesperson_sales_write_update"
  on public.salesperson_sales for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- Conceder permissões
grant select, insert, update on public.salesperson_sales to authenticated;

-- Criar view para facilitar consultas
create or replace view public.vw_salesperson_sales as
select * from public.salesperson_sales;

-- Comentários para documentação
comment on table public.salesperson_sales is 'Vendas realizadas por vendedora por mês/ano';
comment on column public.salesperson_sales.entity_id is 'ID da entidade/empresa';
comment on column public.salesperson_sales.salesperson_id is 'ID da vendedora (referência para pessoas)';
comment on column public.salesperson_sales.year is 'Ano das vendas';
comment on column public.salesperson_sales.month is 'Mês das vendas (1-12)';
comment on column public.salesperson_sales.sales_amount is 'Valor total vendido no mês';
