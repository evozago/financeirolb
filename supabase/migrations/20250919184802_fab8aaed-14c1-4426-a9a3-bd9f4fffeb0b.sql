-- 1. Expandir tabela fornecedores para ser a base única de Cadastro PF e PJ
ALTER TABLE fornecedores 
ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT DEFAULT 'pessoa_juridica' CHECK (tipo_pessoa IN ('pessoa_fisica', 'pessoa_juridica'));

ALTER TABLE fornecedores 
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS rg TEXT,
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS data_fundacao DATE,
ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT,
ADD COLUMN IF NOT EXISTS genero TEXT,
ADD COLUMN IF NOT EXISTS estado_civil TEXT,
ADD COLUMN IF NOT EXISTS profissao TEXT,
ADD COLUMN IF NOT EXISTS nacionalidade TEXT DEFAULT 'Brasileira',
ADD COLUMN IF NOT EXISTS nome_fantasia TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Campos específicos para funcionários
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

-- Campos específicos para vendedoras
ALTER TABLE fornecedores 
ADD COLUMN IF NOT EXISTS eh_vendedora BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS meta_mensal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS comissao_padrao NUMERIC DEFAULT 3.0,
ADD COLUMN IF NOT EXISTS comissao_supermeta NUMERIC DEFAULT 5.0;

-- Campos específicos para fornecedores (manter os existentes)
ALTER TABLE fornecedores 
ADD COLUMN IF NOT EXISTS eh_fornecedor BOOLEAN DEFAULT true;

-- Normalizar campos de documento
ALTER TABLE fornecedores 
ADD COLUMN IF NOT EXISTS cpf_cnpj_normalizado TEXT;

-- 2. Criar função para normalizar CPF/CNPJ
CREATE OR REPLACE FUNCTION normalize_cpf_cnpj(doc TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(COALESCE(doc, ''), '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Criar trigger para normalização automática
CREATE OR REPLACE FUNCTION update_cpf_cnpj_normalized()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalizar CPF se pessoa física
  IF NEW.tipo_pessoa = 'pessoa_fisica' AND NEW.cpf IS NOT NULL THEN
    NEW.cpf_cnpj_normalizado := normalize_cpf_cnpj(NEW.cpf);
  END IF;
  
  -- Normalizar CNPJ se pessoa jurídica
  IF NEW.tipo_pessoa = 'pessoa_juridica' AND NEW.cnpj_cpf IS NOT NULL THEN
    NEW.cpf_cnpj_normalizado := normalize_cpf_cnpj(NEW.cnpj_cpf);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_normalize_cpf_cnpj ON fornecedores;
CREATE TRIGGER trigger_normalize_cpf_cnpj
  BEFORE INSERT OR UPDATE ON fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION update_cpf_cnpj_normalized();

-- 4. Migrar dados de funcionarios para fornecedores
INSERT INTO fornecedores (
  nome, email, telefone, endereco, tipo_pessoa, cpf, 
  eh_funcionario, eh_fornecedor, eh_vendedora,
  cargo_id, setor_id, salario, data_admissao, status_funcionario,
  dias_uteis_mes, valor_transporte_dia, valor_transporte_total,
  chave_pix, tipo_chave_pix, ativo, created_at, updated_at
)
SELECT 
  f.nome, f.email, f.telefone, f.endereco, 'pessoa_fisica',
  f.cpf, true, false, false,
  NULL, NULL, f.salario, f.data_admissao, f.status_funcionario,
  f.dias_uteis_mes, f.valor_transporte_dia, f.valor_transporte_total,
  f.chave_pix, f.tipo_chave_pix, f.ativo, f.created_at, f.updated_at
FROM funcionarios f
WHERE NOT EXISTS (
  SELECT 1 FROM fornecedores 
  WHERE normalize_cpf_cnpj(cpf) = normalize_cpf_cnpj(f.cpf) 
  AND normalize_cpf_cnpj(f.cpf) != ''
);

-- 5. Migrar dados de vendedoras para fornecedores
INSERT INTO fornecedores (
  nome, tipo_pessoa, eh_funcionario, eh_fornecedor, eh_vendedora,
  ativo, created_at, updated_at
)
SELECT 
  v.nome, 'pessoa_fisica', false, false, true,
  v.ativo, v.created_at, v.updated_at
FROM vendedoras v
WHERE NOT EXISTS (
  SELECT 1 FROM fornecedores 
  WHERE UPPER(TRIM(nome)) = UPPER(TRIM(v.nome))
);

-- 6. Migrar dados de pessoas para fornecedores
INSERT INTO fornecedores (
  nome, email, telefone, endereco, tipo_pessoa, cpf, cnpj_cpf,
  eh_funcionario, eh_fornecedor, eh_vendedora,
  ativo, created_at, updated_at
)
SELECT 
  p.nome, p.email, p.telefone, p.endereco, p.tipo_pessoa,
  p.cpf, p.cnpj,
  (p.categorias ? 'funcionario')::boolean,
  (p.categorias ? 'fornecedor')::boolean,
  (p.categorias ? 'vendedora')::boolean,
  p.ativo, p.created_at, p.updated_at
FROM pessoas p
WHERE NOT EXISTS (
  SELECT 1 FROM fornecedores 
  WHERE (
    (p.tipo_pessoa = 'pessoa_fisica' AND normalize_cpf_cnpj(cpf) = normalize_cpf_cnpj(p.cpf) AND normalize_cpf_cnpj(p.cpf) != '') 
    OR 
    (p.tipo_pessoa = 'pessoa_juridica' AND normalize_cpf_cnpj(cnpj_cpf) = normalize_cpf_cnpj(p.cnpj) AND normalize_cpf_cnpj(p.cnpj) != '')
  )
);

-- 7. Migrar dados de entidades_corporativas para fornecedores
INSERT INTO fornecedores (
  nome, email, telefone, tipo_pessoa, cpf, cnpj_cpf, nome_fantasia,
  rg, data_nascimento, data_fundacao, inscricao_estadual,
  genero, estado_civil, profissao, nacionalidade, observacoes,
  eh_funcionario, eh_fornecedor, eh_vendedora,
  ativo, created_at, updated_at
)
SELECT 
  ec.nome_razao_social, ec.email, ec.telefone, ec.tipo_pessoa,
  CASE WHEN ec.tipo_pessoa = 'pessoa_fisica' THEN ec.cpf_cnpj END,
  CASE WHEN ec.tipo_pessoa = 'pessoa_juridica' THEN ec.cpf_cnpj END,
  ec.nome_fantasia, ec.rg, ec.data_nascimento, ec.data_fundacao,
  ec.inscricao_estadual, ec.genero, ec.estado_civil, ec.profissao,
  ec.nacionalidade, ec.observacoes,
  false, false, false, -- Será definido pelos papéis
  ec.ativo, ec.created_at, ec.updated_at
FROM entidades_corporativas ec
WHERE NOT EXISTS (
  SELECT 1 FROM fornecedores 
  WHERE (
    (ec.tipo_pessoa = 'pessoa_fisica' AND normalize_cpf_cnpj(cpf) = normalize_cpf_cnpj(ec.cpf_cnpj) AND normalize_cpf_cnpj(ec.cpf_cnpj) != '') 
    OR 
    (ec.tipo_pessoa = 'pessoa_juridica' AND normalize_cpf_cnpj(cnpj_cpf) = normalize_cpf_cnpj(ec.cpf_cnpj) AND normalize_cpf_cnpj(ec.cpf_cnpj) != '')
  )
);

-- 8. Atualizar fornecedores com papéis das entidades corporativas
UPDATE fornecedores SET 
  eh_funcionario = true 
WHERE id IN (
  SELECT f.id FROM fornecedores f
  JOIN entidades_corporativas ec ON (
    (f.tipo_pessoa = 'pessoa_fisica' AND normalize_cpf_cnpj(f.cpf) = normalize_cpf_cnpj(ec.cpf_cnpj)) 
    OR 
    (f.tipo_pessoa = 'pessoa_juridica' AND normalize_cpf_cnpj(f.cnpj_cpf) = normalize_cpf_cnpj(ec.cpf_cnpj))
  )
  JOIN entidade_papeis ep ON ec.id = ep.entidade_id
  JOIN papeis p ON ep.papel_id = p.id
  WHERE p.nome = 'funcionario' AND ep.ativo = true
);

UPDATE fornecedores SET 
  eh_vendedora = true 
WHERE id IN (
  SELECT f.id FROM fornecedores f
  JOIN entidades_corporativas ec ON (
    (f.tipo_pessoa = 'pessoa_fisica' AND normalize_cpf_cnpj(f.cpf) = normalize_cpf_cnpj(ec.cpf_cnpj)) 
    OR 
    (f.tipo_pessoa = 'pessoa_juridica' AND normalize_cpf_cnpj(f.cnpj_cpf) = normalize_cpf_cnpj(ec.cpf_cnpj))
  )
  JOIN entidade_papeis ep ON ec.id = ep.entidade_id
  JOIN papeis p ON ep.papel_id = p.id
  WHERE p.nome = 'vendedor' AND ep.ativo = true
);

-- 9. Atualizar campos normalizados existentes
UPDATE fornecedores SET 
  cpf_cnpj_normalizado = normalize_cpf_cnpj(
    CASE 
      WHEN tipo_pessoa = 'pessoa_fisica' THEN cpf 
      ELSE cnpj_cpf 
    END
  );

-- 10. Criar constraint único para CPF/CNPJ
ALTER TABLE fornecedores 
ADD CONSTRAINT uk_fornecedores_cpf_cnpj_normalizado 
UNIQUE (cpf_cnpj_normalizado) 
DEFERRABLE INITIALLY DEFERRED;