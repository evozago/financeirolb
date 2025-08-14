-- Create function to map CNPJ to filial if not exists (checking first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'map_cnpj_to_filial'
  ) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.map_cnpj_to_filial(cnpj_emitente text)
    RETURNS uuid
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO ''public''
    AS $function$
    DECLARE
      filial_id uuid;
      cnpj_normalizado text;
    BEGIN
      -- Normalizar CNPJ removendo caracteres especiais
      cnpj_normalizado := regexp_replace(cnpj_emitente, ''[^0-9]'', '''', ''g'');
      
      -- Buscar filial pelo CNPJ
      SELECT id INTO filial_id 
      FROM filiais 
      WHERE regexp_replace(cnpj, ''[^0-9]'', '''', ''g'') = cnpj_normalizado 
      AND ativo = true
      LIMIT 1;
      
      RETURN filial_id;
    END;
    $function$';
  END IF;
END$$;