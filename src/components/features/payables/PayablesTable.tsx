/**
 * Tabela especializada para exibir contas a pagar (parcelas)
 * Utiliza o DataTable genérico com configurações específicas para o domínio
 */

import React, { useMemo } from 'react';
import { EnhancedDataTable, Column } from '@/components/ui/enhanced-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2, CheckCircle, Edit3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { BillToPayInstallment } from '@/types/payables';

// Propriedades do componente
type PayablesTableProps = {
  data: BillToPayInstallment[];
  loading?: boolean;
  currency?: string;
  selectedItems?: BillToPayInstallment[];
  onSelectionChange?: (selectedItems: BillToPayInstallment[]) => void;
  onRowClick?: (item: BillToPayInstallment) => void;
  onView?: (item: BillToPayInstallment) => void;
  onEdit?: (item: BillToPayInstallment) => void;
  onPay?: (item: BillToPayInstallment) => void;
  onDelete?: (item: BillToPayInstallment) => void;
};

// Componente principal
export function PayablesTable({
  data,
  loading = false,
  currency = 'BRL',
  selectedItems = [],
  onSelectionChange,
  onRowClick,
  onView,
  onEdit,
  onPay,
  onDelete,
}: PayablesTableProps) {
  // Configurações de colunas padrão
  const defaultColumns: { key: string; header: string; visible: boolean; order: number }[] = [
    { key: 'supplier', header: 'Fornecedor', visible: true, order: 1 },
    { key: 'category', header: 'Categoria', visible: true, order: 2 },
    { key: 'documentNumber', header: 'Nº Documento', visible: true, order: 3 },
    { key: 'nfeNumber', header: 'Nº NFe', visible: true, order: 4 },
    { key: 'amount', header: 'Valor da Parcela', visible: true, order: 5 },
    { key: 'totalAmount', header: 'Valor Total', visible: true, order: 6 },
    { key: 'installment', header: 'Parcela', visible: true, order: 7 },
    { key: 'dueDate', header: 'Vencimento', visible: true, order: 8 },
    { key: 'status', header: 'Status', visible: true, order: 9 },
    { key: 'actions', header: '', visible: true, order: 10 },
  ];

  // Hook fictício de customização de colunas (mantenha o seu se já existir)
  const useColumnCustomization = (args: any) => ({
    columns: defaultColumns,
    visibleColumns: defaultColumns.map((c) => c.key),
    saveColumns: (_: any) => {},
  });

  const { columns: columnConfig, visibleColumns, saveColumns } = useColumnCustomization({
    defaultColumns,
    storageKey: 'payables-table-columns',
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(value);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR').format(d);
  };

  const getStatusBadge = (status: BillToPayInstallment['status'], dueDate: string) => {
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
    let currentStatus = status;

    if (status === 'Pendente') {
      const isOverdue = new Date(dueDate) < new Date();
      variant = isOverdue ? 'destructive' : 'secondary';
      currentStatus = isOverdue ? 'Vencido' : 'Pendente';
    } else if (status === 'Pago') {
      variant = 'default';
    } else if (status === 'Vencido') {
      variant = 'destructive';
    }

    return (
      <Badge variant={variant} className="font-medium">
        {currentStatus}
      </Badge>
    );
  };

  const ActionDropdown = ({ item }: { item: BillToPayInstallment }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView?.(item)}>
          <Eye className="mr-2 h-4 w-4" />
          <span>Ver</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(item)}>
          <Edit3 className="mr-2 h-4 w-4" />
          <span>Editar</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPay?.(item)}>
          <CheckCircle className="mr-2 h-4 w-4" />
          <span>Marcar como pago</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(item)}>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Excluir</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Helper para obter o Nº da NFe de forma robusta
  const extractNumeroNfe = (item: BillToPayInstallment): string | null => {
    // Primeiro verificar o numero_documento que é onde deve estar salvo
    if (item.numero_documento && item.numero_documento !== '-') {
      return item.numero_documento;
    }

    // Fallback: tentar extrair da descrição
    const desc = item.bill?.description;
    if (desc) {
      const match = desc.match(/NFe\s+(\d+)/i);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  // Definição de todas as colunas disponíveis
  const allColumns: Record<string, Column<BillToPayInstallment>> = {
    supplier: {
      key: 'supplier',
      header: 'Fornecedor',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-medium">{item.bill?.supplier.name}</div>
          <div className="text-sm text-muted-foreground">{item.bill?.supplier.cnpj}</div>
        </div>
      ),
    },
    description: {
      key: 'description',
      header: 'Descrição',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-medium">{item.bill?.description}</div>
          <div className="text-sm text-muted-foreground">ID: {item.bill?.id.slice(-8)}</div>
        </div>
      ),
    },
    category: {
      key: 'category',
      header: 'Categoria',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-medium text-sm">{item.categoria || 'Geral'}</div>
        </div>
      ),
    },
    documentNumber: {
      key: 'documentNumber',
      header: 'Nº Documento',
      sortable: true,
      cell: (item) => <div className="font-mono text-sm">{item.numero_documento || '-'}</div>,
    },

    // ======== COLUNA EDITADA: Nº NFe ========
    nfeNumber: {
      key: 'nfeNumber',
      header: 'Nº NFe',
      sortable: true,
      cell: (item) => {
        const nfe = extractNumeroNfe(item);
        return <div className="font-mono text-sm text-center">{nfe ?? '–'}</div>;
      },
    },

    amount: {
      key: 'amount',
      header: 'Valor da Parcela',
      sortable: true,
      cell: (item) => <div className="font-mono">{formatCurrency(item.amount)}</div>,
      className: 'text-right',
    },
    totalAmount: {
      key: 'totalAmount',
      header: 'Valor Total',
      sortable: true,
      cell: (item) => (
        <div className="font-mono text-muted-foreground">
          {formatCurrency(item.bill?.totalAmount || 0)}
        </div>
      ),
      className: 'text-right',
    },
    installment: {
      key: 'installment',
      header: 'Parcela',
      sortable: true,
      cell: (item) => (
        <div className="text-center font-medium">
          {item.installmentNumber}/{item.bill?.totalInstallments}
        </div>
      ),
      className: 'text-center',
    },
    dueDate: {
      key: 'dueDate',
      header: 'Vencimento',
      sortable: true,
      cell: (item) => {
        const isOverdue =
          new Date(item.dueDate) < new Date() && item.status === 'Pendente';
        return (
          <div className={cn('font-mono', isOverdue && 'text-destructive font-medium')}>
            {formatDate(item.dueDate)}
          </div>
        );
      },
    },
    status: {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (item) => getStatusBadge(item.status, item.dueDate),
    },
    actions: {
      key: 'actions',
      header: '',
      cell: (item) => <ActionDropdown item={item} />,
      className: 'w-12',
    },
  };

  // Filtra e ordena as colunas com base nas preferências do usuário
  const columns = useMemo(() => {
    const result: Column<BillToPayInstallment>[] = [];

    columnConfig
      .filter((col) => visibleColumns.includes(col.key))
      .sort((a, b) => a.order - b.order)
      .forEach((col) => {
        if (allColumns[col.key]) {
          result.push(allColumns[col.key]);
        }
      });

    return result;
  }, [columnConfig, visibleColumns]);

  // Ações em massa (exemplo)
  const bulkActions = null;

  return (
    <div className="space-y-4">
      <EnhancedDataTable
        data={data}
        columns={columns}
        loading={loading}
        selectable={true}
        selectedItems={selectedItems}
        onSelectionChange={onSelectionChange}
        onRowClick={onRowClick}
        getItemId={(item) => item.id}
        actions={bulkActions}
        emptyMessage="Nenhuma conta a pagar encontrada"
        pagination={true}
        defaultPageSize={25}
      />
    </div>
  );
}