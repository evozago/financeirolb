/**
 * Componente de filtros avançados para contas a pagar
 * Permite filtrar por status, fornecedor, datas, valores, etc.
 */

import React from 'react';
import { Search, Filter, X, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { PayablesFilter, Supplier } from '@/types/payables';
import { cn } from '@/lib/utils';

interface PayableFiltersProps {
  filters: PayablesFilter;
  onFiltersChange: (filters: PayablesFilter) => void;
  suppliers: Supplier[];
  className?: string;
}

export function PayableFilters({
  filters,
  onFiltersChange,
  suppliers,
  className,
}: PayableFiltersProps) {
  const statusOptions = [
    { value: 'aberto', label: 'Aberto' },
    { value: 'pago', label: 'Pago' },
    { value: 'vencido', label: 'Vencido' },
  ];

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && 
    (Array.isArray(value) ? value.length > 0 : true)
  );

  const updateFilter = (key: keyof PayablesFilter, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status?.length) count++;
    if (filters.supplierId) count++;
    if (filters.dueDateFrom || filters.dueDateTo) count++;
    if (filters.amountFrom || filters.amountTo) count++;
    return count;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Barra de busca principal */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por fornecedor, descrição ou ID..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {getActiveFiltersCount() > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filtros Avançados</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status?.[0] || 'all'}
                  onValueChange={(value) => updateFilter('status', value === 'all' ? [] : [value])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fornecedor */}
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select
                  value={filters.supplierId || 'all'}
                  onValueChange={(value) => updateFilter('supplierId', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os fornecedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os fornecedores</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data de Vencimento */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Período de Vencimento
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">De</Label>
                    <Input
                      type="date"
                      value={filters.dueDateFrom || ''}
                      onChange={(e) => updateFilter('dueDateFrom', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Até</Label>
                    <Input
                      type="date"
                      value={filters.dueDateTo || ''}
                      onChange={(e) => updateFilter('dueDateTo', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Faixa de Valor
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Mín.</Label>
                    <Input
                      type="number"
                      placeholder="0,00"
                      step="0.01"
                      value={filters.amountFrom || ''}
                      onChange={(e) => updateFilter('amountFrom', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Máx.</Label>
                    <Input
                      type="number"
                      placeholder="999999,99"
                      step="0.01"
                      value={filters.amountTo || ''}
                      onChange={(e) => updateFilter('amountTo', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Filtros ativos */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Busca: "{filters.search}"
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('search', '')}
              />
            </Badge>
          )}
          
          {filters.status?.length && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status.join(', ')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('status', [])}
              />
            </Badge>
          )}
          
          {filters.supplierId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Fornecedor: {suppliers.find(s => s.id === filters.supplierId)?.name}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('supplierId', undefined)}
              />
            </Badge>
          )}
          
          {(filters.dueDateFrom || filters.dueDateTo) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Data: {filters.dueDateFrom || '...'} até {filters.dueDateTo || '...'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  updateFilter('dueDateFrom', undefined);
                  updateFilter('dueDateTo', undefined);
                }}
              />
            </Badge>
          )}
          
          {(filters.amountFrom || filters.amountTo) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Valor: R$ {filters.amountFrom || '0'} - R$ {filters.amountTo || '∞'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  updateFilter('amountFrom', undefined);
                  updateFilter('amountTo', undefined);
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}