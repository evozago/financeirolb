-- Correção para remover triggers dependentes
-- Data: 2025-09-27

-- 1. Remover todos os triggers relacionados à normalização na tabela pessoas
DROP TRIGGER IF EXISTS trigger_pessoas_normalize_cpf ON pessoas;
DROP TRIGGER IF EXISTS normalize_pessoas_cpf_trigger ON pessoas;
DROP TRIGGER IF EXISTS normalize_pessoas_data_trigger ON pessoas;

-- 2. Remover as funções problemáticas
DROP FUNCTION IF EXISTS normalize_pessoas_cpf() CASCADE;
DROP FUNCTION IF EXISTS normalize_pessoas_data() CASCADE;

-- 3. Adicionar os campos necessários se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pessoas' AND column_name = 'email_normalizado') THEN
    ALTER TABLE pessoas ADD COLUMN email_normalizado text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pessoas' AND column_name = 'cpf_cnpj_normalizado') THEN
    ALTER TABLE pessoas ADD COLUMN cpf_cnpj_normalizado text;
  END IF;
END $$;

-- 4. Criar função corrigida para normalização
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

-- 5. Criar trigger corrigido
CREATE TRIGGER normalize_pessoas_data_trigger
  BEFORE INSERT OR UPDATE ON pessoas
  FOR EACH ROW
  EXECUTE FUNCTION normalize_pessoas_data();

-- 6. Atualizar dados existentes
UPDATE pessoas 
SET 
  email_normalizado = CASE WHEN email IS NOT NULL THEN lower(trim(email)) END,
  cpf_cnpj_normalizado = CASE 
    WHEN cpf IS NOT NULL THEN regexp_replace(cpf, '[^0-9]', '', 'g')
    WHEN cnpj IS NOT NULL THEN regexp_replace(cnpj, '[^0-9]', '', 'g')
  END,
  updated_at = now()
WHERE email_normalizado IS NULL OR cpf_cnpj_normalizado IS NULL;

-- 7. Criar índices únicos para evitar duplicatas (com tratamento de erro)
DO $$
BEGIN
  BEGIN
    CREATE UNIQUE INDEX idx_pessoas_email_normalizado_unique 
      ON pessoas(email_normalizado) 
      WHERE email_normalizado IS NOT NULL AND ativo = true;
  EXCEPTION WHEN duplicate_table THEN
    -- Índice já existe, ignorar
  END;
  
  BEGIN
    CREATE UNIQUE INDEX idx_pessoas_cpf_cnpj_normalizado_unique 
      ON pessoas(cpf_cnpj_normalizado) 
      WHERE cpf_cnpj_normalizado IS NOT NULL AND cpf_cnpj_normalizado != '' AND ativo = true;
  EXCEPTION WHEN duplicate_table THEN
    -- Índice já existe, ignorar
  END;
END $$;

-- 8. Comentário
COMMENT ON FUNCTION normalize_pessoas_data() IS 'Normaliza email e CPF/CNPJ na tabela pessoas';
