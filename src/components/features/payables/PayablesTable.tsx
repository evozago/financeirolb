/**
 * Tabela especializada para exibir contas a pagar (parcelas)
 * Utiliza o DataTable genérico com configurações específicas para o domínio
 */

import React from 'react';
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
import { BillToPayInstallment } from '@/types/payables';
import { cn } from '@/lib/utils';

interface PayablesTableProps {
  data: BillToPayInstallment[];
  loading?: boolean;
  selectedItems?: BillToPayInstallment[];
  onSelectionChange?: (items: BillToPayInstallment[]) => void;
  onRowClick?: (item: BillToPayInstallment) => void;
  onMarkAsPaid?: (items: BillToPayInstallment[]) => void;
  onEdit?: (item: BillToPayInstallment) => void;
  onDelete?: (items: BillToPayInstallment[]) => void;
  onView?: (item: BillToPayInstallment) => void;
  onBulkEdit?: (items: BillToPayInstallment[]) => void;
}

export function PayablesTable({
  data,
  loading,
  selectedItems = [],
  onSelectionChange,
  onRowClick,
  onMarkAsPaid,
  onEdit,
  onDelete,
  onView,
  onBulkEdit,
}: PayablesTableProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR');

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'Pendente';
    const currentStatus = isOverdue ? 'Vencido' : status;

    const variants = {
      'Pendente': 'default',
      'Pago': 'default',
      'Vencido': 'destructive',
    } as const;

    const colors = {
      'Pendente': 'bg-status-pending text-status-pending',
      'Pago': 'bg-status-paid text-status-paid',
      'Vencido': 'bg-status-overdue text-status-overdue',
    };

    return (
      <Badge 
        variant={variants[currentStatus as keyof typeof variants]} 
        className={cn('text-xs', colors[currentStatus as keyof typeof colors])}
      >
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
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit?.(item)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </DropdownMenuItem>
        {onMarkAsPaid && item.status !== 'Pago' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onMarkAsPaid([item])}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar como Pago
            </DropdownMenuItem>
          </>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete([item])}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const columns: Column<BillToPayInstallment>[] = [
    {
      key: 'supplier',
      header: 'Fornecedor',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-medium">{item.bill?.supplier.name}</div>
          <div className="text-sm text-muted-foreground">
            {item.bill?.supplier.cnpj}
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Descrição',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-medium">{item.bill?.description}</div>
          <div className="text-sm text-muted-foreground">
            ID: {item.bill?.id.slice(-8)}
          </div>
        </div>
      ),
    },
    {
      key: 'documentNumber',
      header: 'Nº Documento',
      sortable: true,
      cell: (item) => (
        <div className="font-mono text-sm">
          {item.numero_documento || '-'}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Valor da Parcela',
      sortable: true,
      cell: (item) => (
        <div className="font-mono">{formatCurrency(item.amount)}</div>
      ),
      className: 'text-right',
    },
    {
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
    {
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
    {
      key: 'dueDate',
      header: 'Vencimento',
      sortable: true,
      cell: (item) => {
        const isOverdue = new Date(item.dueDate) < new Date() && item.status === 'Pendente';
        return (
          <div className={cn('font-mono', isOverdue && 'text-destructive font-medium')}>
            {formatDate(item.dueDate)}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (item) => getStatusBadge(item.status, item.dueDate),
    },
    {
      key: 'actions',
      header: '',
      cell: (item) => <ActionDropdown item={item} />,
      className: 'w-12',
    },
  ];

  const bulkActions = selectedItems.length > 0 && (
    <div className="flex items-center gap-2">
      {onBulkEdit && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onBulkEdit(selectedItems)}
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Editar em Massa ({selectedItems.length})
        </Button>
      )}
      {onMarkAsPaid && (
        <Button
          size="sm"
          onClick={() => onMarkAsPaid(selectedItems)}
          disabled={selectedItems.every(item => item.status === 'Pago')}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Marcar como Pago
        </Button>
      )}
      {onDelete && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(selectedItems)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir Selecionados
        </Button>
      )}
    </div>
  );

  return (
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
  );
}