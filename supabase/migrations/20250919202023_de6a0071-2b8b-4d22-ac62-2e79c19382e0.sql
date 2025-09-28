-- 1. Atualizar políticas RLS para permitir DELETE definitivo para usuários autenticados

-- Fornecedores: permitir DELETE para usuários autenticados
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.fornecedores;
CREATE POLICY "Authenticated users can delete fornecedores" 
ON public.fornecedores 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Filiais: já permite DELETE para admins, vamos permitir para usuários autenticados  
DROP POLICY IF EXISTS "Only admins can delete filiais" ON public.filiais;
CREATE POLICY "Authenticated users can delete filiais" 
ON public.filiais 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- 2. Atualizar foreign key da tabela marcas para desvincular ao invés de impedir DELETE
-- Primeiro, remover a constraint existente se houver
ALTER TABLE public.marcas 
DROP CONSTRAINT IF EXISTS marcas_fornecedor_id_fkey;

-- Recriar com ON DELETE SET NULL para desvincular marcas quando fornecedor for excluído
ALTER TABLE public.marcas 
ADD CONSTRAINT marcas_fornecedor_id_fkey 
FOREIGN KEY (fornecedor_id) 
REFERENCES public.fornecedores(id) 
ON DELETE SET NULL;

-- 3. Criar função para buscar fornecedores unificados de entidades_corporativas
CREATE OR REPLACE FUNCTION public.search_entidades_fornecedores(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  nome_razao_social text,
  nome_fantasia text,
  cpf_cnpj text,
  email text,
  telefone text,
  tipo_pessoa text,
  ativo boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    ec.created_at,
    ec.updated_at
  FROM entidades_corporativas ec
  INNER JOIN entidade_papeis ep ON ec.id = ep.entidade_id
  INNER JOIN papeis p ON ep.papel_id = p.id
  WHERE p.nome = 'fornecedor' 
    AND ep.ativo = true
    AND ec.ativo = true
    AND (p_search IS NULL OR 
         ec.nome_razao_social ILIKE '%' || p_search || '%' OR
         ec.cpf_cnpj ILIKE '%' || p_search || '%' OR
         ec.email ILIKE '%' || p_search || '%')
  ORDER BY ec.nome_razao_social
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 4. Criar função para buscar pessoas unificadas de entidades_corporativas  
CREATE OR REPLACE FUNCTION public.search_entidades_pessoas(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  nome_razao_social text,
  nome_fantasia text,
  cpf_cnpj text,
  email text,
  telefone text,
  tipo_pessoa text,
  ativo boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  papeis text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    ec.created_at,
    ec.updated_at,
    ARRAY_AGG(p.nome) as papeis
  FROM entidades_corporativas ec
  LEFT JOIN entidade_papeis ep ON ec.id = ep.entidade_id AND ep.ativo = true
  LEFT JOIN papeis p ON ep.papel_id = p.id
  WHERE ec.ativo = true
    AND (p_search IS NULL OR 
         ec.nome_razao_social ILIKE '%' || p_search || '%' OR
         ec.cpf_cnpj ILIKE '%' || p_search || '%' OR
         ec.email ILIKE '%' || p_search || '%')
  GROUP BY ec.id, ec.nome_razao_social, ec.nome_fantasia, ec.cpf_cnpj, 
           ec.email, ec.telefone, ec.tipo_pessoa, ec.ativo, 
           ec.created_at, ec.updated_at
  ORDER BY ec.nome_razao_social
  LIMIT p_limit OFFSET p_offset;
END;
$$;