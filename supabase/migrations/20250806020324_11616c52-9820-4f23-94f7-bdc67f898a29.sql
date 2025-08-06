-- Atualizar campo numero_documento extraindo da descrição
UPDATE ap_installments 
SET numero_documento = CASE 
  WHEN descricao ~ 'NFe Nfe_[0-9]+_[0-9]+' THEN 
    -- Extrair número entre underscores (formato: Nfe_NUMERO_OUTRONUMERO)
    regexp_replace(
      regexp_replace(descricao, '.*Nfe_([0-9]+)_([0-9]+).*', '\2'),
      '^0+', ''
    )
  WHEN descricao ~ 'NFe [0-9]+' THEN 
    -- Extrair número após "NFe " (formato: NFe NUMERO)
    regexp_replace(descricao, '.*NFe ([0-9]+).*', '\1')
  ELSE numero_documento
END
WHERE descricao IS NOT NULL 
  AND (numero_documento IS NULL OR numero_documento = '');