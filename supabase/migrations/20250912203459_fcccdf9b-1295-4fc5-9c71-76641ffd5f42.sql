-- Corrigir estrutura das tabelas e views

-- 1. Verificar se a tabela parcelas_conta_pagar existe e tem as colunas corretas
ALTER TABLE IF EXISTS public.parcelas_conta_pagar 
ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT 1;

-- 2. Recriar views com estrutura correta
DROP VIEW IF EXISTS vw_fato_parcelas;

CREATE VIEW vw_fato_parcelas AS
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
  COALESCE(p.total_parcelas, 1) as total_parcelas,
  p.valor_parcela,
  COALESCE(p.valor_pago, 0) as valor_pago,
  p.data_vencimento,
  p.data_pagamento,
  p.status,
  p.forma_pagamento,
  cb.nome_banco as banco_pagamento,
  CASE 
    WHEN p.status = 'paga' THEN 'Pago'
    WHEN p.data_vencimento < CURRENT_DATE AND p.status != 'paga' THEN 'Vencido'
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

-- 3. Executar migrações de dados com tratamento de erro
DO $$
DECLARE
  fornecedores_result INTEGER := 0;
  installments_result INTEGER := 0;
  error_message TEXT;
BEGIN
  -- Tentar migrar fornecedores
  BEGIN
    SELECT migrate_fornecedores_to_entidades() INTO fornecedores_result;
    RAISE NOTICE 'Fornecedores migrados: %', fornecedores_result;
  EXCEPTION WHEN OTHERS THEN
    error_message := SQLERRM;
    RAISE NOTICE 'Erro ao migrar fornecedores: %', error_message;
  END;
  
  -- Tentar migrar installments
  BEGIN
    SELECT migrate_ap_installments_to_corporative() INTO installments_result;
    RAISE NOTICE 'Installments migrados: %', installments_result;
  EXCEPTION WHEN OTHERS THEN
    error_message := SQLERRM;
    RAISE NOTICE 'Erro ao migrar installments: %', error_message;
  END;
END
$$;