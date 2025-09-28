-- Adicionar campo recorrente_livre na tabela recurring_bills
ALTER TABLE recurring_bills ADD COLUMN IF NOT EXISTS recorrente_livre BOOLEAN DEFAULT false;

-- Comentar sobre o campo para documentação
COMMENT ON COLUMN recurring_bills.recorrente_livre IS 'Permite que a conta recorrente seja lançada múltiplas vezes no mesmo mês';