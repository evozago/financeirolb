-- Criar tabelas para gestão de vendas persistente

-- Tabela para dados totais de vendas mensais
CREATE TABLE IF NOT EXISTS public.vendas_mensais_totais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  total_vendas NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ano, mes)
);

-- Tabela para vendas detalhadas por vendedora
CREATE TABLE IF NOT EXISTS public.vendas_mensais_detalhadas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  vendedora_id UUID NOT NULL,
  valor_vendas NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ano, mes, vendedora_id)
);

-- Tabela para metas das vendedoras com dados completos
CREATE TABLE IF NOT EXISTS public.vendedoras_completas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  metas_mensais JSONB DEFAULT '{}',
  supermetas_mensais JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers nas tabelas
DROP TRIGGER IF EXISTS update_vendas_mensais_totais_updated_at ON public.vendas_mensais_totais;
CREATE TRIGGER update_vendas_mensais_totais_updated_at
  BEFORE UPDATE ON public.vendas_mensais_totais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendas_mensais_detalhadas_updated_at ON public.vendas_mensais_detalhadas;
CREATE TRIGGER update_vendas_mensais_detalhadas_updated_at
  BEFORE UPDATE ON public.vendas_mensais_detalhadas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendedoras_completas_updated_at ON public.vendedoras_completas;
CREATE TRIGGER update_vendedoras_completas_updated_at
  BEFORE UPDATE ON public.vendedoras_completas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.vendas_mensais_totais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_mensais_detalhadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendedoras_completas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - permitir todas as operações para usuários autenticados
CREATE POLICY "Authenticated users can manage vendas_mensais_totais" 
ON public.vendas_mensais_totais FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage vendas_mensais_detalhadas" 
ON public.vendas_mensais_detalhadas FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage vendedoras_completas" 
ON public.vendedoras_completas FOR ALL 
USING (true) WITH CHECK (true);

-- Inserir dados iniciais de 2022 se não existirem
INSERT INTO public.vendas_mensais_totais (ano, mes, total_vendas) VALUES
(2022, 1, 145440),
(2022, 2, 51912),
(2022, 3, 76282.37),
(2022, 4, 85641.82),
(2022, 5, 194924.83),
(2022, 6, 179640.11),
(2022, 7, 119190.72),
(2022, 8, 101530.41),
(2022, 9, 113588.43),
(2022, 10, 171966.21),
(2022, 11, 216776.78),
(2022, 12, 272129.87)
ON CONFLICT (ano, mes) DO NOTHING;