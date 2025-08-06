-- Corrigir extração com padrão correto (tem espaço entre NFe e Nfe_)
UPDATE ap_installments 
SET numero_documento = CASE
  -- Padrão correto: "NFe Nfe_[chave]_"
  WHEN descricao LIKE '%NFe Nfe_%_%' THEN 
    SUBSTRING(
      SUBSTRING(descricao FROM 'NFe Nfe_([0-9]{44})_'), 
      26, 9
    )
  ELSE numero_documento
END
WHERE numero_documento IS NULL OR numero_documento = '-';

-- Verificar resultado
SELECT COUNT(*) as total_updated, 
       COUNT(CASE WHEN numero_documento IS NOT NULL AND numero_documento != '-' THEN 1 END) as with_numbers
FROM ap_installments;