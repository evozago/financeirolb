-- Primeiro, vamos adicionar apenas as colunas que faltam na tabela fornecedores
-- sem criar triggers ou funções que podem estar causando erro

-- Adicionar colunas uma por vez para evitar conflitos
ALTER TABLE public.fornecedores 
ADD COLUMN IF NOT EXISTS email_normalizado TEXT;

-- Verificar se cpf_cnpj_normalizado existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fornecedores' 
                   AND column_name = 'cpf_cnpj_normalizado') THEN
        ALTER TABLE public.fornecedores ADD COLUMN cpf_cnpj_normalizado TEXT;
    END IF;
END $$;

-- Adicionar campo categorias se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fornecedores' 
                   AND column_name = 'categorias') THEN
        ALTER TABLE public.fornecedores ADD COLUMN categorias JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;