-- Corrigir registros com numero_documento NULL ou vazio
-- Extrair número da NFe da chave de acesso nas observações ou usar fallback

UPDATE ap_installments 
SET numero_documento = CASE 
  -- Se tem chave de acesso nas observações, extrair o número dela (posições 26-34)
  WHEN observacoes LIKE '%Chave de Acesso: %' THEN 
    SUBSTRING(
      SUBSTRING(observacoes FROM 'Chave de Acesso: ([0-9]{44})'), 
      26, 9
    )
  -- Se tem chave na descrição (formato antigo), extrair dela
  WHEN descricao LIKE '%Chave: %' THEN
    SUBSTRING(
      SUBSTRING(descricao FROM 'Chave: ([0-9]{44})'), 
      26, 9
    )
  -- Fallback: usar parte final da chave se encontrada
  WHEN observacoes ~ '[0-9]{44}' THEN
    SUBSTRING(
      SUBSTRING(observacoes FROM '([0-9]{44})'), 
      26, 9
    )
  -- Último fallback: usar hífen
  ELSE '-'
END
WHERE numero_documento IS NULL 
   OR numero_documento = '';

-- Verificar quantos registros foram atualizados
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN numero_documento IS NOT NULL AND numero_documento != '-' THEN 1 END) as with_nfe_number,
  COUNT(CASE WHEN numero_documento = '-' THEN 1 END) as with_fallback
FROM ap_installments;