-- zzz_vendedoras_view.sql
-- View robusta para listar vendedoras a partir do modelo canônico (entidades + papéis).
-- Idempotente: pode rodar quantas vezes quiser.

-- Se quiser manter também a view 'vendedoras_view' compatível com 'pessoas',
-- este arquivo prioriza o modelo consolidado (entidades_corporativas + papeis).

create or replace view public.vendedoras_view as
select
  ec.id,
  coalesce(ec.nome_razao_social, ec.nome_fantasia, ec.nome) as nome,
  nullif(regexp_replace(coalesce(ec.cnpj_cpf,''),'\\D','','g'),'') as cpf_cnpj_normalizado,
  lower(trim(coalesce(ec.email,''))) as email_normalizado,
  nullif(regexp_replace(coalesce(ec.telefone_principal,''),'\\D','','g'),'') as telefone_normalizado
from public.entidades_corporativas ec
join public.entidade_papeis ep on ep.entidade_id = ec.id and ep.ativo = true
join public.papeis p on p.id = ep.papel_id
where p.nome ilike 'Vendedor%';
