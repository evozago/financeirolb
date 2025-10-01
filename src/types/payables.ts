/**
 * Tipos TypeScript para o módulo de Contas a Pagar
 * Define as interfaces e tipos utilizados em todo o sistema
 */

export interface Supplier {
  id: string;
  name: string;
  legalName: string;
  cnpj: string;
  brandId?: string;
  brand?: Brand;
  billsToPay?: BillToPay[];
}

export interface Brand {
  id: string;
  name: string;
  suppliers?: Supplier[];
}

export interface BillToPay {
  id: string;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  createdAt: string;
  updatedAt: string;
  supplierId: string;
  supplier: Supplier;
  userId: string;
  installments: BillToPayInstallment[];
}

export interface BillToPayInstallment {
  id: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: 'Pendente' | 'Pago' | 'Vencido';
  billId: string;
  bill?: BillToPay;
  numero_documento?: string;
  categoria?: string;
  data_emissao?: string; // Adicionar campo para data de emissão
  filial?: string;       // Adicionar campo para filial (nome)
  filial_id?: string;    // ID da filial
  filial_nome?: string;  // Nome da filial
}

export interface Filial {
  id: string;
  nome: string;
  cnpj: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayablesSummary {
  totalPending: number;
  totalOverdue: number;
  totalDueThisWeek: number;
  totalDueThisMonth: number;
  totalPaid: number;
  recentPayments: BillToPayInstallment[];
  upcomingPayments: BillToPayInstallment[];
}

export interface PayablesFilter {
  status?: string[];
  supplierId?: string;
  entityId?: string;
  bankAccountId?: string;
  filialId?: string;
  category?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
  showDeleted?: boolean; // Novo campo para mostrar itens deletados
}

export interface ImportResult {
  success: boolean;
  processed: number;
  errors: string[];
  warnings: string[];
}

export type PayableStatus = 'Pendente' | 'Pago' | 'Vencido';

export interface PayablesTableColumn {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  width?: number;
}

export interface RecurringBill {
  id: string;
  name: string;
  supplier_id?: string | null;
  category_id?: string | null;

  // ⭐ Adicionado para suportar Filial na conta recorrente:
  filial_id?: string | null; // FK para public.filiais(id)

  closing_day?: number | null;
  due_day: number;
  expected_amount: number;
  open_ended: boolean;
  end_date?: string | null;
  notes?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;

  supplier?: {
    id: string;
    nome: string;
  } | null;

  category?: {
    id: string;
    nome: string;
  } | null;

  // ⭐ Adicionado: objeto retornado pelo join "filial:filiais(id, nome)"
  filial?: {
    id: string;
    nome: string;
  } | null;
}

export interface RecurringBillOccurrence {
  id: string;
  recurring_bill_id: string;
  year_month: string;
  closing_date?: string;
  due_date: string;
  expected_amount: number;
  is_closed_for_month: boolean;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringEvent {
  occurrence_id: string;
  recurring_bill_id: string;
  name: string;
  supplier_id?: string;
  category_id?: string;
  default_expected_amount: number;
  expected_amount: number;
  year_month: string;
  closing_date?: string;
  due_date: string;
  open_ended: boolean;
  end_date?: string;
  active: boolean;
  is_closed_for_month: boolean;
  next_event_date?: string;
  next_event_type?: 'closing' | 'due';
}
