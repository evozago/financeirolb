-- Fix the auto_map_filial function to handle non-UUID numero_nfe values
CREATE OR REPLACE FUNCTION public.auto_map_filial()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  nfe_cnpj text;
  mapped_filial_id uuid;
  is_valid_uuid boolean;
BEGIN
  -- Se filial_id já está definida, não fazer nada
  IF NEW.filial_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Se tem numero_nfe, verificar se é um UUID válido antes de usar
  IF NEW.numero_nfe IS NOT NULL THEN
    -- Check if numero_nfe is a valid UUID
    BEGIN
      -- Try to cast to UUID, if it fails, it's not a valid UUID
      is_valid_uuid := (NEW.numero_nfe ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$');
      
      IF is_valid_uuid THEN
        SELECT cnpj_emitente INTO nfe_cnpj 
        FROM nfe_data 
        WHERE id = NEW.numero_nfe::uuid;
        
        IF nfe_cnpj IS NOT NULL THEN
          mapped_filial_id := map_cnpj_to_filial(nfe_cnpj);
          IF mapped_filial_id IS NOT NULL THEN
            NEW.filial_id := mapped_filial_id;
          END IF;
        END IF;
      ELSE
        -- numero_nfe is not a UUID, try to find by numero_nfe field in nfe_data
        SELECT cnpj_emitente INTO nfe_cnpj 
        FROM nfe_data 
        WHERE numero_nfe = NEW.numero_nfe;
        
        IF nfe_cnpj IS NOT NULL THEN
          mapped_filial_id := map_cnpj_to_filial(nfe_cnpj);
          IF mapped_filial_id IS NOT NULL THEN
            NEW.filial_id := mapped_filial_id;
          END IF;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If any error occurs, just continue without mapping
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;