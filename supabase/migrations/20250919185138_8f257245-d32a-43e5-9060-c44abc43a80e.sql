-- 10. Migrar dados de funcionarios para fornecedores
INSERT INTO fornecedores (
  nome, email, telefone, endereco, tipo_pessoa, cpf, 
  eh_funcionario, eh_fornecedor, eh_vendedora,
  salario, data_admissao, status_funcionario,
  dias_uteis_mes, valor_transporte_dia, valor_transporte_total,
  chave_pix, tipo_chave_pix, ativo, created_at, updated_at
)
SELECT 
  f.nome, f.email, f.telefone, f.endereco, 'pessoa_fisica',
  f.cpf, true, false, false,
  f.salario, f.data_admissao, f.status_funcionario,
  f.dias_uteis_mes, f.valor_transporte_dia, f.valor_transporte_total,
  f.chave_pix, f.tipo_chave_pix, f.ativo, f.created_at, f.updated_at
FROM funcionarios f
WHERE NOT EXISTS (
  SELECT 1 FROM fornecedores 
  WHERE normalize_cpf_cnpj(cpf) = normalize_cpf_cnpj(f.cpf) 
  AND normalize_cpf_cnpj(f.cpf) != ''
  AND normalize_cpf_cnpj(f.cpf) IS NOT NULL
);

-- 11. Migrar dados de vendedoras para fornecedores
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