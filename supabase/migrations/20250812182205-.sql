-- Soft delete support for ap_installments
-- Add deleted_at column and index
ALTER TABLE public.ap_installments
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ap_installments_deleted_at
ON public.ap_installments (deleted_at);
