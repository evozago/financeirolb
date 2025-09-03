-- Criar função para verificar duplicatas
CREATE OR REPLACE FUNCTION public.check_pessoa_duplicates()
RETURNS TABLE(nome text, quantidade bigint, ids text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.nome,
    COUNT(*) as quantidade,
    string_agg(p.id::text, ', ') as ids
  FROM pessoas p
  WHERE p.ativo = true
  GROUP BY p.nome 
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
$$;