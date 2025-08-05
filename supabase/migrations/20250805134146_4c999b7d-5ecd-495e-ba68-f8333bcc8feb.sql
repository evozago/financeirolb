-- Remover temporariamente a restrição de chave estrangeira para entidade_id
-- para permitir importações sem bloquear o sistema
ALTER TABLE ap_installments DROP CONSTRAINT IF EXISTS ap_installments_entidade_id_fkey;

-- Tornar entidade_id nullable temporariamente para casos onde não conseguimos criar a entidade
ALTER TABLE ap_installments ALTER COLUMN entidade_id DROP NOT NULL;