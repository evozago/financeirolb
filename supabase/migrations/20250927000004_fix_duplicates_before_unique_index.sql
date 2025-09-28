-- Correção para remover duplicatas antes de criar índice único
-- Data: 2025-09-27

-- 1. Remover todos os triggers relacionados à normalização na tabela pessoas
DROP TRIGGER IF EXISTS trigger_pessoas_normalize_cpf ON pessoas;
DROP TRIGGER IF EXISTS normalize_pessoas_cpf_trigger ON pessoas;
DROP TRIGGER IF EXISTS normalize_pessoas_data_trigger ON pessoas;

-- 2. Remover as funções problemáticas
DROP FUNCTION IF EXISTS normalize_pessoas_cpf() CASCADE;
DROP FUNCTION IF EXISTS normalize_pessoas_data() CASCADE;

-- 3. Remover índices únicos se existirem
DROP INDEX IF EXISTS idx_pessoas_email_normalizado_unique;
DROP INDEX IF EXISTS idx_pessoas_cpf_cnpj_normalizado_unique;

-- 4. Adicionar os campos necessários se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pessoas' AND column_name = 'email_normalizado') THEN
    ALTER TABLE pessoas ADD COLUMN email_normalizado text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pessoas' AND column_name = 'cpf_cnpj_normalizado') THEN
    ALTER TABLE pessoas ADD COLUMN cpf_cnpj_normalizado text;
  END IF;
END $$;

-- 5. Atualizar dados existentes para normalização
UPDATE pessoas 
SET 
  email_normalizado = CASE WHEN email IS NOT NULL THEN lower(trim(email)) END,
  cpf_cnpj_normalizado = CASE 
    WHEN cpf IS NOT NULL THEN regexp_replace(cpf, '[^0-9]', '', 'g')
    WHEN cnpj IS NOT NULL THEN regexp_replace(cnpj, '[^0-9]', '', 'g')
  END,
  updated_at = now();

-- 6. Identificar e tratar duplicatas de CPF/CNPJ
-- Manter apenas o registro mais antigo de cada CPF/CNPJ duplicado
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
ids_to_deactivate AS (
  SELECT unnest(ids[2:]) as id_to_deactivate
  FROM duplicates
)
UPDATE pessoas 
SET 
  ativo = false, 
  updated_at = now(),
  observacoes = COALESCE(observacoes || ' | ', '') || 'Desativado por CPF/CNPJ duplicado em ' || now()
WHERE id IN (SELECT id_to_deactivate FROM ids_to_deactivate);

-- 7. Identificar e tratar duplicatas de email
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
email_ids_to_deactivate AS (
  SELECT unnest(ids[2:]) as id_to_deactivate
  FROM email_duplicates
)
UPDATE pessoas 
SET 
  ativo = false, 
  updated_at = now(),
  observacoes = COALESCE(observacoes || ' | ', '') || 'Desativado por email duplicado em ' || now()
WHERE id IN (SELECT id_to_deactivate FROM email_ids_to_deactivate);

-- 8. Criar função corrigida para normalização
CREATE OR REPLACE FUNCTION normalize_pessoas_data()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalizar email se fornecido
  IF NEW.email IS NOT NULL THEN
    NEW.email_normalizado := lower(trim(NEW.email));
  ELSE
    NEW.email_normalizado := NULL;
  END IF;
  
  -- Normalizar CPF/CNPJ se fornecido
  IF NEW.cpf IS NOT NULL THEN
    NEW.cpf_cnpj_normalizado := regexp_replace(NEW.cpf, '[^0-9]', '', 'g');
  ELSIF NEW.cnpj IS NOT NULL THEN
    NEW.cpf_cnpj_normalizado := regexp_replace(NEW.cnpj, '[^0-9]', '', 'g');
  ELSE
    NEW.cpf_cnpj_normalizado := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 9. Criar trigger corrigido
CREATE TRIGGER normalize_pessoas_data_trigger
  BEFORE INSERT OR UPDATE ON pessoas
  FOR EACH ROW
  EXECUTE FUNCTION normalize_pessoas_data();

-- 10. Agora criar os índices únicos (sem duplicatas)
CREATE UNIQUE INDEX idx_pessoas_email_normalizado_unique 
  ON pessoas(email_normalizado) 
  WHERE email_normalizado IS NOT NULL AND email_normalizado != '' AND ativo = true;

CREATE UNIQUE INDEX idx_pessoas_cpf_cnpj_normalizado_unique 
  ON pessoas(cpf_cnpj_normalizado) 
  WHERE cpf_cnpj_normalizado IS NOT NULL AND cpf_cnpj_normalizado != '' AND ativo = true;

-- 11. Criar índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_pessoas_ativo ON pessoas(ativo);
CREATE INDEX IF NOT EXISTS idx_pessoas_tipo_pessoa ON pessoas(tipo_pessoa);
CREATE INDEX IF NOT EXISTS idx_pessoas_nome_search ON pessoas USING gin(to_tsvector('portuguese', nome));

-- 12. Comentários
COMMENT ON FUNCTION normalize_pessoas_data() IS 'Normaliza email e CPF/CNPJ na tabela pessoas';
COMMENT ON INDEX idx_pessoas_cpf_cnpj_normalizado_unique IS 'Índice único para CPF/CNPJ normalizado de pessoas ativas';
COMMENT ON INDEX idx_pessoas_email_normalizado_unique IS 'Índice único para email normalizado de pessoas ativas';

-- 13. Mostrar estatísticas de limpeza
DO $$
DECLARE
  total_pessoas integer;
  pessoas_ativas integer;
  pessoas_inativas integer;
BEGIN
  SELECT count(*) INTO total_pessoas FROM pessoas;
  SELECT count(*) INTO pessoas_ativas FROM pessoas WHERE ativo = true;
  SELECT count(*) INTO pessoas_inativas FROM pessoas WHERE ativo = false;
  
  RAISE NOTICE 'Limpeza concluída:';
  RAISE NOTICE 'Total de pessoas: %', total_pessoas;
  RAISE NOTICE 'Pessoas ativas: %', pessoas_ativas;
  RAISE NOTICE 'Pessoas inativas: %', pessoas_inativas;
END $$;
