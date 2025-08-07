-- Atualizar tabela pedidos_produtos para adicionar novos campos
ALTER TABLE pedidos_produtos 
ADD COLUMN numero_pedido text,
ADD COLUMN desconto_valor numeric DEFAULT 0,
ADD COLUMN desconto_porcentagem numeric DEFAULT 0,
ADD COLUMN tipo_desconto text DEFAULT 'valor', -- 'valor' ou 'porcentagem'
ADD COLUMN quantidade_referencias integer DEFAULT 0,
ADD COLUMN valor_total_bruto numeric DEFAULT 0,
ADD COLUMN valor_total_liquido numeric DEFAULT 0,
ADD COLUMN valor_medio_peca numeric DEFAULT 0,
ADD COLUMN representante_nome text,
ADD COLUMN representante_telefone text,
ADD COLUMN representante_email text;

-- Atualizar tabela fornecedores para adicionar dados do representante
ALTER TABLE fornecedores 
ADD COLUMN representante_nome text,
ADD COLUMN representante_telefone text,
ADD COLUMN representante_email text;

-- Função para calcular valor médio por peça
CREATE OR REPLACE FUNCTION calculate_valor_medio_peca()
RETURNS trigger AS $$
BEGIN
  -- Calcular valor total bruto
  NEW.valor_total_bruto = NEW.quantidade * NEW.custo_unitario;
  
  -- Calcular desconto em valor
  IF NEW.tipo_desconto = 'porcentagem' THEN
    NEW.desconto_valor = NEW.valor_total_bruto * (NEW.desconto_porcentagem / 100);
  END IF;
  
  -- Calcular valor total líquido
  NEW.valor_total_liquido = NEW.valor_total_bruto - COALESCE(NEW.desconto_valor, 0);
  
  -- Calcular valor médio por peça (líquido / quantidade total)
  IF NEW.quantidade > 0 THEN
    NEW.valor_medio_peca = NEW.valor_total_liquido / NEW.quantidade;
  ELSE
    NEW.valor_medio_peca = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular valores automaticamente
CREATE TRIGGER trigger_calculate_valor_medio_peca
  BEFORE INSERT OR UPDATE ON pedidos_produtos
  FOR EACH ROW
  EXECUTE FUNCTION calculate_valor_medio_peca();

-- Comentários nas colunas para documentação
COMMENT ON COLUMN pedidos_produtos.numero_pedido IS 'Número do pedido (renomeado de referencia)';
COMMENT ON COLUMN pedidos_produtos.desconto_valor IS 'Valor do desconto em reais';
COMMENT ON COLUMN pedidos_produtos.desconto_porcentagem IS 'Percentual de desconto aplicado';
COMMENT ON COLUMN pedidos_produtos.tipo_desconto IS 'Tipo do desconto: valor ou porcentagem';
COMMENT ON COLUMN pedidos_produtos.quantidade_referencias IS 'Quantidade de referências (diferente da quantidade de produtos)';
COMMENT ON COLUMN pedidos_produtos.valor_total_bruto IS 'Valor total antes do desconto';
COMMENT ON COLUMN pedidos_produtos.valor_total_liquido IS 'Valor total após desconto';
COMMENT ON COLUMN pedidos_produtos.valor_medio_peca IS 'Valor médio por peça (líquido / quantidade)';
COMMENT ON COLUMN pedidos_produtos.representante_nome IS 'Nome do representante da marca';
COMMENT ON COLUMN pedidos_produtos.representante_telefone IS 'Telefone do representante';
COMMENT ON COLUMN pedidos_produtos.representante_email IS 'Email do representante';
COMMENT ON COLUMN fornecedores.representante_nome IS 'Nome do representante do fornecedor';
COMMENT ON COLUMN fornecedores.representante_telefone IS 'Telefone do representante';
COMMENT ON COLUMN fornecedores.representante_email IS 'Email do representante';