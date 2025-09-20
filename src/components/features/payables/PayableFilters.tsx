/**
 * Componente de filtros avançados para contas a pagar
 * Permite filtrar por status, fornecedor, datas, valores, etc.
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, DollarSign, Building2 } from 'lucide-react';
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
import { PayablesFilter } from '@/types/payables';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface UnifiedSupplier {
  id: string;
  name: string;
  tipo: 'fornecedor' | 'pessoa';
}

interface Entity {
  id: string;
  nome: string;
  cnpj_cpf?: string;
  tipo: string;
}

interface BankAccount {
  id: string;
  nome_banco: string;
  conta?: string;
  agencia?: string;
}

interface Filial {
  id: string;
  nome: string;
  cnpj: string;
}

interface PayableFiltersProps {
  filters: PayablesFilter;
  onFiltersChange: (filters: PayablesFilter) => void;
  suppliers: UnifiedSupplier[];
  className?: string;
}

export function PayableFilters({
  filters,
  onFiltersChange,
  suppliers,
  className,
}: PayableFiltersProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  
  const statusOptions = [
    { value: 'Pendente', label: 'Pendente' },
    { value: 'Pago', label: 'Pago' },
    { value: 'Vencido', label: 'Vencido' },
  ];

  useEffect(() => {
    loadEntities();
    loadBankAccounts();
    loadFiliais();
  }, []);

  const loadEntities = async () => {
    try {
      const { data, error } = await supabase
        .from('entidades')
        .select('id, nome, cnpj_cpf, tipo')
        .eq('ativo', true)
        .eq('tipo', 'PJ')
        .order('nome');

      if (error) {
        console.error('Erro ao carregar entidades:', error);
        return;
      }

      setEntities(data || []);
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('id, nome_banco, conta, agencia')
        .eq('ativo', true)
        .order('nome_banco');

      if (error) {
        console.error('Erro ao carregar contas bancárias:', error);
        return;
      }

      setBankAccounts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
    }
  };

  const loadFiliais = async () => {
    try {
      const { data, error } = await supabase
        .from('filiais')
        .select('id, nome, cnpj')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar filiais:', error);
        return;
      }

      setFiliais(data || []);
    } catch (error) {
      console.error('Erro ao carregar filiais:', error);
    }
  };

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

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
    if (filters.category) count++;
    if (filters.supplierId) count++;
    if (filters.entityId) count++;
    if (filters.bankAccountId) count++;
    if (filters.filialId) count++;
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

               {/* Credor (PF + PJ) */}
               <div className="space-y-2">
                 <Label>Credor</Label>
                 <Select
                   value={filters.supplierId || 'all'}
                   onValueChange={(value) => updateFilter('supplierId', value === 'all' ? undefined : value)}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Todos os credores" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">Todos os credores</SelectItem>
                     {suppliers.map((supplier) => (
                       <SelectItem key={supplier.id} value={supplier.id}>
                         {supplier.name}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>


              {/* Filial */}
              <div className="space-y-2">
                <Label>Filial</Label>
                <Select
                  value={filters.filialId || 'all'}
                  onValueChange={(value) => updateFilter('filialId', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as filiais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as filiais</SelectItem>
                    {filiais.map((filial) => (
                      <SelectItem key={filial.id} value={filial.id}>
                        <div className="flex flex-col items-start">
                          <span>{filial.nome}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCNPJ(filial.cnpj)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conta Bancária */}
              <div className="space-y-2">
                <Label>Conta Bancária</Label>
                <Select
                  value={filters.bankAccountId || 'all'}
                  onValueChange={(value) => updateFilter('bankAccountId', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as contas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as contas</SelectItem>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex flex-col items-start">
                          <span>{account.nome_banco}</span>
                          {(account.conta || account.agencia) && (
                            <span className="text-xs text-muted-foreground">
                              {account.agencia && `Ag: ${account.agencia}`}{' '}
                              {account.conta && `Cc: ${account.conta}`}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={filters.category || 'all'}
                  onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    <SelectItem value="Geral">Geral</SelectItem>
                    <SelectItem value="Energia">Energia</SelectItem>
                    <SelectItem value="Internet">Internet</SelectItem>
                    <SelectItem value="Telefone">Telefone</SelectItem>
                    <SelectItem value="Aluguel">Aluguel</SelectItem>
                    <SelectItem value="Fornecedores">Fornecedores</SelectItem>
                    <SelectItem value="Serviços">Serviços</SelectItem>
                    <SelectItem value="Material">Material</SelectItem>
                    <SelectItem value="Transporte">Transporte</SelectItem>
                    <SelectItem value="Impostos">Impostos</SelectItem>
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
               Credor: {suppliers.find(s => s.id === filters.supplierId)?.name}
               <X 
                 className="h-3 w-3 cursor-pointer" 
                 onClick={() => updateFilter('supplierId', undefined)}
               />
             </Badge>
           )}

          {filters.entityId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Empresa: {entities.find(e => e.id === filters.entityId)?.nome}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('entityId', undefined)}
              />
            </Badge>
          )}

          {filters.filialId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Filial: {filiais.find(f => f.id === filters.filialId)?.nome}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('filialId', undefined)}
              />
            </Badge>
          )}

          {filters.bankAccountId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Banco: {bankAccounts.find(b => b.id === filters.bankAccountId)?.nome_banco}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('bankAccountId', undefined)}
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
          
          {filters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Categoria: {filters.category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter('category', undefined)}
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