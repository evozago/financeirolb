-- Limpeza de dados inconsistentes e otimização do sistema de pessoas e papéis
-- Data: 2025-09-27
-- Objetivo: Limpar dados duplicados e inconsistentes

-- 1. Função para identificar e limpar dados duplicados
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_pessoas()
RETURNS TABLE(
  action_type text,
  affected_count integer,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  duplicate_count integer := 0;
  orphan_count integer := 0;
  inconsistent_count integer := 0;
BEGIN
  -- Identificar pessoas duplicadas por CPF/CNPJ
  WITH duplicates AS (
    SELECT 
      cpf_cnpj_normalizado,
      array_agg(id ORDER BY created_at) as ids,
      count(*) as cnt
    FROM (
      SELECT 
        id, 
        created_at,
        regexp_replace(COALESCE(cpf, cnpj, ''), '[^0-9]', '', 'g') as cpf_cnpj_normalizado
      FROM pessoas 
      WHERE COALESCE(cpf, cnpj) IS NOT NULL
    ) t
    WHERE cpf_cnpj_normalizado != ''
    GROUP BY cpf_cnpj_normalizado
    HAVING count(*) > 1
  )
  SELECT count(*) INTO duplicate_count FROM duplicates;

  -- Manter apenas o registro mais antigo de cada duplicata
  WITH duplicates AS (
    SELECT 
      cpf_cnpj_normalizado,
      array_agg(id ORDER BY created_at) as ids,
      count(*) as cnt
    FROM (
      SELECT 
        id, 
        created_at,
        regexp_replace(COALESCE(cpf, cnpj, ''), '[^0-9]', '', 'g') as cpf_cnpj_normalizado
      FROM pessoas 
      WHERE COALESCE(cpf, cnpj) IS NOT NULL
    ) t
    WHERE cpf_cnpj_normalizado != ''
    GROUP BY cpf_cnpj_normalizado
    HAVING count(*) > 1
  ),
  ids_to_remove AS (
    SELECT unnest(ids[2:]) as id_to_remove
    FROM duplicates
  )
  UPDATE pessoas 
  SET ativo = false, 
      updated_at = now(),
      observacoes = COALESCE(observacoes || ' | ', '') || 'Desativado por duplicação em ' || now()
  WHERE id IN (SELECT id_to_remove FROM ids_to_remove);

  RETURN QUERY SELECT 'duplicate_cleanup'::text, duplicate_count, 'Pessoas duplicadas desativadas'::text;

  -- Identificar papéis órfãos (sem pessoa ou papel válido)
  SELECT count(*) INTO orphan_count
  FROM papeis_pessoa pp
  WHERE NOT EXISTS (SELECT 1 FROM pessoas p WHERE p.id = pp.pessoa_id AND p.ativo = true)
     OR NOT EXISTS (SELECT 1 FROM papeis pap WHERE pap.id = pp.papel_id AND pap.ativo = true);

  -- Desativar papéis órfãos
  UPDATE papeis_pessoa 
  SET ativo = false, updated_at = now()
  WHERE NOT EXISTS (SELECT 1 FROM pessoas p WHERE p.id = papeis_pessoa.pessoa_id AND p.ativo = true)
     OR NOT EXISTS (SELECT 1 FROM papeis pap WHERE pap.id = papeis_pessoa.papel_id AND pap.ativo = true);

  RETURN QUERY SELECT 'orphan_cleanup'::text, orphan_count, 'Associações órfãs de papéis desativadas'::text;

  -- Identificar inconsistências entre pessoas e entidades_corporativas
  SELECT count(*) INTO inconsistent_count
  FROM pessoas p
  LEFT JOIN entidades_corporativas ec ON ec.id = p.id
  WHERE p.ativo = true 
    AND (ec.id IS NULL OR ec.ativo = false);

  RETURN QUERY SELECT 'inconsistency_check'::text, inconsistent_count, 'Pessoas sem correspondência em entidades_corporativas'::text;

END;
$$;

-- 2. Função para sincronizar categorias em pessoas baseado nos papéis ativos
CREATE OR REPLACE FUNCTION public.sync_pessoa_categorias()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  -- Atualizar categorias baseado nos papéis ativos
  WITH pessoa_papeis AS (
    SELECT 
      pp.pessoa_id,
      jsonb_agg(DISTINCT lower(pap.nome) ORDER BY lower(pap.nome)) as categorias_json
    FROM papeis_pessoa pp
    JOIN papeis pap ON pap.id = pp.papel_id
    WHERE pp.ativo = true AND pap.ativo = true
    GROUP BY pp.pessoa_id
  )
  UPDATE pessoas 
  SET 
    categorias = COALESCE(pp.categorias_json, '[]'::jsonb),
    updated_at = now()
  FROM pessoa_papeis pp
  WHERE pessoas.id = pp.pessoa_id
    AND pessoas.categorias != COALESCE(pp.categorias_json, '[]'::jsonb);

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Limpar categorias de pessoas sem papéis ativos
  UPDATE pessoas 
  SET 
    categorias = '[]'::jsonb,
    updated_at = now()
  WHERE id NOT IN (
    SELECT DISTINCT pp.pessoa_id 
    FROM papeis_pessoa pp 
    JOIN papeis pap ON pap.id = pp.papel_id
    WHERE pp.ativo = true AND pap.ativo = true
  ) AND categorias != '[]'::jsonb;

  GET DIAGNOSTICS updated_count = updated_count + ROW_COUNT;

  RETURN updated_count;
END;
$$;

-- 3. Função para validar integridade dos dados
CREATE OR REPLACE FUNCTION public.validate_pessoas_papeis_integrity()
RETURNS TABLE(
  check_name text,
  status text,
  count_found integer,
  description text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  check_count integer;
BEGIN
  -- Verificar pessoas sem ID válido
  SELECT count(*) INTO check_count FROM pessoas WHERE id IS NULL;
  RETURN QUERY SELECT 'null_ids'::text, 
    CASE WHEN check_count = 0 THEN 'OK' ELSE 'ERROR' END::text,
    check_count,
    'Pessoas com ID nulo'::text;

  -- Verificar papéis duplicados por pessoa
  SELECT count(*) INTO check_count 
  FROM (
    SELECT pessoa_id, papel_id, count(*) as cnt
    FROM papeis_pessoa 
    WHERE ativo = true
    GROUP BY pessoa_id, papel_id
    HAVING count(*) > 1
  ) t;
  RETURN QUERY SELECT 'duplicate_roles'::text,
    CASE WHEN check_count = 0 THEN 'OK' ELSE 'WARNING' END::text,
    check_count,
    'Papéis duplicados por pessoa'::text;

  -- Verificar pessoas ativas sem papéis
  SELECT count(*) INTO check_count
  FROM pessoas p
  WHERE p.ativo = true
    AND NOT EXISTS (
      SELECT 1 FROM papeis_pessoa pp 
      WHERE pp.pessoa_id = p.id AND pp.ativo = true
    );
  RETURN QUERY SELECT 'pessoas_without_roles'::text,
    CASE WHEN check_count = 0 THEN 'OK' ELSE 'INFO' END::text,
    check_count,
    'Pessoas ativas sem papéis'::text;

  -- Verificar consistência de categorias
  SELECT count(*) INTO check_count
  FROM pessoas p
  WHERE p.ativo = true
    AND p.categorias != COALESCE((
      SELECT jsonb_agg(DISTINCT lower(pap.nome) ORDER BY lower(pap.nome))
      FROM papeis_pessoa pp
      JOIN papeis pap ON pap.id = pp.papel_id
      WHERE pp.pessoa_id = p.id AND pp.ativo = true AND pap.ativo = true
    ), '[]'::jsonb);
  RETURN QUERY SELECT 'inconsistent_categories'::text,
    CASE WHEN check_count = 0 THEN 'OK' ELSE 'WARNING' END::text,
    check_count,
    'Pessoas com categorias inconsistentes'::text;

END;
$$;

-- 4. Executar limpeza e sincronização
SELECT * FROM cleanup_duplicate_pessoas();
SELECT sync_pessoa_categorias() as categorias_sincronizadas;

-- 5. Criar índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_pessoas_cpf_normalized ON pessoas(regexp_replace(COALESCE(cpf, ''), '[^0-9]', '', 'g')) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pessoas_cnpj_normalized ON pessoas(regexp_replace(COALESCE(cnpj, ''), '[^0-9]', '', 'g')) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pessoas_categorias_gin ON pessoas USING gin(categorias);
CREATE INDEX IF NOT EXISTS idx_papeis_pessoa_composite ON papeis_pessoa(pessoa_id, papel_id, ativo);

-- 6. Atualizar estatísticas das tabelas
ANALYZE pessoas;
ANALYZE papeis_pessoa;
ANALYZE papeis;
ANALYZE entidades_corporativas;
ANALYZE entidade_papeis;

-- 7. Comentários para documentação
COMMENT ON FUNCTION cleanup_duplicate_pessoas() IS 'Remove pessoas duplicadas e dados inconsistentes';
COMMENT ON FUNCTION sync_pessoa_categorias() IS 'Sincroniza o campo categorias com os papéis ativos';
COMMENT ON FUNCTION validate_pessoas_papeis_integrity() IS 'Valida a integridade dos dados de pessoas e papéis';

-- 8. Executar validação final
SELECT * FROM validate_pessoas_papeis_integrity();
