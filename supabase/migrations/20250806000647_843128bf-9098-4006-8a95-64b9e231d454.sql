-- Extrair manualmente os números conhecidos baseados nos padrões identificados
-- Exemplo: NFe Nfe_42250779525242000159550010008042391220417579_8573884776
-- O número da NFe seria: 8042391

UPDATE ap_installments 
SET numero_documento = CASE 
  WHEN descricao LIKE '%8042391%' THEN '8042391'
  WHEN descricao LIKE '%8054661%' THEN '8054661'  
  WHEN descricao LIKE '%8107041%' THEN '8107041'
  WHEN descricao ~ 'NFe.*0010([0-9]{7})' THEN
    substring(descricao from '0010([0-9]{7})')
  ELSE 
    NULL
END
WHERE numero_documento IS NULL 
  AND descricao LIKE '%NFe%';