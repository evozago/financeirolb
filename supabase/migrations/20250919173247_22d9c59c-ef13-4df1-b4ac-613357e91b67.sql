-- Migração corrigida para unificar modelo de dados
-- 1. Remover funções conflitantes existentes
DROP FUNCTION IF EXISTS norm_phone(text);
DROP FUNCTION IF EXISTS norm_doc(text);
DROP FUNCTION IF EXISTS norm_email(text);

-- 2. Criar funções de normalização atualizadas
CREATE OR REPLACE FUNCTION norm_document(doc_text text)
RETURNS text AS $$
BEGIN
    RETURN nullif(regexp_replace(coalesce(doc_text, ''), '\D', '', 'g'), '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION norm_email_field(email_text text)
RETURNS text AS $$
BEGIN
    RETURN nullif(lower(trim(coalesce(email_text, ''))), '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION norm_phone_field(phone_text text)
RETURNS text AS $$
BEGIN
    RETURN nullif(regexp_replace(coalesce(phone_text, ''), '\D', '', 'g'), '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION norm_text_field(input_text text)
RETURNS text AS $$
BEGIN
    RETURN upper(trim(regexp_replace(coalesce(input_text, ''), '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Adicionar campos de normalização
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entidades_corporativas' AND column_name = 'telefone_normalizado') THEN
        ALTER TABLE entidades_corporativas ADD COLUMN telefone_normalizado text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entidades_corporativas' AND column_name = 'nome_normalizado') THEN
        ALTER TABLE entidades_corporativas ADD COLUMN nome_normalizado text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entidades_corporativas' AND column_name = 'source_id') THEN
        ALTER TABLE entidades_corporativas ADD COLUMN source_id text;
    END IF;
END $$;

-- 4. Trigger para normalização automática
CREATE OR REPLACE FUNCTION sync_normalized_fields()
RETURNS trigger AS $$
BEGIN
    NEW.cpf_cnpj_normalizado := norm_document(NEW.cpf_cnpj);
    NEW.email_normalizado := norm_email_field(NEW.email);
    NEW.telefone_normalizado := norm_phone_field(NEW.telefone);
    NEW.nome_normalizado := norm_text_field(NEW.nome_razao_social);
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente e recriar
DROP TRIGGER IF EXISTS trg_sync_normalized_fields ON entidades_corporativas;
CREATE TRIGGER trg_sync_normalized_fields
    BEFORE INSERT OR UPDATE ON entidades_corporativas
    FOR EACH ROW EXECUTE FUNCTION sync_normalized_fields();

-- 5. Atualizar dados existentes
UPDATE entidades_corporativas SET 
    cpf_cnpj_normalizado = norm_document(cpf_cnpj),
    email_normalizado = norm_email_field(email),
    telefone_normalizado = norm_phone_field(telefone),
    nome_normalizado = norm_text_field(nome_razao_social);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_entidades_corp_cpf_cnpj_norm 
    ON entidades_corporativas (cpf_cnpj_normalizado) WHERE cpf_cnpj_normalizado IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entidades_corp_email_norm 
    ON entidades_corporativas (email_normalizado) WHERE email_normalizado IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entidades_corp_nome_norm 
    ON entidades_corporativas (nome_normalizado);

CREATE INDEX IF NOT EXISTS idx_entidades_corp_tipo_ativo 
    ON entidades_corporativas (tipo_pessoa, ativo);

CREATE INDEX IF NOT EXISTS idx_entidade_papeis_lookup 
    ON entidade_papeis (entidade_id, papel_id, ativo);

-- 7. Migrar vendedoras que ainda não foram migradas
INSERT INTO entidades_corporativas (
    tipo_pessoa,
    nome_razao_social,
    cpf_cnpj,
    email,
    telefone,
    observacoes,
    ativo,
    source_id,
    created_at,
    updated_at
)
SELECT DISTINCT
    'pessoa_fisica',
    v.nome,
    v.cpf,
    v.email,
    v.telefone,
    'Migrado automaticamente de vendedoras',
    v.ativo,
    v.id::text,
    COALESCE(v.created_at, now()),
    COALESCE(v.updated_at, now())
FROM vendedoras v
WHERE NOT EXISTS (
    SELECT 1 FROM entidades_corporativas ec 
    WHERE ec.source_id = v.id::text
);

-- 8. Associar papel de vendedor
INSERT INTO entidade_papeis (entidade_id, papel_id, data_inicio, ativo)
SELECT 
    ec.id,
    p.id,
    CURRENT_DATE,
    true
FROM entidades_corporativas ec
JOIN papeis p ON p.nome = 'vendedor'
WHERE ec.source_id IS NOT NULL 
    AND ec.observacoes LIKE '%vendedoras%'
    AND NOT EXISTS (
        SELECT 1 FROM entidade_papeis ep
        WHERE ep.entidade_id = ec.id AND ep.papel_id = p.id
    );

-- 9. View unificada para vendedoras
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
    ec.source_id as vendedora_original_id
FROM entidades_corporativas ec
JOIN entidade_papeis ep ON ec.id = ep.entidade_id AND ep.ativo = true
JOIN papeis p ON ep.papel_id = p.id AND p.nome = 'vendedor'
WHERE ec.ativo = true;

-- 10. Função para buscar entidades
CREATE OR REPLACE FUNCTION buscar_entidade_unificada(
    p_cpf_cnpj text DEFAULT NULL,
    p_email text DEFAULT NULL,
    p_nome text DEFAULT NULL
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
        COALESCE(array_agg(p.nome) FILTER (WHERE p.nome IS NOT NULL), '{}') as papeis
    FROM entidades_corporativas ec
    LEFT JOIN entidade_papeis ep ON ec.id = ep.entidade_id AND ep.ativo = true
    LEFT JOIN papeis p ON ep.papel_id = p.id
    WHERE ec.ativo = true
        AND (p_cpf_cnpj IS NULL OR ec.cpf_cnpj_normalizado = norm_document(p_cpf_cnpj))
        AND (p_email IS NULL OR ec.email_normalizado = norm_email_field(p_email))
        AND (p_nome IS NULL OR ec.nome_normalizado ILIKE '%' || norm_text_field(p_nome) || '%')
    GROUP BY ec.id, ec.nome_razao_social, ec.tipo_pessoa, ec.cpf_cnpj, ec.email, ec.telefone;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;