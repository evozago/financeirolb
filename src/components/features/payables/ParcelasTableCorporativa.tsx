import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Edit2, CreditCard, Trash2, MoreVertical, Search } from 'lucide-react';
import { FatoParcelas, FiltrosParcelasCorporativas } from '@/types/corporativo';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ParcelasTableCorporativaProps {
  parcelas: FatoParcelas[];
  loading: boolean;
  onPayment: (parcelaId: string) => void;
  onEdit?: (parcelaId: string) => void;
  onView?: (parcelaId: string) => void;
  onDelete?: (parcelaId: string) => void;
  onFilterChange: (filtros: FiltrosParcelasCorporativas) => void;
}

export const ParcelasTableCorporativa: React.FC<ParcelasTableCorporativaProps> = ({
  parcelas,
  loading,
  onPayment,
  onEdit,
  onView,
  onDelete,
  onFilterChange,
}) => {
  const [filtros, setFiltros] = useState<FiltrosParcelasCorporativas>({});

  const getStatusBadge = (status: string, statusFormatado: string) => {
    const variants = {
      'paga': 'default' as const,
      'vencida': 'destructive' as const,
      'a_vencer': 'secondary' as const,
      'cancelada': 'outline' as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {statusFormatado}
      </Badge>
    );
  };

  const handleSearchChange = (search: string) => {
    const novosFiltros = { ...filtros, search };
    setFiltros(novosFiltros);
    onFilterChange(novosFiltros);
  };

  const handleStatusChange = (status: string) => {
    const statusArray = status ? [status] : undefined;
    const novosFiltros = { ...filtros, status: statusArray };
    setFiltros(novosFiltros);
    onFilterChange(novosFiltros);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Parcelas a Pagar</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por fornecedor, descrição..."
                className="pl-10 w-64"
                value={filtros.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Select value={filtros.status?.[0] || ''} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="a_vencer">A Vencer</SelectItem>
                <SelectItem value="vencida">Vencidas</SelectItem>
                <SelectItem value="paga">Pagas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Carregando parcelas...</div>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Credor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Nº Doc</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Filial</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcelas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      Nenhuma parcela encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  parcelas.map((parcela) => (
                    <TableRow key={parcela.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{parcela.credor_nome}</div>
                          {parcela.credor_documento && (
                            <div className="text-xs text-muted-foreground">
                              {parcela.credor_documento}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48 truncate" title={parcela.conta_descricao}>
                          {parcela.conta_descricao}
                        </div>
                      </TableCell>
                      <TableCell>
                        {parcela.numero_documento || '-'}
                      </TableCell>
                      <TableCell>
                        {parcela.categoria || '-'}
                      </TableCell>
                      <TableCell>
                        {parcela.filial || '-'}
                      </TableCell>
                      <TableCell>
                        {parcela.numero_parcela}/{parcela.total_parcelas}
                      </TableCell>
                      <TableCell className="font-mono">
                        <div>
                          {formatCurrency(parcela.valor_parcela)}
                        </div>
                        {parcela.valor_pago > 0 && (
                          <div className="text-xs text-green-600">
                            Pago: {formatCurrency(parcela.valor_pago)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{formatDate(parcela.data_vencimento)}</div>
                        {parcela.data_pagamento && (
                          <div className="text-xs text-muted-foreground">
                            Pago: {formatDate(parcela.data_pagamento)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(parcela.status, parcela.status_formatado)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onView && (
                              <DropdownMenuItem onClick={() => onView(parcela.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                            )}
                            {parcela.status !== 'paga' && parcela.status !== 'cancelada' && (
                              <DropdownMenuItem onClick={() => onPayment(parcela.id)}>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Pagar
                              </DropdownMenuItem>
                            )}
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(parcela.id)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={() => onDelete(parcela.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};