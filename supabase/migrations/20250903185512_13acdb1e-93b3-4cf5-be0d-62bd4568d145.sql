-- ============================================
-- MIGRAÇÃO PARA ESTRUTURA UNIFICADA DE PESSOAS
-- ============================================

-- 1. CRIAR TABELA DE ENDEREÇOS SEPARADA (Normalização)
CREATE TABLE IF NOT EXISTS public.enderecos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pessoa_id UUID NOT NULL,
  tipo_endereco TEXT NOT NULL DEFAULT 'principal', -- principal, cobranca, entrega, etc
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  pais TEXT DEFAULT 'Brasil',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_enderecos_pessoa FOREIGN KEY (pessoa_id) REFERENCES public.pessoas(id) ON DELETE CASCADE
);

-- 2. CRIAR TABELA DE CONTATOS SEPARADA (Normalização)
CREATE TABLE IF NOT EXISTS public.contatos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pessoa_id UUID NOT NULL,
  tipo_contato TEXT NOT NULL, -- telefone, email, whatsapp, etc
  valor TEXT NOT NULL,
  principal BOOLEAN DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_contatos_pessoa FOREIGN KEY (pessoa_id) REFERENCES public.pessoas(id) ON DELETE CASCADE
);

-- 3. MELHORAR ESTRUTURA DA TABELA PESSOAS
-- Adicionar campos que faltam para unificação completa
ALTER TABLE public.pessoas 
ADD COLUMN IF NOT EXISTS razao_social TEXT,
ADD COLUMN IF NOT EXISTS nome_fantasia TEXT,
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS data_fundacao DATE,
ADD COLUMN IF NOT EXISTS genero TEXT,
ADD COLUMN IF NOT EXISTS estado_civil TEXT,
ADD COLUMN IF NOT EXISTS nacionalidade TEXT DEFAULT 'Brasileira',
ADD COLUMN IF NOT EXISTS profissao TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 4. FUNÇÃO PARA MIGRAR DADOS DE FORNECEDORES PARA PESSOAS
CREATE OR REPLACE FUNCTION migrate_fornecedores_to_pessoas() 
RETURNS INTEGER AS $$
DECLARE
  fornecedor_record RECORD;
  pessoa_id UUID;
  migrated_count INTEGER := 0;
BEGIN
  FOR fornecedor_record IN 
    SELECT * FROM public.fornecedores 
    WHERE ativo = true 
    AND id NOT IN (
      SELECT DISTINCT (dados_fornecedor->>'fornecedor_id')::UUID 
      FROM public.pessoas 
      WHERE dados_fornecedor->>'fornecedor_id' IS NOT NULL
    )
  LOOP
    -- Inserir na tabela pessoas
    INSERT INTO public.pessoas (
      nome,
      email,
      telefone,
      endereco,
      tipo_pessoa,
      categorias,
      cnpj,
      dados_fornecedor,
      filial_id,
      ativo,
      created_at,
      updated_at
    ) VALUES (
      fornecedor_record.nome,
      fornecedor_record.email,
      fornecedor_record.telefone,
      fornecedor_record.endereco,
      CASE 
        WHEN length(replace(fornecedor_record.cnpj_cpf, '.', '')) = 11 THEN 'pessoa_fisica'
        ELSE 'pessoa_juridica'
      END,
      '["fornecedor"]'::jsonb,
      fornecedor_record.cnpj_cpf,
      jsonb_build_object(
        'fornecedor_id', fornecedor_record.id,
        'categoria_id', fornecedor_record.categoria_id,
        'contato_representante', fornecedor_record.contato_representante,
        'telefone_representante', fornecedor_record.telefone_representante,
        'email_representante', fornecedor_record.email_representante,
        'representante_nome', fornecedor_record.representante_nome,
        'representante_telefone', fornecedor_record.representante_telefone,
        'representante_email', fornecedor_record.representante_email,
        'data_cadastro', fornecedor_record.data_cadastro
      ),
      fornecedor_record.filial_id,
      fornecedor_record.ativo,
      fornecedor_record.created_at,
      fornecedor_record.updated_at
    )
    RETURNING id INTO pessoa_id;
    
    -- Migrar contatos se existirem
    IF fornecedor_record.email IS NOT NULL THEN
      INSERT INTO public.contatos (pessoa_id, tipo_contato, valor, principal)
      VALUES (pessoa_id, 'email', fornecedor_record.email, true);
    END IF;
    
    IF fornecedor_record.telefone IS NOT NULL THEN
      INSERT INTO public.contatos (pessoa_id, tipo_contato, valor, principal)
      VALUES (pessoa_id, 'telefone', fornecedor_record.telefone, true);
    END IF;
    
    -- Migrar endereço se existir
    IF fornecedor_record.endereco IS NOT NULL THEN
      INSERT INTO public.enderecos (pessoa_id, tipo_endereco, logradouro)
      VALUES (pessoa_id, 'principal', fornecedor_record.endereco);
    END IF;
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNÇÃO PARA MIGRAR DADOS DE FUNCIONARIOS PARA PESSOAS
CREATE OR REPLACE FUNCTION migrate_funcionarios_to_pessoas() 
RETURNS INTEGER AS $$
DECLARE
  funcionario_record RECORD;
  pessoa_id UUID;
  migrated_count INTEGER := 0;
BEGIN
  FOR funcionario_record IN 
    SELECT * FROM public.funcionarios 
    WHERE ativo = true 
    AND id NOT IN (
      SELECT DISTINCT (dados_funcionario->>'funcionario_id')::UUID 
      FROM public.pessoas 
      WHERE dados_funcionario->>'funcionario_id' IS NOT NULL
    )
  LOOP
    -- Inserir na tabela pessoas
    INSERT INTO public.pessoas (
      nome,
      email,
      telefone,
      endereco,
      tipo_pessoa,
      categorias,
      cpf,
      dados_funcionario,
      ativo,
      created_at,
      updated_at
    ) VALUES (
      funcionario_record.nome,
      funcionario_record.email,
      funcionario_record.telefone,
      funcionario_record.endereco,
      'pessoa_fisica',
      '["funcionario"]'::jsonb,
      funcionario_record.cpf,
      jsonb_build_object(
        'funcionario_id', funcionario_record.id,
        'salario', funcionario_record.salario,
        'dias_uteis_mes', funcionario_record.dias_uteis_mes,
        'valor_transporte_dia', funcionario_record.valor_transporte_dia,
        'valor_transporte_total', funcionario_record.valor_transporte_total,
        'chave_pix', funcionario_record.chave_pix,
        'tipo_chave_pix', funcionario_record.tipo_chave_pix,
        'data_admissao', funcionario_record.data_admissao,
        'cargo', funcionario_record.cargo,
        'setor', funcionario_record.setor,
        'status_funcionario', funcionario_record.status_funcionario
      ),
      funcionario_record.ativo,
      funcionario_record.created_at,
      funcionario_record.updated_at
    )
    RETURNING id INTO pessoa_id;
    
    migrated_count := migrated_count + 1;
  END LOOP;
  
  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;

-- 6. ATUALIZAR RELACIONAMENTOS PARA USAR PESSOAS
-- Criar função para atualizar ap_installments
CREATE OR REPLACE FUNCTION update_ap_installments_relationships()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Atualizar fornecedor_id baseado no nome do fornecedor
  UPDATE public.ap_installments 
  SET fornecedor_id = p.id
  FROM public.pessoas p
  WHERE p.categorias @> '["fornecedor"]'
    AND upper(trim(p.nome)) = upper(trim(ap_installments.fornecedor))
    AND ap_installments.fornecedor_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGERS PARA MANTER SINCRONIZAÇÃO
CREATE OR REPLACE FUNCTION sync_pessoa_contacts() 
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar telefone principal se mudou
  IF NEW.telefone IS DISTINCT FROM OLD.telefone THEN
    UPDATE public.contatos 
    SET valor = NEW.telefone, updated_at = now()
    WHERE pessoa_id = NEW.id 
      AND tipo_contato = 'telefone' 
      AND principal = true;
      
    -- Se não existe, criar
    IF NOT FOUND AND NEW.telefone IS NOT NULL THEN
      INSERT INTO public.contatos (pessoa_id, tipo_contato, valor, principal)
      VALUES (NEW.id, 'telefone', NEW.telefone, true);
    END IF;
  END IF;
  
  -- Atualizar email principal se mudou
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.contatos 
    SET valor = NEW.email, updated_at = now()
    WHERE pessoa_id = NEW.id 
      AND tipo_contato = 'email' 
      AND principal = true;
      
    -- Se não existe, criar
    IF NOT FOUND AND NEW.email IS NOT NULL THEN
      INSERT INTO public.contatos (pessoa_id, tipo_contato, valor, principal)
      VALUES (NEW.id, 'email', NEW.email, true);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_pessoas_categorias ON public.pessoas USING GIN (categorias);
CREATE INDEX IF NOT EXISTS idx_pessoas_tipo_pessoa ON public.pessoas (tipo_pessoa);
CREATE INDEX IF NOT EXISTS idx_pessoas_cpf ON public.pessoas (cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pessoas_cnpj ON public.pessoas (cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pessoas_nome ON public.pessoas (nome);
CREATE INDEX IF NOT EXISTS idx_pessoas_ativo ON public.pessoas (ativo);

CREATE INDEX IF NOT EXISTS idx_contatos_pessoa_tipo ON public.contatos (pessoa_id, tipo_contato);
CREATE INDEX IF NOT EXISTS idx_contatos_principal ON public.contatos (pessoa_id, principal) WHERE principal = true;

CREATE INDEX IF NOT EXISTS idx_enderecos_pessoa ON public.enderecos (pessoa_id);
CREATE INDEX IF NOT EXISTS idx_enderecos_tipo ON public.enderecos (pessoa_id, tipo_endereco);

-- 9. RLS POLICIES
ALTER TABLE public.enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can access enderecos" ON public.enderecos FOR ALL USING (true);
CREATE POLICY "Authenticated users can access contatos" ON public.contatos FOR ALL USING (true);

-- 10. TRIGGERS
CREATE TRIGGER trigger_sync_pessoa_contacts 
  AFTER UPDATE OF telefone, email ON public.pessoas
  FOR EACH ROW EXECUTE FUNCTION sync_pessoa_contacts();

CREATE TRIGGER update_pessoas_updated_at
  BEFORE UPDATE ON public.pessoas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enderecos_updated_at
  BEFORE UPDATE ON public.enderecos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contatos_updated_at
  BEFORE UPDATE ON public.contatos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. VIEWS DE COMPATIBILIDADE ATUALIZADAS
CREATE OR REPLACE VIEW public.fornecedores_unified AS
SELECT 
  p.id,
  p.nome,
  p.cnpj as cnpj_cpf,
  c_email.valor as email,
  c_tel.valor as telefone,
  e.logradouro as endereco,
  p.ativo,
  p.created_at,
  p.updated_at,
  (p.dados_fornecedor->>'data_cadastro')::timestamp with time zone as data_cadastro,
  (p.dados_fornecedor->>'categoria_id')::uuid as categoria_id,
  p.dados_fornecedor->>'contato_representante' as contato_representante,
  p.dados_fornecedor->>'telefone_representante' as telefone_representante,
  p.dados_fornecedor->>'email_representante' as email_representante,
  p.dados_fornecedor->>'representante_nome' as representante_nome,
  p.dados_fornecedor->>'representante_telefone' as representante_telefone,
  p.dados_fornecedor->>'representante_email' as representante_email,
  p.filial_id
FROM public.pessoas p
LEFT JOIN public.contatos c_email ON p.id = c_email.pessoa_id AND c_email.tipo_contato = 'email' AND c_email.principal = true
LEFT JOIN public.contatos c_tel ON p.id = c_tel.pessoa_id AND c_tel.tipo_contato = 'telefone' AND c_tel.principal = true
LEFT JOIN public.enderecos e ON p.id = e.pessoa_id AND e.tipo_endereco = 'principal'
WHERE p.categorias @> '["fornecedor"]';

CREATE OR REPLACE VIEW public.funcionarios_unified AS
SELECT 
  p.id,
  p.nome,
  p.cpf,
  c_email.valor as email,
  c_tel.valor as telefone,
  e.logradouro as endereco,
  (p.dados_funcionario->>'salario')::numeric as salario,
  (p.dados_funcionario->>'dias_uteis_mes')::integer as dias_uteis_mes,
  (p.dados_funcionario->>'valor_transporte_dia')::numeric as valor_transporte_dia,
  (p.dados_funcionario->>'valor_transporte_total')::numeric as valor_transporte_total,
  p.ativo,
  p.created_at,
  p.updated_at,
  p.dados_funcionario->>'chave_pix' as chave_pix,
  p.dados_funcionario->>'tipo_chave_pix' as tipo_chave_pix,
  (p.dados_funcionario->>'data_admissao')::date as data_admissao,
  p.dados_funcionario->>'cargo' as cargo,
  p.dados_funcionario->>'setor' as setor,
  p.dados_funcionario->>'status_funcionario' as status_funcionario,
  p.cargo_id,
  p.setor_id
FROM public.pessoas p
LEFT JOIN public.contatos c_email ON p.id = c_email.pessoa_id AND c_email.tipo_contato = 'email' AND c_email.principal = true
LEFT JOIN public.contatos c_tel ON p.id = c_tel.pessoa_id AND c_tel.tipo_contato = 'telefone' AND c_tel.principal = true
LEFT JOIN public.enderecos e ON p.id = e.pessoa_id AND e.tipo_endereco = 'principal'
WHERE p.categorias @> '["funcionario"]';