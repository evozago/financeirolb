-- Migração para corrigir políticas RLS da tabela papeis
-- Data: 2025-09-22
-- Objetivo: Permitir operações CRUD na tabela papeis

BEGIN;

-- 1. Verificar se RLS está habilitado na tabela papeis
DO $$
BEGIN
  -- Se RLS não estiver habilitado, habilitar
  IF NOT EXISTS (
    SELECT 1 FROM pg_class 
    WHERE relname = 'papeis' 
    AND relrowsecurity = true
  ) THEN
    ALTER TABLE public.papeis ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitado para tabela papeis';
  ELSE
    RAISE NOTICE 'RLS já estava habilitado para tabela papeis';
  END IF;
END $$;

-- 2. Remover políticas existentes se houver conflito
DROP POLICY IF EXISTS "Authenticated users can manage papeis" ON public.papeis;
DROP POLICY IF EXISTS "Allow all operations on papeis" ON public.papeis;
DROP POLICY IF EXISTS "papeis_policy" ON public.papeis;

-- 3. Criar política permissiva para usuários autenticados
CREATE POLICY "Allow all operations on papeis" 
ON public.papeis 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Criar política para usuários anônimos (caso necessário para testes)
CREATE POLICY "Allow read access to papeis for anon" 
ON public.papeis 
FOR SELECT 
TO anon 
USING (true);

-- 5. Verificar se a tabela tem dados básicos
INSERT INTO public.papeis (nome) VALUES
  ('cliente'),
  ('fornecedor'),
  ('funcionario'),
  ('vendedor'),
  ('administrador')
ON CONFLICT (nome) DO NOTHING;

-- 6. Adicionar colunas necessárias se não existirem
DO $$
BEGIN
  -- Adicionar coluna descrição se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'papeis' 
    AND column_name = 'descricao'
  ) THEN
    ALTER TABLE public.papeis ADD COLUMN descricao text;
    RAISE NOTICE 'Coluna descricao adicionada à tabela papeis';
  END IF;

  -- Adicionar coluna ativo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'papeis' 
    AND column_name = 'ativo'
  ) THEN
    ALTER TABLE public.papeis ADD COLUMN ativo boolean DEFAULT true;
    RAISE NOTICE 'Coluna ativo adicionada à tabela papeis';
  END IF;

  -- Adicionar colunas de timestamp se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'papeis' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.papeis ADD COLUMN created_at timestamptz DEFAULT now();
    RAISE NOTICE 'Coluna created_at adicionada à tabela papeis';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'papeis' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.papeis ADD COLUMN updated_at timestamptz DEFAULT now();
    RAISE NOTICE 'Coluna updated_at adicionada à tabela papeis';
  END IF;
END $$;

-- 7. Criar trigger para updated_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_papeis_updated_at'
  ) THEN
    CREATE TRIGGER trg_papeis_updated_at
      BEFORE UPDATE ON public.papeis
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    RAISE NOTICE 'Trigger updated_at criado para tabela papeis';
  END IF;
END $$;

-- 8. Atualizar descrições dos papéis existentes
UPDATE public.papeis SET 
  descricao = CASE 
    WHEN nome = 'cliente' THEN 'Cliente da empresa'
    WHEN nome = 'fornecedor' THEN 'Fornecedor de produtos ou serviços'
    WHEN nome = 'funcionario' THEN 'Funcionário da empresa'
    WHEN nome = 'vendedor' THEN 'Responsável por vendas'
    WHEN nome = 'administrador' THEN 'Administrador do sistema'
    ELSE descricao
  END,
  ativo = COALESCE(ativo, true),
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, now())
WHERE descricao IS NULL OR ativo IS NULL OR created_at IS NULL OR updated_at IS NULL;

COMMIT;

-- Verificar resultado
SELECT 'Migração concluída. Políticas RLS configuradas para tabela papeis.' as status;
