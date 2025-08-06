-- Fix security issues by setting search_path for functions
-- This addresses the Function Search Path Mutable warnings

-- Update normalize_supplier_name function
CREATE OR REPLACE FUNCTION normalize_supplier_name(supplier_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN upper(trim(regexp_replace(supplier_name, '\s+', ' ', 'g')));
END;
$$;

-- Update extract_invoice_number function  
CREATE OR REPLACE FUNCTION extract_invoice_number(description text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Extract NFe number from description like "NFe Nfe_35250860618056000136550010000000411555737506_8769107769"
  RETURN regexp_replace(description, '^NFe\s+Nfe_([0-9]+).*', '\1', 'g');
END;
$$;

-- Update normalize_installment_info function
CREATE OR REPLACE FUNCTION normalize_installment_info(numero_parcela integer, total_parcelas integer, valor numeric)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN numero_parcela::text || '/' || total_parcelas::text || '_' || valor::text;
END;
$$;

-- Update populate_normalized_fields function
CREATE OR REPLACE FUNCTION populate_normalized_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.supplier_key = normalize_supplier_name(NEW.fornecedor);
  NEW.invoice_number_norm = extract_invoice_number(NEW.descricao);
  NEW.installment_norm = normalize_installment_info(NEW.numero_parcela, NEW.total_parcelas, NEW.valor);
  RETURN NEW;
END;
$$;

-- Update check_duplicate_installment function
CREATE OR REPLACE FUNCTION check_duplicate_installment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;