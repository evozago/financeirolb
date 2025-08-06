-- Remove a constraint que está causando problema
ALTER TABLE contas_bancarias DROP CONSTRAINT IF EXISTS contas_bancarias_tipo_conta_check;