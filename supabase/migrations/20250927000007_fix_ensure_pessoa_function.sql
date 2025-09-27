-- Correção da função ensure_pessoa_in_entidades_corporativas
-- Data: 2025-09-27
-- Objetivo: Evitar erro de constraint única ao sincronizar papéis

-- 1. Recriar a função ensure_pessoa_in_entidades_corporativas corrigida
CREATE OR REPLACE FUNCTION public.ensure_pessoa_in_entidades_corporativas(p_pessoa_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pessoa_record RECORD;
  entidade_id UUID;
BEGIN
  -- Buscar dados da pessoa
  SELECT * INTO pessoa_record FROM pessoas WHERE id = p_pessoa_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pessoa não encontrada: %', p_pessoa_id;
  END IF;

  -- Verificar se já existe em entidades_corporativas
  SELECT id INTO entidade_id FROM entidades_corporativas WHERE id = p_pessoa_id;
  
  IF FOUND THEN
    -- Se já existe, apenas atualizar os dados básicos
    UPDATE entidades_corporativas 
    SET 
      tipo_pessoa = pessoa_record.tipo_pessoa,
      nome_razao_social = pessoa_record.nome,
      nome_fantasia = pessoa_record.nome_fantasia,
      cpf_cnpj = COALESCE(pessoa_record.cpf, pessoa_record.cnpj),
      cpf_cnpj_normalizado = regexp_replace(COALESCE(pessoa_record.cpf, pessoa_record.cnpj, ''), '[^0-9]', '', 'g'),
      email = pessoa_record.email,
      email_normalizado = CASE WHEN pessoa_record.email IS NOT NULL THEN lower(pessoa_record.email) END,
      telefone = pessoa_record.telefone,
      ativo = pessoa_record.ativo,
      updated_at = now()
    WHERE id = p_pessoa_id;
    
    RETURN p_pessoa_id;
  END IF;

  -- Criar entrada em entidades_corporativas
  INSERT INTO entidades_corporativas (
    id,
    tipo_pessoa,
    nome_razao_social,
    nome_fantasia,
    cpf_cnpj,
    cpf_cnpj_normalizado,
    email,
    email_normalizado,
    telefone,
    ativo,
    created_at,
    updated_at
  ) VALUES (
    pessoa_record.id,
    pessoa_record.tipo_pessoa,
    pessoa_record.nome,
    pessoa_record.nome_fantasia,
    COALESCE(pessoa_record.cpf, pessoa_record.cnpj),
    regexp_replace(COALESCE(pessoa_record.cpf, pessoa_record.cnpj, ''), '[^0-9]', '', 'g'),
    pessoa_record.email,
    CASE WHEN pessoa_record.email IS NOT NULL THEN lower(pessoa_record.email) END,
    pessoa_record.telefone,
    pessoa_record.ativo,
    pessoa_record.created_at,
    pessoa_record.updated_at
  ) RETURNING id INTO entidade_id;

  RETURN entidade_id;
END;
$$;

-- 2. Criar função separada para sincronizar papéis (chamada apenas quando necessário)
CREATE OR REPLACE FUNCTION public.sync_papeis_pessoa_to_entidade(p_pessoa_id UUID)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  synced_count integer := 0;
BEGIN
  -- Garantir que a pessoa existe em entidades_corporativas
  PERFORM ensure_pessoa_in_entidades_corporativas(p_pessoa_id);

  -- Primeiro, desativar todos os papéis existentes em entidade_papeis
  UPDATE entidade_papeis 
  SET ativo = false, updated_at = now()
  WHERE entidade_id = p_pessoa_id;

  -- Depois, sincronizar papéis ativos de papeis_pessoa para entidade_papeis
  INSERT INTO entidade_papeis (entidade_id, papel_id, data_inicio, ativo, created_at, updated_at)
  SELECT 
    p_pessoa_id,
    pp.papel_id,
    CURRENT_DATE,
    pp.ativo,
    pp.created_at,
    now()
  FROM papeis_pessoa pp
  WHERE pp.pessoa_id = p_pessoa_id
  AND pp.ativo = true
  ON CONFLICT (entidade_id, papel_id) DO UPDATE SET
    ativo = EXCLUDED.ativo,
    updated_at = now(),
    data_inicio = CASE 
      WHEN NOT entidade_papeis.ativo THEN EXCLUDED.data_inicio 
      ELSE entidade_papeis.data_inicio 
    END;

  GET DIAGNOSTICS synced_count = ROW_COUNT;
  
  RETURN synced_count;
END;
$$;

-- 3. Criar trigger para sincronização automática de papéis
CREATE OR REPLACE FUNCTION sync_papeis_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Sincronizar papéis quando houver mudanças em papeis_pessoa
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM sync_papeis_pessoa_to_entidade(NEW.pessoa_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM sync_papeis_pessoa_to_entidade(OLD.pessoa_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- 4. Criar trigger na tabela papeis_pessoa
DROP TRIGGER IF EXISTS trg_sync_papeis_to_entidade ON papeis_pessoa;
CREATE TRIGGER trg_sync_papeis_to_entidade
  AFTER INSERT OR UPDATE OR DELETE ON papeis_pessoa
  FOR EACH ROW
  EXECUTE FUNCTION sync_papeis_trigger();

-- 5. Comentários
COMMENT ON FUNCTION ensure_pessoa_in_entidades_corporativas(UUID) IS 'Garante que uma pessoa existe em entidades_corporativas (sem sincronizar papéis)';
COMMENT ON FUNCTION sync_papeis_pessoa_to_entidade(UUID) IS 'Sincroniza papéis de papeis_pessoa para entidade_papeis';
COMMENT ON FUNCTION sync_papeis_trigger() IS 'Trigger para sincronização automática de papéis';

-- 6. Executar sincronização inicial para pessoas existentes
DO $$
DECLARE
  pessoa_record RECORD;
  total_synced integer := 0;
BEGIN
  FOR pessoa_record IN 
    SELECT DISTINCT pessoa_id 
    FROM papeis_pessoa 
    WHERE ativo = true
  LOOP
    total_synced := total_synced + sync_papeis_pessoa_to_entidade(pessoa_record.pessoa_id);
  END LOOP;
  
  RAISE NOTICE 'Sincronização inicial concluída: % papéis sincronizados', total_synced;
END $$;
