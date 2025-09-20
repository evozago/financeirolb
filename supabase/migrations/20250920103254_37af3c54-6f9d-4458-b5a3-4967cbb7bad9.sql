-- Criar tabela pessoas sem a coluna cpf_cnpj_normalizado primeiro
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
  
  -- Campos de controle
  tipo_pessoa TEXT NOT NULL DEFAULT 'pessoa_fisica',
  email_normalizado TEXT,
  
  -- Categorias usando jsonb para flexibilidade
  categorias JSONB DEFAULT '[]'::jsonb,
  eh_fornecedor BOOLEAN DEFAULT false
);

-- Habilitar RLS na tabela pessoas
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS básicas
CREATE POLICY "Authenticated users can access pessoas" ON public.pessoas FOR ALL TO authenticated USING (true) WITH CHECK (true);