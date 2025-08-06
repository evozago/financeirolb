-- Atualizar registros existentes para extrair o número da NFe da descrição
-- Exemplo: 'NFe Nfe_42250779525242000159550010008042391220417579_8573884776 - Parcela única'
-- Extrair '8042391' que está entre '00010' e os últimos 11 dígitos

UPDATE ap_installments 
SET numero_documento = CASE 
  WHEN descricao ~ 'NFe.*([0-9]{7,10})([0-9]{11})_[0-9]+' THEN
    substring(descricao from '([0-9]{7,10})([0-9]{11})_[0-9]+')
  WHEN descricao ~ 'NFe.*_([0-9]+)_' THEN
    substring(descricao from '_([0-9]+)_')
  ELSE 
    NULL
END
WHERE numero_documento IS NULL 
  AND descricao LIKE '%NFe%';