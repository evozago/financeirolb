-- Views auxiliares para seleção de ENTIDADE/filial e fallback.

-- Lista entidades corporativas (para o frontend usar fallback se houver só 1)
create or replace view public.vw_single_entity_candidate as
select id as entity_id, nome, created_at
from public.entidades_corporativas
order by created_at asc;

-- Se existir a tabela 'filiais', materializa o vínculo filial -> entidade
do $$
begin
  if to_regclass('public.filiais') is not null then
    execute '
      create or replace view public.vw_filial_to_entidade as
      select f.id as filial_id, f.entidade_corporativa_id as entity_id, f.nome as filial_nome
      from public.filiais f
    ';
  end if;
end$$;
