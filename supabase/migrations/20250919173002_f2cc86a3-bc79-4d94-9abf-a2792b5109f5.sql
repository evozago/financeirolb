-- Migração para unificar modelo de dados e normalizar entidades
-- 1. Verificar e atualizar estrutura de entidades_corporativas

-- Adicionar campos faltantes se não existirem
DO $$ 
BEGIN
    -- Adicionar campos de normalização se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entidades_corporativas' AND column_name = 'telefone_normalizado') THEN
        ALTER TABLE entidades_corporativas ADD COLUMN telefone_normalizado text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entidades_corporativas' AND column_name = 'nome_normalizado') THEN
        ALTER TABLE entidades_corporativas ADD COLUMN nome_normalizado text;
    END IF;
END $$;

-- 2. Função para normalização de dados
CREATE OR REPLACE FUNCTION norm_text(input_text text)
RETURNS text AS $$
BEGIN
    RETURN upper(trim(regexp_replace(coalesce(input_text, ''), '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION norm_phone(phone_text text)
RETURNS text AS $$
BEGIN
    RETURN nullif(regexp_replace(coalesce(phone_text, ''), '\D', '', 'g'), '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION norm_document(doc_text text)
RETURNS text AS $$
BEGIN
    RETURN nullif(regexp_replace(coalesce(doc_text, ''), '\D', '', 'g'), '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION norm_email(email_text text)
RETURNS text AS $$
BEGIN
    RETURN lower(trim(coalesce(email_text, '')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Trigger para manter campos normalizados atualizados
CREATE OR REPLACE FUNCTION sync_normalized_fields()
RETURNS trigger AS $$
BEGIN
    NEW.cpf_cnpj_normalizado := norm_document(NEW.cpf_cnpj);
    NEW.email_normalizado := norm_email(NEW.email);
    NEW.telefone_normalizado := norm_phone(NEW.telefone);
    NEW.nome_normalizado := norm_text(NEW.nome_razao_social);
    
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trg_sync_normalized_fields ON entidades_corporativas;
CREATE TRIGGER trg_sync_normalized_fields
    BEFORE INSERT OR UPDATE ON entidades_corporativas
    FOR EACH ROW EXECUTE FUNCTION sync_normalized_fields();

-- 4. Atualizar dados existentes com campos normalizados
UPDATE entidades_corporativas SET 
    cpf_cnpj_normalizado = norm_document(cpf_cnpj),
    email_normalizado = norm_email(email),
    telefone_normalizado = norm_phone(telefone),
    nome_normalizado = norm_text(nome_razao_social);

-- 5. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_entidades_corporativas_cpf_cnpj_norm 
    ON entidades_corporativas (cpf_cnpj_normalizado) WHERE cpf_cnpj_normalizado IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entidades_corporativas_email_norm 
    ON entidades_corporativas (email_normalizado) WHERE email_normalizado IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entidades_corporativas_telefone_norm 
    ON entidades_corporativas (telefone_normalizado) WHERE telefone_normalizado IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entidades_corporativas_nome_norm 
    ON entidades_corporativas (nome_normalizado);

CREATE INDEX IF NOT EXISTS idx_entidades_corporativas_tipo_ativo 
    ON entidades_corporativas (tipo_pessoa, ativo);

-- Índices para papéis
CREATE INDEX IF NOT EXISTS idx_entidade_papeis_entidade_ativo 
    ON entidade_papeis (entidade_id, ativo);

CREATE INDEX IF NOT EXISTS idx_entidade_papeis_papel_ativo 
    ON entidade_papeis (papel_id, ativo);

-- 6. Migrar vendedoras para entidades_corporativas
INSERT INTO entidades_corporativas (
    tipo_pessoa,
    nome_razao_social,
    cpf_cnpj,
    email,
    telefone,
    observacoes,
    ativo,
    created_at,
    updated_at
)
SELECT DISTINCT
    'pessoa_fisica',
    v.nome,
    v.cpf,
    v.email,
    v.telefone,
    'Migrado de vendedoras em ' || now(),
    v.ativo,
    COALESCE(v.created_at, now()),
    COALESCE(v.updated_at, now())
FROM vendedoras v
WHERE v.id NOT IN (
    SELECT DISTINCT source_id::uuid 
    FROM entidades_corporativas ec 
    WHERE ec.observacoes LIKE '%Migrado de vendedoras%'
    AND source_id IS NOT NULL
);

-- 7. Adicionar campo source_id para rastrear origem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entidades_corporativas' AND column_name = 'source_id') THEN
        ALTER TABLE entidades_corporativas ADD COLUMN source_id text;
    END IF;
END $$;

-- Atualizar com source_id das vendedoras migradas
UPDATE entidades_corporativas ec
SET source_id = v.id::text
FROM vendedoras v
WHERE ec.observacoes LIKE '%Migrado de vendedoras%'
    AND norm_text(ec.nome_razao_social) = norm_text(v.nome)
    AND ec.source_id IS NULL;

-- 8. Associar papel de vendedor às vendedoras migradas
INSERT INTO entidade_papeis (entidade_id, papel_id, data_inicio, ativo)
SELECT 
    ec.id,
    p.id,
    CURRENT_DATE,
    true
FROM entidades_corporativas ec
CROSS JOIN papeis p
WHERE p.nome = 'vendedor'
    AND ec.observacoes LIKE '%Migrado de vendedoras%'
    AND NOT EXISTS (
        SELECT 1 FROM entidade_papeis ep
        WHERE ep.entidade_id = ec.id AND ep.papel_id = p.id
    );

-- 9. Constraints de integridade
-- Constraint para garantir que não existam duplicatas por documento
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'uq_entidades_corporativas_cpf_cnpj'
    ) THEN
        ALTER TABLE entidades_corporativas 
        ADD CONSTRAINT uq_entidades_corporativas_cpf_cnpj 
        UNIQUE (cpf_cnpj_normalizado);
    END IF;
EXCEPTION WHEN others THEN
    -- Se der erro por duplicatas existentes, vamos identificá-las
    RAISE NOTICE 'Duplicatas encontradas em CPF/CNPJ - necessário limpar dados antes de aplicar constraint';
END;
$$;

-- 10. View unificada para vendedoras
CREATE OR REPLACE VIEW vendedoras_unificadas AS
SELECT 
    ec.id,
    ec.nome_razao_social as nome,
    ec.cpf_cnpj,
    ec.email,
    ec.telefone,
    ec.ativo,
    ec.created_at,
    ec.updated_at,
    v.id as vendedora_original_id
FROM entidades_corporativas ec
JOIN entidade_papeis ep ON ec.id = ep.entidade_id AND ep.ativo = true
JOIN papeis p ON ep.papel_id = p.id AND p.nome = 'vendedor'
LEFT JOIN vendedoras v ON v.id::text = ec.source_id
WHERE ec.ativo = true;

-- 11. Função para buscar entidade por diferentes critérios
CREATE OR REPLACE FUNCTION buscar_entidade(
    p_cpf_cnpj text DEFAULT NULL,
    p_email text DEFAULT NULL,
    p_nome text DEFAULT NULL,
    p_telefone text DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    nome_razao_social text,
    tipo_pessoa text,
    cpf_cnpj text,
    email text,
    telefone text,
    papeis text[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.id,
        ec.nome_razao_social,
        ec.tipo_pessoa,
        ec.cpf_cnpj,
        ec.email,
        ec.telefone,
        array_agg(p.nome) as papeis
    FROM entidades_corporativas ec
    LEFT JOIN entidade_papeis ep ON ec.id = ep.entidade_id AND ep.ativo = true
    LEFT JOIN papeis p ON ep.papel_id = p.id
    WHERE ec.ativo = true
        AND (p_cpf_cnpj IS NULL OR ec.cpf_cnpj_normalizado = norm_document(p_cpf_cnpj))
        AND (p_email IS NULL OR ec.email_normalizado = norm_email(p_email))
        AND (p_nome IS NULL OR ec.nome_normalizado ILIKE '%' || norm_text(p_nome) || '%')
        AND (p_telefone IS NULL OR ec.telefone_normalizado = norm_phone(p_telefone))
    GROUP BY ec.id, ec.nome_razao_social, ec.tipo_pessoa, ec.cpf_cnpj, ec.email, ec.telefone;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;