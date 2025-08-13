-- Criar tabela de filiais
CREATE TABLE public.filiais (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  cnpj text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir as filiais baseadas nos CNPJs informados
INSERT INTO public.filiais (nome, cnpj) VALUES 
('Filial 1', '33133217000129'),
('Filial 2', '60927596000100');

-- Adicionar coluna filial_id nas tabelas relacionadas
ALTER TABLE public.fornecedores ADD COLUMN filial_id uuid REFERENCES public.filiais(id);
ALTER TABLE public.contas_bancarias ADD COLUMN filial_id uuid REFERENCES public.filiais(id);
ALTER TABLE public.ap_installments ADD COLUMN filial_id uuid REFERENCES public.filiais(id);

-- Habilitar RLS na tabela filiais
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para filiais
CREATE POLICY "Authenticated users can view filiais" 
ON public.filiais FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert filiais" 
ON public.filiais FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update filiais" 
ON public.filiais FOR UPDATE 
USING (true);

CREATE POLICY "Only admins can delete filiais" 
ON public.filiais FOR DELETE 
USING (is_admin());

-- Criar função para mapear CNPJ para filial automaticamente
CREATE OR REPLACE FUNCTION public.map_cnpj_to_filial(cnpj_emitente text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  filial_id uuid;
  cnpj_normalizado text;
BEGIN
  -- Normalizar CNPJ removendo caracteres especiais
  cnpj_normalizado := regexp_replace(cnpj_emitente, '[^0-9]', '', 'g');
  
  -- Buscar filial pelo CNPJ
  SELECT id INTO filial_id 
  FROM filiais 
  WHERE regexp_replace(cnpj, '[^0-9]', '', 'g') = cnpj_normalizado 
  AND ativo = true
  LIMIT 1;
  
  RETURN filial_id;
END;
$$;

-- Criar trigger para mapear filial automaticamente em ap_installments
CREATE OR REPLACE FUNCTION public.auto_map_filial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  nfe_cnpj text;
  mapped_filial_id uuid;
BEGIN
  -- Se filial_id já está definida, não fazer nada
  IF NEW.filial_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Se tem numero_nfe, buscar CNPJ da NFe
  IF NEW.numero_nfe IS NOT NULL THEN
    SELECT cnpj_emitente INTO nfe_cnpj 
    FROM nfe_data 
    WHERE id = NEW.numero_nfe::uuid;
    
    IF nfe_cnpj IS NOT NULL THEN
      mapped_filial_id := map_cnpj_to_filial(nfe_cnpj);
      IF mapped_filial_id IS NOT NULL THEN
        NEW.filial_id := mapped_filial_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Adicionar trigger para mapeamento automático
CREATE TRIGGER trigger_auto_map_filial
BEFORE INSERT OR UPDATE ON public.ap_installments
FOR EACH ROW
EXECUTE FUNCTION public.auto_map_filial();

-- Criar trigger para updated_at em filiais
CREATE TRIGGER update_filiais_updated_at
BEFORE UPDATE ON public.filiais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();