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
  
  -- Outras categorias (usando jsonb para flexibilidade)
  categorias JSONB DEFAULT '[]'::jsonb,
  eh_fornecedor BOOLEAN DEFAULT false
);

-- Adicionar campos faltantes na tabela fornecedores para garantir paridade
-- Verificar se existem e adicionar apenas os que não existem

-- Adicionar campo categorias em formato jsonb se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fornecedores' 
                 AND column_name = 'categorias') THEN
    ALTER TABLE public.fornecedores ADD COLUMN categorias JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Garantir que fornecedores tem campo email_normalizado
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'fornecedores' 
                 AND column_name = 'email_normalizado') THEN
    ALTER TABLE public.fornecedores ADD COLUMN email_normalizado TEXT;
  END IF;
END $$;

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_pessoas_cpf_normalizado ON public.pessoas(cpf_cnpj_normalizado);
CREATE INDEX IF NOT EXISTS idx_pessoas_tipo_pessoa ON public.pessoas(tipo_pessoa);
CREATE INDEX IF NOT EXISTS idx_pessoas_categorias ON public.pessoas USING GIN(categorias);
CREATE INDEX IF NOT EXISTS idx_pessoas_nome ON public.pessoas(nome);
CREATE INDEX IF NOT EXISTS idx_pessoas_email ON public.pessoas(email);

CREATE INDEX IF NOT EXISTS idx_fornecedores_categorias ON public.fornecedores USING GIN(categorias);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cpf_cnpj_normalizado ON public.fornecedores(cpf_cnpj_normalizado);

-- Trigger para atualizar updated_at em pessoas
CREATE OR REPLACE FUNCTION update_pessoas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pessoas_updated_at
  BEFORE UPDATE ON public.pessoas
  FOR EACH ROW
  EXECUTE FUNCTION update_pessoas_updated_at();

-- Trigger para normalizar CPF em pessoas
CREATE OR REPLACE FUNCTION update_pessoas_cpf_cnpj_normalized()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalizar CPF se pessoa física
  IF NEW.cpf IS NOT NULL THEN
    NEW.cpf_cnpj_normalizado := regexp_replace(NEW.cpf, '[^0-9]', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pessoas_normalize_cpf
  BEFORE INSERT OR UPDATE ON public.pessoas
  FOR EACH ROW
  EXECUTE FUNCTION update_pessoas_cpf_cnpj_normalized();

-- Habilitar RLS na tabela pessoas
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para pessoas (similar às de fornecedores)
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