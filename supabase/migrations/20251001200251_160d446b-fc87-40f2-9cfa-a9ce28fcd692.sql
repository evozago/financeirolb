-- Migração para mesclar papéis duplicados (com tratamento de conflitos)
-- Consolida papéis com nomes similares mantendo o mais descritivo

DO $$
DECLARE
  v_cliente_id uuid;
  v_cliente_dup_id uuid;
  v_fornecedor_id uuid;
  v_fornecedor_dup_id uuid;
  v_funcionario_id uuid;
  v_funcionario_dup_id uuid;
  v_aux_vendas_id uuid;
  v_aux_vendas_dup_id uuid;
  v_vendedor_id uuid;
  v_vendedora_id uuid;
  v_forn_consumo_id uuid;
  v_forn_consumo_dup_id uuid;
  v_forn_revenda_id uuid;
  v_forn_revenda_dup_id uuid;
BEGIN
  -- 1. Cliente / cliente
  SELECT id INTO v_cliente_id FROM papeis WHERE nome = 'Cliente' AND ativo = true LIMIT 1;
  SELECT id INTO v_cliente_dup_id FROM papeis WHERE lower(nome) = 'cliente' AND id != v_cliente_id LIMIT 1;
  
  IF v_cliente_id IS NOT NULL AND v_cliente_dup_id IS NOT NULL THEN
    -- Remover registros duplicados que causariam conflito
    DELETE FROM entidade_papeis 
    WHERE papel_id = v_cliente_dup_id 
      AND entidade_id IN (
        SELECT entidade_id FROM entidade_papeis WHERE papel_id = v_cliente_id
      );
    
    -- Atualizar os restantes
    UPDATE entidade_papeis SET papel_id = v_cliente_id WHERE papel_id = v_cliente_dup_id;
    UPDATE papeis SET ativo = false WHERE id = v_cliente_dup_id;
  END IF;

  -- 2. Fornecedor / fornecedor
  SELECT id INTO v_fornecedor_id FROM papeis WHERE nome = 'Fornecedor' AND ativo = true LIMIT 1;
  SELECT id INTO v_fornecedor_dup_id FROM papeis WHERE lower(nome) = 'fornecedor' AND id != v_fornecedor_id LIMIT 1;
  
  IF v_fornecedor_id IS NOT NULL AND v_fornecedor_dup_id IS NOT NULL THEN
    DELETE FROM entidade_papeis 
    WHERE papel_id = v_fornecedor_dup_id 
      AND entidade_id IN (SELECT entidade_id FROM entidade_papeis WHERE papel_id = v_fornecedor_id);
    
    UPDATE entidade_papeis SET papel_id = v_fornecedor_id WHERE papel_id = v_fornecedor_dup_id;
    UPDATE papeis SET ativo = false WHERE id = v_fornecedor_dup_id;
  END IF;

  -- 3. Funcionario / funcionario
  SELECT id INTO v_funcionario_id FROM papeis WHERE nome = 'Funcionario' AND ativo = true LIMIT 1;
  SELECT id INTO v_funcionario_dup_id FROM papeis WHERE lower(nome) = 'funcionario' AND id != v_funcionario_id LIMIT 1;
  
  IF v_funcionario_id IS NOT NULL AND v_funcionario_dup_id IS NOT NULL THEN
    DELETE FROM entidade_papeis 
    WHERE papel_id = v_funcionario_dup_id 
      AND entidade_id IN (SELECT entidade_id FROM entidade_papeis WHERE papel_id = v_funcionario_id);
    
    UPDATE entidade_papeis SET papel_id = v_funcionario_id WHERE papel_id = v_funcionario_dup_id;
    UPDATE papeis SET ativo = false WHERE id = v_funcionario_dup_id;
  END IF;

  -- 4. Auxiliar de Vendas / auxiliar_vendas
  SELECT id INTO v_aux_vendas_id FROM papeis WHERE nome = 'Auxiliar de Vendas' AND ativo = true LIMIT 1;
  SELECT id INTO v_aux_vendas_dup_id FROM papeis WHERE nome = 'auxiliar_vendas' LIMIT 1;
  
  IF v_aux_vendas_id IS NOT NULL AND v_aux_vendas_dup_id IS NOT NULL THEN
    DELETE FROM entidade_papeis 
    WHERE papel_id = v_aux_vendas_dup_id 
      AND entidade_id IN (SELECT entidade_id FROM entidade_papeis WHERE papel_id = v_aux_vendas_id);
    
    UPDATE entidade_papeis SET papel_id = v_aux_vendas_id WHERE papel_id = v_aux_vendas_dup_id;
    UPDATE papeis SET ativo = false WHERE id = v_aux_vendas_dup_id;
  END IF;

  -- 5. vendedor / vendedora -> manter 'vendedor' como padrão
  SELECT id INTO v_vendedor_id FROM papeis WHERE nome = 'vendedor' AND ativo = true LIMIT 1;
  SELECT id INTO v_vendedora_id FROM papeis WHERE nome = 'vendedora' LIMIT 1;
  
  IF v_vendedor_id IS NOT NULL AND v_vendedora_id IS NOT NULL THEN
    DELETE FROM entidade_papeis 
    WHERE papel_id = v_vendedora_id 
      AND entidade_id IN (SELECT entidade_id FROM entidade_papeis WHERE papel_id = v_vendedor_id);
    
    UPDATE entidade_papeis SET papel_id = v_vendedor_id WHERE papel_id = v_vendedora_id;
    UPDATE papeis SET ativo = false WHERE id = v_vendedora_id;
  END IF;

  -- 6. Fornecedor de Material para Consumo Interno / fornecedor_consumo_interno
  SELECT id INTO v_forn_consumo_id FROM papeis 
  WHERE nome = 'Fornecedor de Material para Consumo Interno' AND ativo = true LIMIT 1;
  SELECT id INTO v_forn_consumo_dup_id FROM papeis WHERE nome = 'fornecedor_consumo_interno' LIMIT 1;
  
  IF v_forn_consumo_id IS NOT NULL AND v_forn_consumo_dup_id IS NOT NULL THEN
    DELETE FROM entidade_papeis 
    WHERE papel_id = v_forn_consumo_dup_id 
      AND entidade_id IN (SELECT entidade_id FROM entidade_papeis WHERE papel_id = v_forn_consumo_id);
    
    UPDATE entidade_papeis SET papel_id = v_forn_consumo_id WHERE papel_id = v_forn_consumo_dup_id;
    UPDATE papeis SET ativo = false WHERE id = v_forn_consumo_dup_id;
  END IF;

  -- 7. Fornecedor de Produtos Para Revenda / fornecedor_revenda
  SELECT id INTO v_forn_revenda_id FROM papeis 
  WHERE nome = 'Fornecedor de Produtos Para Revenda' AND ativo = true LIMIT 1;
  SELECT id INTO v_forn_revenda_dup_id FROM papeis WHERE nome = 'fornecedor_revenda' LIMIT 1;
  
  IF v_forn_revenda_id IS NOT NULL AND v_forn_revenda_dup_id IS NOT NULL THEN
    DELETE FROM entidade_papeis 
    WHERE papel_id = v_forn_revenda_dup_id 
      AND entidade_id IN (SELECT entidade_id FROM entidade_papeis WHERE papel_id = v_forn_revenda_id);
    
    UPDATE entidade_papeis SET papel_id = v_forn_revenda_id WHERE papel_id = v_forn_revenda_dup_id;
    UPDATE papeis SET ativo = false WHERE id = v_forn_revenda_dup_id;
  END IF;

  -- 8. Remover duplicatas restantes em entidade_papeis (caso existam)
  DELETE FROM entidade_papeis a
  USING entidade_papeis b
  WHERE a.id > b.id 
    AND a.entidade_id = b.entidade_id 
    AND a.papel_id = b.papel_id;

  -- 9. Desativar outros papéis snake_case duplicados
  UPDATE papeis SET ativo = false 
  WHERE nome IN (
    'auxiliar_administrativo', 'auxiliar_estoque', 
    'auxiliar_vendas', 'cliente', 'fornecedor', 
    'funcionario', 'vendedora', 'fornecedor_consumo_interno', 
    'fornecedor_revenda'
  ) AND ativo = true;

END $$;