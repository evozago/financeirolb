-- Corrigir extração do número da nota fiscal
-- No formato: NFe Nfe_CCMMAANNNNNNNNNNCCCVVSSSSSNNNNNNNNN_XXXXXXXX
-- O número da nota está nas posições 26-34 da chave de acesso (9 dígitos)
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