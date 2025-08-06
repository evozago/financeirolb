-- Extrair número da NFe do final da string após o último underscore
-- Padrão: NFe Nfe_33250716590234006450550040008324741789978842_8689200078 - Parcela X
-- O número da NFe é: 8689200078

UPDATE ap_installments 
SET numero_documento = 
  CASE 
    WHEN descricao ~ 'Nfe_.*_([0-9]+)' THEN
      substring(descricao from 'Nfe_.*_([0-9]+)')
    ELSE 
      NULL
  END
WHERE numero_documento IS NULL 
  AND descricao LIKE '%Nfe_%';