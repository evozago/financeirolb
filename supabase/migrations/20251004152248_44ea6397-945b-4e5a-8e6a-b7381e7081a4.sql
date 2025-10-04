-- Adicionar suporte a subcategorias em categorias_produtos
-- Compatibilidade total: categorias existentes permanecem como categorias principais (categoria_pai_id = NULL)

-- 1. Adicionar coluna de referência para categoria pai (auto-referência)
ALTER TABLE public.categorias_produtos 
ADD COLUMN categoria_pai_id UUID REFERENCES public.categorias_produtos(id) ON DELETE SET NULL;

-- 2. Adicionar coluna de nível hierárquico (facilita queries e validações)
ALTER TABLE public.categorias_produtos 
ADD COLUMN nivel INTEGER DEFAULT 0 NOT NULL;

-- 3. Criar índice para performance em queries hierárquicas
CREATE INDEX idx_categorias_pai ON public.categorias_produtos(categoria_pai_id);

-- 4. Comentários nas colunas para documentação
COMMENT ON COLUMN public.categorias_produtos.categoria_pai_id IS 'ID da categoria pai. NULL indica categoria principal (nível 0)';
COMMENT ON COLUMN public.categorias_produtos.nivel IS 'Nível hierárquico: 0=principal, 1=subcategoria, 2=sub-subcategoria';

-- 5. View para visualização hierárquica com caminho completo
CREATE OR REPLACE VIEW public.vw_categorias_hierarquicas AS
WITH RECURSIVE hierarquia AS (
  -- Categorias raiz (sem pai)
  SELECT 
    id,
    nome,
    categoria_pai_id,
    ativo,
    created_at,
    updated_at,
    nome as caminho_completo,
    0 as nivel,
    ARRAY[id] as caminho_ids,
    ARRAY[nome] as caminho_nomes
  FROM public.categorias_produtos
  WHERE categoria_pai_id IS NULL AND ativo = true
  
  UNION ALL
  
  -- Subcategorias (recursivo)
  SELECT 
    c.id,
    c.nome,
    c.categoria_pai_id,
    c.ativo,
    c.created_at,
    c.updated_at,
    h.caminho_completo || ' > ' || c.nome as caminho_completo,
    h.nivel + 1 as nivel,
    h.caminho_ids || c.id as caminho_ids,
    h.caminho_nomes || c.nome as caminho_nomes
  FROM public.categorias_produtos c
  INNER JOIN hierarquia h ON c.categoria_pai_id = h.id
  WHERE c.ativo = true
)
SELECT * FROM hierarquia
ORDER BY caminho_completo;

-- 6. Função para obter caminho completo de uma categoria
CREATE OR REPLACE FUNCTION public.get_categoria_path(p_categoria_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_path TEXT;
BEGIN
  SELECT caminho_completo INTO v_path
  FROM public.vw_categorias_hierarquicas
  WHERE id = p_categoria_id;
  
  RETURN COALESCE(v_path, 'Categoria não encontrada');
END;
$$;

-- 7. Função para validar se criar relacionamento geraria ciclo
CREATE OR REPLACE FUNCTION public.validate_categoria_hierarquia()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_nivel INTEGER := 0;
  v_current_id UUID := NEW.categoria_pai_id;
  v_max_depth INTEGER := 3; -- Máximo 3 níveis de profundidade
BEGIN
  -- Se não tem pai, é categoria principal (nível 0)
  IF NEW.categoria_pai_id IS NULL THEN
    NEW.nivel := 0;
    RETURN NEW;
  END IF;
  
  -- Verificar se a categoria está tentando ser pai de si mesma
  IF NEW.categoria_pai_id = NEW.id THEN
    RAISE EXCEPTION 'Uma categoria não pode ser pai de si mesma';
  END IF;
  
  -- Calcular nível e verificar ciclos
  WHILE v_current_id IS NOT NULL AND v_nivel < v_max_depth + 1 LOOP
    v_nivel := v_nivel + 1;
    
    -- Se encontrou a própria categoria no caminho, há um ciclo
    IF v_current_id = NEW.id THEN
      RAISE EXCEPTION 'Relacionamento circular detectado: uma categoria não pode ser ancestral de si mesma';
    END IF;
    
    -- Subir na hierarquia
    SELECT categoria_pai_id INTO v_current_id
    FROM public.categorias_produtos
    WHERE id = v_current_id;
  END LOOP;
  
  -- Verificar profundidade máxima
  IF v_nivel > v_max_depth THEN
    RAISE EXCEPTION 'Profundidade máxima de % níveis excedida', v_max_depth;
  END IF;
  
  -- Atualizar o nível
  NEW.nivel := v_nivel;
  
  RETURN NEW;
END;
$$;

-- 8. Trigger para validar hierarquia antes de insert/update
DROP TRIGGER IF EXISTS trg_validate_categoria_hierarquia ON public.categorias_produtos;
CREATE TRIGGER trg_validate_categoria_hierarquia
  BEFORE INSERT OR UPDATE OF categoria_pai_id
  ON public.categorias_produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_categoria_hierarquia();

-- 9. Comentário na view
COMMENT ON VIEW public.vw_categorias_hierarquicas IS 'View hierárquica de categorias com caminho completo e níveis calculados recursivamente';

-- 10. Grant permissions
GRANT SELECT ON public.vw_categorias_hierarquicas TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_categoria_path(UUID) TO authenticated;