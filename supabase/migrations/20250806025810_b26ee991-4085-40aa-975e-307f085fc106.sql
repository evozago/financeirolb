-- Extrair número da NFe da chave que está na própria descrição
-- A chave está no formato: NFe_42250779525242000159550010008129541991380556_8729847940

UPDATE ap_installments 
SET numero_documento = CASE
  -- Extrair da descrição quando tem formato NFe_[chave]_
  WHEN descricao ~ 'NFe_[0-9]{44}_' THEN 
    SUBSTRING(
      SUBSTRING(descricao FROM 'NFe_([0-9]{44})_'), 
      26, 9
    )
  -- Manter o hífen para casos sem padrão reconhecível
  ELSE '-'
END
WHERE numero_documento = '-' OR numero_documento IS NULL;