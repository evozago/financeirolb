-- 15. Corrigir constraints das tabelas antes da migração
ALTER TABLE entidades_corporativas DROP CONSTRAINT IF EXISTS entidades_corporativas_tipo_pessoa_check;
ALTER TABLE fornecedores DROP CONSTRAINT IF EXISTS fornecedores_tipo_pessoa_check;

-- 16. Corrigir dados inconsistentes na tabela entidades_corporativas
UPDATE entidades_corporativas 
SET tipo_pessoa = 'pessoa_juridica' 
WHERE tipo_pessoa IN ('juridica', '');

UPDATE entidades_corporativas 
SET tipo_pessoa = 'pessoa_fisica' 
WHERE tipo_pessoa = 'fisica';

-- Definir valores padrão para registros sem tipo_pessoa
UPDATE entidades_corporativas 
SET tipo_pessoa = 'pessoa_juridica' 
WHERE tipo_pessoa IS NULL;

-- 17. Recriar constraints com os valores corretos
ALTER TABLE entidades_corporativas 
ADD CONSTRAINT entidades_corporativas_tipo_pessoa_check 
CHECK (tipo_pessoa IN ('pessoa_fisica', 'pessoa_juridica'));

ALTER TABLE fornecedores 
ADD CONSTRAINT fornecedores_tipo_pessoa_check 
CHECK (tipo_pessoa IN ('pessoa_fisica', 'pessoa_juridica'));