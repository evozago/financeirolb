-- 1. Corrigir dados inconsistentes na tabela fornecedores antes da migração
UPDATE fornecedores 
SET tipo_pessoa = 'pessoa_juridica' 
WHERE tipo_pessoa = 'juridica';

UPDATE fornecedores 
SET tipo_pessoa = 'pessoa_fisica' 
WHERE tipo_pessoa = 'fisica';

-- Definir valores padrão para registros sem tipo_pessoa
UPDATE fornecedores 
SET tipo_pessoa = 'pessoa_juridica' 
WHERE tipo_pessoa IS NULL OR tipo_pessoa = '';

-- 2. Remover constraint existente se houver
ALTER TABLE fornecedores DROP CONSTRAINT IF EXISTS fornecedores_tipo_pessoa_check;

-- 3. Adicionar novamente o constraint correto
ALTER TABLE fornecedores 
ADD CONSTRAINT fornecedores_tipo_pessoa_check 
CHECK (tipo_pessoa IN ('pessoa_fisica', 'pessoa_juridica'));