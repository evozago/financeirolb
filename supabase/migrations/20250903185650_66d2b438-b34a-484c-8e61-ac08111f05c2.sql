-- CORREÇÃO DOS WARNINGS DE SEGURANÇA DA MIGRAÇÃO

-- 1. Corrigir funções com search_path mutable
CREATE OR REPLACE FUNCTION public.migrate_fornecedores_to_pessoas() 
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fornecedor_record RECORD;
  pessoa_id UUID;
  migrated_count INTEGER := 0;
BEGIN
  FOR fornecedor_record IN 
    SELECT * FROM fornecedores 
    WHERE ativo = true 
    AND id NOT IN (
      SELECT DISTINCT (dados_fornecedor->>'fornecedor_id')::UUID 
      FROM pessoas 
      WHERE dados_fornecedor->>'fornecedor_id' IS NOT NULL
    )
  LOOP
    INSERT INTO pessoas (
      nome, email, telefone, endereco, tipo_pessoa, categorias, cnpj,
      dados_fornecedor, filial_id, ativo, created_at, updated_at
    ) VALUES (
      fornecedor_record.nome, fornecedor_record.email, fornecedor_record.telefone,
      fornecedor_record.endereco,
      CASE WHEN length(replace(fornecedor_record.cnpj_cpf, '.', '')) = 11 THEN 'pessoa_fisica'
           ELSE 'pessoa_juridica' END,
      '["fornecedor"]'::jsonb, fornecedor_record.cnpj_cpf,
      jsonb_build_object(
        'fornecedor_id', fornecedor_record.id,
        'categoria_id', fornecedor_record.categoria_id,
        'contato_representante', fornecedor_record.contato_representante,
        'telefone_representante', fornecedor_record.telefone_representante,
        'email_representante', fornecedor_record.email_representante,
        'representante_nome', fornecedor_record.representante_nome,
        'representante_telefone', fornecedor_record.representante_telefone,
        'representante_email', fornecedor_record.representante_email,
        'data_cadastro', fornecedor_record.data_cadastro
      ),
      fornecedor_record.filial_id, fornecedor_record.ativo,
      fornecedor_record.created_at, fornecedor_record.updated_at
    ) RETURNING id INTO pessoa_id;
    
    IF fornecedor_record.email IS NOT NULL THEN
      INSERT INTO contatos (pessoa_id, tipo_contato, valor, principal)
      VALUES (pessoa_id, 'email', fornecedor_record.email, true);
    END IF;
    
    IF fornecedor_record.telefone IS NOT NULL THEN
      INSERT INTO contatos (pessoa_id, tipo_contato, valor, principal)
      VALUES (pessoa_id, 'telefone', fornecedor_record.telefone, true);
    END IF;
    
    IF fornecedor_record.endereco IS NOT NULL THEN
      INSERT INTO enderecos (pessoa_id, tipo_endereco, logradouro)
      VALUES (pessoa_id, 'principal', fornecedor_record.endereco);
    END IF;
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RETURN migrated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.migrate_funcionarios_to_pessoas() 
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  funcionario_record RECORD;
  pessoa_id UUID;
  migrated_count INTEGER := 0;
BEGIN
  FOR funcionario_record IN 
    SELECT * FROM funcionarios 
    WHERE ativo = true 
    AND id NOT IN (
      SELECT DISTINCT (dados_funcionario->>'funcionario_id')::UUID 
      FROM pessoas 
      WHERE dados_funcionario->>'funcionario_id' IS NOT NULL
    )
  LOOP
    INSERT INTO pessoas (
      nome, email, telefone, endereco, tipo_pessoa, categorias, cpf,
      dados_funcionario, ativo, created_at, updated_at
    ) VALUES (
      funcionario_record.nome, funcionario_record.email, funcionario_record.telefone,
      funcionario_record.endereco, 'pessoa_fisica', '["funcionario"]'::jsonb,
      funcionario_record.cpf,
      jsonb_build_object(
        'funcionario_id', funcionario_record.id,
        'salario', funcionario_record.salario,
        'dias_uteis_mes', funcionario_record.dias_uteis_mes,
        'valor_transporte_dia', funcionario_record.valor_transporte_dia,
        'valor_transporte_total', funcionario_record.valor_transporte_total,
        'chave_pix', funcionario_record.chave_pix,
        'tipo_chave_pix', funcionario_record.tipo_chave_pix,
        'data_admissao', funcionario_record.data_admissao,
        'cargo', funcionario_record.cargo,
        'setor', funcionario_record.setor,
        'status_funcionario', funcionario_record.status_funcionario
      ),
      funcionario_record.ativo, funcionario_record.created_at, funcionario_record.updated_at
    ) RETURNING id INTO pessoa_id;
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RETURN migrated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ap_installments_relationships()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  UPDATE ap_installments 
  SET fornecedor_id = p.id
  FROM pessoas p
  WHERE p.categorias @> '["fornecedor"]'
    AND upper(trim(p.nome)) = upper(trim(ap_installments.fornecedor))
    AND ap_installments.fornecedor_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_pessoa_contacts() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.telefone IS DISTINCT FROM OLD.telefone THEN
    UPDATE contatos 
    SET valor = NEW.telefone, updated_at = now()
    WHERE pessoa_id = NEW.id 
      AND tipo_contato = 'telefone' 
      AND principal = true;
      
    IF NOT FOUND AND NEW.telefone IS NOT NULL THEN
      INSERT INTO contatos (pessoa_id, tipo_contato, valor, principal)
      VALUES (NEW.id, 'telefone', NEW.telefone, true);
    END IF;
  END IF;
  
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE contatos 
    SET valor = NEW.email, updated_at = now()
    WHERE pessoa_id = NEW.id 
      AND tipo_contato = 'email' 
      AND principal = true;
      
    IF NOT FOUND AND NEW.email IS NOT NULL THEN
      INSERT INTO contatos (pessoa_id, tipo_contato, valor, principal)
      VALUES (NEW.id, 'email', NEW.email, true);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;