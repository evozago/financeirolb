import React, { useMemo } from 'react';
import { EnhancedDataTable, Column } from '@/components/ui/enhanced-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2, Edit3, Building2, UserCheck, UserX } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SupplierData {
  id: string;
  nome_razao_social: string;
  nome_fantasia?: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  tipo_pessoa: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface SuppliersTableProps {
  data: SupplierData[];
  loading?: boolean;
  selectedItems?: SupplierData[];
  onSelectionChange?: (items: SupplierData[]) => void;
  onRowClick?: (item: SupplierData) => void;
  onEdit?: (item: SupplierData) => void;
  onDelete?: (items: SupplierData[]) => void;
  onView?: (item: SupplierData) => void;
  onBulkEdit?: (items: SupplierData[]) => void;
  onActivate?: (items: SupplierData[]) => void;
  onDeactivate?: (items: SupplierData[]) => void;
}

export function SuppliersTable({
  data,
  loading,
  selectedItems = [],
  onSelectionChange,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  onBulkEdit,
  onActivate,
  onDeactivate,
}: SuppliersTableProps) {
  const formatCNPJ = (cnpj: string | undefined) => {
    if (!cnpj) return '-';
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length === 14) {
      return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } else if (clean.length === 11) {
      return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return cnpj;
  };

  const ActionDropdown = ({ item }: { item: SupplierData }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onView && (
          <DropdownMenuItem onClick={() => onView(item)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(item)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir definitivamente o fornecedor "{item.nome_razao_social}"? 
                  Esta ação não pode ser desfeita e removerá todos os dados relacionados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete([item])}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir Definitivamente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const columns: Column<SupplierData>[] = [
    {
      key: 'nome_razao_social',
      header: 'Razão Social',
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{item.nome_razao_social}</div>
            {item.nome_fantasia && (
              <div className="text-sm text-muted-foreground">{item.nome_fantasia}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'cpf_cnpj',
      header: 'CPF/CNPJ',
      sortable: true,
      cell: (item) => (
        <div className="font-mono text-sm">{formatCNPJ(item.cpf_cnpj)}</div>
      ),
    },
    {
      key: 'tipo_pessoa',
      header: 'Tipo',
      sortable: true,
      cell: (item) => (
        <Badge variant={item.tipo_pessoa === 'pessoa_fisica' ? 'default' : 'secondary'}>
          {item.tipo_pessoa === 'pessoa_fisica' ? 'PF' : 'PJ'}
        </Badge>
      ),
      className: 'text-center',
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      cell: (item) => (
        <div className="text-sm">{item.email || '-'}</div>
      ),
    },
    {
      key: 'telefone',
      header: 'Telefone',
      sortable: true,
      cell: (item) => (
        <div className="font-mono text-sm">{item.telefone || '-'}</div>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      sortable: true,
      cell: (item) => (
        <Badge variant={item.ativo ? "default" : "secondary"}>
          {item.ativo ? "Ativo" : "Inativo"}
        </Badge>
      ),
      className: 'text-center',
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
      {onActivate && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onActivate(selectedItems)}
          disabled={selectedItems.every(item => item.ativo)}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Ativar
        </Button>
      )}
      {onDeactivate && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDeactivate(selectedItems)}
          disabled={selectedItems.every(item => !item.ativo)}
        >
          <UserX className="h-4 w-4 mr-2" />
          Desativar
        </Button>
      )}
      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Selecionados
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir definitivamente {selectedItems.length} fornecedor{selectedItems.length !== 1 ? 'es' : ''}? 
                Esta ação não pode ser desfeita e removerá todos os dados relacionados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDelete(selectedItems)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir {selectedItems.length} Fornecedor{selectedItems.length !== 1 ? 'es' : ''}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
      emptyMessage="Nenhum fornecedor encontrado"
      pagination={true}
      defaultPageSize={25}
    />
  );
}
