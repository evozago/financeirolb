-- Atualizar todos os registros com numero_documento vazio
-- Extrair número do padrão: Nfe_32250710912561000382550010001144631364067171_8593705438
-- O número da NFe está após o último underscore: 8593705438

UPDATE ap_installments 
SET numero_documento = 
  CASE 
    WHEN descricao ~ 'Nfe_.*_([0-9]+)' THEN
      (regexp_match(descricao, 'Nfe_.*_([0-9]+)'))[1]
    ELSE 
      numero_documento
  END
WHERE numero_documento IS NULL 
  AND descricao LIKE '%Nfe_%';