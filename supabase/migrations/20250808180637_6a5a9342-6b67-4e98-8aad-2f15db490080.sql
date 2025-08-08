-- Add payment-related fields to ap_installments
ALTER TABLE public.ap_installments
ADD COLUMN IF NOT EXISTS valor_pago numeric(14,2);

ALTER TABLE public.ap_installments
ADD COLUMN IF NOT EXISTS banco_pagador text;