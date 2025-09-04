-- Refinamento completo do sistema corporativo lui-bambini-finance
-- Fase 1: Estrutura de dados normalizada

-- Função para normalizar CPF/CNPJ (apenas dígitos)
CREATE OR REPLACE FUNCTION public.normaliza_cpf_cnpj(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN regexp_replace(input_text, '[^0-9]', '', 'g');
END;
$$;

-- Função para normalizar email (lowercase + trim)
CREATE OR REPLACE FUNCTION public.normaliza_email(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN lower(trim(input_text));
END;
$$;

-- Tabela de papéis das entidades
CREATE TABLE IF NOT EXISTS public.papeis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir papéis padrão
INSERT INTO public.papeis (nome, descricao) VALUES
  ('Cliente', 'Pessoa que compra produtos/serviços'),
  ('Fornecedor', 'Pessoa que fornece produtos/serviços'),
  ('Funcionario', 'Funcionário da empresa'),
  ('Vendedor', 'Responsável por vendas'),
  ('Representante', 'Representante comercial')
ON CONFLICT (nome) DO NOTHING;

-- Tabela central de entidades (PF/PJ unificado)
CREATE TABLE IF NOT EXISTS public.entidades_corporativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_pessoa text NOT NULL CHECK (tipo_pessoa IN ('fisica', 'juridica')),
  nome_razao_social text NOT NULL,
  nome_fantasia text,
  cpf_cnpj text,
  cpf_cnpj_normalizado text UNIQUE,
  email text,
  email_normalizado text UNIQUE,
  telefone text,
  inscricao_estadual text,
  rg text,
  data_nascimento date,
  data_fundacao date,
  nacionalidade text DEFAULT 'Brasileira',
  profissao text,
  estado_civil text,
  genero text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Índices e constraints para entidades_corporativas
CREATE INDEX IF NOT EXISTS idx_entidades_corporativas_nome ON public.entidades_corporativas(nome_razao_social);
CREATE INDEX IF NOT EXISTS idx_entidades_corporativas_cpf_cnpj ON public.entidades_corporativas(cpf_cnpj_normalizado);
CREATE INDEX IF NOT EXISTS idx_entidades_corporativas_email ON public.entidades_corporativas(email_normalizado);
CREATE INDEX IF NOT EXISTS idx_entidades_corporativas_tipo ON public.entidades_corporativas(tipo_pessoa);

-- Tabela de relacionamento N:N entre entidades e papéis
CREATE TABLE IF NOT EXISTS public.entidade_papeis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_id uuid NOT NULL REFERENCES public.entidades_corporativas(id) ON DELETE CASCADE,
  papel_id uuid NOT NULL REFERENCES public.papeis(id) ON DELETE CASCADE,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  ativo boolean NOT NULL DEFAULT true,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(entidade_id, papel_id)
);

-- Tabela de endereços separada
CREATE TABLE IF NOT EXISTS public.endereco_detalhado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text CHECK (length(uf) = 2),
  cep text,
  pais text DEFAULT 'Brasil',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Relacionamento N:N entre entidades e endereços
CREATE TABLE IF NOT EXISTS public.entidade_enderecos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_id uuid NOT NULL REFERENCES public.entidades_corporativas(id) ON DELETE CASCADE,
  endereco_id uuid NOT NULL REFERENCES public.endereco_detalhado(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('cobranca', 'entrega', 'fiscal', 'residencial', 'comercial')),
  principal boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(entidade_id, endereco_id, tipo)
);

-- Detalhes específicos de funcionários
CREATE TABLE IF NOT EXISTS public.funcionarios_detalhes (
  id uuid PRIMARY KEY,
  entidade_id uuid NOT NULL REFERENCES public.entidades_corporativas(id) ON DELETE CASCADE,
  cargo_id uuid REFERENCES public.hr_cargos(id),
  setor_id uuid REFERENCES public.hr_setores(id),
  filial_id uuid REFERENCES public.filiais(id),
  salario_base numeric(10,2) DEFAULT 0,
  data_admissao date,
  data_demissao date,
  status_funcionario text DEFAULT 'ativo' CHECK (status_funcionario IN ('ativo', 'inativo', 'afastado', 'demitido')),
  chave_pix text,
  tipo_chave_pix text,
  dias_uteis_mes integer DEFAULT 22,
  valor_transporte_dia numeric(5,2) DEFAULT 0,
  valor_transporte_total numeric(7,2) DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de arquivos com hash único
CREATE TABLE IF NOT EXISTS public.arquivos_sistema (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_original text NOT NULL,
  nome_arquivo text NOT NULL,
  mime_type text NOT NULL,
  sha256_hash text NOT NULL UNIQUE,
  tamanho_bytes bigint NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Documentos fiscais com chave NFe única
CREATE TABLE IF NOT EXISTS public.documentos_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_documento text NOT NULL CHECK (tipo_documento IN ('NFe', 'NFSe', 'NFCe', 'CTe')),
  chave_nfe text NOT NULL UNIQUE,
  numero_documento text NOT NULL,
  serie text NOT NULL,
  emitente_id uuid NOT NULL REFERENCES public.entidades_corporativas(id),
  destinatario_id uuid REFERENCES public.entidades_corporativas(id),
  data_emissao date NOT NULL,
  data_entrada date,
  valor_total numeric(12,2) NOT NULL,
  valor_icms numeric(12,2) DEFAULT 0,
  valor_ipi numeric(12,2) DEFAULT 0,
  valor_pis numeric(12,2) DEFAULT 0,
  valor_cofins numeric(12,2) DEFAULT 0,
  arquivo_xml_id uuid REFERENCES public.arquivos_sistema(id),
  arquivo_pdf_id uuid REFERENCES public.arquivos_sistema(id),
  situacao text DEFAULT 'processado' CHECK (situacao IN ('processado', 'cancelado', 'inutilizado')),
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Contas recorrentes (templates para geração automática)
CREATE TABLE IF NOT EXISTS public.contas_recorrentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  credor_id uuid NOT NULL REFERENCES public.entidades_corporativas(id),
  categoria_id uuid REFERENCES public.categorias_produtos(id),
  filial_id uuid REFERENCES public.filiais(id),
  periodicidade text NOT NULL CHECK (periodicidade IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual')),
  dia_base integer NOT NULL CHECK (dia_base BETWEEN 1 AND 31),
  valor_padrao numeric(12,2) NOT NULL,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  proxima_geracao date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Triggers para normalização automática
CREATE OR REPLACE FUNCTION public.trigger_normaliza_entidade()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalizar CPF/CNPJ
  IF NEW.cpf_cnpj IS NOT NULL THEN
    NEW.cpf_cnpj_normalizado = normaliza_cpf_cnpj(NEW.cpf_cnpj);
  END IF;
  
  -- Normalizar email
  IF NEW.email IS NOT NULL THEN
    NEW.email_normalizado = normaliza_email(NEW.email);
  END IF;
  
  -- Atualizar timestamp
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_normaliza_entidades ON public.entidades_corporativas;
CREATE TRIGGER trigger_normaliza_entidades
  BEFORE INSERT OR UPDATE ON public.entidades_corporativas
  FOR EACH ROW EXECUTE FUNCTION public.trigger_normaliza_entidade();

-- Trigger para updated_at em outras tabelas
CREATE OR REPLACE FUNCTION public.trigger_updated_at()
RETURNS trigger
LANGUAGE plpgsql  
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Aplicar triggers de updated_at
CREATE TRIGGER trigger_papeis_updated_at BEFORE UPDATE ON public.papeis FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();
CREATE TRIGGER trigger_endereco_updated_at BEFORE UPDATE ON public.endereco_detalhado FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();
CREATE TRIGGER trigger_funcionarios_updated_at BEFORE UPDATE ON public.funcionarios_detalhes FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();
CREATE TRIGGER trigger_documentos_updated_at BEFORE UPDATE ON public.documentos_fiscais FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();
CREATE TRIGGER trigger_recorrentes_updated_at BEFORE UPDATE ON public.contas_recorrentes FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.entidades_corporativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidade_papeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endereco_detalhado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidade_enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios_detalhes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arquivos_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_recorrentes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (usuários autenticados podem acessar)
CREATE POLICY "Authenticated users can manage entidades_corporativas" ON public.entidades_corporativas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can view papeis" ON public.papeis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage entidade_papeis" ON public.entidade_papeis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage endereco_detalhado" ON public.endereco_detalhado FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage entidade_enderecos" ON public.entidade_enderecos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage funcionarios_detalhes" ON public.funcionarios_detalhes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage arquivos_sistema" ON public.arquivos_sistema FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage documentos_fiscais" ON public.documentos_fiscais FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage contas_recorrentes" ON public.contas_recorrentes FOR ALL TO authenticated USING (true) WITH CHECK (true);