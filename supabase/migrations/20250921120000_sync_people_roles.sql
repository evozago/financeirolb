-- Sincronizar entidades e papéis com a tabela pessoas
-- Garante que operações existentes continuem funcionando com a nova estrutura de papéis de pessoas

-- 1. Função auxiliar para atualizar os flags e categorias em pessoas com base nos papéis ativos
CREATE OR REPLACE FUNCTION public.refresh_pessoa_role_state(p_pessoa_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  role_names text[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT lower(p.nome) ORDER BY lower(p.nome))
  INTO role_names
  FROM public.papeis_pessoa pp
  JOIN public.papeis p ON p.id = pp.papel_id
  WHERE pp.pessoa_id = p_pessoa_id
    AND pp.ativo = true
    AND p.ativo = true;

  UPDATE public.pessoas
  SET
    categorias = CASE
      WHEN role_names IS NULL OR array_length(role_names, 1) IS NULL THEN '[]'::jsonb
      ELSE to_jsonb(role_names)
    END,
    eh_vendedora = COALESCE(role_names && ARRAY['vendedora', 'vendedor'], false),
    eh_funcionario = COALESCE(role_names && ARRAY['funcionario'], false),
    eh_fornecedor = COALESCE(role_names && ARRAY['fornecedor'], false),
    updated_at = now()
  WHERE id = p_pessoa_id;
END;
$$;

-- 2. Função para sincronizar entidades corporativas (pessoas físicas) com a tabela pessoas
CREATE OR REPLACE FUNCTION public.sync_entidades_corporativas_to_pessoas()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  norm_doc text;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM public.pessoas WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.tipo_pessoa = 'pessoa_fisica' THEN
    norm_doc := nullif(regexp_replace(coalesce(NEW.cpf_cnpj, ''), '[^0-9]', '', 'g'), '');

    INSERT INTO public.pessoas (id, nome, cpf, email, telefone, tipo_pessoa, ativo)
    VALUES (NEW.id, NEW.nome_razao_social, norm_doc, NEW.email, NEW.telefone, 'pessoa_fisica', NEW.ativo)
    ON CONFLICT (id) DO UPDATE SET
      nome = EXCLUDED.nome,
      cpf = EXCLUDED.cpf,
      email = EXCLUDED.email,
      telefone = EXCLUDED.telefone,
      tipo_pessoa = EXCLUDED.tipo_pessoa,
      ativo = EXCLUDED.ativo,
      updated_at = now();
  ELSE
    DELETE FROM public.pessoas WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_entidades_to_pessoas ON public.entidades_corporativas;
CREATE TRIGGER trg_sync_entidades_to_pessoas
  AFTER INSERT OR UPDATE OR DELETE ON public.entidades_corporativas
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_entidades_corporativas_to_pessoas();

-- 3. Função para manter a tabela papeis_pessoa em sincronia com entidade_papeis
CREATE OR REPLACE FUNCTION public.sync_entidade_papeis_to_papeis_pessoa()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_pessoa uuid;
  target_papel uuid;
BEGIN
  target_pessoa := COALESCE(NEW.entidade_id, OLD.entidade_id);
  target_papel := COALESCE(NEW.papel_id, OLD.papel_id);

  IF target_pessoa IS NULL OR target_papel IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Apenas processar se houver registro correspondente em pessoas
  IF NOT EXISTS (SELECT 1 FROM public.pessoas WHERE id = target_pessoa) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.ativo THEN
      INSERT INTO public.papeis_pessoa (pessoa_id, papel_id, ativo)
      VALUES (target_pessoa, target_papel, true)
      ON CONFLICT (pessoa_id, papel_id)
      DO UPDATE SET ativo = true, updated_at = now();
    ELSE
      UPDATE public.papeis_pessoa
      SET ativo = false, updated_at = now()
      WHERE pessoa_id = target_pessoa AND papel_id = target_papel;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.ativo THEN
      INSERT INTO public.papeis_pessoa (pessoa_id, papel_id, ativo)
      VALUES (target_pessoa, target_papel, true)
      ON CONFLICT (pessoa_id, papel_id)
      DO UPDATE SET ativo = true, updated_at = now();
    ELSE
      UPDATE public.papeis_pessoa
      SET ativo = false, updated_at = now()
      WHERE pessoa_id = target_pessoa AND papel_id = target_papel;
    END IF;
  ELSE -- DELETE
    UPDATE public.papeis_pessoa
    SET ativo = false, updated_at = now()
    WHERE pessoa_id = target_pessoa AND papel_id = target_papel;
  END IF;

  PERFORM public.refresh_pessoa_role_state(target_pessoa);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_entidade_papeis_to_pessoas ON public.entidade_papeis;
CREATE TRIGGER trg_sync_entidade_papeis_to_pessoas
  AFTER INSERT OR UPDATE OR DELETE ON public.entidade_papeis
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_entidade_papeis_to_papeis_pessoa();

-- 4. Trigger adicional para garantir atualização dos flags quando papeis_pessoa for alterado diretamente
CREATE OR REPLACE FUNCTION public.refresh_pessoa_role_state_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_pessoa_role_state(OLD.pessoa_id);
    RETURN OLD;
  ELSE
    PERFORM public.refresh_pessoa_role_state(NEW.pessoa_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_pessoa_role_state ON public.papeis_pessoa;
CREATE TRIGGER trg_refresh_pessoa_role_state
  AFTER INSERT OR UPDATE OR DELETE ON public.papeis_pessoa
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_pessoa_role_state_trigger();

-- 5. Atualizar a função de busca unificada para considerar a tabela pessoas como fonte primária de PF
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
  SELECT *
  FROM (
    -- Pessoas físicas provenientes da tabela pessoas
    SELECT
      p.id,
      p.nome AS nome_razao_social,
      NULL::text AS nome_fantasia,
      p.cpf AS cpf_cnpj,
      p.email,
      p.telefone,
      p.tipo_pessoa,
      p.ativo,
      p.created_at,
      p.updated_at,
      COALESCE(
        ARRAY_AGG(DISTINCT CASE WHEN pap.nome IS NOT NULL THEN pap.nome END)
          FILTER (WHERE pap.nome IS NOT NULL),
        ARRAY[]::text[]
      ) AS papeis
    FROM public.pessoas p
    LEFT JOIN public.papeis_pessoa pp
      ON pp.pessoa_id = p.id AND pp.ativo = true
    LEFT JOIN public.papeis pap
      ON pap.id = pp.papel_id AND pap.ativo = true
    WHERE (p_search IS NULL OR
           p.nome ILIKE '%' || p_search || '%' OR
           p.cpf ILIKE '%' || p_search || '%' OR
           p.email ILIKE '%' || p_search || '%')
    GROUP BY p.id, p.nome, p.cpf, p.email, p.telefone, p.tipo_pessoa, p.ativo, p.created_at, p.updated_at

    UNION ALL

    -- Demais entidades (principalmente PJ) que ainda não possuem registro correspondente em pessoas
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
      COALESCE(
        ARRAY_AGG(DISTINCT CASE WHEN p.nome IS NOT NULL THEN p.nome END)
          FILTER (WHERE p.nome IS NOT NULL),
        ARRAY[]::text[]
      ) AS papeis
    FROM public.entidades_corporativas ec
    LEFT JOIN public.entidade_papeis ep
      ON ep.entidade_id = ec.id AND ep.ativo = true
    LEFT JOIN public.papeis p
      ON p.id = ep.papel_id AND p.ativo = true
    WHERE NOT EXISTS (SELECT 1 FROM public.pessoas ps WHERE ps.id = ec.id)
      AND (p_search IS NULL OR
           ec.nome_razao_social ILIKE '%' || p_search || '%' OR
           ec.cpf_cnpj ILIKE '%' || p_search || '%' OR
           ec.email ILIKE '%' || p_search || '%')
    GROUP BY ec.id, ec.nome_razao_social, ec.nome_fantasia, ec.cpf_cnpj,
             ec.email, ec.telefone, ec.tipo_pessoa, ec.ativo, ec.created_at, ec.updated_at

    UNION ALL

    -- Dados legados de fornecedores que ainda não foram consolidados
    SELECT
      f.id,
      f.nome AS nome_razao_social,
      f.nome_fantasia,
      f.cnpj_cpf AS cpf_cnpj,
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
      ]::text[] AS papeis
    FROM public.fornecedores f
    WHERE f.ativo = true
      AND NOT EXISTS (SELECT 1 FROM public.pessoas ps WHERE ps.id = f.id)
      AND NOT EXISTS (SELECT 1 FROM public.entidades_corporativas ec WHERE ec.id = f.id)
      AND (p_search IS NULL OR
           f.nome ILIKE '%' || p_search || '%' OR
           f.cnpj_cpf ILIKE '%' || p_search || '%' OR
           f.email ILIKE '%' || p_search || '%')
  ) AS combined
  ORDER BY nome_razao_social
  LIMIT p_limit OFFSET p_offset;
END;
$$;
