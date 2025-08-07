-- Create storage bucket for order attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('order-attachments', 'order-attachments', false);

-- Create policies for order attachments bucket
CREATE POLICY "Authenticated users can upload order attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'order-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view order attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'order-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update order attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'order-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete order attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'order-attachments' AND auth.uid() IS NOT NULL);

-- Add representative contact fields to suppliers (fornecedores) table
ALTER TABLE fornecedores
ADD COLUMN IF NOT EXISTS contato_representante TEXT,
ADD COLUMN IF NOT EXISTS telefone_representante TEXT,
ADD COLUMN IF NOT EXISTS email_representante TEXT;

-- Update existing table with representative data from representantes_contatos if exists
UPDATE fornecedores 
SET 
  contato_representante = rc.nome_representante,
  telefone_representante = rc.telefone,
  email_representante = rc.email
FROM representantes_contatos rc 
WHERE fornecedores.id = rc.fornecedor_id
AND fornecedores.contato_representante IS NULL;