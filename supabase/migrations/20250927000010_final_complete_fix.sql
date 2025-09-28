-- Correção final e completa de todos os problemas
-- Data: 2025-09-27
-- Resolve: constraint única, sintaxe e estrutura de tabelas

-- 1. Adicionar colunas necessárias se não existirem
DO $$ 
BEGIN
    -- Adicionar updated_at em entidade_papeis
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entidade_papeis' AND column_name = 'updated_at') THEN
        ALTER TABLE entidade_papeis ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        UPDATE entidade_papeis SET updated_at = created_at WHERE updated_at IS NULL;
        ALTER TABLE entidade_papeis ALTER COLUMN updated_at SET NOT NULL;
    END IF;
    
    -- Adicionar updated_at em papeis_pessoa
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'papeis_pessoa' AND column_name = 'updated_at') THEN
        ALTER TABLE papeis_pessoa ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        UPDATE papeis_pessoa SET updated_at = created_at WHERE updated_at IS NULL;
        ALTER TABLE papeis_pessoa ALTER COLUMN updated_at SET NOT NULL;
    END IF;
    
    -- Adicionar email_normalizado em pessoas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pessoas' AND column_name = 'email_normalizado') THEN
        ALTER TABLE pessoas ADD COLUMN email_normalizado text;
    END IF;
    
    -- Adicionar cpf_cnpj_normalizado em pessoas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pessoas' AND column_name = 'cpf_cnpj_normalizado') THEN
        ALTER TABLE pessoas ADD COLUMN cpf_cnpj_normalizado text;
    END IF;
END $$;

-- 2. Remover TODOS os triggers e funções existentes
DROP TRIGGER IF EXISTS trg_sync_papeis_to_entidade ON papeis_pessoa CASCADE;
DROP TRIGGER IF EXISTS update_entidade_papeis_updated_at ON entidade_papeis CASCADE;
DROP TRIGGER IF EXISTS update_papeis_pessoa_updated_at ON papeis_pessoa CASCADE;
DROP TRIGGER IF EXISTS normalize_pessoas_data_trigger ON pessoas CASCADE;
DROP TRIGGER IF EXISTS trg_normalize_pessoas_fields ON pessoas CASCADE;

DROP FUNCTION IF EXISTS sync_papeis_trigger() CASCADE;
DROP FUNCTION IF EXISTS sync_papeis_pessoa_to_entidade(UUID) CASCADE;
DROP FUNCTION IF EXISTS ensure_pessoa_in_entidades_corporativas(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS normalize_pessoas_fields() CASCADE;
DROP FUNCTION IF EXISTS migrate_fornecedores_to_pessoas() CASCADE;
DROP FUNCTION IF EXISTS sync_entidades_to_pessoas() CASCADE;

-- 3. Normalizar dados existentes em pessoas
UPDATE pessoas 
SET 
  email_normalizado = CASE WHEN email IS NOT NULL AND trim(email) != '' THEN lower(trim(email)) END,
  cpf_cnpj_normalizado = CASE 
    WHEN cpf IS NOT NULL AND trim(cpf) != '' THEN regexp_replace(cpf, '[^0-9]', '', 'g')
    WHEN cnpj IS NOT NULL AND trim(cnpj) != '' THEN regexp_replace(cnpj, '[^0-9]', '', 'g')
  END,
  updated_at = now()
WHERE email_normalizado IS NULL OR cpf_cnpj_normalizado IS NULL;

-- 4. Limpar registros com CPF/CNPJ vazio em entidades_corporativas
DELETE FROM entidades_corporativas 
WHERE cpf_cnpj_normalizado = '' OR cpf_cnpj_normalizado IS NULL;

-- 5. Criar função ensure_pessoa_in_entidades_corporativas CORRIGIDA
CREATE OR REPLACE FUNCTION public.ensure_pessoa_in_entidades_corporativas(p_pessoa_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pessoa_record RECORD;
  entidade_id UUID;
  cpf_cnpj_norm text;
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

  -- Normalizar CPF/CNPJ
  cpf_cnpj_norm := regexp_replace(COALESCE(pessoa_record.cpf, pessoa_record.cnpj, ''), '[^0-9]', '', 'g');
  
  -- Se CPF/CNPJ estiver vazio, usar NULL
  IF cpf_cnpj_norm = '' THEN
    cpf_cnpj_norm := NULL;
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
    cpf_cnpj_norm,
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

-- 6. Criar função get_pessoas_with_papeis CORRIGIDA
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

-- 7. Criar função para normalização automática
CREATE OR REPLACE FUNCTION normalize_pessoas_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalizar email
  IF NEW.email IS NOT NULL AND trim(NEW.email) != '' THEN
    NEW.email_normalizado := lower(trim(NEW.email));
  ELSE
    NEW.email_normalizado := NULL;
  END IF;
  
  -- Normalizar CPF/CNPJ
  IF NEW.cpf IS NOT NULL AND trim(NEW.cpf) != '' THEN
    NEW.cpf_cnpj_normalizado := regexp_replace(NEW.cpf, '[^0-9]', '', 'g');
  ELSIF NEW.cnpj IS NOT NULL AND trim(NEW.cnpj) != '' THEN
    NEW.cpf_cnpj_normalizado := regexp_replace(NEW.cnpj, '[^0-9]', '', 'g');
  ELSE
    NEW.cpf_cnpj_normalizado := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Criar trigger para normalização
CREATE TRIGGER trg_normalize_pessoas_fields
  BEFORE INSERT OR UPDATE ON pessoas
  FOR EACH ROW
  EXECUTE FUNCTION normalize_pessoas_fields();

-- 9. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Criar triggers para updated_at
CREATE TRIGGER update_entidade_papeis_updated_at
    BEFORE UPDATE ON entidade_papeis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_papeis_pessoa_updated_at
    BEFORE UPDATE ON papeis_pessoa
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. Criar índices necessários
CREATE INDEX IF NOT EXISTS idx_pessoas_ativo ON pessoas(ativo);
CREATE INDEX IF NOT EXISTS idx_pessoas_tipo_pessoa ON pessoas(tipo_pessoa);
CREATE INDEX IF NOT EXISTS idx_pessoas_email_norm ON pessoas(email_normalizado) WHERE email_normalizado IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pessoas_cpf_cnpj_norm ON pessoas(cpf_cnpj_normalizado) WHERE cpf_cnpj_normalizado IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_papeis_pessoa_pessoa_id_ativo ON papeis_pessoa(pessoa_id, ativo);
CREATE INDEX IF NOT EXISTS idx_papeis_pessoa_papel_id_ativo ON papeis_pessoa(papel_id, ativo);

-- 12. Criar constraint única para evitar duplicação de papéis
ALTER TABLE papeis_pessoa DROP CONSTRAINT IF EXISTS papeis_pessoa_pessoa_papel_unique;
ALTER TABLE papeis_pessoa ADD CONSTRAINT papeis_pessoa_pessoa_papel_unique 
  UNIQUE (pessoa_id, papel_id);

-- 13. Comentários
COMMENT ON FUNCTION ensure_pessoa_in_entidades_corporativas(UUID) IS 'Garante que uma pessoa existe em entidades_corporativas (versão final corrigida)';
COMMENT ON FUNCTION get_pessoas_with_papeis(text, integer, integer) IS 'Busca pessoas com seus papéis associados (versão final corrigida)';
COMMENT ON FUNCTION normalize_pessoas_fields() IS 'Normaliza campos email e CPF/CNPJ na tabela pessoas';
COMMENT ON FUNCTION update_updated_at_column() IS 'Atualiza automaticamente a coluna updated_at';

-- 14. Mostrar estatísticas finais
DO $$
DECLARE
  total_pessoas integer;
  pessoas_ativas integer;
  total_papeis integer;
BEGIN
  SELECT count(*) INTO total_pessoas FROM pessoas;
  SELECT count(*) INTO pessoas_ativas FROM pessoas WHERE ativo = true;
  SELECT count(*) INTO total_papeis FROM papeis_pessoa WHERE ativo = true;
  
  RAISE NOTICE '=== CORREÇÃO FINAL CONCLUÍDA ===';
  RAISE NOTICE 'Total de pessoas: %', total_pessoas;
  RAISE NOTICE 'Pessoas ativas: %', pessoas_ativas;
  RAISE NOTICE 'Total de papéis ativos: %', total_papeis;
  RAISE NOTICE '=== SISTEMA PRONTO PARA USO ===';
END $$;
