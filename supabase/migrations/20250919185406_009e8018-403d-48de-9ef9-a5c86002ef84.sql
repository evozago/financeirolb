-- 13. Corrigir dados inconsistentes na tabela entidades_corporativas
UPDATE entidades_corporativas 
SET tipo_pessoa = 'pessoa_juridica' 
WHERE tipo_pessoa = 'juridica';

UPDATE entidades_corporativas 
SET tipo_pessoa = 'pessoa_fisica' 
WHERE tipo_pessoa = 'fisica';

-- Definir valores padrão para registros sem tipo_pessoa
UPDATE entidades_corporativas 
SET tipo_pessoa = 'pessoa_juridica' 
WHERE tipo_pessoa IS NULL OR tipo_pessoa = '';

-- 14. Agora migrar dados de entidades_corporativas para fornecedores
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
  false, false, false,
  ec.ativo, ec.created_at, ec.updated_at
FROM entidades_corporativas ec
WHERE NOT EXISTS (
  SELECT 1 FROM fornecedores f
  WHERE (
    (ec.tipo_pessoa = 'pessoa_fisica' AND ec.cpf_cnpj IS NOT NULL AND normalize_cpf_cnpj(f.cpf) = normalize_cpf_cnpj(ec.cpf_cnpj) AND normalize_cpf_cnpj(ec.cpf_cnpj) != '') 
    OR 
    (ec.tipo_pessoa = 'pessoa_juridica' AND ec.cpf_cnpj IS NOT NULL AND normalize_cpf_cnpj(f.cnpj_cpf) = normalize_cpf_cnpj(ec.cpf_cnpj) AND normalize_cpf_cnpj(ec.cpf_cnpj) != '')
    OR
    (UPPER(TRIM(f.nome)) = UPPER(TRIM(ec.nome_razao_social)))
  )
);