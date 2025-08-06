-- Permitir valores NULL na coluna numero_nfe temporariamente para resolver o erro de importação
ALTER TABLE ap_installments ALTER COLUMN numero_nfe DROP NOT NULL;

-- Atualizar registros existentes que podem ter numero_nfe nulo
UPDATE ap_installments 
SET numero_nfe = numero_documento 
WHERE numero_nfe IS NULL AND numero_documento IS NOT NULL;

-- Criar trigger para garantir que numero_nfe seja preenchido durante inserção
CREATE OR REPLACE FUNCTION ensure_numero_nfe()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Se numero_nfe não foi fornecido, tenta usar numero_documento
  IF NEW.numero_nfe IS NULL OR NEW.numero_nfe = '' THEN
    IF NEW.numero_documento IS NOT NULL AND NEW.numero_documento != '' THEN
      NEW.numero_nfe = NEW.numero_documento;
    ELSE
      -- Se não tem numero_documento, gera um identificador baseado no ID
      NEW.numero_nfe = 'NFE_' || substring(NEW.id::text from 1 for 8);
    END IF;
  END IF;
  
  -- Sincroniza numero_documento com numero_nfe se não estiver preenchido
  IF NEW.numero_documento IS NULL OR NEW.numero_documento = '' THEN
    NEW.numero_documento = NEW.numero_nfe;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Aplicar o trigger na tabela
DROP TRIGGER IF EXISTS trigger_ensure_numero_nfe ON ap_installments;
CREATE TRIGGER trigger_ensure_numero_nfe
  BEFORE INSERT OR UPDATE ON ap_installments
  FOR EACH ROW
  EXECUTE FUNCTION ensure_numero_nfe();