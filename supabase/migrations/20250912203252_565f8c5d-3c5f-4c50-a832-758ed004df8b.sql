-- 1. Criar tabela de papéis para entidades corporativas
CREATE TABLE IF NOT EXISTS public.papeis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Melhorar tabela parcelas_conta_pagar
CREATE TABLE IF NOT EXISTS public.parcelas_conta_pagar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_pagar_id UUID NOT NULL REFERENCES public.contas_pagar_corporativas(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL DEFAULT 1,
  total_parcelas INTEGER NOT NULL DEFAULT 1,
  valor_parcela NUMERIC NOT NULL,
  valor_pago NUMERIC DEFAULT 0,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'a_vencer' CHECK (status IN ('a_vencer', 'vencida', 'paga', 'cancelada')),
  forma_pagamento TEXT,
  conta_bancaria_id UUID REFERENCES public.contas_bancarias(id),
  observacoes TEXT,
  comprovante_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Inserir papéis padrão
INSERT INTO public.papeis (nome, descricao) VALUES 
  ('fornecedor', 'Fornecedor de produtos ou serviços'),
  ('cliente', 'Cliente da empresa'),
  ('funcionario', 'Funcionário da empresa'),
  ('vendedor', 'Vendedor/Representante comercial'),
  ('contador', 'Contador/Escritório contábil'),
  ('prestador_servico', 'Prestador de serviços')
ON CONFLICT (nome) DO NOTHING;

-- 4. Função para migrar fornecedores para entidades corporativas
CREATE OR REPLACE FUNCTION migrate_fornecedores_to_entidades()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fornecedor_record RECORD;
  entidade_id UUID;
  papel_fornecedor_id UUID;
  migrated_count INTEGER := 0;
BEGIN
  -- Buscar ID do papel fornecedor
  SELECT id INTO papel_fornecedor_id FROM papeis WHERE nome = 'fornecedor';
  
  -- Migrar cada fornecedor
  FOR fornecedor_record IN 
    SELECT * FROM fornecedores 
    WHERE ativo = true 
    AND id NOT IN (
      SELECT DISTINCT (ep.entidade_id) 
      FROM entidade_papeis ep
      JOIN papeis p ON ep.papel_id = p.id
      WHERE p.nome = 'fornecedor'
    )
  LOOP
    -- Inserir na tabela entidades_corporativas
    INSERT INTO entidades_corporativas (
      tipo_pessoa,
      nome_razao_social,
      nome_fantasia,
      cpf_cnpj,
      email,
      telefone,
      observacoes,
      ativo,
      created_at,
      updated_at
    ) VALUES (
      CASE 
        WHEN LENGTH(REPLACE(REPLACE(REPLACE(fornecedor_record.cnpj_cpf, '.', ''), '/', ''), '-', '')) = 11 
        THEN 'pessoa_fisica'
        ELSE 'pessoa_juridica' 
      END,
      fornecedor_record.nome,
      fornecedor_record.nome,
      fornecedor_record.cnpj_cpf,
      fornecedor_record.email,
      fornecedor_record.telefone,
      'Migrado automaticamente de fornecedores em ' || now(),
      fornecedor_record.ativo,
      fornecedor_record.created_at,
      fornecedor_record.updated_at
    ) RETURNING id INTO entidade_id;
    
    -- Associar papel de fornecedor
    INSERT INTO entidade_papeis (entidade_id, papel_id, data_inicio, ativo)
    VALUES (entidade_id, papel_fornecedor_id, CURRENT_DATE, true);
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RETURN migrated_count;
END;
$$;

-- 5. Função para migrar ap_installments para nova estrutura
CREATE OR REPLACE FUNCTION migrate_ap_installments_to_corporative()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  installment_record RECORD;
  conta_pagar_id UUID;
  entidade_id UUID;
  migrated_count INTEGER := 0;
BEGIN
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
      (SELECT id FROM categorias_produtos WHERE nome = installment_record.categoria LIMIT 1),
      installment_record.data_emissao,
      installment_record.valor_total,
      installment_record.filial_id,
      'Migrado de ap_installments',
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
      forma_pagamento,
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

-- 6. Habilitar RLS nas novas tabelas
ALTER TABLE public.papeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_conta_pagar ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS
CREATE POLICY "Authenticated users can view papeis" ON public.papeis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can modify papeis" ON public.papeis
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Authenticated users can manage parcelas_conta_pagar" ON public.parcelas_conta_pagar
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Triggers para updated_at
CREATE TRIGGER update_papeis_updated_at
  BEFORE UPDATE ON public.papeis
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_parcelas_conta_pagar_updated_at
  BEFORE UPDATE ON public.parcelas_conta_pagar
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 9. Índices para performance
CREATE INDEX IF NOT EXISTS idx_parcelas_conta_pagar_conta_id ON parcelas_conta_pagar(conta_pagar_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_conta_pagar_status ON parcelas_conta_pagar(status);
CREATE INDEX IF NOT EXISTS idx_parcelas_conta_pagar_vencimento ON parcelas_conta_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_entidade_papeis_entidade_id ON entidade_papeis(entidade_id);
CREATE INDEX IF NOT EXISTS idx_entidade_papeis_papel_id ON entidade_papeis(papel_id);

-- 10. Executar migrações
SELECT migrate_fornecedores_to_entidades() as fornecedores_migrados;
SELECT migrate_ap_installments_to_corporative() as installments_migrados;