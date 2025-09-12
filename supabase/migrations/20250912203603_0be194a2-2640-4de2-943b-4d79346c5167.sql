-- Corrigir função de migração para usar valores corretos de tipo_pessoa
CREATE OR REPLACE FUNCTION migrate_fornecedores_to_entidades()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fornecedor_record RECORD;
  entidade_id UUID;
  papel_fornecedor_id UUID;
  migrated_count INTEGER := 0;
BEGIN
  -- Buscar ID do papel fornecedor
  SELECT id INTO papel_fornecedor_id FROM papeis WHERE nome = 'fornecedor';
  
  IF papel_fornecedor_id IS NULL THEN
    RAISE EXCEPTION 'Papel fornecedor não encontrado';
  END IF;
  
  -- Migrar cada fornecedor que ainda não foi migrado
  FOR fornecedor_record IN 
    SELECT f.* FROM fornecedores f
    WHERE f.ativo = true 
    AND NOT EXISTS (
      SELECT 1 FROM entidades_corporativas ec 
      WHERE UPPER(TRIM(ec.nome_razao_social)) = UPPER(TRIM(f.nome))
      AND COALESCE(ec.cpf_cnpj, '') = COALESCE(f.cnpj_cpf, '')
    )
  LOOP
    -- Inserir na tabela entidades_corporativas
    INSERT INTO entidades_corporativas (
      tipo_pessoa,
      nome_razao_social,
      nome_fantasia,
      cpf_cnpj,
      email,
      telefone,
      observacoes,
      ativo,
      created_at,
      updated_at
    ) VALUES (
      -- Corrigir valores: usar 'fisica' e 'juridica' ao invés de 'pessoa_fisica' e 'pessoa_juridica'
      CASE 
        WHEN LENGTH(REPLACE(REPLACE(REPLACE(COALESCE(fornecedor_record.cnpj_cpf, ''), '.', ''), '/', ''), '-', '')) = 11 
        THEN 'fisica'
        ELSE 'juridica' 
      END,
      fornecedor_record.nome,
      fornecedor_record.nome,
      fornecedor_record.cnpj_cpf,
      fornecedor_record.email,
      fornecedor_record.telefone,
      'Migrado automaticamente de fornecedores em ' || now(),
      fornecedor_record.ativo,
      COALESCE(fornecedor_record.created_at, now()),
      COALESCE(fornecedor_record.updated_at, now())
    ) RETURNING id INTO entidade_id;
    
    -- Associar papel de fornecedor
    INSERT INTO entidade_papeis (entidade_id, papel_id, data_inicio, ativo)
    VALUES (entidade_id, papel_fornecedor_id, CURRENT_DATE, true)
    ON CONFLICT DO NOTHING;
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RETURN migrated_count;
END;
$$;

-- Executar migração de fornecedores
SELECT migrate_fornecedores_to_entidades() as fornecedores_migrados;

-- Executar migração dos installments
SELECT migrate_ap_installments_to_corporative() as installments_migrados;