-- supabase/sql/verify_duplicates_view.sql
-- Arquivo COMPLETO — cria uma VIEW de diagnóstico para localizar CNPJ/CPF duplicados em public.entidades

create or replace view public.vw_entidades_dup_cpf_cnpj as
select
  e.cnpj_cpf,
  count(*) as qtd,
  array_agg(e.id) as ids,
  array_agg(e.nome) as nomes
from public.entidades e
where e.cnpj_cpf is not null and trim(e.cnpj_cpf) <> ''
group by e.cnpj_cpf
having count(*) > 1;

comment on view public.vw_entidades_dup_cpf_cnpj is
  'Mostra chaves fiscais (CNPJ/CPF) com duplicidade em public.entidades.';
