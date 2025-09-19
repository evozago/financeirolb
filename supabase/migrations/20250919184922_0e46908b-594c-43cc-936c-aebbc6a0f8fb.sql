-- 1. Primeiro, adicionar as novas colunas à tabela fornecedores
ALTER TABLE fornecedores 
ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT DEFAULT 'pessoa_juridica';

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