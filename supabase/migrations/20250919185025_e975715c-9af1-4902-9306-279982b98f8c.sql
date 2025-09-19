-- 6. Criar função para normalizar CPF/CNPJ
CREATE OR REPLACE FUNCTION normalize_cpf_cnpj(doc TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(COALESCE(doc, ''), '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- 7. Criar trigger para normalização automática
CREATE OR REPLACE FUNCTION update_cpf_cnpj_normalized()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalizar CPF se pessoa física
  IF NEW.tipo_pessoa = 'pessoa_fisica' AND NEW.cpf IS NOT NULL THEN
    NEW.cpf_cnpj_normalizado := normalize_cpf_cnpj(NEW.cpf);
  END IF;
  
  -- Normalizar CNPJ se pessoa jurídica
  IF NEW.tipo_pessoa = 'pessoa_juridica' AND NEW.cnpj_cpf IS NOT NULL THEN
    NEW.cpf_cnpj_normalizado := normalize_cpf_cnpj(NEW.cnpj_cpf);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 8. Aplicar trigger
DROP TRIGGER IF EXISTS trigger_normalize_cpf_cnpj ON fornecedores;
CREATE TRIGGER trigger_normalize_cpf_cnpj
  BEFORE INSERT OR UPDATE ON fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION update_cpf_cnpj_normalized();

-- 9. Adicionar constraint de verificação de tipo_pessoa
ALTER TABLE fornecedores 
DROP CONSTRAINT IF EXISTS fornecedores_tipo_pessoa_check;

ALTER TABLE fornecedores 
ADD CONSTRAINT fornecedores_tipo_pessoa_check 
CHECK (tipo_pessoa IN ('pessoa_fisica', 'pessoa_juridica'));