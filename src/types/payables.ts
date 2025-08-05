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
  dueDateFrom?: string;
  dueDateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  search?: string;
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