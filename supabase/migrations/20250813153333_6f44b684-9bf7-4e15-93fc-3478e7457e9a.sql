-- Criar função para atualizar saldo bancário quando pagamento é confirmado
CREATE OR REPLACE FUNCTION public.update_bank_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verifica se é um pagamento sendo confirmado (status mudou para 'pago' e tem conta bancária)
  IF NEW.status = 'pago' AND NEW.conta_bancaria_id IS NOT NULL AND 
     (OLD.status != 'pago' OR OLD.status IS NULL OR OLD.conta_bancaria_id IS NULL) THEN
    
    -- Diminui o saldo da conta bancária
    UPDATE contas_bancarias 
    SET saldo_atual = saldo_atual - NEW.valor,
        updated_at = NOW()
    WHERE id = NEW.conta_bancaria_id;
    
  -- Verifica se um pagamento está sendo estornado (status mudou de 'pago' para outro)
  ELSIF OLD.status = 'pago' AND NEW.status != 'pago' AND OLD.conta_bancaria_id IS NOT NULL THEN
    
    -- Aumenta o saldo da conta bancária (estorna)
    UPDATE contas_bancarias 
    SET saldo_atual = saldo_atual + OLD.valor,
        updated_at = NOW()
    WHERE id = OLD.conta_bancaria_id;
    
  -- Verifica se a conta bancária mudou para um pagamento existente
  ELSIF NEW.status = 'pago' AND OLD.status = 'pago' AND 
        NEW.conta_bancaria_id != OLD.conta_bancaria_id THEN
    
    -- Estorna da conta anterior
    IF OLD.conta_bancaria_id IS NOT NULL THEN
      UPDATE contas_bancarias 
      SET saldo_atual = saldo_atual + OLD.valor,
          updated_at = NOW()
      WHERE id = OLD.conta_bancaria_id;
    END IF;
    
    -- Debita na nova conta
    IF NEW.conta_bancaria_id IS NOT NULL THEN
      UPDATE contas_bancarias 
      SET saldo_atual = saldo_atual - NEW.valor,
          updated_at = NOW()
      WHERE id = NEW.conta_bancaria_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para atualizar saldo bancário
DROP TRIGGER IF EXISTS trigger_update_bank_balance ON ap_installments;
CREATE TRIGGER trigger_update_bank_balance
  AFTER UPDATE ON ap_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_balance();