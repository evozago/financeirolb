-- Criar sistema completo de papéis para pessoas
-- Corrigir erro: "Could not find a relationship between 'pessoas' and 'papeis_pessoa'"

-- 1. Criar tabela de papéis se não existir
CREATE TABLE IF NOT EXISTS public.papeis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Criar tabela de relacionamento pessoas-papéis
CREATE TABLE IF NOT EXISTS public.papeis_pessoa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pessoa_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  papel_id UUID NOT NULL REFERENCES public.papeis(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pessoa_id, papel_id)
);

-- 3. Inserir papéis básicos se não existirem
INSERT INTO public.papeis (nome, descricao) VALUES 
  ('vendedora', 'Pessoa responsável por vendas')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.papeis (nome, descricao) VALUES 
  ('funcionario', 'Funcionário da empresa')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.papeis (nome, descricao) VALUES 
  ('fornecedor', 'Fornecedor de produtos/serviços')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.papeis (nome, descricao) VALUES 
  ('cliente', 'Cliente da empresa')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.papeis (nome, descricao) VALUES 
  ('caixa', 'Operador de caixa')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.papeis (nome, descricao) VALUES 
  ('estoquista', 'Responsável pelo estoque')
ON CONFLICT (nome) DO NOTHING;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_papeis_pessoa_pessoa_id ON public.papeis_pessoa(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_papeis_pessoa_papel_id ON public.papeis_pessoa(papel_id);
CREATE INDEX IF NOT EXISTS idx_papeis_pessoa_ativo ON public.papeis_pessoa(ativo);
CREATE INDEX IF NOT EXISTS idx_papeis_nome ON public.papeis(nome);

-- 5. Criar triggers para updated_at
CREATE TRIGGER trigger_papeis_updated_at 
  BEFORE UPDATE ON public.papeis 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_papeis_pessoa_updated_at 
  BEFORE UPDATE ON public.papeis_pessoa 
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Habilitar RLS
ALTER TABLE public.papeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papeis_pessoa ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS
CREATE POLICY "Authenticated users can manage papeis" 
  ON public.papeis FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage papeis_pessoa" 
  ON public.papeis_pessoa FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Migrar dados existentes de pessoas para o sistema de papéis
-- Adicionar papel "vendedora" para pessoas que têm eh_vendedora = true
INSERT INTO public.papeis_pessoa (pessoa_id, papel_id)
SELECT 
  p.id,
  (SELECT id FROM public.papeis WHERE nome = 'vendedora')
FROM public.pessoas p
WHERE p.eh_vendedora = true
  AND NOT EXISTS (
    SELECT 1 FROM public.papeis_pessoa pp 
    WHERE pp.pessoa_id = p.id 
      AND pp.papel_id = (SELECT id FROM public.papeis WHERE nome = 'vendedora')
  );

-- Adicionar papel "funcionario" para pessoas que têm eh_funcionario = true
INSERT INTO public.papeis_pessoa (pessoa_id, papel_id)
SELECT 
  p.id,
  (SELECT id FROM public.papeis WHERE nome = 'funcionario')
FROM public.pessoas p
WHERE p.eh_funcionario = true
  AND NOT EXISTS (
    SELECT 1 FROM public.papeis_pessoa pp 
    WHERE pp.pessoa_id = p.id 
      AND pp.papel_id = (SELECT id FROM public.papeis WHERE nome = 'funcionario')
  );

-- Adicionar papel "fornecedor" para pessoas que têm eh_fornecedor = true
INSERT INTO public.papeis_pessoa (pessoa_id, papel_id)
SELECT 
  p.id,
  (SELECT id FROM public.papeis WHERE nome = 'fornecedor')
FROM public.pessoas p
WHERE p.eh_fornecedor = true
  AND NOT EXISTS (
    SELECT 1 FROM public.papeis_pessoa pp 
    WHERE pp.pessoa_id = p.id 
      AND pp.papel_id = (SELECT id FROM public.papeis WHERE nome = 'fornecedor')
  );

-- 9. Criar função para buscar pessoas com papéis
CREATE OR REPLACE FUNCTION public.get_pessoas_with_papeis()
RETURNS TABLE(
  id UUID,
  nome TEXT,
  cpf TEXT,
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
    p.id,
    p.nome,
    p.cpf,
    p.email,
    p.telefone,
    p.tipo_pessoa,
    p.ativo,
    COALESCE(
      ARRAY_AGG(
        CASE WHEN pp.ativo = true THEN pap.nome END
        ORDER BY pap.nome
      ) FILTER (WHERE pap.nome IS NOT NULL),
      ARRAY[]::TEXT[]
    ) as papeis
  FROM public.pessoas p
  LEFT JOIN public.papeis_pessoa pp ON p.id = pp.pessoa_id AND pp.ativo = true
  LEFT JOIN public.papeis pap ON pp.papel_id = pap.id AND pap.ativo = true
  WHERE p.ativo = true
  GROUP BY p.id, p.nome, p.cpf, p.email, p.telefone, p.tipo_pessoa, p.ativo
  ORDER BY p.nome;
END;
$$;

-- 10. Criar função para adicionar papel a uma pessoa
CREATE OR REPLACE FUNCTION public.add_papel_to_pessoa(
  p_pessoa_id UUID,
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
  
  -- Inserir relacionamento se não existir
  INSERT INTO public.papeis_pessoa (pessoa_id, papel_id, ativo)
  VALUES (p_pessoa_id, v_papel_id, true)
  ON CONFLICT (pessoa_id, papel_id) 
  DO UPDATE SET ativo = true, updated_at = now();
  
  RETURN true;
END;
$$;

-- 11. Criar função para remover papel de uma pessoa
CREATE OR REPLACE FUNCTION public.remove_papel_from_pessoa(
  p_pessoa_id UUID,
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
  UPDATE public.papeis_pessoa 
  SET ativo = false, updated_at = now()
  WHERE pessoa_id = p_pessoa_id AND papel_id = v_papel_id;
  
  RETURN true;
END;
$$;
