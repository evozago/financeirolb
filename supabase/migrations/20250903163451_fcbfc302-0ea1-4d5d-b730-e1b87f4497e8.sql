-- Create unified pessoas table
CREATE TABLE public.pessoas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Data
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  
  -- Classification
  tipo_pessoa TEXT NOT NULL CHECK (tipo_pessoa IN ('pessoa_fisica', 'pessoa_juridica')),
  categorias JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array: ['funcionario', 'vendedora', 'fornecedor']
  
  -- Documents
  cpf TEXT,
  cnpj TEXT,
  rg TEXT,
  inscricao_estadual TEXT,
  
  -- Specific Data (JSONB for flexibility)
  dados_funcionario JSONB DEFAULT '{}'::jsonb,
  dados_vendedora JSONB DEFAULT '{}'::jsonb,
  dados_fornecedor JSONB DEFAULT '{}'::jsonb,
  
  -- Configuration
  cargo_id UUID REFERENCES hr_cargos(id),
  setor_id UUID REFERENCES hr_setores(id),
  filial_id UUID REFERENCES filiais(id),
  
  -- Control
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view pessoas" ON public.pessoas
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert pessoas" ON public.pessoas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update pessoas" ON public.pessoas
  FOR UPDATE USING (true);

CREATE POLICY "Only admins can delete pessoas" ON public.pessoas
  FOR DELETE USING (is_admin());

-- Indexes
CREATE INDEX idx_pessoas_tipo_pessoa ON public.pessoas(tipo_pessoa);
CREATE INDEX idx_pessoas_categorias ON public.pessoas USING GIN(categorias);
CREATE INDEX idx_pessoas_cpf ON public.pessoas(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_pessoas_cnpj ON public.pessoas(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX idx_pessoas_ativo ON public.pessoas(ativo);

-- Update hr_cargos to include setor_id
ALTER TABLE public.hr_cargos ADD COLUMN IF NOT EXISTS setor_id UUID REFERENCES hr_setores(id);

-- Trigger to update setor_id based on cargo_id
CREATE OR REPLACE FUNCTION public.update_pessoa_setor()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cargo_id IS NOT NULL THEN
    SELECT setor_id INTO NEW.setor_id 
    FROM hr_cargos 
    WHERE id = NEW.cargo_id;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pessoa_setor
  BEFORE INSERT OR UPDATE ON public.pessoas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pessoa_setor();

-- Migrate data from funcionarios
INSERT INTO public.pessoas (
  id, nome, email, telefone, endereco, tipo_pessoa, categorias,
  cpf, cargo_id, setor_id, ativo, created_at, updated_at,
  dados_funcionario
)
SELECT 
  id, nome, email, telefone, endereco, 'pessoa_fisica', '["funcionario"]'::jsonb,
  cpf, 
  (SELECT id FROM hr_cargos WHERE nome = f.cargo LIMIT 1),
  (SELECT id FROM hr_setores WHERE nome = f.setor LIMIT 1),
  ativo, created_at, updated_at,
  jsonb_build_object(
    'data_admissao', data_admissao,
    'salario', salario,
    'status_funcionario', status_funcionario,
    'chave_pix', chave_pix,
    'tipo_chave_pix', tipo_chave_pix,
    'valor_transporte_dia', valor_transporte_dia,
    'valor_transporte_total', valor_transporte_total,
    'dias_uteis_mes', dias_uteis_mes
  )
FROM funcionarios f
ON CONFLICT (id) DO NOTHING;

-- Migrate data from vendedoras
INSERT INTO public.pessoas (
  id, nome, email, telefone, tipo_pessoa, categorias,
  ativo, created_at, updated_at, dados_vendedora
)
SELECT 
  id, nome, email, telefone, 'pessoa_fisica', '["vendedora"]'::jsonb,
  ativo, created_at, updated_at,
  jsonb_build_object(
    'meta_mensal', meta_mensal,
    'comissao_padrao', comissao_padrao,
    'comissao_supermeta', comissao_supermeta
  )
FROM vendedoras v
ON CONFLICT (id) DO UPDATE SET
  categorias = pessoas.categorias || '["vendedora"]'::jsonb,
  dados_vendedora = EXCLUDED.dados_vendedora;

-- Migrate data from fornecedores
INSERT INTO public.pessoas (
  id, nome, email, telefone, endereco, tipo_pessoa, categorias,
  cpf, cnpj, filial_id, ativo, created_at, updated_at, dados_fornecedor
)
SELECT 
  id, nome, email, telefone, endereco,
  CASE WHEN cnpj_cpf IS NOT NULL AND length(regexp_replace(cnpj_cpf, '[^0-9]', '', 'g')) = 14 THEN 'pessoa_juridica' ELSE 'pessoa_fisica' END,
  '["fornecedor"]'::jsonb,
  CASE WHEN length(regexp_replace(cnpj_cpf, '[^0-9]', '', 'g')) = 11 THEN cnpj_cpf ELSE NULL END,
  CASE WHEN length(regexp_replace(cnpj_cpf, '[^0-9]', '', 'g')) = 14 THEN cnpj_cpf ELSE NULL END,
  filial_id, ativo, created_at, updated_at,
  jsonb_build_object(
    'categoria_id', categoria_id,
    'representante_nome', representante_nome,
    'representante_telefone', representante_telefone,
    'representante_email', representante_email,
    'contato_representante', contato_representante,
    'telefone_representante', telefone_representante,
    'email_representante', email_representante,
    'data_cadastro', data_cadastro
  )
FROM fornecedores f
ON CONFLICT (id) DO UPDATE SET
  categorias = pessoas.categorias || '["fornecedor"]'::jsonb,
  dados_fornecedor = EXCLUDED.dados_fornecedor,
  cnpj = COALESCE(pessoas.cnpj, EXCLUDED.cnpj),
  cpf = COALESCE(pessoas.cpf, EXCLUDED.cpf);

-- Compatibility views
CREATE OR REPLACE VIEW public.funcionarios AS
SELECT 
  p.id, p.nome, p.email, p.telefone, p.endereco, p.cpf,
  c.nome as cargo,
  s.nome as setor,
  p.ativo, p.created_at, p.updated_at,
  (p.dados_funcionario->>'data_admissao')::date as data_admissao,
  (p.dados_funcionario->>'salario')::numeric as salario,
  COALESCE(p.dados_funcionario->>'status_funcionario', 'ativo') as status_funcionario,
  p.dados_funcionario->>'chave_pix' as chave_pix,
  p.dados_funcionario->>'tipo_chave_pix' as tipo_chave_pix,
  COALESCE((p.dados_funcionario->>'valor_transporte_dia')::numeric, 8.6) as valor_transporte_dia,
  COALESCE((p.dados_funcionario->>'valor_transporte_total')::numeric, 0) as valor_transporte_total,
  COALESCE((p.dados_funcionario->>'dias_uteis_mes')::integer, 22) as dias_uteis_mes
FROM pessoas p
LEFT JOIN hr_cargos c ON p.cargo_id = c.id
LEFT JOIN hr_setores s ON p.setor_id = s.id
WHERE '"funcionario"'::jsonb <@ p.categorias AND p.ativo = true;

CREATE OR REPLACE VIEW public.vendedoras AS
SELECT 
  p.id, p.nome, p.email, p.telefone,
  COALESCE((p.dados_vendedora->>'meta_mensal')::numeric, 0) as meta_mensal,
  COALESCE((p.dados_vendedora->>'comissao_padrao')::numeric, 3.0) as comissao_padrao,
  COALESCE((p.dados_vendedora->>'comissao_supermeta')::numeric, 5.0) as comissao_supermeta,
  p.ativo, p.created_at, p.updated_at
FROM pessoas p
WHERE '"vendedora"'::jsonb <@ p.categorias AND p.ativo = true;

CREATE OR REPLACE VIEW public.fornecedores AS
SELECT 
  p.id, p.nome, p.email, p.telefone, p.endereco,
  COALESCE(p.cnpj, p.cpf) as cnpj_cpf,
  p.filial_id, p.ativo, p.created_at, p.updated_at,
  (p.dados_fornecedor->>'categoria_id')::uuid as categoria_id,
  p.dados_fornecedor->>'representante_nome' as representante_nome,
  p.dados_fornecedor->>'representante_telefone' as representante_telefone,
  p.dados_fornecedor->>'representante_email' as representante_email,
  p.dados_fornecedor->>'contato_representante' as contato_representante,
  p.dados_fornecedor->>'telefone_representante' as telefone_representante,
  p.dados_fornecedor->>'email_representante' as email_representante,
  (p.dados_fornecedor->>'data_cadastro')::timestamptz as data_cadastro
FROM pessoas p
WHERE '"fornecedor"'::jsonb <@ p.categorias AND p.ativo = true;