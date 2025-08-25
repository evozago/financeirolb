-- Create recurring bills tables with proper structure

-- 1) Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2) Create recurring_bills table
CREATE TABLE IF NOT EXISTS public.recurring_bills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  supplier_id uuid,
  category_id uuid,
  closing_day integer CHECK (closing_day BETWEEN 1 AND 31),
  due_day integer NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  expected_amount numeric NOT NULL DEFAULT 0,
  open_ended boolean NOT NULL DEFAULT true,
  end_date date,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Create recurring_bill_occurrences table
CREATE TABLE IF NOT EXISTS public.recurring_bill_occurrences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurring_bill_id uuid NOT NULL REFERENCES recurring_bills(id) ON DELETE CASCADE,
  year_month date NOT NULL,
  closing_date date,
  due_date date NOT NULL,
  expected_amount numeric NOT NULL DEFAULT 0,
  is_closed_for_month boolean NOT NULL DEFAULT false,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Enable RLS
ALTER TABLE public.recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_bill_occurrences ENABLE ROW LEVEL SECURITY;

-- 5) Create RLS policies
CREATE POLICY "Authenticated users can view recurring_bills" 
ON public.recurring_bills FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert recurring_bills" 
ON public.recurring_bills FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update recurring_bills" 
ON public.recurring_bills FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete recurring_bills" 
ON public.recurring_bills FOR DELETE 
USING (true);

CREATE POLICY "Authenticated users can view recurring_bill_occurrences" 
ON public.recurring_bill_occurrences FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert recurring_bill_occurrences" 
ON public.recurring_bill_occurrences FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update recurring_bill_occurrences" 
ON public.recurring_bill_occurrences FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete recurring_bill_occurrences" 
ON public.recurring_bill_occurrences FOR DELETE 
USING (true);

-- 6) Create indexes
CREATE INDEX IF NOT EXISTS idx_recurring_bills_supplier ON public.recurring_bills(supplier_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_category ON public.recurring_bills(category_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bill_occurrences_bill ON public.recurring_bill_occurrences(recurring_bill_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bill_occurrences_dates ON public.recurring_bill_occurrences(closing_date, due_date);
CREATE INDEX IF NOT EXISTS idx_recurring_bill_occurrences_year_month ON public.recurring_bill_occurrences(year_month);

-- 7) Add unique constraint
ALTER TABLE public.recurring_bill_occurrences
ADD CONSTRAINT IF NOT EXISTS uq_rbo_bill_month UNIQUE (recurring_bill_id, year_month);

-- 8) Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_recurring_bills_updated_at
BEFORE UPDATE ON public.recurring_bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_bill_occurrences_updated_at
BEFORE UPDATE ON public.recurring_bill_occurrences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();