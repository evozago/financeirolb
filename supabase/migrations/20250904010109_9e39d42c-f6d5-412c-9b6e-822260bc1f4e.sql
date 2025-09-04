-- Corrigir triggers duplicados e continuar refinamento do sistema
-- Remover triggers existentes que podem estar causando conflito

DROP TRIGGER IF EXISTS trigger_papeis_updated_at ON public.papeis;
DROP TRIGGER IF EXISTS trigger_endereco_updated_at ON public.endereco_detalhado;
DROP TRIGGER IF EXISTS trigger_funcionarios_updated_at ON public.funcionarios_detalhes;
DROP TRIGGER IF EXISTS trigger_documentos_updated_at ON public.documentos_fiscais;
DROP TRIGGER IF EXISTS trigger_recorrentes_updated_at ON public.contas_recorrentes;

-- Recriar triggers de updated_at apenas se necessário
CREATE TRIGGER trigger_endereco_updated_at 
  BEFORE UPDATE ON public.endereco_detalhado 
  FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();

CREATE TRIGGER trigger_funcionarios_updated_at 
  BEFORE UPDATE ON public.funcionarios_detalhes 
  FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();

CREATE TRIGGER trigger_documentos_updated_at 
  BEFORE UPDATE ON public.documentos_fiscais 
  FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();

CREATE TRIGGER trigger_recorrentes_updated_at 
  BEFORE UPDATE ON public.contas_recorrentes 
  FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();

-- Continuar com estrutura de vendas e transações
CREATE TABLE IF NOT EXISTS public.vendas_corporativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.entidades_corporativas(id),
  vendedor_id uuid NOT NULL REFERENCES public.entidades_corporativas(id),
  filial_id uuid REFERENCES public.filiais(id),
  numero_venda text,
  data_venda date NOT NULL DEFAULT CURRENT_DATE,
  valor_total numeric(12,2) NOT NULL DEFAULT 0,
  desconto_total numeric(12,2) DEFAULT 0,
  status_venda text DEFAULT 'concluida' CHECK (status_venda IN ('orcamento', 'aprovado', 'concluida', 'cancelada')),
  meio_pagamento text,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Itens de venda
CREATE TABLE IF NOT EXISTS public.itens_venda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id uuid NOT NULL REFERENCES public.vendas_corporativas(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES public.produtos(id),
  sku text,
  descricao text NOT NULL,
  marca_id uuid REFERENCES public.marcas(id),
  quantidade numeric(10,3) NOT NULL DEFAULT 1,
  preco_unitario numeric(10,2) NOT NULL,
  desconto_unitario numeric(10,2) DEFAULT 0,
  valor_total numeric(12,2) NOT NULL,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Refinar tabela de contas a pagar para integrar com nova estrutura
CREATE TABLE IF NOT EXISTS public.contas_pagar_corporativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credor_id uuid NOT NULL REFERENCES public.entidades_corporativas(id),
  categoria_id uuid REFERENCES public.categorias_produtos(id),
  documento_fiscal_id uuid REFERENCES public.documentos_fiscais(id),
  filial_id uuid REFERENCES public.filiais(id),
  numero_documento text,
  numero_nota text,
  data_emissao date NOT NULL,
  data_competencia date,
  valor_total numeric(12,2) NOT NULL,
  descricao text NOT NULL,
  observacoes text,
  origem text DEFAULT 'manual' CHECK (origem IN ('manual', 'nfe', 'recorrente')),
  status text DEFAULT 'aberto' CHECK (status IN ('aberto', 'parcialmente_pago', 'pago', 'cancelado')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Parcelas das contas a pagar (normalizado)
CREATE TABLE IF NOT EXISTS public.parcelas_conta_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_pagar_id uuid NOT NULL REFERENCES public.contas_pagar_corporativas(id) ON DELETE CASCADE,
  numero_parcela integer NOT NULL,
  valor_parcela numeric(12,2) NOT NULL,
  data_vencimento date NOT NULL,
  data_pagamento date,
  valor_pago numeric(12,2),
  juros numeric(12,2) DEFAULT 0,
  multa numeric(12,2) DEFAULT 0,
  desconto numeric(12,2) DEFAULT 0,
  meio_pagamento text,
  conta_bancaria_id uuid REFERENCES public.contas_bancarias(id),
  comprovante_id uuid REFERENCES public.arquivos_sistema(id),
  status text DEFAULT 'a_vencer' CHECK (status IN ('a_vencer', 'vencida', 'paga', 'cancelada')),
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(conta_pagar_id, numero_parcela)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON public.vendas_corporativas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_vendedor ON public.vendas_corporativas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON public.vendas_corporativas(data_venda);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_credor ON public.contas_pagar_corporativas(credor_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_data ON public.contas_pagar_corporativas(data_emissao);
CREATE INDEX IF NOT EXISTS idx_parcelas_vencimento ON public.parcelas_conta_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON public.parcelas_conta_pagar(status);

-- Triggers para timestamps
CREATE TRIGGER trigger_vendas_updated_at 
  BEFORE UPDATE ON public.vendas_corporativas 
  FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();

CREATE TRIGGER trigger_contas_pagar_updated_at 
  BEFORE UPDATE ON public.contas_pagar_corporativas 
  FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();

CREATE TRIGGER trigger_parcelas_updated_at 
  BEFORE UPDATE ON public.parcelas_conta_pagar 
  FOR EACH ROW EXECUTE FUNCTION public.trigger_updated_at();

-- Trigger para atualizar status das parcelas automaticamente
CREATE OR REPLACE FUNCTION public.trigger_atualiza_status_parcela()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualizar status baseado nas datas e pagamento
  IF NEW.data_pagamento IS NOT NULL THEN
    NEW.status = 'paga';
  ELSIF NEW.data_vencimento < CURRENT_DATE AND NEW.data_pagamento IS NULL THEN
    NEW.status = 'vencida';
  ELSE
    NEW.status = 'a_vencer';
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_status_parcela
  BEFORE INSERT OR UPDATE ON public.parcelas_conta_pagar
  FOR EACH ROW EXECUTE FUNCTION public.trigger_atualiza_status_parcela();

-- RLS para novas tabelas
ALTER TABLE public.vendas_corporativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar_corporativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_conta_pagar ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can manage vendas_corporativas" ON public.vendas_corporativas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage itens_venda" ON public.itens_venda FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage contas_pagar_corporativas" ON public.contas_pagar_corporativas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage parcelas_conta_pagar" ON public.parcelas_conta_pagar FOR ALL TO authenticated USING (true) WITH CHECK (true);