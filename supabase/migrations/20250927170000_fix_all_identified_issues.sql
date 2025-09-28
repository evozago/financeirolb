-- Correção completa dos problemas identificados
-- Data: 2025-09-27
-- Resolve: persistência de papéis, pedidos órfãos, marcas/categorias, padronização de papéis

-- ============================================================================
-- 1. CORREÇÃO DA PERSISTÊNCIA DE PAPÉIS
-- ============================================================================

-- Garantir que as funções RPC existam e funcionem corretamente
CREATE OR REPLACE FUNCTION public.upsert_entidade_papel(
  _entidade UUID,
  _papel_nome TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  papel_id UUID;
BEGIN
  -- Buscar o ID do papel pelo nome
  SELECT id INTO papel_id 
  FROM papeis 
  WHERE lower(trim(nome)) = lower(trim(_papel_nome)) 
  AND ativo = true;
  
  IF papel_id IS NULL THEN
    RAISE EXCEPTION 'Papel não encontrado: %', _papel_nome;
  END IF;
  
  -- Garantir que a entidade existe em entidades_corporativas
  INSERT INTO entidades_corporativas (id, tipo_pessoa, nome_razao_social, ativo, created_at, updated_at)
  SELECT _entidade, 'pessoa_fisica', 'Entidade', true, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM entidades_corporativas WHERE id = _entidade)
  ON CONFLICT (id) DO NOTHING;
  
  -- Inserir ou ativar o papel na entidade
  INSERT INTO entidade_papeis (entidade_id, papel_id, ativo, created_at, updated_at)
  VALUES (_entidade, papel_id, true, now(), now())
  ON CONFLICT (entidade_id, papel_id) 
  DO UPDATE SET 
    ativo = true,
    updated_at = now();
    
  -- Também manter sincronização com papeis_pessoa (para compatibilidade)
  INSERT INTO papeis_pessoa (pessoa_id, papel_id, ativo, created_at, updated_at)
  VALUES (_entidade, papel_id, true, now(), now())
  ON CONFLICT (pessoa_id, papel_id)
  DO UPDATE SET
    ativo = true,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.desativar_entidade_papel(
  _entidade UUID,
  _papel_nome TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  papel_id UUID;
BEGIN
  -- Buscar o ID do papel pelo nome
  SELECT id INTO papel_id 
  FROM papeis 
  WHERE lower(trim(nome)) = lower(trim(_papel_nome)) 
  AND ativo = true;
  
  IF papel_id IS NULL THEN
    RAISE EXCEPTION 'Papel não encontrado: %', _papel_nome;
  END IF;
  
  -- Desativar o papel na entidade
  UPDATE entidade_papeis 
  SET ativo = false, updated_at = now()
  WHERE entidade_id = _entidade AND papel_id = papel_id;
  
  -- Também desativar em papeis_pessoa (para compatibilidade)
  UPDATE papeis_pessoa 
  SET ativo = false, updated_at = now()
  WHERE pessoa_id = _entidade AND papel_id = papel_id;
END;
$$;

-- ============================================================================
-- 2. CORREÇÃO DOS PEDIDOS DESAPARECIDOS (MIGRAÇÃO FORNECEDOR_ID -> ENTIDADE_ID)
-- ============================================================================

-- Verificar se a coluna entidade_id existe em pedidos_produtos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pedidos_produtos' AND column_name = 'entidade_id') THEN
        ALTER TABLE pedidos_produtos ADD COLUMN entidade_id UUID;
    END IF;
END $$;

-- Migrar dados de fornecedor_id para entidade_id onde ainda não foi feito
UPDATE pedidos_produtos 
SET entidade_id = fornecedor_id
WHERE entidade_id IS NULL 
AND fornecedor_id IS NOT NULL;

-- Verificar se existem pedidos órfãos e reportar
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM pedidos_produtos 
  WHERE entidade_id IS NULL AND fornecedor_id IS NULL;
  
  IF orphan_count > 0 THEN
    RAISE NOTICE 'ATENÇÃO: % pedidos órfãos encontrados (sem fornecedor_id nem entidade_id)', orphan_count;
    
    -- Marcar pedidos órfãos como inativos em vez de deletar
    UPDATE pedidos_produtos 
    SET observacoes = COALESCE(observacoes || ' | ', '') || 'Pedido órfão - sem fornecedor associado',
        status = 'cancelado'
    WHERE entidade_id IS NULL AND fornecedor_id IS NULL;
  END IF;
END $$;

-- Criar constraint para garantir que entidade_id não seja nulo em novos registros
ALTER TABLE pedidos_produtos 
ALTER COLUMN entidade_id SET NOT NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_produtos_entidade_id 
ON pedidos_produtos(entidade_id);

-- ============================================================================
-- 3. CORREÇÃO DAS MARCAS E CATEGORIAS (FORNECEDOR_ID -> ENTIDADE_ID)
-- ============================================================================

-- Corrigir tabela marcas
DO $$ 
BEGIN
    -- Adicionar entidade_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'marcas' AND column_name = 'entidade_id') THEN
        ALTER TABLE marcas ADD COLUMN entidade_id UUID;
    END IF;
    
    -- Migrar dados
    UPDATE marcas 
    SET entidade_id = fornecedor_id
    WHERE entidade_id IS NULL 
    AND fornecedor_id IS NOT NULL;
    
    -- Criar foreign key constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_marcas_entidade_id') THEN
        ALTER TABLE marcas 
        ADD CONSTRAINT fk_marcas_entidade_id 
        FOREIGN KEY (entidade_id) REFERENCES entidades_corporativas(id);
    END IF;
END $$;

-- Corrigir tabela categorias_produtos se tiver fornecedor_id
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'categorias_produtos' AND column_name = 'fornecedor_id') THEN
        
        -- Adicionar entidade_id se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'categorias_produtos' AND column_name = 'entidade_id') THEN
            ALTER TABLE categorias_produtos ADD COLUMN entidade_id UUID;
        END IF;
        
        -- Migrar dados
        UPDATE categorias_produtos 
        SET entidade_id = fornecedor_id
        WHERE entidade_id IS NULL 
        AND fornecedor_id IS NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- 4. PADRONIZAÇÃO DOS PAPÉIS
-- ============================================================================

-- Função para normalizar nomes de papéis
CREATE OR REPLACE FUNCTION normalize_nome(text)
RETURNS text AS $$
  SELECT unaccent(lower(trim($1)));
$$ LANGUAGE sql IMMUTABLE;

-- Identificar e corrigir duplicatas de papéis
WITH duplicates AS (
  SELECT 
    normalize_nome(nome) as nome_norm,
    array_agg(id ORDER BY created_at) as ids,
    array_agg(nome ORDER BY created_at) as nomes,
    count(*) as cnt
  FROM papeis 
  WHERE ativo = true
  GROUP BY normalize_nome(nome)
  HAVING count(*) > 1
)
UPDATE papeis 
SET ativo = false, updated_at = now()
WHERE id IN (
  SELECT unnest(ids[2:]) 
  FROM duplicates
);

-- Corrigir especificamente o caso "Funcionário" vs "Funcionario"
UPDATE papeis 
SET nome = 'Funcionário'
WHERE lower(trim(nome)) IN ('funcionario', 'funcionário') 
AND ativo = true;

-- Garantir que existe apenas um registro ativo para cada papel normalizado
WITH papel_unico AS (
  SELECT 
    normalize_nome(nome) as nome_norm,
    MIN(id) as keep_id
  FROM papeis 
  WHERE ativo = true
  GROUP BY normalize_nome(nome)
)
UPDATE papeis 
SET ativo = false, updated_at = now()
WHERE ativo = true 
AND id NOT IN (SELECT keep_id FROM papel_unico);

-- Criar índice único para evitar futuras duplicações
DROP INDEX IF EXISTS ux_papeis_nome_norm;
CREATE UNIQUE INDEX ux_papeis_nome_norm
ON papeis (normalize_nome(nome))
WHERE ativo = true;

-- ============================================================================
-- 5. CORREÇÃO DAS VIEWS E CONSULTAS
-- ============================================================================

-- Criar/atualizar view para pedidos com fornecedores
CREATE OR REPLACE VIEW public.vw_pedidos_fornecedor AS
SELECT 
  pp.*,
  ec.nome_razao_social as fornecedor_nome,
  ec.tipo_pessoa as fornecedor_tipo
FROM pedidos_produtos pp
LEFT JOIN entidades_corporativas ec ON pp.entidade_id = ec.id
WHERE pp.entidade_id IS NOT NULL;

-- Atualizar função get_pessoas_with_papeis para incluir papéis de entidade_papeis
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
      array_agg(DISTINCT pap.nome ORDER BY pap.nome) 
      FILTER (WHERE pap.nome IS NOT NULL AND (
        (pp.ativo = true) OR (ep.ativo = true)
      )),
      ARRAY[]::text[]
    ) AS papeis
  FROM pessoas p
  LEFT JOIN papeis_pessoa pp ON pp.pessoa_id = p.id
  LEFT JOIN entidade_papeis ep ON ep.entidade_id = p.id
  LEFT JOIN papeis pap ON (pap.id = pp.papel_id OR pap.id = ep.papel_id) AND pap.ativo = true
  WHERE (p_search IS NULL OR
         p.nome ILIKE '%' || p_search || '%' OR
         p.email ILIKE '%' || p_search || '%' OR
         COALESCE(p.cpf, p.cnpj) ILIKE '%' || p_search || '%')
  GROUP BY p.id, p.nome, p.email, p.telefone, p.tipo_pessoa, p.cpf, p.cnpj, p.ativo, p.created_at, p.updated_at
  ORDER BY p.nome
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- ============================================================================
-- 6. FUNÇÃO PARA CARREGAR ENTIDADES COM MARCAS E CATEGORIAS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_entidades_with_details()
RETURNS TABLE(
  id uuid,
  nome_razao_social text,
  tipo_pessoa text,
  ativo boolean,
  marcas_count bigint,
  categorias_count bigint,
  papeis text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id,
    ec.nome_razao_social,
    ec.tipo_pessoa,
    ec.ativo,
    COALESCE(m.marcas_count, 0) as marcas_count,
    COALESCE(c.categorias_count, 0) as categorias_count,
    COALESCE(
      array_agg(DISTINCT p.nome ORDER BY p.nome) 
      FILTER (WHERE p.nome IS NOT NULL AND ep.ativo = true),
      ARRAY[]::text[]
    ) AS papeis
  FROM entidades_corporativas ec
  LEFT JOIN (
    SELECT entidade_id, COUNT(*) as marcas_count
    FROM marcas 
    WHERE ativo = true
    GROUP BY entidade_id
  ) m ON ec.id = m.entidade_id
  LEFT JOIN (
    SELECT entidade_id, COUNT(*) as categorias_count
    FROM categorias_produtos 
    WHERE ativo = true AND entidade_id IS NOT NULL
    GROUP BY entidade_id
  ) c ON ec.id = c.entidade_id
  LEFT JOIN entidade_papeis ep ON ep.entidade_id = ec.id
  LEFT JOIN papeis p ON p.id = ep.papel_id AND p.ativo = true
  GROUP BY ec.id, ec.nome_razao_social, ec.tipo_pessoa, ec.ativo, m.marcas_count, c.categorias_count
  ORDER BY ec.nome_razao_social;
END;
$$;

-- ============================================================================
-- 7. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON FUNCTION public.upsert_entidade_papel(UUID, TEXT) IS 'Ativa ou reativa um papel para uma entidade';
COMMENT ON FUNCTION public.desativar_entidade_papel(UUID, TEXT) IS 'Desativa um papel de uma entidade';
COMMENT ON FUNCTION public.normalize_nome(TEXT) IS 'Normaliza nomes removendo acentos e convertendo para minúsculas';
COMMENT ON VIEW public.vw_pedidos_fornecedor IS 'View que une pedidos com dados dos fornecedores usando entidade_id';
COMMENT ON FUNCTION public.get_entidades_with_details() IS 'Retorna entidades com contagem de marcas, categorias e papéis associados';

-- ============================================================================
-- 8. ESTATÍSTICAS FINAIS
-- ============================================================================

DO $$
DECLARE
  total_pedidos integer;
  pedidos_com_entidade integer;
  total_marcas integer;
  marcas_com_entidade integer;
  total_papeis_unicos integer;
  total_pessoas integer;
BEGIN
  SELECT COUNT(*) INTO total_pedidos FROM pedidos_produtos;
  SELECT COUNT(*) INTO pedidos_com_entidade FROM pedidos_produtos WHERE entidade_id IS NOT NULL;
  
  SELECT COUNT(*) INTO total_marcas FROM marcas WHERE ativo = true;
  SELECT COUNT(*) INTO marcas_com_entidade FROM marcas WHERE ativo = true AND entidade_id IS NOT NULL;
  
  SELECT COUNT(*) INTO total_papeis_unicos FROM papeis WHERE ativo = true;
  SELECT COUNT(*) INTO total_pessoas FROM pessoas WHERE ativo = true;
  
  RAISE NOTICE '=== CORREÇÃO COMPLETA FINALIZADA ===';
  RAISE NOTICE 'Pedidos: % total, % com entidade_id', total_pedidos, pedidos_com_entidade;
  RAISE NOTICE 'Marcas: % total, % com entidade_id', total_marcas, marcas_com_entidade;
  RAISE NOTICE 'Papéis únicos: %', total_papeis_unicos;
  RAISE NOTICE 'Pessoas ativas: %', total_pessoas;
  RAISE NOTICE '=== SISTEMA CORRIGIDO E PRONTO ===';
END $$;
