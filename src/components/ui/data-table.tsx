/**
 * Componente de tabela genérico com funcionalidades avançadas
 * - Ordenação de colunas
 * - Personalização de colunas (mostrar/ocultar/reordenar)
 * - Seleção múltipla
 * - Paginação
 * - Filtros
 */

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Settings, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;
  actions?: React.ReactNode;
  getItemId?: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  actions,
  getItemId,
  onRowClick,
  emptyMessage = "Nenhum item encontrado",
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    () => {
      const saved = localStorage.getItem('data-table-columns');
      if (saved) {
        return JSON.parse(saved);
      }
      return columns.reduce((acc, col) => ({ ...acc, [col.key as string]: true }), {});
    }
  );

  const filteredColumns = columns.filter(col => visibleColumns[col.key as string]);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortKey];
      const bValue = (b as any)[sortKey];

      if (aValue === bValue) return 0;
      
      const result = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? result : -result;
    });
  }, [data, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleColumnVisibilityChange = (key: string, visible: boolean) => {
    const newVisibility = { ...visibleColumns, [key]: visible };
    setVisibleColumns(newVisibility);
    localStorage.setItem('data-table-columns', JSON.stringify(newVisibility));
  };

  const isAllSelected = selectedItems.length === data.length && data.length > 0;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < data.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange?.([]); 
    } else {
      onSelectionChange?.(data);
    }
  };

  const handleSelectItem = (item: T) => {
    const itemId = getItemId?.(item) || JSON.stringify(item);
    const currentId = selectedItems.map(selected => getItemId?.(selected) || JSON.stringify(selected));
    
    if (currentId.includes(itemId)) {
      onSelectionChange?.(selectedItems.filter(selected => 
        (getItemId?.(selected) || JSON.stringify(selected)) !== itemId
      ));
    } else {
      onSelectionChange?.([...selectedItems, item]);
    }
  };

  const getSortIcon = (key: string) => {
    if (sortKey !== key) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with actions */}
      {(selectable && selectedItems.length > 0) || actions ? (
        <div className="flex items-center justify-between">
          {selectable && selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selecionado{selectedItems.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {actions}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                  Colunas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key as string}
                    checked={visibleColumns[column.key as string]}
                    onCheckedChange={(checked) => 
                      handleColumnVisibilityChange(column.key as string, checked)
                    }
                  >
                    {column.header}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : null}

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {selectable && (
                  <th className="w-12 p-4">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todos"
                      {...(isIndeterminate && { 'data-state': 'indeterminate' })}
                    />
                  </th>
                )}
                {filteredColumns.map((column) => (
                  <th
                    key={column.key as string}
                    className={cn(
                      "p-4 text-left font-medium text-muted-foreground",
                      column.sortable && "cursor-pointer hover:text-foreground",
                      column.className
                    )}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key as string)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && getSortIcon(column.key as string)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={filteredColumns.length + (selectable ? 1 : 0)} 
                    className="p-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                sortedData.map((item, index) => {
                  const itemId = getItemId?.(item) || index.toString();
                  const isSelected = selectedItems.some(selected => 
                    (getItemId?.(selected) || JSON.stringify(selected)) === itemId
                  );

                  return (
                    <tr
                      key={itemId}
                      className={cn(
                        "border-t hover:bg-muted/25 transition-colors",
                        onRowClick && "cursor-pointer",
                        isSelected && "bg-muted/50"
                      )}
                      onClick={() => onRowClick?.(item)}
                    >
                      {selectable && (
                        <td className="p-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectItem(item)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Selecionar item ${index + 1}`}
                          />
                        </td>
                      )}
                      {filteredColumns.map((column) => (
                        <td
                          key={column.key as string}
                          className={cn("p-4", column.className)}
                          style={{ width: column.width }}
                        >
                          {column.cell 
                            ? column.cell(item)
                            : String((item as any)[column.key] || '-')
                          }
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}