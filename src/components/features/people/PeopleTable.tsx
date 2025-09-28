import React, { useMemo } from 'react';
import { EnhancedDataTable, Column } from '@/components/ui/enhanced-data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2, Edit3, Users, UserCheck, UserX } from 'lucide-react';
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
import { normalizeRoleName } from '@/utils/normalizeRoleName';

interface PessoaData {
  id: string;
  nome_razao_social: string;
  nome_fantasia?: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  tipo_pessoa: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  papeis?: string[];
  papeis_slug?: string[];
}

interface PeopleTableProps {
  data: PessoaData[];
  loading?: boolean;
  selectedItems?: PessoaData[];
  onSelectionChange?: (items: PessoaData[]) => void;
  onRowClick?: (item: PessoaData) => void;
  onEdit?: (item: PessoaData) => void;
  onDelete?: (items: PessoaData[]) => void;
  onView?: (item: PessoaData) => void;
  onBulkEdit?: (items: PessoaData[]) => void;
  onActivate?: (items: PessoaData[]) => void;
  onDeactivate?: (items: PessoaData[]) => void;
}

export function PeopleTable({
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
}: PeopleTableProps) {
  const formatCPF = (cpfCnpj: string | undefined) => {
    if (!cpfCnpj) return '-';
    const clean = cpfCnpj.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    } else if (clean.length === 14) {
      return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return cpfCnpj;
  };

  const getCategoriasBadges = (papeis: string[] | undefined, papeisSlug?: string[]) => {
    const colors: Record<string, string> = {
      funcionario: "bg-blue-100 text-blue-800",
      vendedor: "bg-green-100 text-green-800",
      vendedora: "bg-green-100 text-green-800",
      fornecedor: "bg-purple-100 text-purple-800",
      cliente: "bg-orange-100 text-orange-800"
    };

    return papeis?.filter(papel => papel).map((papel, index) => {
      const slug = papeisSlug?.[index] || normalizeRoleName(papel);
      const color = colors[slug] || "bg-gray-100 text-gray-800";

      return (
        <Badge key={`${papel}-${index}`} className={color}>
          {papel}
        </Badge>
      );
    });
  };

  const ActionDropdown = ({ item }: { item: PessoaData }) => (
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
                  Tem certeza que deseja excluir definitivamente a pessoa "{item.nome_razao_social}"? 
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

  const columns: Column<PessoaData>[] = [
    {
      key: 'nome_razao_social',
      header: 'Nome',
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
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
      key: 'cpf_cnpj',
      header: 'CPF/CNPJ',
      sortable: true,
      cell: (item) => (
        <div className="font-mono text-sm">{formatCPF(item.cpf_cnpj)}</div>
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
      key: 'papeis',
      header: 'Papéis',
      cell: (item) => (
        <div className="flex flex-wrap gap-1">
          {getCategoriasBadges(item.papeis, item.papeis_slug)}
        </div>
      ),
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
              Excluir Selecionadas
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir definitivamente {selectedItems.length} pessoa{selectedItems.length !== 1 ? 's' : ''}? 
                Esta ação não pode ser desfeita e removerá todos os dados relacionados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDelete(selectedItems)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir {selectedItems.length} Pessoa{selectedItems.length !== 1 ? 's' : ''}
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
      emptyMessage="Nenhuma pessoa encontrada"
      pagination={true}
      defaultPageSize={25}
    />
  );
}
