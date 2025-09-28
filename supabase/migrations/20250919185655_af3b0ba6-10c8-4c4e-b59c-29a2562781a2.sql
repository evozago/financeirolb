-- 18. Migrar dados de entidades_corporativas para fornecedores (agora sem constraint)
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
  WHERE UPPER(TRIM(f.nome)) = UPPER(TRIM(ec.nome_razao_social))
);

-- 19. Atualizar campos normalizados para todos os registros
UPDATE fornecedores SET 
  cpf_cnpj_normalizado = normalize_cpf_cnpj(
    CASE 
      WHEN tipo_pessoa = 'pessoa_fisica' THEN cpf 
      ELSE cnpj_cpf 
    END
  )
WHERE cpf_cnpj_normalizado IS NULL;