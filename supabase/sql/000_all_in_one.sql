-- 000_all_in_one.sql — Unificação & Diagnóstico (não destrutivo)
begin;

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create or replace function public.norm_doc(doc text) returns text immutable language sql
as $$ select nullif(regexp_replace(coalesce(doc,''),'\\D','','g'),'') $$;
create or replace function public.norm_email(e text) returns text immutable language sql
as $$ select nullif(lower(trim(coalesce(e,''))),'') $$;
create or replace function public.norm_phone(t text) returns text immutable language sql
as $$ select nullif(regexp_replace(coalesce(t,''),'\\D','','g'),'') $$;

drop view if exists public.vw_entidades_unificadas cascade;
create view public.vw_entidades_unificadas as
  select 'pessoas' as origem, p.id as origem_id,
         p.nome as nome_razao_social,
         public.norm_doc(null) as cpf_cnpj,
         public.norm_email(p.email) as email,
         public.norm_phone(p.telefone) as telefone
    from public.pessoas p
    where to_regclass('public.pessoas') is not null
  union all
  select 'fornecedores', f.id, f.nome,
         public.norm_doc(f.cnpj_cpf),
         public.norm_email(f.email),
         public.norm_phone(f.telefone)
    from public.fornecedores f
    where to_regclass('public.fornecedores') is not null
  union all
  select 'vendedoras', v.id, v.nome,
         public.norm_doc(null),
         public.norm_email(v.email),
         public.norm_phone(v.telefone)
    from public.vendedoras v
    where to_regclass('public.vendedoras') is not null
  union all
  select 'entidades', e.id, coalesce(e.nome, e.tipo),
         public.norm_doc(e.cnpj_cpf),
         public.norm_email(e.email),
         public.norm_phone(e.telefone)
    from public.entidades e
    where to_regclass('public.entidades') is not null
  union all
  select 'entidades_corporativas', ec.id,
         coalesce(ec.nome_razao_social, ec.nome_fantasia),
         public.norm_doc(coalesce(ec.cnpj_cpf, ec.cnpj, ec.cpf)),
         public.norm_email(ec.email),
         public.norm_phone(ec.telefone_principal)
    from public.entidades_corporativas ec
    where to_regclass('public.entidades_corporativas') is not null
;

drop view if exists public.vw_entidades_dup_cpf_cnpj cascade;
create view public.vw_entidades_dup_cpf_cnpj as
select lower(cpf_cnpj) as chave, count(*) as qtd,
       array_agg(jsonb_build_object('origem',origem,'id',origem_id,'nome',nome_razao_social)) as itens
from public.vw_entidades_unificadas
where cpf_cnpj is not null and cpf_cnpj <> ''
group by lower(cpf_cnpj) having count(*) > 1;

drop view if exists public.vw_entidades_dup_email cascade;
create view public.vw_entidades_dup_email as
select lower(email) as chave, count(*) as qtd,
       array_agg(jsonb_build_object('origem',origem,'id',origem_id,'nome',nome_razao_social)) as itens
from public.vw_entidades_unificadas
where email is not null and email <> ''
group by lower(email) having count(*) > 1;

drop view if exists public.vw_entidades_dup_phone cascade;
create view public.vw_entidades_dup_phone as
select telefone as chave, count(*) as qtd,
       array_agg(jsonb_build_object('origem',origem,'id',origem_id,'nome',nome_razao_social)) as itens
from public.vw_entidades_unificadas
where telefone is not null and telefone <> ''
group by telefone having count(*) > 1;

create table if not exists public.entidades_unicas (
  id uuid primary key default gen_random_uuid(),
  nome text, cpf_cnpj text, email text, telefone text,
  origem_preferida text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create unique index if not exists ux_entidades_unicas_cpf on public.entidades_unicas ((lower(cpf_cnpj)));
create unique index if not exists ux_entidades_unicas_email on public.entidades_unicas ((lower(email)));
create unique index if not exists ux_entidades_unicas_phone on public.entidades_unicas (telefone);

create table if not exists public.entidade_map (
  origem text not null, origem_id uuid not null, entidade_unica_id uuid not null,
  primary key (origem, origem_id)
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='trg_entidades_unicas_updated_at') then
    create trigger trg_entidades_unicas_updated_at
      before update on public.entidades_unicas
      for each row execute function public.set_updated_at();
  end if;
end$$;

alter table public.entidades_unicas enable row level security;
create policy if not exists p_entidades_unicas_all
  on public.entidades_unicas for all using (auth.uid() is not null) with check (auth.uid() is not null);
alter table public.entidade_map enable row level security;
create policy if not exists p_entidade_map_all
  on public.entidade_map for all using (auth.uid() is not null) with check (auth.uid() is not null);

with fonte as (select * from public.vw_entidades_unificadas),
ins_doc as (
  insert into public.entidades_unicas (nome, cpf_cnpj, email, telefone, origem_preferida)
  select distinct on (lower(cpf_cnpj)) nome_razao_social, cpf_cnpj, email, telefone, origem
    from fonte where cpf_cnpj is not null and cpf_cnpj <> ''
  on conflict ((lower(cpf_cnpj))) do nothing returning id, cpf_cnpj
),
ins_email as (
  insert into public.entidades_unicas (nome, cpf_cnpj, email, telefone, origem_preferida)
  select distinct on (lower(email)) nome_razao_social, null, email, telefone, origem
    from fonte where (cpf_cnpj is null or cpf_cnpj='') and email is not null and email <> ''
  on conflict ((lower(email))) do nothing returning id, email
),
ins_phone as (
  insert into public.entidades_unicas (nome, cpf_cnpj, email, telefone, origem_preferida)
  select distinct on (telefone) nome_razao_social, null, null, telefone, origem
    from fonte where (cpf_cnpj is null or cpf_cnpj='') and (email is null or email='') and telefone is not null and telefone <> ''
  on conflict (telefone) do nothing returning id, telefone
),
ins_rest as (
  insert into public.entidades_unicas (nome, cpf_cnpj, email, telefone, origem_preferida)
  select nome_razao_social, null, null, null, origem
    from fonte f
   where (cpf_cnpj is null or cpf_cnpj='')
     and (email is null or email='')
     and (telefone is null or telefone='')
     and not exists (select 1 from public.entidade_map m where m.origem=f.origem and m.origem_id=f.origem_id)
  returning id
)
select 1;

with fonte as (select * from public.vw_entidades_unificadas),
preferencias as (
  select f.*,
         (select id from public.entidades_unicas u where lower(u.cpf_cnpj)=lower(f.cpf_cnpj)) as id_por_doc,
         (select id from public.entidades_unicas u where lower(u.email)=lower(f.email)) as id_por_email,
         (select id from public.entidades_unicas u where u.telefone=f.telefone) as id_por_phone
  from fonte f
),
escolha as (
  select origem, origem_id, coalesce(id_por_doc, id_por_email, id_por_phone) as entidade_unica_id
  from preferencias
),
fallback_nome as (
  select p.origem, p.origem_id,
         coalesce(e.entidade_unica_id,
           (select id from public.entidades_unicas u where u.nome=p.nome_razao_social order by u.created_at asc limit 1)
         ) as entidade_unica_id
  from preferencias p
  left join escolha e on e.origem=p.origem and e.origem_id=p.origem_id
)
insert into public.entidade_map (origem, origem_id, entidade_unica_id)
select origem, origem_id, entidade_unica_id from fallback_nome
where entidade_unica_id is not null
on conflict (origem, origem_id) do update set entidade_unica_id=excluded.entidade_unica_id;

drop view if exists public.vw_entidades_canon cascade;
create view public.vw_entidades_canon as
select u.id, u.nome, u.cpf_cnpj, u.email, u.telefone, u.created_at, u.updated_at
from public.entidades_unicas u;

drop view if exists public.vw_vendedoras_canon cascade;
create view public.vw_vendedoras_canon as
select u.id, u.nome, u.email, u.telefone
from public.entidades_unicas u
where exists (select 1 from public.entidade_map m where m.entidade_unica_id=u.id and m.origem='vendedoras');

drop view if exists public.vw_fornecedores_canon cascade;
create view public.vw_fornecedores_canon as
select u.id, u.nome, u.cpf_cnpj, u.email, u.telefone
from public.entidades_unicas u
where exists (select 1 from public.entidade_map m where m.entidade_unica_id=u.id and m.origem='fornecedores');

drop view if exists public.vw_pessoas_canon cascade;
create view public.vw_pessoas_canon as
select u.id, u.nome, u.email, u.telefone
from public.entidades_unicas u
where exists (select 1 from public.entidade_map m where m.entidade_unica_id=u.id and m.origem='pessoas');

drop table if exists public.merge_log;
create table public.merge_log (
  id bigserial primary key,
  executado_em timestamptz default now(),
  total_unicas integer,
  total_map integer
);
insert into public.merge_log (total_unicas, total_map)
select (select count(*) from public.entidades_unicas),
       (select count(*) from public.entidade_map);

commit;