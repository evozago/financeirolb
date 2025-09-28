import React, { useMemo } from 'react';
import { EnhancedDataTable, Column } from '@/components/ui/enhanced-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2, Edit3, Building2, UserCheck, UserX, Mail, Phone } from 'lucide-react';
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

interface Entidade {
  id: string;
  tipo_pessoa: string;
  nome_razao_social: string;
  nome_fantasia: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  papeis: string[];
  ativo: boolean;
}

interface EntitiesTableProps {
  data: Entidade[];
  loading?: boolean;
  selectedItems?: Entidade[];
  onSelectionChange?: (items: Entidade[]) => void;
  onRowClick?: (item: Entidade) => void;
  onEdit?: (item: Entidade) => void;
  onDelete?: (items: Entidade[]) => void;
  onView?: (item: Entidade) => void;
  onBulkEdit?: (items: Entidade[]) => void;
  onActivate?: (items: Entidade[]) => void;
  onDeactivate?: (items: Entidade[]) => void;
}

export function EntitiesTable({
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
}: EntitiesTableProps) {
  const formatCpfCnpj = (cpfCnpj: string) => {
    if (!cpfCnpj) return '';
    const digits = cpfCnpj.replace(/\D/g, '');
    
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
    } else if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.***.***/****-$5');
    }
    return cpfCnpj;
  };

  const ActionDropdown = ({ item }: { item: Entidade }) => (
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
            Visualizar 360°
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
                  Tem certeza que deseja excluir definitivamente a entidade "{item.nome_razao_social}"? 
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

  const columns: Column<Entidade>[] = [
    {
      key: 'nome_razao_social',
      header: 'Entidade',
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{item.nome_razao_social}</div>
            {item.nome_fantasia && item.nome_fantasia !== item.nome_razao_social && (
              <div className="text-sm text-muted-foreground">{item.nome_fantasia}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'tipo_pessoa',
      header: 'Tipo',
      sortable: true,
      cell: (item) => (
        <Badge variant={item.tipo_pessoa === 'fisica' ? 'default' : 'secondary'}>
          {item.tipo_pessoa === 'fisica' ? 'PF' : 'PJ'}
        </Badge>
      ),
      className: 'text-center',
    },
    {
      key: 'cpf_cnpj',
      header: 'CPF/CNPJ',
      sortable: true,
      cell: (item) => (
        <div className="font-mono text-sm">{formatCpfCnpj(item.cpf_cnpj)}</div>
      ),
    },
    {
      key: 'contato',
      header: 'Contato',
      cell: (item) => (
        <div className="space-y-1">
          {item.email && (
            <div className="flex items-center text-sm">
              <Mail className="h-3 w-3 mr-1" />
              <span className="truncate max-w-[150px]">{item.email}</span>
            </div>
          )}
          {item.telefone && (
            <div className="flex items-center text-sm">
              <Phone className="h-3 w-3 mr-1" />
              {item.telefone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'papeis',
      header: 'Papéis',
      cell: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.papeis?.map((papel) => (
            <Badge key={papel} variant="outline" className="text-xs">
              {papel}
            </Badge>
          ))}
        </div>
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
              Excluir Selecionadas
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir definitivamente {selectedItems.length} entidade{selectedItems.length !== 1 ? 's' : ''}? 
                Esta ação não pode ser desfeita e removerá todos os dados relacionados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDelete(selectedItems)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir {selectedItems.length} Entidade{selectedItems.length !== 1 ? 's' : ''}
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
      emptyMessage="Nenhuma entidade encontrada"
      pagination={true}
      defaultPageSize={25}
    />
  );
}
