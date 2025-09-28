-- Expansão do sistema de papéis/categorias para entidades
-- Adicionando campos para descrição e hierarquia nos papéis

-- Adicionar campos na tabela papéis se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'papeis' AND column_name = 'descricao') THEN
    ALTER TABLE public.papeis ADD COLUMN descricao text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'papeis' AND column_name = 'papel_pai_id') THEN
    ALTER TABLE public.papeis ADD COLUMN papel_pai_id uuid REFERENCES public.papeis(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'papeis' AND column_name = 'ativo') THEN
    ALTER TABLE public.papeis ADD COLUMN ativo boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'papeis' AND column_name = 'created_at') THEN
    ALTER TABLE public.papeis ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'papeis' AND column_name = 'updated_at') THEN
    ALTER TABLE public.papeis ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Criar trigger para updated_at se não existir
DROP TRIGGER IF EXISTS update_papeis_updated_at ON public.papeis;
CREATE TRIGGER update_papeis_updated_at
  BEFORE UPDATE ON public.papeis
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Atualizar papéis existentes com descrições
UPDATE public.papeis SET 
  descricao = CASE 
    WHEN nome = 'Cliente' THEN 'Pessoa ou empresa que adquire produtos/serviços'
    WHEN nome = 'Fornecedor' THEN 'Pessoa ou empresa que fornece produtos/serviços'
    WHEN nome = 'Funcionario' THEN 'Pessoa contratada pela empresa'
    WHEN nome = 'Vendedor' THEN 'Responsável por vendas e atendimento ao cliente'
    WHEN nome = 'Representante' THEN 'Representante comercial ou de vendas'
    ELSE descricao
  END,
  ativo = true,
  updated_at = now()
WHERE descricao IS NULL;

-- Inserir novos papéis específicos solicitados
INSERT INTO public.papeis (nome, descricao, ativo) VALUES
('Fornecedor de Produtos Para Revenda', 'Fornecedor especializado em produtos destinados à revenda', true),
('Fornecedor de Material para Consumo Interno', 'Fornecedor de materiais para uso interno da empresa', true),
('Estoquista', 'Funcionário responsável pelo controle de estoque', true),
('Caixa', 'Funcionário responsável pelo atendimento no caixa', true),
('Vendedora', 'Funcionária responsável por vendas diretas', true)
ON CONFLICT (nome) DO UPDATE SET 
  descricao = EXCLUDED.descricao,
  updated_at = now();

-- Estabelecer hierarquia: cargos específicos como filhos de Funcionario
DO $$
DECLARE
  funcionario_id uuid;
BEGIN
  -- Buscar ID do papel Funcionario
  SELECT id INTO funcionario_id FROM public.papeis WHERE nome = 'Funcionario';
  
  -- Atualizar papéis filhos para ter Funcionario como pai
  UPDATE public.papeis 
  SET papel_pai_id = funcionario_id, updated_at = now()
  WHERE nome IN ('Estoquista', 'Caixa', 'Vendedora', 'Vendedor');
END $$;

-- Criar função para buscar papéis hierárquicos
CREATE OR REPLACE FUNCTION public.get_papeis_hierarquicos()
RETURNS TABLE(
  id uuid,
  nome text,
  descricao text,
  papel_pai_id uuid,
  papel_pai_nome text,
  nivel integer,
  ativo boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE hierarquia_papeis AS (
    -- Papéis raiz (sem pai)
    SELECT 
      p.id,
      p.nome,
      p.descricao,
      p.papel_pai_id,
      NULL::text as papel_pai_nome,
      0 as nivel,
      p.ativo
    FROM papeis p 
    WHERE p.papel_pai_id IS NULL AND p.ativo = true
    
    UNION ALL
    
    -- Papéis filhos
    SELECT 
      p.id,
      p.nome,
      p.descricao,
      p.papel_pai_id,
      hp.nome as papel_pai_nome,
      hp.nivel + 1 as nivel,
      p.ativo
    FROM papeis p
    INNER JOIN hierarquia_papeis hp ON p.papel_pai_id = hp.id
    WHERE p.ativo = true
  )
  SELECT * FROM hierarquia_papeis
  ORDER BY nivel, nome;
END;
$$;

-- Criar políticas RLS para papéis
ALTER TABLE public.papeis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view papeis" ON public.papeis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage papeis" ON public.papeis
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());