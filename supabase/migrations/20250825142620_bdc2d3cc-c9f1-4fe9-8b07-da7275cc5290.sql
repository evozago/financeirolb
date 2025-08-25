-- Add missing foreign key constraints for recurring_bills table

-- Add foreign key constraint to fornecedores table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'recurring_bills_supplier_id_fkey'
  ) THEN
    ALTER TABLE public.recurring_bills 
    ADD CONSTRAINT recurring_bills_supplier_id_fkey 
    FOREIGN KEY (supplier_id) REFERENCES public.fornecedores(id);
  END IF;
END $$;

-- Add foreign key constraint to categorias_produtos table  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'recurring_bills_category_id_fkey'
  ) THEN
    ALTER TABLE public.recurring_bills 
    ADD CONSTRAINT recurring_bills_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES public.categorias_produtos(id);
  END IF;
END $$;