-- Corrigir problemas de violação de chave única na tabela entidade_papeis
-- e unificar o sistema de papéis

-- 1. Primeiro, verificar se existe a tabela entidade_papeis e sua estrutura
DO $$
BEGIN
  -- Se a tabela entidade_papeis não existir, criar com estrutura correta
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entidade_papeis') THEN
    CREATE TABLE public.entidade_papeis (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      entidade_id UUID NOT NULL,
      papel_id UUID NOT NULL,
      ativo BOOLEAN NOT NULL DEFAULT true,
      data_inicio TIMESTAMP WITH TIME ZONE DEFAULT now(),
      data_fim TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- 2. Remover constraint de chave única duplicada se existir
DO $$
BEGIN
  -- Verificar se existe constraint UNIQUE duplicada e remover
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'entidade_papeis' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name != 'entidade_papeis_pkey'
  ) THEN
    -- Remover todas as constraints UNIQUE exceto a primary key
    PERFORM pg_catalog.pg_constraint.conname 
    FROM pg_catalog.pg_constraint 
    JOIN pg_catalog.pg_class ON pg_constraint.conrelid = pg_class.oid
    WHERE pg_class.relname = 'entidade_papeis' 
    AND pg_constraint.contype = 'u'
    AND pg_constraint.conname != 'entidade_papeis_pkey';
    
    -- Executar DROP para cada constraint encontrada
    FOR constraint_rec IN 
      SELECT conname 
      FROM pg_catalog.pg_constraint 
      JOIN pg_catalog.pg_class ON pg_constraint.conrelid = pg_class.oid
      WHERE pg_class.relname = 'entidade_papeis' 
      AND pg_constraint.contype = 'u'
      AND pg_constraint.conname != 'entidade_papeis_pkey'
    LOOP
      EXECUTE 'ALTER TABLE public.entidade_papeis DROP CONSTRAINT IF EXISTS ' || constraint_rec.conname;
    END LOOP;
  END IF;
END $$;

-- 3. Adicionar foreign keys se não existirem
DO $$
BEGIN
  -- Foreign key para entidades_corporativas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'entidade_papeis' 
    AND constraint_name = 'entidade_papeis_entidade_id_fkey'
  ) THEN
    -- Verificar se a tabela entidades_corporativas existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'entidades_corporativas') THEN
      ALTER TABLE public.entidade_papeis 
      ADD CONSTRAINT entidade_papeis_entidade_id_fkey 
      FOREIGN KEY (entidade_id) REFERENCES public.entidades_corporativas(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- Foreign key para papeis
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'entidade_papeis' 
    AND constraint_name = 'entidade_papeis_papel_id_fkey'
  ) THEN
    -- Verificar se a tabela papeis existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'papeis') THEN
      ALTER TABLE public.entidade_papeis 
      ADD CONSTRAINT entidade_papeis_papel_id_fkey 
      FOREIGN KEY (papel_id) REFERENCES public.papeis(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 4. Remover registros duplicados mantendo apenas o mais recente
DELETE FROM public.entidade_papeis 
WHERE id NOT IN (
  SELECT DISTINCT ON (entidade_id, papel_id) id
  FROM public.entidade_papeis 
  ORDER BY entidade_id, papel_id, created_at DESC
);

-- 5. Criar índice único composto para evitar duplicatas futuras
CREATE UNIQUE INDEX IF NOT EXISTS idx_entidade_papeis_unique_active 
ON public.entidade_papeis (entidade_id, papel_id) 
WHERE ativo = true;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_entidade_papeis_entidade_id 
ON public.entidade_papeis (entidade_id);

CREATE INDEX IF NOT EXISTS idx_entidade_papeis_papel_id 
ON public.entidade_papeis (papel_id);

CREATE INDEX IF NOT EXISTS idx_entidade_papeis_ativo 
ON public.entidade_papeis (ativo);

-- 7. Criar trigger para updated_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_entidade_papeis_updated_at'
  ) THEN
    CREATE TRIGGER trigger_entidade_papeis_updated_at 
    BEFORE UPDATE ON public.entidade_papeis 
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 8. Habilitar RLS se não estiver habilitado
ALTER TABLE public.entidade_papeis ENABLE ROW LEVEL SECURITY;

-- 9. Criar política RLS se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'entidade_papeis' 
    AND policyname = 'Authenticated users can manage entidade_papeis'
  ) THEN
    CREATE POLICY "Authenticated users can manage entidade_papeis" 
    ON public.entidade_papeis FOR ALL TO authenticated 
    USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 10. Função para adicionar papel a entidade com tratamento de conflitos
CREATE OR REPLACE FUNCTION public.add_papel_to_entidade(
  p_entidade_id UUID,
  p_papel_nome TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_papel_id UUID;
  v_existing_id UUID;
BEGIN
  -- Buscar ID do papel
  SELECT id INTO v_papel_id 
  FROM public.papeis 
  WHERE nome = p_papel_nome AND ativo = true;
  
  IF v_papel_id IS NULL THEN
    RAISE EXCEPTION 'Papel % não encontrado', p_papel_nome;
  END IF;
  
  -- Verificar se já existe um relacionamento ativo
  SELECT id INTO v_existing_id
  FROM public.entidade_papeis 
  WHERE entidade_id = p_entidade_id 
    AND papel_id = v_papel_id 
    AND ativo = true;
  
  IF v_existing_id IS NOT NULL THEN
    -- Já existe e está ativo, apenas atualizar timestamp
    UPDATE public.entidade_papeis 
    SET updated_at = now()
    WHERE id = v_existing_id;
    RETURN true;
  END IF;
  
  -- Verificar se existe um relacionamento inativo
  SELECT id INTO v_existing_id
  FROM public.entidade_papeis 
  WHERE entidade_id = p_entidade_id 
    AND papel_id = v_papel_id 
    AND ativo = false;
  
  IF v_existing_id IS NOT NULL THEN
    -- Reativar relacionamento existente
    UPDATE public.entidade_papeis 
    SET ativo = true, updated_at = now(), data_fim = NULL
    WHERE id = v_existing_id;
    RETURN true;
  END IF;
  
  -- Inserir novo relacionamento
  INSERT INTO public.entidade_papeis (entidade_id, papel_id, ativo)
  VALUES (p_entidade_id, v_papel_id, true);
  
  RETURN true;
EXCEPTION
  WHEN unique_violation THEN
    -- Em caso de violação de chave única, tentar reativar
    UPDATE public.entidade_papeis 
    SET ativo = true, updated_at = now(), data_fim = NULL
    WHERE entidade_id = p_entidade_id 
      AND papel_id = v_papel_id;
    RETURN true;
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 11. Função para remover papel de entidade
CREATE OR REPLACE FUNCTION public.remove_papel_from_entidade(
  p_entidade_id UUID,
  p_papel_nome TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_papel_id UUID;
BEGIN
  -- Buscar ID do papel
  SELECT id INTO v_papel_id 
  FROM public.papeis 
  WHERE nome = p_papel_nome AND ativo = true;
  
  IF v_papel_id IS NULL THEN
    RAISE EXCEPTION 'Papel % não encontrado', p_papel_nome;
  END IF;
  
  -- Desativar relacionamento
  UPDATE public.entidade_papeis 
  SET ativo = false, updated_at = now(), data_fim = now()
  WHERE entidade_id = p_entidade_id 
    AND papel_id = v_papel_id 
    AND ativo = true;
  
  RETURN true;
END;
$$;

-- 12. Função para buscar entidades com seus papéis
CREATE OR REPLACE FUNCTION public.get_entidades_with_papeis()
RETURNS TABLE(
  id UUID,
  nome_razao_social TEXT,
  nome_fantasia TEXT,
  cpf_cnpj TEXT,
  email TEXT,
  telefone TEXT,
  tipo_pessoa TEXT,
  ativo BOOLEAN,
  papeis TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id,
    ec.nome_razao_social,
    ec.nome_fantasia,
    ec.cpf_cnpj,
    ec.email,
    ec.telefone,
    ec.tipo_pessoa,
    ec.ativo,
    COALESCE(
      ARRAY_AGG(
        CASE WHEN ep.ativo = true THEN p.nome END
        ORDER BY p.nome
      ) FILTER (WHERE p.nome IS NOT NULL),
      ARRAY[]::TEXT[]
    ) as papeis
  FROM public.entidades_corporativas ec
  LEFT JOIN public.entidade_papeis ep ON ec.id = ep.entidade_id AND ep.ativo = true
  LEFT JOIN public.papeis p ON ep.papel_id = p.id AND p.ativo = true
  WHERE ec.ativo = true
  GROUP BY ec.id, ec.nome_razao_social, ec.nome_fantasia, ec.cpf_cnpj, 
           ec.email, ec.telefone, ec.tipo_pessoa, ec.ativo
  ORDER BY ec.nome_razao_social;
END;
$$;
