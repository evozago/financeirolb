-- 12. Migrar dados de pessoas para fornecedores
INSERT INTO fornecedores (
  nome, email, telefone, endereco, tipo_pessoa, cpf, cnpj_cpf,
  eh_funcionario, eh_fornecedor, eh_vendedora,
  ativo, created_at, updated_at
)
SELECT 
  p.nome, p.email, p.telefone, p.endereco, p.tipo_pessoa,
  p.cpf, p.cnpj,
  COALESCE((p.categorias ? 'funcionario'), false)::boolean,
  COALESCE((p.categorias ? 'fornecedor'), false)::boolean,
  COALESCE((p.categorias ? 'vendedora'), false)::boolean,
  p.ativo, p.created_at, p.updated_at
FROM pessoas p
WHERE NOT EXISTS (
  SELECT 1 FROM fornecedores 
  WHERE (
    (p.tipo_pessoa = 'pessoa_fisica' AND p.cpf IS NOT NULL AND normalize_cpf_cnpj(cpf) = normalize_cpf_cnpj(p.cpf) AND normalize_cpf_cnpj(p.cpf) != '') 
    OR 
    (p.tipo_pessoa = 'pessoa_juridica' AND p.cnpj IS NOT NULL AND normalize_cpf_cnpj(cnpj_cpf) = normalize_cpf_cnpj(p.cnpj) AND normalize_cpf_cnpj(p.cnpj) != '')
    OR
    (UPPER(TRIM(nome)) = UPPER(TRIM(p.nome)))
  )
);