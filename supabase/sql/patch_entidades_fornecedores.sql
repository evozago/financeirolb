# Create the requested SQL file as a complete, ready-to-run patch
from pathlib import Path
from textwrap import dedent

sql = dedent("""\
-- =====================================================
-- patch_entidades_fornecedores.sql
-- Patching canônico: garantir estrutura de ENTIDADES e
-- inserir FORNECEDORES sem duplicar por CNPJ/CPF ou e-mail.
-- Seguro para rodar mais de uma vez (idempotente).
-- =====================================================

-- ===== Funções utilitárias (idempotentes) =====
create or replace function public.norm_doc(doc text)
returns text immutable language sql as
$$ select nullif(regexp_replace(coalesce(doc,''),'\\D','','g'),'') $$;

create or replace function public.norm_email(e text)
returns text immutable language sql as
$$ select nullif(lower(trim(coalesce(e,''))),'') $$;

create or replace function public.norm_phone(t text)
returns text immutable language sql as
$$ select nullif(regexp_replace(coalesce(t,''),'\\D','','g'), '') $$;

-- ===== Garantir tabela/colunas mínimas em public.entidades =====
do $$
begin
  if to_regclass('public.entidades') is null then
    create table public.entidades (
      id uuid primary key default gen_random_uuid()
    );
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='entidades' and column_name='tipo') then
    alter table public.entidades add column tipo text; -- 'PF' ou 'PJ'
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='entidades' and column_name='nome') then
    alter table public.entidades add column nome text;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='entidades' and column_name='cnpj_cpf') then
    alter table public.entidades add column cnpj_cpf text;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='entidades' and column_name='email') then
    alter table public.entidades add column email text;
  end if;

  if not exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='entidades' and column_name='telefone') then
    alter table public.entidades add column telefone text;
  end if;
end$$;

-- ===== Inserir fornecedores evitando duplicidade =====
do $$
begin
  if to_regclass('public.fornecedores') is not null then
    insert into public.entidades (tipo, nome, cnpj_cpf, email, telefone)
    select
      'PJ',
      f.nome,
      public.norm_doc(f.cnpj_cpf),
      public.norm_email(f.email),
      public.norm_phone(f.telefone)
    from public.fornecedores f
    where not exists (
      select 1
      from public.entidades e
      where
        (public.norm_doc(f.cnpj_cpf) is not null and lower(e.cnpj_cpf) = lower(public.norm_doc(f.cnpj_cpf)))
        or
        (public.norm_email(f.email)   is not null and lower(e.email)    = lower(public.norm_email(f.email)))
    );
  end if;
end$$;

-- ===== Dicas de validação (opcionais) =====
-- select count(*) as total_entidades from public.entidades;
-- select * from public.entidades order by nome limit 50;
-- select lower(email) as email, count(*) c from public.entidades where email is not null group by lower(email) having count(*)>1;
-- select lower(cnpj_cpf) as doc, count(*) c from public.entidades where cnpj_cpf is not null group by lower(cnpj_cpf) having count(*)>1;
""")

path = Path("/mnt/data/patch_entidades_fornecedores.sql")
path.write_text(sql, encoding="utf-8")
print("Arquivo criado:", path)
