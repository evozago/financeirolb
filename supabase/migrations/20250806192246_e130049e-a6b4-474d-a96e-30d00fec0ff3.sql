-- Corrigir o trigger para preservar numero_nfe quando já foi definido corretamente
CREATE OR REPLACE FUNCTION ensure_numero_nfe()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Apenas processa se numero_nfe estiver realmente vazio/nulo
  IF NEW.numero_nfe IS NULL OR NEW.numero_nfe = '' THEN
    -- Se numero_documento foi fornecido, usar ele
    IF NEW.numero_documento IS NOT NULL AND NEW.numero_documento != '' THEN
      NEW.numero_nfe = NEW.numero_documento;
    ELSE
      -- Se não tem numero_documento, gera um identificador baseado no ID
      NEW.numero_nfe = 'NFE_' || substring(NEW.id::text from 1 for 8);
    END IF;
  END IF;
  
  -- Só sincroniza numero_documento com numero_nfe se numero_documento estiver vazio
  -- e numero_nfe tiver um valor válido
  IF (NEW.numero_documento IS NULL OR NEW.numero_documento = '') 
     AND NEW.numero_nfe IS NOT NULL AND NEW.numero_nfe != '' THEN
    NEW.numero_documento = NEW.numero_nfe;
  END IF;
  
  RETURN NEW;
END;
$function$;