-- 20250928_0001_sales_vendedoras.sql
-- Objetivo:
-- - Garantir chave composta por entidade em papeis_pessoa
-- - (Re)criar VIEW v_vendedoras alinhada ao modelo
-- - Função utilitária de timestamp (segura se já existir)
-- Obs: assume que a tabela public.vendedora_config já exista.
--      Se não existir, crie-a antes (ou me peça o script).

-- 0) Função updated_at (safe)
create or replace function public.tg_set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) Coluna entidade_id em papeis_pessoa (se faltar)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'papeis_pessoa' and column_name = 'entidade_id'
  ) then
    alter table public.papeis_pessoa
      add column entidade_id uuid;
  end if;
end$$;

-- 2) FK para entidade (usa entidades_corporativas se existir; caso contrário, tenta entidades)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='entidades_corporativas') then
    alter table public.papeis_pessoa
      drop constraint if exists papeis_pessoa_entidade_id_fkey,
      add constraint papeis_pessoa_entidade_id_fkey
      foreign key (entidade_id) references public.entidades_corporativas(id) on delete cascade;
  elsif exists (select 1 from information_schema.tables where table_schema='public' and table_name='entidades') then
    alter table public.papeis_pessoa
      drop constraint if exists papeis_pessoa_entidade_id_fkey,
      add constraint papeis_pessoa_entidade_id_fkey
      foreign key (entidade_id) references public.entidades(id) on delete cascade;
  end if;
end$$;

-- 3) Constraint única composta (substitui pares antigos)
do $$
begin
  -- derruba qualquer unique antiga que não seja composta
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.papeis_pessoa'::regclass and contype='u'
      and conname <> 'papeis_pessoa_pkey'
  ) then
    -- drop em todas as uniques não-PK
    for r in (select conname from pg_constraint
              where conrelid='public.papeis_pessoa'::regclass and contype='u')
    loop
      execute format('alter table public.papeis_pessoa drop constraint %I', r.conname);
    end loop;
  end if;

  -- cria unique composta (idempotente via nome fixo)
  alter table public.papeis_pessoa
    add constraint papeis_pessoa_pessoa_papel_entidade_unique
    unique (pessoa_id, papel_id, entidade_id);
exception when duplicate_object then
  -- já existe, ignorar
  null;
end$$;

-- 4) Índice para acelerar
create index if not exists idx_papeis_pessoa_pessoa_papel_entidade
  on public.papeis_pessoa(pessoa_id, papel_id, entidade_id);

-- 5) VIEW v_vendedoras
--   fonte única para o front: pessoa + papel 'vendedora' + config por entidade
create or replace view public.v_vendedoras as
select
  p.id                         as pessoa_id,
  p.nome,
  p.cpf,
  p.email,
  p.telefone,
  p.ativo                      as pessoa_ativa,
  pp.entidade_id,
  coalesce(vc.ativa, true)     as vendedora_ativa,
  vc.metas,
  vc.preferencia
from public.pessoas p
join public.papeis_pessoa pp
  on pp.pessoa_id = p.id
join public.papeis pa
  on pa.id = pp.papel_id and pa.ativo is distinct from false
left join public.vendedora_config vc
  on vc.pessoa_id = p.id and vc.entidade_id = pp.entidade_id
where lower(pa.nome) like 'vendedor%';
