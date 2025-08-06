-- Extrair número da NFe com o formato correto encontrado
UPDATE ap_installments 
SET numero_documento = CASE
  -- Extrair da descrição quando tem formato NFe_[chave]_
  WHEN descricao LIKE '%NFe_%_%' THEN 
    SUBSTRING(
      SUBSTRING(descricao FROM 'NFe_([0-9]{44})_'), 
      26, 9
    )
  -- Para outros casos que não conseguimos extrair
  ELSE numero_documento
END
WHERE numero_documento = '-' 
   OR numero_documento IS NULL;