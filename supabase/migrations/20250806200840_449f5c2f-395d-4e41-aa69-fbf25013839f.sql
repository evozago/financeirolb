-- Remove constraint existente e recria com valores corretos
ALTER TABLE contas_bancarias DROP CONSTRAINT IF EXISTS contas_bancarias_tipo_conta_check;

-- Adiciona nova constraint com os valores do formulário
ALTER TABLE contas_bancarias ADD CONSTRAINT contas_bancarias_tipo_conta_check 
CHECK (tipo_conta IS NULL OR tipo_conta IN (
  'Conta Corrente',
  'Conta Poupança', 
  'Conta Investimento',
  'Conta Salário',
  'Cartão de Crédito',
  'Outro'
));