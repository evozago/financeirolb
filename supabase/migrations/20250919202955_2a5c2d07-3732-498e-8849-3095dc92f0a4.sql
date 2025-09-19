-- Corrigir as funções para unificar dados de fornecedores e entidades_corporativas
-- sem perder os dados existentes

-- 1. Função unificada para fornecedores (combinando fornecedores + entidades com papel fornecedor)
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
  -- Primeiro, dados de entidades_corporativas com papel fornecedor
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
  
  UNION ALL
  
  -- Depois, dados da tabela fornecedores (dados legados)
  SELECT 
    f.id,
    f.nome as nome_razao_social,
    f.nome_fantasia,
    f.cnpj_cpf as cpf_cnpj,
    f.email,
    f.telefone,
    f.tipo_pessoa,
    f.ativo,
    f.created_at,
    f.updated_at
  FROM fornecedores f
  WHERE f.ativo = true
    AND f.eh_fornecedor = true
    -- Evitar duplicatas: não incluir se já existe em entidades_corporativas
    AND NOT EXISTS (
      SELECT 1 FROM entidades_corporativas ec 
      WHERE UPPER(TRIM(ec.nome_razao_social)) = UPPER(TRIM(f.nome))
         OR (ec.cpf_cnpj IS NOT NULL AND f.cnpj_cpf IS NOT NULL 
             AND regexp_replace(ec.cpf_cnpj, '[^0-9]', '', 'g') = regexp_replace(f.cnpj_cpf, '[^0-9]', '', 'g'))
    )
    AND (p_search IS NULL OR 
         f.nome ILIKE '%' || p_search || '%' OR
         f.cnpj_cpf ILIKE '%' || p_search || '%' OR
         f.email ILIKE '%' || p_search || '%')
  
  ORDER BY nome_razao_social
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 2. Função unificada para pessoas (combinando entidades + fornecedores)
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
  -- Primeiro, dados de entidades_corporativas
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
  
  UNION ALL
  
  -- Depois, dados da tabela fornecedores (dados legados)
  SELECT 
    f.id,
    f.nome as nome_razao_social,
    f.nome_fantasia,
    f.cnpj_cpf as cpf_cnpj,
    f.email,
    f.telefone,
    f.tipo_pessoa,
    f.ativo,
    f.created_at,
    f.updated_at,
    ARRAY[
      CASE WHEN f.eh_funcionario THEN 'funcionario' END,
      CASE WHEN f.eh_vendedora THEN 'vendedora' END,
      CASE WHEN f.eh_fornecedor THEN 'fornecedor' END
    ]::text[] as papeis
  FROM fornecedores f
  WHERE f.ativo = true
    -- Evitar duplicatas
    AND NOT EXISTS (
      SELECT 1 FROM entidades_corporativas ec 
      WHERE UPPER(TRIM(ec.nome_razao_social)) = UPPER(TRIM(f.nome))
         OR (ec.cpf_cnpj IS NOT NULL AND f.cnpj_cpf IS NOT NULL 
             AND regexp_replace(ec.cpf_cnpj, '[^0-9]', '', 'g') = regexp_replace(f.cnpj_cpf, '[^0-9]', '', 'g'))
    )
    AND (p_search IS NULL OR 
         f.nome ILIKE '%' || p_search || '%' OR
         f.cnpj_cpf ILIKE '%' || p_search || '%' OR
         f.email ILIKE '%' || p_search || '%')
  
  ORDER BY nome_razao_social
  LIMIT p_limit OFFSET p_offset;
END;
$$;