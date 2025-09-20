-- Primeiro, migrar pessoas físicas de fornecedores para pessoas
INSERT INTO pessoas (
  id, nome, cpf, email, telefone, endereco, 
  data_nascimento, rg, nacionalidade, profissao, 
  genero, estado_civil, observacoes, ativo, 
  created_at, updated_at, tipo_pessoa, categorias
)
SELECT 
  id, nome, cpf, email, telefone, endereco,
  data_nascimento, rg, nacionalidade, profissao,
  genero, estado_civil, observacoes, ativo,
  created_at, updated_at, 'pessoa_fisica' as tipo_pessoa,
  CASE 
    WHEN eh_funcionario = true AND eh_fornecedor = true THEN '["funcionario", "fornecedor"]'::jsonb
    WHEN eh_funcionario = true THEN '["funcionario"]'::jsonb
    WHEN eh_fornecedor = true THEN '["fornecedor"]'::jsonb
    ELSE '[]'::jsonb
  END as categorias
FROM fornecedores 
WHERE tipo_pessoa = 'pessoa_fisica'
  AND NOT EXISTS (
    SELECT 1 FROM pessoas p WHERE p.id = fornecedores.id
  )
ON CONFLICT (id) DO NOTHING;

-- Atualizar referências em ap_installments para pessoas físicas
UPDATE ap_installments 
SET fornecedor_id = NULL
WHERE fornecedor_id IN (
  SELECT id FROM fornecedores WHERE tipo_pessoa = 'pessoa_fisica'
);

-- Atualizar referências em recurring_bills para pessoas físicas
UPDATE recurring_bills 
SET supplier_id = NULL
WHERE supplier_id IN (
  SELECT id FROM fornecedores WHERE tipo_pessoa = 'pessoa_fisica'
);

-- Agora remover pessoas físicas da tabela fornecedores
DELETE FROM fornecedores 
WHERE tipo_pessoa = 'pessoa_fisica';

-- Migrar pessoas jurídicas de pessoas para fornecedores (se houver baseado no padrão CNPJ)
INSERT INTO fornecedores (
  id, nome, nome_fantasia, cnpj_cpf, email, telefone, 
  endereco, inscricao_estadual, data_fundacao, 
  observacoes, ativo, created_at, updated_at, tipo_pessoa,
  eh_fornecedor
)
SELECT 
  p.id, p.nome, NULL as nome_fantasia, p.cpf as cnpj_cpf, 
  p.email, p.telefone, p.endereco, NULL as inscricao_estadual, 
  p.data_nascimento as data_fundacao, p.observacoes, 
  p.ativo, p.created_at, p.updated_at, 'pessoa_juridica' as tipo_pessoa,
  true as eh_fornecedor
FROM pessoas p
WHERE p.cpf ~ '^[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}$' -- CNPJ pattern
  AND NOT EXISTS (
    SELECT 1 FROM fornecedores f WHERE f.id = p.id
  )
ON CONFLICT (id) DO NOTHING;

-- Remover pessoas jurídicas da tabela pessoas (baseado no padrão CNPJ)
DELETE FROM pessoas 
WHERE cpf ~ '^[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}$';

-- Atualizar tipo_pessoa para garantir consistência
UPDATE fornecedores 
SET tipo_pessoa = 'pessoa_juridica' 
WHERE tipo_pessoa IS NULL OR tipo_pessoa != 'pessoa_juridica';