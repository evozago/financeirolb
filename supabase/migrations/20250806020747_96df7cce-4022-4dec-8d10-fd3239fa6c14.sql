-- Extração correta do número da nota fiscal
-- Chave exemplo: 42250704900415000172550020003499961553988630
-- Posições:     12345678901234567890123456789012345678901234
-- Número NFe:   posições 26-34 = 003499961 = 349996 (sem zeros à esquerda)
UPDATE ap_installments 
SET numero_documento = CASE 
  WHEN descricao ~ 'NFe Nfe_[0-9]{44}_[0-9]+' THEN 
    -- Extrair 9 dígitos do número da NFe (posições 26-34 da chave de 44 dígitos)
    substring(
      regexp_replace(descricao, '.*Nfe_([0-9]{44})_.*', '\1'),
      26, 9
    )::bigint::text  -- Remove zeros à esquerda convertendo para bigint e depois text
  WHEN descricao ~ 'NFe [0-9]+' THEN 
    -- Manter extração original para outros formatos
    regexp_replace(descricao, '.*NFe ([0-9]+).*', '\1')
  ELSE numero_documento
END
WHERE descricao IS NOT NULL;