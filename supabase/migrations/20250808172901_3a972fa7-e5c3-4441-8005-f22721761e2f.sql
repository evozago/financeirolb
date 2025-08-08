-- Adicionar campos para controle de pagamento avançado
ALTER TABLE ap_installments 
ADD COLUMN IF NOT EXISTS valor_pago NUMERIC,
ADD COLUMN IF NOT EXISTS banco_pagador TEXT;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN ap_installments.valor_pago IS 'Valor efetivamente pago (pode ser diferente do valor original devido a descontos)';
COMMENT ON COLUMN ap_installments.banco_pagador IS 'Banco utilizado para efetuar o pagamento';