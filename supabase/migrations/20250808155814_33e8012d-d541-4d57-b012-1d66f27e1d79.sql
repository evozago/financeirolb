-- Criar trigger para calcular valores automaticamente na tabela pedidos_produtos
CREATE OR REPLACE FUNCTION public.calculate_order_values()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular valor total líquido
  IF NEW.tipo_desconto = 'porcentagem' THEN
    NEW.valor_total_liquido = NEW.valor_total_bruto - (NEW.valor_total_bruto * (COALESCE(NEW.desconto_porcentagem, 0) / 100));
  ELSE
    NEW.valor_total_liquido = NEW.valor_total_bruto - COALESCE(NEW.desconto_valor, 0);
  END IF;
  
  -- Calcular valor médio por peça
  IF NEW.quantidade > 0 THEN
    NEW.valor_medio_peca = NEW.valor_total_liquido / NEW.quantidade;
  ELSE
    NEW.valor_medio_peca = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar a função antes de inserir ou atualizar
CREATE TRIGGER trigger_calculate_order_values
  BEFORE INSERT OR UPDATE ON public.pedidos_produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_order_values();