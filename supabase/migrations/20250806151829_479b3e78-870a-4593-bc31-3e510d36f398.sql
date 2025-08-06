-- Add normalized columns for duplicate prevention
ALTER TABLE ap_installments 
ADD COLUMN IF NOT EXISTS supplier_key text,
ADD COLUMN IF NOT EXISTS invoice_number_norm text,
ADD COLUMN IF NOT EXISTS installment_norm text;

-- Function to normalize text (remove accents, trim, uppercase)
CREATE OR REPLACE FUNCTION normalize_text(input_text text)
RETURNS text AS $$
BEGIN
  IF input_text IS NULL OR trim(input_text) = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN upper(trim(unaccent(input_text)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to normalize installment (handle empty as 'ÚNICA')
CREATE OR REPLACE FUNCTION normalize_installment(parcela_num integer, total_parcelas integer)
RETURNS text AS $$
BEGIN
  IF parcela_num IS NULL OR total_parcelas IS NULL OR total_parcelas = 1 THEN
    RETURN 'ÚNICA';
  END IF;
  
  RETURN parcela_num::text || '/' || total_parcelas::text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing records with normalized values
UPDATE ap_installments 
SET 
  supplier_key = normalize_text(fornecedor),
  invoice_number_norm = normalize_text(numero_documento),
  installment_norm = normalize_installment(numero_parcela, total_parcelas)
WHERE supplier_key IS NULL;

-- Add mandatory numero_documento (invoice number) field
ALTER TABLE ap_installments 
ALTER COLUMN numero_documento SET NOT NULL,
ALTER COLUMN numero_documento SET DEFAULT '';

-- Update empty numero_documento to prevent constraint violation
UPDATE ap_installments 
SET numero_documento = 'REVISAR-' || id::text
WHERE numero_documento IS NULL OR numero_documento = '';

-- Create trigger to automatically populate normalized columns
CREATE OR REPLACE FUNCTION populate_normalized_columns()
RETURNS TRIGGER AS $$
BEGIN
  NEW.supplier_key = normalize_text(NEW.fornecedor);
  NEW.invoice_number_norm = normalize_text(NEW.numero_documento);
  NEW.installment_norm = normalize_installment(NEW.numero_parcela, NEW.total_parcelas);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for INSERT and UPDATE
DROP TRIGGER IF EXISTS tr_populate_normalized_ap_installments ON ap_installments;
CREATE TRIGGER tr_populate_normalized_ap_installments
  BEFORE INSERT OR UPDATE ON ap_installments
  FOR EACH ROW
  EXECUTE FUNCTION populate_normalized_columns();

-- Create function to check for duplicates
CREATE OR REPLACE FUNCTION check_duplicate_installment()
RETURNS TRIGGER AS $$
DECLARE
  duplicate_count integer;
  duplicate_id uuid;
BEGIN
  -- Check for existing record with same normalized key
  SELECT COUNT(*), MIN(id) INTO duplicate_count, duplicate_id
  FROM ap_installments 
  WHERE supplier_key = NEW.supplier_key
    AND invoice_number_norm = NEW.invoice_number_norm
    AND installment_norm = NEW.installment_norm
    AND (NEW.id IS NULL OR id != NEW.id); -- Exclude self during updates
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Já existe um título para Fornecedor = %, Nº Nota = %, Parcela = %. ID existente: %. Altere a parcela ou revise os dados.',
      NEW.fornecedor, NEW.numero_documento, NEW.installment_norm, duplicate_id
      USING ERRCODE = '23505'; -- unique_violation
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create duplicate prevention trigger
DROP TRIGGER IF EXISTS tr_check_duplicate_installment ON ap_installments;
CREATE TRIGGER tr_check_duplicate_installment
  BEFORE INSERT OR UPDATE ON ap_installments
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_installment();

-- Mark existing duplicates for review (keep most recent)
WITH ranked_duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY supplier_key, invoice_number_norm, installment_norm
           ORDER BY updated_at DESC, created_at DESC
         ) AS rn,
         supplier_key, invoice_number_norm, installment_norm
  FROM ap_installments
  WHERE supplier_key IS NOT NULL 
    AND invoice_number_norm IS NOT NULL 
    AND installment_norm IS NOT NULL
)
UPDATE ap_installments 
SET observacoes = COALESCE(observacoes || ' | ', '') || 'DUPLICADO - Identificado em ' || now()::date
FROM ranked_duplicates rd
WHERE ap_installments.id = rd.id 
  AND rd.rn > 1;

-- Create unique index after cleaning duplicates
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS ux_ap_installments_unique_key
ON ap_installments (supplier_key, invoice_number_norm, installment_norm)
WHERE supplier_key IS NOT NULL 
  AND invoice_number_norm IS NOT NULL 
  AND installment_norm IS NOT NULL;