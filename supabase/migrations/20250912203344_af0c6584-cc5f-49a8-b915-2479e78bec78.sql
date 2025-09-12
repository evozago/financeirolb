-- Corrigir problemas da migração anterior

-- 1. Remover políticas conflitantes se existirem
DROP POLICY IF EXISTS "Authenticated users can view papeis" ON public.papeis;
DROP POLICY IF EXISTS "Only admins can modify papeis" ON public.papeis;
DROP POLICY IF EXISTS "Authenticated users can manage parcelas_conta_pagar" ON public.parcelas_conta_pagar;

-- 2. Criar políticas com nomes únicos
CREATE POLICY "papeis_select_authenticated" ON public.papeis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "papeis_modify_admin_only" ON public.papeis
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "parcelas_conta_pagar_full_access" ON public.parcelas_conta_pagar
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Executar migrações (se ainda não executadas)
DO $$
DECLARE
  fornecedores_result INTEGER;
  installments_result INTEGER;
BEGIN
  -- Migrar fornecedores para entidades corporativas
  SELECT migrate_fornecedores_to_entidades() INTO fornecedores_result;
  RAISE NOTICE 'Fornecedores migrados: %', fornecedores_result;
  
  -- Migrar ap_installments para estrutura corporativa
  SELECT migrate_ap_installments_to_corporative() INTO installments_result;
  RAISE NOTICE 'Installments migrados: %', installments_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro na migração: %', SQLERRM;
END
$$;

-- 4. Criar views para facilitar consultas (BI-ready)
CREATE OR REPLACE VIEW vw_fato_parcelas AS
SELECT 
  p.id,
  p.conta_pagar_id,
  cp.credor_id,
  ec.nome_razao_social as credor_nome,
  ec.cpf_cnpj as credor_documento,
  cp.descricao as conta_descricao,
  cp.numero_documento,
  cat.nome as categoria,
  f.nome as filial,
  p.numero_parcela,
  p.total_parcelas,
  p.valor_parcela,
  p.valor_pago,
  p.data_vencimento,
  p.data_pagamento,
  p.status,
  p.forma_pagamento,
  cb.nome_banco as banco_pagamento,
  CASE 
    WHEN p.status = 'paga' THEN 'Pago'
    WHEN p.data_vencimento < CURRENT_DATE THEN 'Vencido'
    ELSE 'A Vencer'
  END as status_formatado,
  EXTRACT(YEAR FROM p.data_vencimento) as ano_vencimento,
  EXTRACT(MONTH FROM p.data_vencimento) as mes_vencimento,
  p.created_at,
  p.updated_at
FROM parcelas_conta_pagar p
JOIN contas_pagar_corporativas cp ON p.conta_pagar_id = cp.id
JOIN entidades_corporativas ec ON cp.credor_id = ec.id
LEFT JOIN categorias_produtos cat ON cp.categoria_id = cat.id
LEFT JOIN filiais f ON cp.filial_id = f.id
LEFT JOIN contas_bancarias cb ON p.conta_bancaria_id = cb.id;

CREATE OR REPLACE VIEW vw_dim_entidade AS
SELECT 
  ec.id,
  ec.tipo_pessoa,
  ec.nome_razao_social,
  ec.nome_fantasia,
  ec.cpf_cnpj,
  ec.email,
  ec.telefone,
  ARRAY_AGG(DISTINCT p.nome ORDER BY p.nome) as papeis,
  ec.ativo,
  ec.created_at,
  ec.updated_at
FROM entidades_corporativas ec
LEFT JOIN entidade_papeis ep ON ec.id = ep.entidade_id AND ep.ativo = true
LEFT JOIN papeis p ON ep.papel_id = p.id
GROUP BY ec.id, ec.tipo_pessoa, ec.nome_razao_social, ec.nome_fantasia, 
         ec.cpf_cnpj, ec.email, ec.telefone, ec.ativo, ec.created_at, ec.updated_at;

CREATE OR REPLACE VIEW vw_dim_categoria_financeira AS
SELECT 
  id,
  nome,
  ativo,
  created_at,
  updated_at
FROM categorias_produtos
WHERE ativo = true;

CREATE OR REPLACE VIEW vw_dim_filial AS
SELECT 
  id,
  nome,
  cnpj,
  ativo,
  created_at,
  updated_at
FROM filiais
WHERE ativo = true;