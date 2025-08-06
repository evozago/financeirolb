-- Primeiro atualiza os dados existentes para os valores corretos
UPDATE contas_bancarias SET tipo_conta = 'Conta Corrente' WHERE tipo_conta = 'corrente';

-- Remove constraint existente 
ALTER TABLE contas_bancarias DROP CONSTRAINT IF EXISTS contas_bancarias_tipo_conta_check;

-- Adiciona nova constraint com valores corretos
ALTER TABLE contas_bancarias ADD CONSTRAINT contas_bancarias_tipo_conta_check 
CHECK (tipo_conta IS NULL OR tipo_conta IN (
  'Conta Corrente',
  'Conta Poupança', 
  'Conta Investimento',
  'Conta Salário',
  'Cartão de Crédito',
  'Outro'
));