-- Deduplicate fornecedores and enforce uniqueness on normalized document
BEGIN;

-- 1) Backfill normalized document
UPDATE public.fornecedores f
SET cpf_cnpj_normalizado = normalize_cpf_cnpj(
  COALESCE(NULLIF(TRIM(f.cpf), ''), NULLIF(TRIM(f.cnpj_cpf), ''))
)
WHERE (f.cpf_cnpj_normalizado IS NULL OR TRIM(f.cpf_cnpj_normalizado) = '');

-- 2) Remove duplicates keeping the oldest by created_at (then id)
WITH ranked AS (
  SELECT id,
         cpf_cnpj_normalizado,
         ROW_NUMBER() OVER (
           PARTITION BY cpf_cnpj_normalizado
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.fornecedores
  WHERE cpf_cnpj_normalizado IS NOT NULL AND TRIM(cpf_cnpj_normalizado) <> ''
)
DELETE FROM public.fornecedores f
USING ranked r
WHERE f.id = r.id
  AND r.rn > 1;

-- 3) Enforce uniqueness for future inserts (only when normalized doc is present)
CREATE UNIQUE INDEX IF NOT EXISTS ux_fornecedores_cpf_cnpj_norm_unique
ON public.fornecedores (cpf_cnpj_normalizado)
WHERE cpf_cnpj_normalizado IS NOT NULL AND TRIM(cpf_cnpj_normalizado) <> '';

COMMIT;