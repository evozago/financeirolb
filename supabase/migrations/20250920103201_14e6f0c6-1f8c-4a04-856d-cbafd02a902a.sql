-- Criar tabela pessoas para pessoas físicas
CREATE TABLE IF NOT EXISTS public.pessoas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Dados pessoais básicos
  nome TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  
  -- Dados específicos de pessoa física
  data_nascimento DATE,
  nacionalidade TEXT DEFAULT 'Brasileira',
  profissao TEXT,
  genero TEXT,
  estado_civil TEXT,
  
  -- Campos de sistema
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Relacionamentos
  categoria_id UUID,
  filial_id UUID,
  
  -- Dados funcionário
  eh_funcionario BOOLEAN DEFAULT false,
  cargo_id UUID,
  setor_id UUID,
  salario NUMERIC DEFAULT 0,
  data_admissao DATE,
  data_demissao DATE,
  dias_uteis_mes INTEGER DEFAULT 22,
  valor_transporte_dia NUMERIC DEFAULT 8.6,
  valor_transporte_total NUMERIC DEFAULT 0,
  status_funcionario TEXT DEFAULT 'ativo',
  
  -- Dados vendedora
  eh_vendedora BOOLEAN DEFAULT false,
  meta_mensal NUMERIC DEFAULT 0,
  comissao_padrao NUMERIC DEFAULT 3.0,
  comissao_supermeta NUMERIC DEFAULT 5.0,
  
  -- Dados financeiros
  chave_pix TEXT,
  tipo_chave_pix TEXT,
  
  -- Campos de controle e normalização
  cpf_cnpj_normalizado TEXT,
  tipo_pessoa TEXT NOT NULL DEFAULT 'pessoa_fisica',
  email_normalizado TEXT,
  
  -- Categorias usando jsonb para flexibilidade
  categorias JSONB DEFAULT '[]'::jsonb,
  eh_fornecedor BOOLEAN DEFAULT false
);

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_pessoas_cpf_normalizado ON public.pessoas(cpf_cnpj_normalizado);
CREATE INDEX IF NOT EXISTS idx_pessoas_tipo_pessoa ON public.pessoas(tipo_pessoa);
CREATE INDEX IF NOT EXISTS idx_pessoas_categorias ON public.pessoas USING GIN(categorias);
CREATE INDEX IF NOT EXISTS idx_pessoas_nome ON public.pessoas(nome);
CREATE INDEX IF NOT EXISTS idx_pessoas_email ON public.pessoas(email);

-- Criar índice para categorias em fornecedores também
CREATE INDEX IF NOT EXISTS idx_fornecedores_categorias ON public.fornecedores USING GIN(categorias);

-- Habilitar RLS na tabela pessoas
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para pessoas
CREATE POLICY "Authenticated users can select pessoas"
  ON public.pessoas FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pessoas"
  ON public.pessoas FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pessoas"
  ON public.pessoas FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete pessoas"
  ON public.pessoas FOR DELETE 
  TO authenticated
  USING (true);