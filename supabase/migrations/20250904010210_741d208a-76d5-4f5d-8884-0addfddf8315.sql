-- Corrigir questões de segurança detectadas pelo linter

-- Corrigir search_path nas funções criadas
CREATE OR REPLACE FUNCTION public.trigger_normaliza_entidade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Normalizar CPF/CNPJ
  IF NEW.cpf_cnpj IS NOT NULL THEN
    NEW.cpf_cnpj_normalizado = normaliza_cpf_cnpj(NEW.cpf_cnpj);
  END IF;
  
  -- Normalizar email
  IF NEW.email IS NOT NULL THEN
    NEW.email_normalizado = normaliza_email(NEW.email);
  END IF;
  
  -- Atualizar timestamp
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_atualiza_status_parcela()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar status baseado nas datas e pagamento
  IF NEW.data_pagamento IS NOT NULL THEN
    NEW.status = 'paga';
  ELSIF NEW.data_vencimento < CURRENT_DATE AND NEW.data_pagamento IS NULL THEN
    NEW.status = 'vencida';
  ELSE
    NEW.status = 'a_vencer';
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Criar funções para APIs corporativas (Dashboard 360°)
CREATE OR REPLACE FUNCTION public.get_entidade_dashboard(p_entidade_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_cadastral jsonb;
  v_papeis jsonb;
  v_enderecos jsonb;
  v_financeiro jsonb;
  v_vendas jsonb;
BEGIN
  -- Dados cadastrais
  SELECT jsonb_build_object(
    'id', id,
    'tipo_pessoa', tipo_pessoa,
    'nome_razao_social', nome_razao_social,
    'nome_fantasia', nome_fantasia,
    'cpf_cnpj', cpf_cnpj,
    'email', email,
    'telefone', telefone,
    'inscricao_estadual', inscricao_estadual,
    'data_nascimento', data_nascimento,
    'data_fundacao', data_fundacao,
    'ativo', ativo
  ) INTO v_cadastral
  FROM entidades_corporativas
  WHERE id = p_entidade_id;
  
  -- Papéis da entidade
  SELECT jsonb_agg(
    jsonb_build_object(
      'papel', p.nome,
      'descricao', p.descricao,
      'data_inicio', ep.data_inicio,
      'ativo', ep.ativo
    )
  ) INTO v_papeis
  FROM entidade_papeis ep
  JOIN papeis p ON ep.papel_id = p.id
  WHERE ep.entidade_id = p_entidade_id AND ep.ativo = true;
  
  -- Endereços
  SELECT jsonb_agg(
    jsonb_build_object(
      'tipo', ee.tipo,
      'principal', ee.principal,
      'logradouro', ed.logradouro,
      'numero', ed.numero,
      'bairro', ed.bairro,
      'cidade', ed.cidade,
      'uf', ed.uf,
      'cep', ed.cep
    )
  ) INTO v_enderecos
  FROM entidade_enderecos ee
  JOIN endereco_detalhado ed ON ee.endereco_id = ed.id
  WHERE ee.entidade_id = p_entidade_id;
  
  -- Resumo financeiro (contas a pagar)
  SELECT jsonb_build_object(
    'total_aberto', COALESCE(SUM(CASE WHEN p.status IN ('a_vencer', 'vencida') THEN p.valor_parcela ELSE 0 END), 0),
    'total_pago', COALESCE(SUM(CASE WHEN p.status = 'paga' THEN p.valor_pago ELSE 0 END), 0),
    'total_vencido', COALESCE(SUM(CASE WHEN p.status = 'vencida' THEN p.valor_parcela ELSE 0 END), 0),
    'contas_abertas', COUNT(CASE WHEN p.status IN ('a_vencer', 'vencida') THEN 1 END)
  ) INTO v_financeiro
  FROM contas_pagar_corporativas cp
  JOIN parcelas_conta_pagar p ON cp.id = p.conta_pagar_id
  WHERE cp.credor_id = p_entidade_id;
  
  -- Resumo de vendas (como cliente)
  SELECT jsonb_build_object(
    'total_vendas', COALESCE(SUM(valor_total), 0),
    'quantidade_vendas', COUNT(*),
    'ultima_venda', MAX(data_venda)
  ) INTO v_vendas
  FROM vendas_corporativas
  WHERE cliente_id = p_entidade_id;
  
  -- Montar resultado final
  v_result := jsonb_build_object(
    'cadastral', v_cadastral,
    'papeis', COALESCE(v_papeis, '[]'::jsonb),
    'enderecos', COALESCE(v_enderecos, '[]'::jsonb),
    'financeiro', COALESCE(v_financeiro, '{}'::jsonb),
    'vendas', COALESCE(v_vendas, '{}'::jsonb)
  );
  
  RETURN v_result;
END;
$$;

-- Função para buscar entidades por papéis e texto
CREATE OR REPLACE FUNCTION public.search_entidades_corporativas(
  p_query text DEFAULT NULL,
  p_papel text DEFAULT NULL,
  p_limite integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  tipo_pessoa text,
  nome_razao_social text,
  nome_fantasia text,
  cpf_cnpj text,
  email text,
  telefone text,
  papeis text[],
  ativo boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    e.id,
    e.tipo_pessoa,
    e.nome_razao_social,
    e.nome_fantasia,
    e.cpf_cnpj,
    e.email,
    e.telefone,
    ARRAY_AGG(DISTINCT p.nome) as papeis,
    e.ativo
  FROM entidades_corporativas e
  LEFT JOIN entidade_papeis ep ON e.id = ep.entidade_id AND ep.ativo = true
  LEFT JOIN papeis p ON ep.papel_id = p.id
  WHERE (p_query IS NULL OR (
    e.nome_razao_social ILIKE '%' || p_query || '%' OR
    e.nome_fantasia ILIKE '%' || p_query || '%' OR
    e.cpf_cnpj ILIKE '%' || p_query || '%' OR
    e.email ILIKE '%' || p_query || '%'
  ))
  AND (p_papel IS NULL OR p.nome = p_papel)
  AND e.ativo = true
  GROUP BY e.id, e.tipo_pessoa, e.nome_razao_social, e.nome_fantasia, e.cpf_cnpj, e.email, e.telefone, e.ativo
  ORDER BY e.nome_razao_social
  LIMIT p_limite OFFSET p_offset;
END;
$$;

-- Função para estatísticas do dashboard financeiro
CREATE OR REPLACE FUNCTION public.get_dashboard_financeiro_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'contas_vencendo_hoje', COALESCE(SUM(CASE WHEN p.status = 'a_vencer' AND p.data_vencimento = CURRENT_DATE THEN p.valor_parcela ELSE 0 END), 0),
    'contas_vencidas', COALESCE(SUM(CASE WHEN p.status = 'vencida' THEN p.valor_parcela ELSE 0 END), 0),
    'contas_pagas_mes', COALESCE(SUM(CASE WHEN p.status = 'paga' AND DATE_TRUNC('month', p.data_pagamento) = DATE_TRUNC('month', CURRENT_DATE) THEN p.valor_pago ELSE 0 END), 0),
    'total_aberto', COALESCE(SUM(CASE WHEN p.status IN ('a_vencer', 'vencida') THEN p.valor_parcela ELSE 0 END), 0),
    'qtd_vencendo_hoje', COUNT(CASE WHEN p.status = 'a_vencer' AND p.data_vencimento = CURRENT_DATE THEN 1 END),
    'qtd_vencidas', COUNT(CASE WHEN p.status = 'vencida' THEN 1 END),
    'qtd_pagas_mes', COUNT(CASE WHEN p.status = 'paga' AND DATE_TRUNC('month', p.data_pagamento) = DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)
  ) INTO v_stats
  FROM parcelas_conta_pagar p
  JOIN contas_pagar_corporativas cp ON p.conta_pagar_id = cp.id;
  
  RETURN v_stats;
END;
$$;

-- Views para BI (com dados agregados)
CREATE OR REPLACE VIEW public.vw_fato_parcelas AS
SELECT 
  p.id as id_parcela,
  cp.id as id_conta,
  cp.credor_id as id_credor,
  cp.categoria_id as id_categoria,
  cp.filial_id as id_filial,
  p.valor_parcela as valor,
  p.data_vencimento,
  p.data_pagamento,
  p.valor_pago,
  p.status,
  p.meio_pagamento,
  cp.data_emissao,
  DATE_TRUNC('month', p.data_vencimento) as mes_vencimento,
  DATE_TRUNC('year', p.data_vencimento) as ano_vencimento
FROM parcelas_conta_pagar p
JOIN contas_pagar_corporativas cp ON p.conta_pagar_id = cp.id;

CREATE OR REPLACE VIEW public.vw_fato_vendas AS
SELECT 
  v.id as id_venda,
  v.cliente_id as id_cliente,
  v.vendedor_id as id_vendedor,
  v.filial_id as id_filial,
  v.valor_total as valor,
  v.data_venda,
  v.status_venda,
  DATE_TRUNC('month', v.data_venda) as mes_venda,
  DATE_TRUNC('year', v.data_venda) as ano_venda
FROM vendas_corporativas v;

-- Views dimensão
CREATE OR REPLACE VIEW public.vw_dim_entidades AS
SELECT 
  id,
  tipo_pessoa,
  nome_razao_social,
  nome_fantasia,
  cpf_cnpj,
  email,
  telefone,
  ativo
FROM entidades_corporativas;

CREATE OR REPLACE VIEW public.vw_dim_categorias AS
SELECT 
  id,
  nome,
  ativo
FROM categorias_produtos;