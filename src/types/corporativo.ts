// Tipos TypeScript para a estrutura corporativa

export interface Papel {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface EntidadeCorporativa {
  id: string;
  tipo_pessoa: 'pessoa_fisica' | 'pessoa_juridica';
  nome_razao_social: string;
  nome_fantasia?: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  inscricao_estadual?: string;
  data_nascimento?: string;
  data_fundacao?: string;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  papeis?: string[]; // Array de nomes dos papéis
}

export interface EntidadePapel {
  id: string;
  entidade_id: string;
  papel_id: string;
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
  observacoes?: string;
  created_at: string;
}

export interface ContaPagarCorporativa {
  id: string;
  credor_id: string;
  descricao: string;
  numero_documento?: string;
  numero_nota?: string;
  categoria_id?: string;
  data_emissao: string;
  data_competencia?: string;
  valor_total: number;
  filial_id?: string;
  documento_fiscal_id?: string;
  observacoes?: string;
  status: 'aberto' | 'parcialmente_pago' | 'pago' | 'cancelado';
  origem: 'manual' | 'importacao' | 'recorrente';
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relacionamentos
  credor?: EntidadeCorporativa;
  categoria?: { id: string; nome: string; };
  filial?: { id: string; nome: string; };
  parcelas?: ParcelaContaPagar[];
}

export interface ParcelaContaPagar {
  id: string;
  conta_pagar_id: string;
  numero_parcela: number;
  total_parcelas: number;
  valor_parcela: number;
  valor_pago: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'a_vencer' | 'vencida' | 'paga' | 'cancelada';
  juros?: number;
  multa?: number;
  desconto?: number;
  meio_pagamento?: string;
  forma_pagamento?: string;
  conta_bancaria_id?: string;
  comprovante_id?: string;
  comprovante_path?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  conta_pagar?: ContaPagarCorporativa;
  conta_bancaria?: { id: string; nome_banco: string; };
}

// View para BI
export interface FatoParcelas {
  id: string;
  conta_pagar_id: string;
  credor_id: string;
  credor_nome: string;
  credor_documento?: string;
  conta_descricao: string;
  numero_documento?: string;
  categoria?: string;
  filial?: string;
  numero_parcela: number;
  total_parcelas: number;
  valor_parcela: number;
  valor_pago: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: string;
  forma_pagamento?: string;
  banco_pagamento?: string;
  status_formatado: 'Pago' | 'Vencido' | 'A Vencer';
  ano_vencimento: number;
  mes_vencimento: number;
  juros: number;
  multa: number;
  desconto: number;
  created_at: string;
  updated_at: string;
}

export interface DimEntidade {
  id: string;
  tipo_pessoa: 'pessoa_fisica' | 'pessoa_juridica';
  nome_razao_social: string;
  nome_fantasia?: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  papeis: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Filtros para consultas
export interface FiltrosParcelasCorporativas {
  status?: string[];
  credor_id?: string;
  filial_id?: string;
  categoria_id?: string;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
  search?: string;
}

// Dados para criação de conta a pagar
export interface NovaContaPagar {
  credor_id: string;
  descricao: string;
  numero_documento?: string;
  categoria_id?: string;
  data_emissao: string;
  valor_total: number;
  filial_id?: string;
  observacoes?: string;
  parcelas: {
    numero_parcela: number;
    valor_parcela: number;
    data_vencimento: string;
  }[];
}

// Dados para pagamento de parcela
export interface PagamentoParcela {
  parcela_id: string;
  valor_pago: number;
  data_pagamento: string;
  meio_pagamento?: string;
  conta_bancaria_id?: string;
  juros?: number;
  multa?: number;
  desconto?: number;
  observacoes?: string;
}

export type StatusParcela = 'a_vencer' | 'vencida' | 'paga' | 'cancelada';
export type StatusContaPagar = 'aberto' | 'parcialmente_pago' | 'pago' | 'cancelado';
export type TipoPessoa = 'pessoa_fisica' | 'pessoa_juridica';