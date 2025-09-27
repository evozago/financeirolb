-- Correção final e completa da estrutura de pessoas
-- Data: 2025-09-27
-- Remove tudo e recria do zero para evitar conflitos

-- 1. Remover TODOS os triggers relacionados (mesmo que não existam)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remover todos os triggers da tabela pessoas
    FOR r IN (SELECT tgname FROM pg_trigger WHERE tgrelid = 'pessoas'::regclass)
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.tgname || ' ON pessoas CASCADE';
    END LOOP;
END $$;

-- 2. Remover TODAS as funções relacionadas à normalização
DROP FUNCTION IF EXISTS normalize_pessoas_cpf() CASCADE;
DROP FUNCTION IF EXISTS normalize_pessoas_data() CASCADE;
DROP FUNCTION IF EXISTS normalize_pessoas_email() CASCADE;

-- 3. Remover TODOS os índices únicos relacionados
DROP INDEX IF EXISTS idx_pessoas_email_normalizado_unique CASCADE;
DROP INDEX IF EXISTS idx_pessoas_cpf_cnpj_normalizado_unique CASCADE;
DROP INDEX IF EXISTS idx_pessoas_cpf_normalizado_unique CASCADE;
DROP INDEX IF EXISTS idx_pessoas_cnpj_normalizado_unique CASCADE;

-- 4. Adicionar campos se não existirem (sem erro se já existirem)
DO $$ 
BEGIN
    -- Adicionar email_normalizado
    BEGIN
        ALTER TABLE pessoas ADD COLUMN email_normalizado text;
    EXCEPTION WHEN duplicate_column THEN
        -- Coluna já existe, ignorar
    END;
    
    -- Adicionar cpf_cnpj_normalizado
    BEGIN
        ALTER TABLE pessoas ADD COLUMN cpf_cnpj_normalizado text;
    EXCEPTION WHEN duplicate_column THEN
        -- Coluna já existe, ignorar
    END;
END $$;

-- 5. Limpar dados existentes primeiro
UPDATE pessoas 
SET 
  email_normalizado = NULL,
  cpf_cnpj_normalizado = NULL,
  updated_at = now();

-- 6. Normalizar dados existentes
UPDATE pessoas 
SET 
  email_normalizado = CASE WHEN email IS NOT NULL AND trim(email) != '' THEN lower(trim(email)) END,
  cpf_cnpj_normalizado = CASE 
    WHEN cpf IS NOT NULL AND trim(cpf) != '' THEN regexp_replace(cpf, '[^0-9]', '', 'g')
    WHEN cnpj IS NOT NULL AND trim(cnpj) != '' THEN regexp_replace(cnpj, '[^0-9]', '', 'g')
  END,
  updated_at = now();

-- 7. Identificar e marcar duplicatas de CPF/CNPJ (sem desativar ainda)
WITH duplicates AS (
  SELECT 
    cpf_cnpj_normalizado,
    array_agg(id ORDER BY created_at) as ids,
    count(*) as cnt
  FROM pessoas 
  WHERE cpf_cnpj_normalizado IS NOT NULL 
    AND cpf_cnpj_normalizado != '' 
    AND ativo = true
  GROUP BY cpf_cnpj_normalizado
  HAVING count(*) > 1
),
ids_to_mark AS (
  SELECT unnest(ids[2:]) as id_to_mark
  FROM duplicates
)
UPDATE pessoas 
SET 
  observacoes = COALESCE(observacoes || ' | ', '') || 'DUPLICATA_CPF_CNPJ_' || now()::date,
  updated_at = now()
WHERE id IN (SELECT id_to_mark FROM ids_to_mark);

-- 8. Identificar e marcar duplicatas de email (sem desativar ainda)
WITH email_duplicates AS (
  SELECT 
    email_normalizado,
    array_agg(id ORDER BY created_at) as ids,
    count(*) as cnt
  FROM pessoas 
  WHERE email_normalizado IS NOT NULL 
    AND email_normalizado != '' 
    AND ativo = true
  GROUP BY email_normalizado
  HAVING count(*) > 1
),
email_ids_to_mark AS (
  SELECT unnest(ids[2:]) as id_to_mark
  FROM email_duplicates
)
UPDATE pessoas 
SET 
  observacoes = COALESCE(observacoes || ' | ', '') || 'DUPLICATA_EMAIL_' || now()::date,
  updated_at = now()
WHERE id IN (SELECT id_to_mark FROM email_ids_to_mark);

-- 9. Criar função de normalização (nova versão)
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

-- 10. Criar trigger (nova versão)
CREATE TRIGGER trg_normalize_pessoas_fields
  BEFORE INSERT OR UPDATE ON pessoas
  FOR EACH ROW
  EXECUTE FUNCTION normalize_pessoas_fields();

-- 11. Criar índices não-únicos primeiro (para performance)
CREATE INDEX IF NOT EXISTS idx_pessoas_ativo ON pessoas(ativo);
CREATE INDEX IF NOT EXISTS idx_pessoas_tipo_pessoa ON pessoas(tipo_pessoa);
CREATE INDEX IF NOT EXISTS idx_pessoas_email_norm ON pessoas(email_normalizado) WHERE email_normalizado IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pessoas_cpf_cnpj_norm ON pessoas(cpf_cnpj_normalizado) WHERE cpf_cnpj_normalizado IS NOT NULL;

-- 12. Mostrar estatísticas
DO $$
DECLARE
  total_pessoas integer;
  pessoas_ativas integer;
  duplicatas_cpf integer;
  duplicatas_email integer;
BEGIN
  SELECT count(*) INTO total_pessoas FROM pessoas;
  SELECT count(*) INTO pessoas_ativas FROM pessoas WHERE ativo = true;
  SELECT count(*) INTO duplicatas_cpf FROM pessoas WHERE observacoes LIKE '%DUPLICATA_CPF_CNPJ%';
  SELECT count(*) INTO duplicatas_email FROM pessoas WHERE observacoes LIKE '%DUPLICATA_EMAIL%';
  
  RAISE NOTICE '=== ESTATÍSTICAS DA CORREÇÃO ===';
  RAISE NOTICE 'Total de pessoas: %', total_pessoas;
  RAISE NOTICE 'Pessoas ativas: %', pessoas_ativas;
  RAISE NOTICE 'Duplicatas de CPF/CNPJ marcadas: %', duplicatas_cpf;
  RAISE NOTICE 'Duplicatas de email marcadas: %', duplicatas_email;
  RAISE NOTICE '=== CORREÇÃO CONCLUÍDA ===';
END $$;

-- 13. Comentários
COMMENT ON FUNCTION normalize_pessoas_fields() IS 'Normaliza campos email e CPF/CNPJ na tabela pessoas';
COMMENT ON TRIGGER trg_normalize_pessoas_fields ON pessoas IS 'Trigger para normalização automática de campos';
