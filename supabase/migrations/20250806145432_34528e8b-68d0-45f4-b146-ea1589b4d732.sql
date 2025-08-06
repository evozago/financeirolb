-- Step 1: Migrate existing data - try to link ap_installments with nfe_data
-- First, try to match by access key extracted from description
WITH access_keys AS (
  SELECT 
    id,
    CASE
      WHEN descricao LIKE '%NFe Nfe_%_%' THEN 
        SUBSTRING(descricao FROM 'NFe Nfe_([0-9]{44})_')
      WHEN descricao LIKE '%[0-9]{44}%' THEN
        SUBSTRING(descricao FROM '([0-9]{44})')
      ELSE NULL
    END as chave_acesso_extraida
  FROM ap_installments
  WHERE numero_nfe IS NULL
),
matched_nfe AS (
  SELECT 
    ak.id as ap_id,
    nfe.id as nfe_id,
    nfe.numero_nfe
  FROM access_keys ak
  JOIN nfe_data nfe ON nfe.chave_acesso = ak.chave_acesso_extraida
  WHERE ak.chave_acesso_extraida IS NOT NULL
)
UPDATE ap_installments 
SET numero_nfe = matched_nfe.nfe_id
FROM matched_nfe
WHERE ap_installments.id = matched_nfe.ap_id;