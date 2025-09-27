-- Adicionar coluna updated_at na tabela entidade_papeis e corrigir funções
-- Data: 2025-09-27

-- 1. Adicionar coluna updated_at na tabela entidade_papeis se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entidade_papeis' AND column_name = 'updated_at') THEN
        ALTER TABLE entidade_papeis ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        
        -- Atualizar registros existentes
        UPDATE entidade_papeis SET updated_at = created_at WHERE updated_at IS NULL;
        
        -- Tornar a coluna NOT NULL
        ALTER TABLE entidade_papeis ALTER COLUMN updated_at SET NOT NULL;
    END IF;
END $$;

-- 2. Adicionar coluna updated_at na tabela papeis_pessoa se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'papeis_pessoa' AND column_name = 'updated_at') THEN
        ALTER TABLE papeis_pessoa ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        
        -- Atualizar registros existentes
        UPDATE papeis_pessoa SET updated_at = created_at WHERE updated_at IS NULL;
        
        -- Tornar a coluna NOT NULL
        ALTER TABLE papeis_pessoa ALTER COLUMN updated_at SET NOT NULL;
    END IF;
END $$;

-- 3. Remover triggers existentes que podem estar causando conflito
DROP TRIGGER IF EXISTS trg_sync_papeis_to_entidade ON papeis_pessoa;
DROP FUNCTION IF EXISTS sync_papeis_trigger() CASCADE;
DROP FUNCTION IF EXISTS sync_papeis_pessoa_to_entidade(UUID) CASCADE;

-- 4. Recriar função de sincronização corrigida
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

-- 5. Recriar função de trigger corrigida
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

-- 6. Recriar trigger na tabela papeis_pessoa
CREATE TRIGGER trg_sync_papeis_to_entidade
  AFTER INSERT OR UPDATE OR DELETE ON papeis_pessoa
  FOR EACH ROW
  EXECUTE FUNCTION sync_papeis_trigger();

-- 7. Criar trigger para atualizar updated_at automaticamente na tabela entidade_papeis
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_entidade_papeis_updated_at ON entidade_papeis;
CREATE TRIGGER update_entidade_papeis_updated_at
    BEFORE UPDATE ON entidade_papeis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Criar trigger para atualizar updated_at automaticamente na tabela papeis_pessoa
DROP TRIGGER IF EXISTS update_papeis_pessoa_updated_at ON papeis_pessoa;
CREATE TRIGGER update_papeis_pessoa_updated_at
    BEFORE UPDATE ON papeis_pessoa
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Comentários
COMMENT ON FUNCTION sync_papeis_pessoa_to_entidade(UUID) IS 'Sincroniza papéis de papeis_pessoa para entidade_papeis (versão corrigida)';
COMMENT ON FUNCTION sync_papeis_trigger() IS 'Trigger para sincronização automática de papéis (versão corrigida)';
COMMENT ON FUNCTION update_updated_at_column() IS 'Atualiza automaticamente a coluna updated_at';

-- 10. Executar sincronização inicial para pessoas existentes
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
