-- Atualizar registros existentes com uma estratégia mais específica
-- Padrão: NFe Nfe_42250779525242000159550010008042391220417579_8573884776
-- Extrair os 7-9 dígitos que vêm após '00010' mas antes dos últimos 11 dígitos

UPDATE ap_installments 
SET numero_documento = CASE 
  WHEN descricao ~ 'NFe.*0001([0-9]{7,9})[0-9]{11}_' THEN
    substring(descricao from '0001([0-9]{7,9})[0-9]{11}_')
  WHEN descricao ~ 'NFe.*([0-9]{6,9})_[0-9]+' THEN
    substring(descricao from '([0-9]{6,9})_[0-9]+')
  ELSE 
    NULL
END
WHERE numero_documento IS NULL 
  AND descricao LIKE '%NFe%';