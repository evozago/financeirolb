-- Correção dos problemas de associação entre pessoas e papéis (VERSÃO CORRIGIDA)
-- Data: 2025-09-27
-- Objetivo: Resolver inconsistências nas tabelas de pessoas e suas associações com papéis

-- 1. Criar função para migrar dados de fornecedores para pessoas
CREATE OR REPLACE FUNCTION public.migrate_fornecedores_to_pessoas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fornecedor_record RECORD;
  migrated_count INTEGER := 0;
  papel_funcionario_id UUID;
  papel_vendedora_id UUID;
  papel_fornecedor_id UUID;
BEGIN
  -- Buscar IDs dos papéis
  SELECT id INTO papel_funcionario_id FROM papeis WHERE nome ILIKE '%funcionario%' AND ativo = true LIMIT 1;
  SELECT id INTO papel_vendedora_id FROM papeis WHERE nome ILIKE '%vendedor%' AND ativo = true LIMIT 1;
  SELECT id INTO papel_fornecedor_id FROM papeis WHERE nome ILIKE '%fornecedor%' AND ativo = true LIMIT 1;

  -- Migrar fornecedores que não existem em pessoas
  FOR fornecedor_record IN 
    SELECT * FROM fornecedores 
    WHERE ativo = true 
    AND id NOT IN (SELECT id FROM pessoas WHERE id IS NOT NULL)
  LOOP
    -- Inserir na tabela pessoas
    INSERT INTO pessoas (
      id,
      nome,
      email,
      telefone,
      endereco,
      tipo_pessoa,
      cpf,
      cnpj,
      razao_social,
      nome_fantasia,
      cargo_id,
      setor_id,
      filial_id,
      ativo,
      created_at,
      updated_at,
      categorias
    ) VALUES (
      fornecedor_record.id,
      fornecedor_record.nome,
      fornecedor_record.email,
      fornecedor_record.telefone,
      fornecedor_record.endereco,
      fornecedor_record.tipo_pessoa,
      CASE WHEN fornecedor_record.tipo_pessoa = 'pessoa_fisica' THEN fornecedor_record.cpf END,
      CASE WHEN fornecedor_record.tipo_pessoa = 'pessoa_juridica' THEN fornecedor_record.cnpj_cpf END,
      CASE WHEN fornecedor_record.tipo_pessoa = 'pessoa_juridica' THEN fornecedor_record.nome END,
      fornecedor_record.nome_fantasia,
      fornecedor_record.cargo_id,
      fornecedor_record.setor_id,
      fornecedor_record.filial_id,
      fornecedor_record.ativo,
      fornecedor_record.created_at,
      fornecedor_record.updated_at,
      '[]'::jsonb
    ) ON CONFLICT (id) DO UPDATE SET
      nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      telefone = EXCLUDED.telefone,
      endereco = EXCLUDED.endereco,
      tipo_pessoa = EXCLUDED.tipo_pessoa,
      cpf = EXCLUDED.cpf,
      cnpj = EXCLUDED.cnpj,
      updated_at = now();

    -- Associar papéis baseado nos flags do fornecedor
    IF fornecedor_record.eh_funcionario AND papel_funcionario_id IS NOT NULL THEN
      INSERT INTO papeis_pessoa (pessoa_id, papel_id, ativo, created_at)
      VALUES (fornecedor_record.id, papel_funcionario_id, true, now())
      ON CONFLICT (pessoa_id, papel_id) DO UPDATE SET
        ativo = true,
        updated_at = now();
    END IF;

    IF fornecedor_record.eh_vendedora AND papel_vendedora_id IS NOT NULL THEN
      INSERT INTO papeis_pessoa (pessoa_id, papel_id, ativo, created_at)
      VALUES (fornecedor_record.id, papel_vendedora_id, true, now())
      ON CONFLICT (pessoa_id, papel_id) DO UPDATE SET
        ativo = true,
        updated_at = now();
    END IF;

    IF fornecedor_record.eh_fornecedor AND papel_fornecedor_id IS NOT NULL THEN
      INSERT INTO papeis_pessoa (pessoa_id, papel_id, ativo, created_at)
      VALUES (fornecedor_record.id, papel_fornecedor_id, true, now())
      ON CONFLICT (pessoa_id, papel_id) DO UPDATE SET
        ativo = true,
        updated_at = now();
    END IF;

    migrated_count := migrated_count + 1;
  END LOOP;

  RETURN migrated_count;
END;
$$;

-- 2. Criar função para sincronizar entidades_corporativas com pessoas
CREATE OR REPLACE FUNCTION public.sync_entidades_to_pessoas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entidade_record RECORD;
  synced_count INTEGER := 0;
BEGIN
  -- Sincronizar entidades que não existem em pessoas
  FOR entidade_record IN 
    SELECT * FROM entidades_corporativas 
    WHERE ativo = true 
    AND id NOT IN (SELECT id FROM pessoas WHERE id IS NOT NULL)
  LOOP
    -- Inserir na tabela pessoas
    INSERT INTO pessoas (
      id,
      nome,
      email,
      telefone,
      tipo_pessoa,
      cpf,
      cnpj,
      razao_social,
      nome_fantasia,
      ativo,
      created_at,
      updated_at,
      categorias
    ) VALUES (
      entidade_record.id,
      entidade_record.nome_razao_social,
      entidade_record.email,
      entidade_record.telefone,
      entidade_record.tipo_pessoa,
      CASE WHEN entidade_record.tipo_pessoa = 'pessoa_fisica' THEN entidade_record.cpf_cnpj END,
      CASE WHEN entidade_record.tipo_pessoa = 'pessoa_juridica' THEN entidade_record.cpf_cnpj END,
      CASE WHEN entidade_record.tipo_pessoa = 'pessoa_juridica' THEN entidade_record.nome_razao_social END,
      entidade_record.nome_fantasia,
      entidade_record.ativo,
      entidade_record.created_at,
      entidade_record.updated_at,
      '[]'::jsonb
    ) ON CONFLICT (id) DO UPDATE SET
      nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      telefone = EXCLUDED.telefone,
      tipo_pessoa = EXCLUDED.tipo_pessoa,
      cpf = EXCLUDED.cpf,
      cnpj = EXCLUDED.cnpj,
      updated_at = now();

    -- Sincronizar papéis de entidade_papeis para papeis_pessoa
    INSERT INTO papeis_pessoa (pessoa_id, papel_id, ativo, created_at)
    SELECT 
      entidade_record.id,
      ep.papel_id,
      ep.ativo,
      ep.created_at
    FROM entidade_papeis ep
    WHERE ep.entidade_id = entidade_record.id
    AND ep.ativo = true
    ON CONFLICT (pessoa_id, papel_id) DO UPDATE SET
      ativo = EXCLUDED.ativo,
      updated_at = now();

    synced_count := synced_count + 1;
  END LOOP;

  RETURN synced_count;
END;
$$;

-- 3. Criar função para garantir que pessoas existam em entidades_corporativas (CORRIGIDA)
CREATE OR REPLACE FUNCTION public.ensure_pessoa_in_entidades_corporativas(p_pessoa_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pessoa_record RECORD;
  entidade_id UUID;
BEGIN
  -- Buscar dados da pessoa
  SELECT * INTO pessoa_record FROM pessoas WHERE id = p_pessoa_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pessoa não encontrada: %', p_pessoa_id;
  END IF;

  -- Verificar se já existe em entidades_corporativas
  SELECT id INTO entidade_id FROM entidades_corporativas WHERE id = p_pessoa_id;
  
  IF FOUND THEN
    RETURN entidade_id;
  END IF;

  -- Criar entrada em entidades_corporativas
  INSERT INTO entidades_corporativas (
    id,
    tipo_pessoa,
    nome_razao_social,
    nome_fantasia,
    cpf_cnpj,
    cpf_cnpj_normalizado,
    email,
    email_normalizado,
    telefone,
    ativo,
    created_at,
    updated_at
  ) VALUES (
    pessoa_record.id,
    pessoa_record.tipo_pessoa,
    pessoa_record.nome,
    pessoa_record.nome_fantasia,
    COALESCE(pessoa_record.cpf, pessoa_record.cnpj),
    regexp_replace(COALESCE(pessoa_record.cpf, pessoa_record.cnpj, ''), '[^0-9]', '', 'g'),
    pessoa_record.email,
    CASE WHEN pessoa_record.email IS NOT NULL THEN lower(pessoa_record.email) END,
    pessoa_record.telefone,
    pessoa_record.ativo,
    pessoa_record.created_at,
    pessoa_record.updated_at
  ) RETURNING id INTO entidade_id;

  RETURN entidade_id;
END;
$$;

-- 4. Criar função melhorada para buscar pessoas com papéis
CREATE OR REPLACE FUNCTION public.get_pessoas_with_papeis(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  nome text,
  email text,
  telefone text,
  tipo_pessoa text,
  cpf_cnpj text,
  ativo boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  papeis text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.nome,
    p.email,
    p.telefone,
    p.tipo_pessoa,
    COALESCE(p.cpf, p.cnpj) as cpf_cnpj,
    p.ativo,
    p.created_at,
    p.updated_at,
    COALESCE(
      ARRAY_AGG(DISTINCT pap.nome ORDER BY pap.nome) 
      FILTER (WHERE pap.nome IS NOT NULL AND pp.ativo = true),
      ARRAY[]::text[]
    ) AS papeis
  FROM pessoas p
  LEFT JOIN papeis_pessoa pp ON pp.pessoa_id = p.id
  LEFT JOIN papeis pap ON pap.id = pp.papel_id AND pap.ativo = true
  WHERE (p_search IS NULL OR
         p.nome ILIKE '%' || p_search || '%' OR
         p.email ILIKE '%' || p_search || '%' OR
         COALESCE(p.cpf, p.cnpj) ILIKE '%' || p_search || '%')
  GROUP BY p.id, p.nome, p.email, p.telefone, p.tipo_pessoa, p.cpf, p.cnpj, p.ativo, p.created_at, p.updated_at
  ORDER BY p.nome
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 5. Executar migrações
SELECT migrate_fornecedores_to_pessoas() as fornecedores_migrados;
SELECT sync_entidades_to_pessoas() as entidades_sincronizadas;

-- 6. Atualizar categorias em pessoas baseado nos papéis
UPDATE pessoas 
SET categorias = (
  SELECT COALESCE(
    jsonb_agg(DISTINCT lower(pap.nome) ORDER BY lower(pap.nome)),
    '[]'::jsonb
  )
  FROM papeis_pessoa pp
  JOIN papeis pap ON pap.id = pp.papel_id
  WHERE pp.pessoa_id = pessoas.id
  AND pp.ativo = true
  AND pap.ativo = true
),
updated_at = now()
WHERE id IN (
  SELECT DISTINCT pp.pessoa_id 
  FROM papeis_pessoa pp 
  WHERE pp.ativo = true
);

-- 7. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_papeis_pessoa_pessoa_id_ativo ON papeis_pessoa(pessoa_id, ativo);
CREATE INDEX IF NOT EXISTS idx_papeis_pessoa_papel_id_ativo ON papeis_pessoa(papel_id, ativo);
CREATE INDEX IF NOT EXISTS idx_pessoas_nome_search ON pessoas USING gin(to_tsvector('portuguese', nome));
CREATE INDEX IF NOT EXISTS idx_pessoas_email_search ON pessoas(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pessoas_cpf_search ON pessoas(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pessoas_cnpj_search ON pessoas(cnpj) WHERE cnpj IS NOT NULL;

-- 8. Criar constraint para evitar duplicação de papéis por pessoa
ALTER TABLE papeis_pessoa DROP CONSTRAINT IF EXISTS papeis_pessoa_pessoa_papel_unique;
ALTER TABLE papeis_pessoa ADD CONSTRAINT papeis_pessoa_pessoa_papel_unique 
  UNIQUE (pessoa_id, papel_id);

-- 9. Comentários para documentação
COMMENT ON FUNCTION migrate_fornecedores_to_pessoas() IS 'Migra dados da tabela fornecedores para pessoas, mantendo associações de papéis';
COMMENT ON FUNCTION sync_entidades_to_pessoas() IS 'Sincroniza dados de entidades_corporativas com pessoas';
COMMENT ON FUNCTION ensure_pessoa_in_entidades_corporativas(UUID) IS 'Garante que uma pessoa existe em entidades_corporativas';
COMMENT ON FUNCTION get_pessoas_with_papeis(text, integer, integer) IS 'Busca pessoas com seus papéis associados';
