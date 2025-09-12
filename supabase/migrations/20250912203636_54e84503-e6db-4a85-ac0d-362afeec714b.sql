-- Corrigir estrutura das tabelas com colunas corretas

-- 1. Adicionar colunas faltantes na tabela parcelas_conta_pagar
ALTER TABLE public.parcelas_conta_pagar 
ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
ADD COLUMN IF NOT EXISTS comprovante_path TEXT;

-- 2. Atualizar forma_pagamento baseado em meio_pagamento se existir
UPDATE parcelas_conta_pagar 
SET forma_pagamento = meio_pagamento 
WHERE forma_pagamento IS NULL AND meio_pagamento IS NOT NULL;

-- 3. Recriar view com estrutura correta
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
  COALESCE(p.status, 'a_vencer') as status,
  COALESCE(p.forma_pagamento, p.meio_pagamento) as forma_pagamento,
  cb.nome_banco as banco_pagamento,
  CASE 
    WHEN COALESCE(p.status, 'a_vencer') = 'paga' THEN 'Pago'
    WHEN p.data_vencimento < CURRENT_DATE AND COALESCE(p.status, 'a_vencer') != 'paga' THEN 'Vencido'
    ELSE 'A Vencer'
  END as status_formatado,
  EXTRACT(YEAR FROM p.data_vencimento) as ano_vencimento,
  EXTRACT(MONTH FROM p.data_vencimento) as mes_vencimento,
  COALESCE(p.juros, 0) as juros,
  COALESCE(p.multa, 0) as multa,
  COALESCE(p.desconto, 0) as desconto,
  p.created_at,
  p.updated_at
FROM parcelas_conta_pagar p
JOIN contas_pagar_corporativas cp ON p.conta_pagar_id = cp.id
JOIN entidades_corporativas ec ON cp.credor_id = ec.id
LEFT JOIN categorias_produtos cat ON cp.categoria_id = cat.id
LEFT JOIN filiais f ON cp.filial_id = f.id
LEFT JOIN contas_bancarias cb ON p.conta_bancaria_id = cb.id;

-- 4. Função atualizada para migração dos installments com estrutura correta
CREATE OR REPLACE FUNCTION migrate_ap_installments_to_corporative_v2()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  installment_record RECORD;
  conta_pagar_id UUID;
  entidade_id UUID;
  categoria_id UUID;
  migrated_count INTEGER := 0;
BEGIN
  -- Verificar se já existem dados migrados
  IF EXISTS (SELECT 1 FROM contas_pagar_corporativas WHERE observacoes LIKE '%Migrado de ap_installments%') THEN
    RAISE NOTICE 'Dados já foram migrados anteriormente';
    RETURN 0;
  END IF;

  -- Migrar cada grupo de parcelas (mesmo fornecedor, descrição e número de documento)
  FOR installment_record IN 
    SELECT 
      MIN(id) as first_id,
      fornecedor,
      descricao,
      numero_documento,
      categoria,
      data_emissao,
      filial_id,
      entidade_id as existing_entidade_id,
      COUNT(*) as total_parcelas,
      SUM(valor) as valor_total
    FROM ap_installments 
    WHERE deleted_at IS NULL
    GROUP BY fornecedor, descricao, numero_documento, categoria, data_emissao, filial_id, entidade_id
  LOOP
    -- Tentar encontrar entidade pelo nome (fornecedor migrado)
    IF installment_record.existing_entidade_id IS NOT NULL THEN
      entidade_id := installment_record.existing_entidade_id;
    ELSE
      SELECT ec.id INTO entidade_id
      FROM entidades_corporativas ec
      JOIN entidade_papeis ep ON ec.id = ep.entidade_id
      JOIN papeis p ON ep.papel_id = p.id
      WHERE p.nome = 'fornecedor'
        AND UPPER(TRIM(ec.nome_razao_social)) = UPPER(TRIM(installment_record.fornecedor))
        AND ep.ativo = true
      LIMIT 1;
    END IF;
    
    -- Se não encontrou, criar entidade genérica
    IF entidade_id IS NULL THEN
      INSERT INTO entidades_corporativas (
        tipo_pessoa,
        nome_razao_social,
        observacoes,
        ativo
      ) VALUES (
        'pessoa_juridica',
        installment_record.fornecedor,
        'Criado automaticamente na migração de AP',
        true
      ) RETURNING id INTO entidade_id;
      
      -- Associar papel de fornecedor
      INSERT INTO entidade_papeis (entidade_id, papel_id, data_inicio, ativo)
      SELECT entidade_id, id, CURRENT_DATE, true FROM papeis WHERE nome = 'fornecedor';
    END IF;
    
    -- Buscar categoria
    SELECT id INTO categoria_id FROM categorias_produtos WHERE nome = installment_record.categoria LIMIT 1;
    
    -- Criar conta a pagar corporativa
    INSERT INTO contas_pagar_corporativas (
      credor_id,
      descricao,
      numero_documento,
      categoria_id,
      data_emissao,
      valor_total,
      filial_id,
      observacoes,
      status
    ) VALUES (
      entidade_id,
      installment_record.descricao,
      installment_record.numero_documento,
      categoria_id,
      installment_record.data_emissao,
      installment_record.valor_total,
      installment_record.filial_id,
      'Migrado de ap_installments em ' || now(),
      'aberto'
    ) RETURNING id INTO conta_pagar_id;
    
    -- Inserir parcelas
    INSERT INTO parcelas_conta_pagar (
      conta_pagar_id,
      numero_parcela,
      total_parcelas,
      valor_parcela,
      valor_pago,
      data_vencimento,
      data_pagamento,
      status,
      meio_pagamento,
      conta_bancaria_id,
      observacoes,
      comprovante_path
    )
    SELECT 
      conta_pagar_id,
      numero_parcela,
      total_parcelas,
      valor,
      CASE WHEN status = 'pago' THEN valor ELSE 0 END,
      data_vencimento,
      data_pagamento,
      CASE 
        WHEN status = 'pago' THEN 'paga'
        WHEN data_vencimento < CURRENT_DATE AND status != 'pago' THEN 'vencida'
        ELSE 'a_vencer'
      END,
      forma_pagamento,
      conta_bancaria_id,
      observacoes,
      comprovante_path
    FROM ap_installments 
    WHERE fornecedor = installment_record.fornecedor
      AND descricao = installment_record.descricao
      AND COALESCE(numero_documento, '') = COALESCE(installment_record.numero_documento, '')
      AND deleted_at IS NULL;
    
    migrated_count := migrated_count + installment_record.total_parcelas::INTEGER;
  END LOOP;
  
  RETURN migrated_count;
END;
$$;

-- 5. Executar migrações com tratamento de erro melhor
DO $$
DECLARE
  fornecedores_result INTEGER := 0;
  installments_result INTEGER := 0;
BEGIN
  -- Migrar fornecedores
  BEGIN
    SELECT migrate_fornecedores_to_entidades() INTO fornecedores_result;
    RAISE NOTICE 'Fornecedores migrados: %', fornecedores_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Fornecedores: %', SQLERRM;
  END;
  
  -- Migrar installments com nova função
  BEGIN
    SELECT migrate_ap_installments_to_corporative_v2() INTO installments_result;
    RAISE NOTICE 'Installments migrados: %', installments_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Installments: %', SQLERRM;
  END;
END
$$;