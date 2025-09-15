-- Modelo canônico NÃO-DESTRUTIVO (PF/PJ) + papéis.
-- Versão segura: não cria UNIQUE em email/cnpj_cpf (usa índices normais),
-- para não travar se já houver duplicados. Depois de higienizar, pode trocar por UNIQUE.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

create or replace function public.norm_doc(doc text)
returns text immutable language sql as
$$ select nullif(regexp_replace(coalesce(doc,''),'\\D','','g'),'') $$;

create or replace function public.norm_email(e text)
returns text immutable language sql as
$$ select nullif(lower(trim(coalesce(e,''))),'') $$;

create or replace function public.norm_phone(t text)
returns text immutable language sql as
$$ select nullif(regexp_replace(coalesce(t,''),'\\D','','g'),'') $$;

create table if not exists public.entidades (
  id uuid primary key default gen_random_uuid()
);

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='entidades' and column_name='tipo') then
    alter table public.entidades add column tipo text; -- 'PF' | 'PJ'
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='entidades' and column_name='nome') then
    alter table public.entidades add column nome text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='entidades' and column_name='nome_fantasia') then
    alter table public.entidades add column nome_fantasia text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='entidades' and column_name='cnpj_cpf') then
    alter table public.entidades add column cnpj_cpf text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='entidades' and column_name='email') then
    alter table public.entidades add column email text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='entidades' and column_name='telefone') then
    alter table public.entidades add column telefone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='entidades' and column_name='created_at') then
    alter table public.entidades add column created_at timestamptz default now();
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='entidades' and column_name='updated_at') then
    alter table public.entidades add column updated_at timestamptz default now();
  end if;
end$$;

-- (Opcional) CHECK do tipo
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.entidades'::regclass and conname='entidades_tipo_check') then
    alter table public.entidades add constraint entidades_tipo_check check (tipo in ('PF','PJ'));
  end if;
end$$;

-- Índices NÃO-únicos (seguros; depois você pode promover para UNIQUE)
create index if not exists ix_entidades_doc    on public.entidades ((lower(cnpj_cpf)));
create index if not exists ix_entidades_email  on public.entidades ((lower(email)));
create index if not exists ix_entidades_nome   on public.entidades (lower(nome));

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='trg_entidades_updated_at') then
    create trigger trg_entidades_updated_at
      before update on public.entidades
      for each row execute function public.set_updated_at();
  end if;
end$$;

-- PAPÉIS
create table if not exists public.papeis (
  id uuid primary key default gen_random_uuid(),
  nome text unique not null
);

insert into public.papeis (nome) values
  ('cliente'),('fornecedor'),('fornecedor_materiais'),
  ('fornecedor_revenda'),('funcionario'),('vendedor')
on conflict (nome) do nothing;

create table if not exists public.entidade_papeis (
  entidade_id uuid not null references public.entidades(id) on delete cascade,
  papel_id uuid not null references public.papeis(id) on delete restrict,
  ativo boolean default true,
  created_at timestamptz default now(),
  primary key (entidade_id, papel_id)
);

-- Carga NÃO-DESTRUTIVA: evita inserir se já existir por DOC ou E-MAIL
-- 1) pessoas → PF
do $$
declare nome_col text; doc_col text; email_col text := 'email'; tel_col text := 'telefone';
begin
  if to_regclass('public.pessoas') is not null then
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='pessoas' and column_name='nome') then
      nome_col := 'nome';
    elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='pessoas' and column_name='nome_razao_social') then
      nome_col := 'nome_razao_social';
    end if;

    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='pessoas' and column_name='cpf') then
      doc_col := 'cpf';
    elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='pessoas' and column_name='cnpj_cpf') then
      doc_col := 'cnpj_cpf';
    elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='pessoas' and column_name='documento') then
      doc_col := 'documento';
    end if;

    execute format($f$
      insert into public.entidades (tipo, nome, cnpj_cpf, email, telefone)
      select 'PF',
             %s,
             public.norm_doc(%s),
             public.norm_email(%s),
             public.norm_phone(%s)
      from public.pessoas p
      where not exists (
        select 1 from public.entidades e
        where (public.norm_doc(%s) is not null and lower(e.cnpj_cpf)=lower(public.norm_doc(%s)))
           or (public.norm_email(%s) is not null and lower(e.email)=lower(public.norm_email(%s)))
      )
    $f$,
      coalesce('p.'||quote_ident(nome_col), 'NULL'),
      coalesce('p.'||quote_ident(doc_col), 'NULL'),
      (case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='pessoas' and column_name= email_col) then 'p.'||quote_ident(email_col) else 'NULL' end),
      (case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='pessoas' and column_name= tel_col) then 'p.'||quote_ident(tel_col) else 'NULL' end),
      coalesce('p.'||quote_ident(doc_col), 'NULL'),
      coalesce('p.'||quote_ident(doc_col), 'NULL'),
      (case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='pessoas' and column_name= email_col) then 'p.'||quote_ident(email_col) else 'NULL' end),
      (case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='pessoas' and column_name= email_col) then 'p.'||quote_ident(email_col) else 'NULL' end)
    );
  end if;
end$$;

-- 2) fornecedores → PJ
do $$
declare nome_col text := 'nome'; doc_col text; email_col text := 'email'; tel_col text := 'telefone';
begin
  if to_regclass('public.fornecedores') is not null then
    if exists (select 1 from information_schema.columns where table_schema='public' and table_name='fornecedores' and column_name='cnpj_cpf') then
      doc_col := 'cnpj_cpf';
    elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='fornecedores' and column_name='cnpj') then
      doc_col := 'cnpj';
    elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='fornecedores' and column_name='cpf') then
      doc_col := 'cpf';
    end if;

    execute format($f$
      insert into public.entidades (tipo, nome, cnpj_cpf, email, telefone)
      select 'PJ',
             %s,
             public.norm_doc(%s),
             public.norm_email(%s),
             public.norm_phone(%s)
      from public.fornecedores f
      where not exists (
        select 1 from public.entidades e
        where (public.norm_doc(%s) is not null and lower(e.cnpj_cpf)=lower(public.norm_doc(%s)))
           or (public.norm_email(%s) is not null and lower(e.email)=lower(public.norm_email(%s)))
      )
    $f$,
      'f.'||quote_ident(nome_col),
      coalesce('f.'||quote_ident(doc_col), 'NULL'),
      (case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='fornecedores' and column_name= email_col) then 'f.'||quote_ident(email_col) else 'NULL' end),
      (case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='fornecedores' and column_name= tel_col) then 'f.'||quote_ident(tel_col) else 'NULL' end),
      coalesce('f.'||quote_ident(doc_col), 'NULL'),
      coalesce('f.'||quote_ident(doc_col), 'NULL'),
      (case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='fornecedores' and column_name= email_col) then 'f.'||quote_ident(email_col) else 'NULL' end),
      (case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='fornecedores' and column_name= email_col) then 'f.'||quote_ident(email_col) else 'NULL' end)
    );
  end if;
end$$;

-- 3) vendedoras → PF + papel 'vendedor'
do $$
declare papel_vendedor uuid;
begin
  select id into papel_vendedor from public.papeis where nome='vendedor';

  if to_regclass('public.vendedoras') is not null then
    insert into public.entidades (tipo, nome, email, telefone)
    select 'PF', v.nome, public.norm_email(v.email), public.norm_phone(v.telefone)
    from public.vendedoras v
    where not exists (
      select 1 from public.entidades e
      where (lower(e.nome)=lower(v.nome))
         or (public.norm_email(v.email) is not null and lower(e.email)=lower(public.norm_email(v.email)))
    );

    insert into public.entidade_papeis (entidade_id, papel_id, ativo)
    select e.id, papel_vendedor, true
    from public.vendedoras v
    join public.entidades e on lower(e.nome)=lower(v.nome)
    on conflict do nothing;
  end if;
end$$;

-- Views canônicas
create or replace view public.vw_pessoas_unificadas as
select id, tipo, nome, cnpj_cpf, email, telefone
from public.entidades
where tipo='PF';

create or replace view public.vw_empresas_unificadas as
select id, tipo, nome, nome_fantasia, cnpj_cpf, email, telefone
from public.entidades
where tipo='PJ';

create or replace view public.vw_vendedores_unificados as
select e.id, e.nome, e.email, e.telefone
from public.entidades e
join public.entidade_papeis ep on ep.entidade_id=e.id and ep.ativo=true
join public.papeis p on p.id=ep.papel_id and p.nome='vendedor';
