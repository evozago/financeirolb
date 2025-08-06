-- Corrigir extração do número da nota fiscal
-- Na chave de acesso da NFe: CCMMAANNNNNNNNNNCCCVVSSSSSNNNNNNNNN
-- O número da nota está nas posições 24-32 (9 dígitos)
UPDATE ap_installments 
SET numero_documento = CASE 
  WHEN descricao ~ 'NFe Nfe_[0-9]{44}_[0-9]+' THEN 
    -- Extrair 9 dígitos do número da NFe (posições 24-32 da chave de 44 dígitos)
    substring(
      regexp_replace(descricao, '.*Nfe_([0-9]{44})_.*', '\1'),
      24, 9
    )::bigint::text  -- Remove zeros à esquerda convertendo para bigint e depois text
  WHEN descricao ~ 'NFe [0-9]+' THEN 
    -- Manter extração original para outros formatos
    regexp_replace(descricao, '.*NFe ([0-9]+).*', '\1')
  ELSE numero_documento
END
WHERE descricao IS NOT NULL;