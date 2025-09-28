-- 2. Adicionar campos específicos para funcionários
ALTER TABLE fornecedores 
ADD COLUMN IF NOT EXISTS eh_funcionario BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cargo_id UUID,
ADD COLUMN IF NOT EXISTS setor_id UUID,
ADD COLUMN IF NOT EXISTS salario NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_admissao DATE,
ADD COLUMN IF NOT EXISTS data_demissao DATE,
ADD COLUMN IF NOT EXISTS status_funcionario TEXT DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS dias_uteis_mes INTEGER DEFAULT 22,
ADD COLUMN IF NOT EXISTS valor_transporte_dia NUMERIC DEFAULT 8.6,
ADD COLUMN IF NOT EXISTS valor_transporte_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS chave_pix TEXT,
ADD COLUMN IF NOT EXISTS tipo_chave_pix TEXT;

-- 3. Adicionar campos específicos para vendedoras
ALTER TABLE fornecedores 
ADD COLUMN IF NOT EXISTS eh_vendedora BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS meta_mensal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS comissao_padrao NUMERIC DEFAULT 3.0,
ADD COLUMN IF NOT EXISTS comissao_supermeta NUMERIC DEFAULT 5.0;

-- 4. Adicionar campo para fornecedores
ALTER TABLE fornecedores 
ADD COLUMN IF NOT EXISTS eh_fornecedor BOOLEAN DEFAULT true;

-- 5. Adicionar campo para normalização de CPF/CNPJ
ALTER TABLE fornecedores 
ADD COLUMN IF NOT EXISTS cpf_cnpj_normalizado TEXT;