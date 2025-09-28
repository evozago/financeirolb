-- Função para limpar todos os mapeamentos de papéis existentes
CREATE OR REPLACE FUNCTION public.clear_all_papel_mappings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  entidade_papeis_count INTEGER := 0;
  pessoa_papeis_count INTEGER := 0;
  papeis_pessoa_count INTEGER := 0;
  result jsonb;
BEGIN
  -- Contar registros antes da limpeza
  SELECT COUNT(*) INTO entidade_papeis_count FROM entidade_papeis WHERE ativo = true;
  SELECT COUNT(*) INTO pessoa_papeis_count FROM pessoa_papeis WHERE ativo = true;
  SELECT COUNT(*) INTO papeis_pessoa_count FROM papeis_pessoa WHERE ativo = true;
  
  -- Desativar todos os relacionamentos ao invés de deletar
  UPDATE entidade_papeis SET ativo = false, updated_at = NOW();
  UPDATE pessoa_papeis SET ativo = false, updated_at = NOW() WHERE ativo = true;
  UPDATE papeis_pessoa SET ativo = false, updated_at = NOW() WHERE ativo = true;
  
  -- Construir resultado
  result := jsonb_build_object(
    'success', true,
    'message', 'Todos os mapeamentos de papéis foram zerados com sucesso',
    'cleared_counts', jsonb_build_object(
      'entidade_papeis', entidade_papeis_count,
      'pessoa_papeis', pessoa_papeis_count,
      'papeis_pessoa', papeis_pessoa_count,
      'total', entidade_papeis_count + pessoa_papeis_count + papeis_pessoa_count
    ),
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$;