-- Corrigir trigger para calcular valores apenas quando o valor_total_bruto for maior que 0
CREATE OR REPLACE FUNCTION public.calculate_order_values()
RETURNS TRIGGER AS $$
BEGIN
  -- Só calcular se houver valor total bruto válido
  IF NEW.valor_total_bruto IS NOT NULL AND NEW.valor_total_bruto > 0 THEN
    -- Calcular valor total líquido
    IF NEW.tipo_desconto = 'porcentagem' THEN
      NEW.valor_total_liquido = NEW.valor_total_bruto - (NEW.valor_total_bruto * (COALESCE(NEW.desconto_porcentagem, 0) / 100));
    ELSE
      NEW.valor_total_liquido = NEW.valor_total_bruto - COALESCE(NEW.desconto_valor, 0);
    END IF;
    
    -- Calcular valor médio por peça
    IF NEW.quantidade > 0 THEN
      NEW.valor_medio_peca = NEW.valor_total_liquido / NEW.quantidade;
      -- Calcular custo unitário baseado no valor total bruto
      NEW.custo_unitario = NEW.valor_total_bruto / NEW.quantidade;
    ELSE
      NEW.valor_medio_peca = 0;
      NEW.custo_unitario = 0;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';