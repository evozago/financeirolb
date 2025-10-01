/**
 * Versão estendida da PayablesTable com suporte à lixeira
 * Mantém toda funcionalidade original e adiciona recursos de lixeira
 */

import React, { useMemo } from 'react';
import { EnhancedDataTable, Column } from '@/components/ui/enhanced-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2, CheckCircle, Edit3, RotateCcw, Archive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BillToPayInstallment } from '@/types/payables';
import { cn } from '@/lib/utils';
import { ColumnCustomizer, ColumnConfig } from './ColumnCustomizer';
import { useColumnCustomization } from '@/hooks/useColumnCustomization';
import { TrashActions } from './TrashActions';

interface PayablesTableWithTrashProps {
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
  // Novos props para lixeira
  showDeleted?: boolean;
  onRestore?: (items: BillToPayInstallment[]) => void;
  onPermanentDelete?: (items: BillToPayInstallment[]) => void;
  // Props para ordenação
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
}

export function PayablesTableWithTrash({
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
  // Novos props para lixeira
  showDeleted = false,
  onRestore,
  onPermanentDelete,
  // Props para ordenação
  sortKey,
  sortDirection,
  onSortChange,
}: PayablesTableWithTrashProps) {
  // Configuração padrão das colunas
  const defaultColumns: ColumnConfig[] = [
    { key: 'supplier', header: 'Fornecedor', visible: true, order: 0 },
    { key: 'description', header: 'Descrição', visible: true, order: 1 },
    { key: 'nfeNumber', header: 'Nº Nota Fiscal', visible: true, order: 2 },
    { key: 'category', header: 'Categoria', visible: true, order: 3 },
    { key: 'filial', header: 'Filial', visible: true, order: 4 },
    { key: 'amount', header: 'Valor da Parcela', visible: true, order: 5 },
    { key: 'totalAmount', header: 'Valor Total', visible: true, order: 6 },
    { key: 'installment', header: 'Parcela', visible: true, order: 7 },
    { key: 'issueDate', header: 'Data Emissão', visible: true, order: 8 },
    { key: 'dueDate', header: 'Vencimento', visible: true, order: 9 },
    { key: 'status', header: 'Status', visible: true, order: 10 },
    { key: 'actions', header: '', visible: true, order: 11 },
  ];

  const { columns: columnConfig, visibleColumns, saveColumns } = useColumnCustomization({
    defaultColumns,
    storageKey: showDeleted ? 'payables-trash-table-columns' : 'payables-table-columns'
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR');

  const getStatusBadge = (status: string, dueDate: string) => {
    if (showDeleted) {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          <Archive className="h-3 w-3 mr-1" />
          Deletado
        </Badge>
      );
    }

    const isOverdue = new Date(dueDate) < new Date() && status === 'Pendente';
    const currentStatus = isOverdue ? 'Vencido' : status;

    const variants = {
      'Pendente': 'default',
      'Pago': 'default',
      'Vencido': 'destructive',
    } as const;

    const colors = {
      'Pendente': 'bg-status-pending text-white',
      'Pago': 'bg-status-paid text-white',
      'Vencido': 'bg-status-overdue text-white',
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
        {showDeleted ? (
          // Ações para itens na lixeira
          <>
            <DropdownMenuItem onClick={() => onRestore?.([item])}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onPermanentDelete?.([item])}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar Permanentemente
            </DropdownMenuItem>
          </>
        ) : (
          // Ações normais
          <>
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
                  Mover para Lixeira
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Definição de todas as colunas disponíveis
  const allColumns: Record<string, Column<BillToPayInstallment>> = {
    supplier: {
      key: 'supplier',
      header: 'Fornecedor',
      sortable: true,
      cell: (item) => (
        <div className={cn(showDeleted && 'opacity-60')}>
          <div className="font-medium">{item.bill?.supplier.name}</div>
          <div className="text-sm text-muted-foreground">
            {item.bill?.supplier.cnpj}
          </div>
        </div>
      ),
    },
    description: {
      key: 'description',
      header: 'Descrição',
      sortable: true,
      cell: (item) => (
        <div className={cn(showDeleted && 'opacity-60')}>
          <div className="font-medium">{item.bill?.description}</div>
          <div className="text-sm text-muted-foreground">
            ID: {item.bill?.id.slice(-8)}
          </div>
        </div>
      ),
    },
    category: {
      key: 'category',
      header: 'Categoria',
      sortable: true,
      cell: (item) => (
        <div className={cn(showDeleted && 'opacity-60')}>
          <div className="font-medium text-sm">
            {item.categoria || 'Geral'}
          </div>
        </div>
      ),
    },
    filial: {
      key: 'filial',
      header: 'Filial',
      sortable: true,
      cell: (item) => (
        <div className={cn(showDeleted && 'opacity-60')}>
          <div className="font-medium text-sm">
            {item.filial_nome || item.filial || 'Não definida'}
          </div>
        </div>
      ),
    },
    nfeNumber: {
      key: 'nfeNumber',
      header: 'Nº Nota Fiscal',
      sortable: true,
      cell: (item) => {
        const raw = item.numero_documento ?? '';
        const formatted = raw.replace(/^0+/, '') || (raw ? '0' : '-');
        return (
          <div className={cn('font-mono text-sm', showDeleted && 'opacity-60')}>
            {formatted}
          </div>
        );
      },
    },
    amount: {
      key: 'amount',
      header: 'Valor da Parcela',
      sortable: true,
      cell: (item) => (
        <div className={cn('font-mono', showDeleted && 'opacity-60')}>
          {formatCurrency(item.amount)}
        </div>
      ),
      className: 'text-right',
    },
    totalAmount: {
      key: 'totalAmount',
      header: 'Valor Total',
      sortable: true,
      cell: (item) => (
        <div className={cn('font-mono text-muted-foreground', showDeleted && 'opacity-60')}>
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
        <div className={cn('text-center font-medium', showDeleted && 'opacity-60')}>
          {item.installmentNumber}/{item.bill?.totalInstallments}
        </div>
      ),
      className: 'text-center',
    },
    issueDate: {
      key: 'issueDate',
      header: 'Data Emissão',
      sortable: true,
      cell: (item) => (
        <div className={cn('font-mono text-sm', showDeleted && 'opacity-60')}>
          {item.data_emissao ? formatDate(item.data_emissao) : '-'}
        </div>
      ),
    },
    dueDate: {
      key: 'dueDate',
      header: 'Vencimento',
      sortable: true,
      cell: (item) => {
        const isOverdue = new Date(item.dueDate) < new Date() && item.status === 'Pendente';
        return (
          <div className={cn(
            'font-mono', 
            isOverdue && !showDeleted && 'text-destructive font-medium',
            showDeleted && 'opacity-60'
          )}>
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

  // Gerar colunas baseadas na configuração
  const columns = useMemo(() => {
    return visibleColumns.map(config => allColumns[config.key]).filter(Boolean);
  }, [visibleColumns, showDeleted]);

  const bulkActions = selectedItems.length > 0 && (
    <div className="space-y-2">
      {showDeleted ? (
        // Ações para lixeira
        <TrashActions
          selectedItems={selectedItems}
          onRestore={onRestore || (() => {})}
          onPermanentDelete={onPermanentDelete || (() => {})}
          loading={loading}
        />
      ) : (
        // Ações normais
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
              Mover para Lixeira
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Barra de ferramentas com customização de colunas */}
      <div className="flex justify-end">
        <ColumnCustomizer
          columns={columnConfig}
          onColumnsChange={saveColumns}
        />
      </div>

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
        emptyMessage={
          showDeleted 
            ? "Nenhum item na lixeira" 
            : "Nenhuma conta a pagar encontrada"
        }
        pagination={true}
        defaultPageSize={25}
        // Passar props de ordenação
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={onSortChange}
        className={cn(showDeleted && 'opacity-90')}
      />
    </div>
  );
}
