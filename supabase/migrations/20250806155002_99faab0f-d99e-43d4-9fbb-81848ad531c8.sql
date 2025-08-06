-- Recreate duplicate prevention system for ap_installments
-- This will prevent duplicate NFe imports with same supplier, installment, and total value

-- First, add columns for normalized duplicate detection
ALTER TABLE ap_installments 
ADD COLUMN IF NOT EXISTS supplier_key text,
ADD COLUMN IF NOT EXISTS invoice_number_norm text,
ADD COLUMN IF NOT EXISTS installment_norm text;

-- Create function to normalize supplier name
CREATE OR REPLACE FUNCTION normalize_supplier_name(supplier_name text)
RETURNS text AS $$
BEGIN
  RETURN upper(trim(regexp_replace(supplier_name, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to extract invoice number from description
CREATE OR REPLACE FUNCTION extract_invoice_number(description text)
RETURNS text AS $$
BEGIN
  -- Extract NFe number from description like "NFe Nfe_35250860618056000136550010000000411555737506_8769107769"
  RETURN regexp_replace(description, '^NFe\s+Nfe_([0-9]+).*', '\1', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to normalize installment info
CREATE OR REPLACE FUNCTION normalize_installment_info(numero_parcela integer, total_parcelas integer, valor numeric)
RETURNS text AS $$
BEGIN
  RETURN numero_parcela::text || '/' || total_parcelas::text || '_' || valor::text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing records with normalized data
UPDATE ap_installments SET
  supplier_key = normalize_supplier_name(fornecedor),
  invoice_number_norm = extract_invoice_number(descricao),
  installment_norm = normalize_installment_info(numero_parcela, total_parcelas, valor);

-- Create trigger function to populate normalized columns
CREATE OR REPLACE FUNCTION populate_normalized_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.supplier_key = normalize_supplier_name(NEW.fornecedor);
  NEW.invoice_number_norm = extract_invoice_number(NEW.descricao);
  NEW.installment_norm = normalize_installment_info(NEW.numero_parcela, NEW.total_parcelas, NEW.valor);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate normalized fields
DROP TRIGGER IF EXISTS trigger_populate_normalized_fields ON ap_installments;
CREATE TRIGGER trigger_populate_normalized_fields
  BEFORE INSERT OR UPDATE ON ap_installments
  FOR EACH ROW
  EXECUTE FUNCTION populate_normalized_fields();

-- Create function to prevent duplicates
CREATE OR REPLACE FUNCTION check_duplicate_installment()
RETURNS TRIGGER AS $$
DECLARE
  duplicate_count integer;
BEGIN
  -- Check if this combination already exists
  SELECT COUNT(*) INTO duplicate_count
  FROM ap_installments
  WHERE supplier_key = NEW.supplier_key
    AND invoice_number_norm = NEW.invoice_number_norm
    AND installment_norm = NEW.installment_norm
    AND id != NEW.id;
    
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Duplicate installment detected: Supplier=%, Invoice=%, Installment=%', 
      NEW.fornecedor, NEW.invoice_number_norm, NEW.installment_norm;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent duplicates
DROP TRIGGER IF EXISTS trigger_check_duplicate_installment ON ap_installments;
CREATE TRIGGER trigger_check_duplicate_installment
  BEFORE INSERT OR UPDATE ON ap_installments
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_installment();

-- Create unique index to enforce uniqueness at database level
DROP INDEX IF EXISTS idx_ap_installments_unique_combo;
CREATE UNIQUE INDEX idx_ap_installments_unique_combo 
ON ap_installments (supplier_key, invoice_number_norm, installment_norm);

-- Mark existing duplicates for review (add a flag to identify them)
ALTER TABLE ap_installments ADD COLUMN IF NOT EXISTS is_duplicate boolean DEFAULT false;

-- Mark duplicates (keep the first one, mark others as duplicates)
WITH ranked_duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY supplier_key, invoice_number_norm, installment_norm 
      ORDER BY created_at ASC
    ) as rn
  FROM ap_installments
  WHERE supplier_key IS NOT NULL 
    AND invoice_number_norm IS NOT NULL 
    AND installment_norm IS NOT NULL
)
UPDATE ap_installments 
SET is_duplicate = true
WHERE id IN (
  SELECT id FROM ranked_duplicates WHERE rn > 1
);