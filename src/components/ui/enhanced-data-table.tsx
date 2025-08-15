/**
 * Componente de tabela aprimorado com paginação e seleção múltipla com Shift
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Settings, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface PaginationOptions {
  page: number;
  pageSize: number;
  total: number;
}

export interface EnhancedDataTableProps<T> {
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
  pagination?: boolean;
  defaultPageSize?: number;
  // Novos props para ordenação no backend
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500, 1000, 5000];
const ALL_ITEMS_VALUE = 999999;

export function EnhancedDataTable<T>({
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
  pagination = true,
  defaultPageSize = 25,
  // Novos props para ordenação no backend
  sortKey: externalSortKey,
  sortDirection: externalSortDirection,
  onSortChange,
}: EnhancedDataTableProps<T>) {
  // Usar ordenação externa se disponível, senão ordenação interna
  const [internalSortKey, setInternalSortKey] = useState<string | null>(null);
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  
  // Determinar se usar ordenação externa ou interna
  const sortKey = externalSortKey || internalSortKey;
  const sortDirection = externalSortDirection || internalSortDirection;
  
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    () => {
      const saved = localStorage.getItem('enhanced-data-table-columns');
      if (saved) {
        return JSON.parse(saved);
      }
      return columns.reduce((acc, col) => ({ ...acc, [col.key as string]: true }), {});
    }
  );

  const filteredColumns = columns.filter(col => visibleColumns[col.key as string]);

  // Dados ordenados - só usar ordenação local se não tiver callback de ordenação externa
  const sortedData = useMemo(() => {
    if (onSortChange) {
      // Se tem callback de ordenação externa, não ordenar localmente
      return data;
    }
    
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortKey];
      const bValue = (b as any)[sortKey];

      if (aValue === bValue) return 0;
      
      const result = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? result : -result;
    });
  }, [data, sortKey, sortDirection, onSortChange]);

  // Dados paginados
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    if (pageSize >= ALL_ITEMS_VALUE) {
      return sortedData; // Mostrar todos os dados
    }
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination]);

  // Informações de paginação
  const paginationInfo = useMemo(() => {
    const total = sortedData.length;
    const isShowingAll = pageSize >= ALL_ITEMS_VALUE;
    const totalPages = isShowingAll ? 1 : Math.ceil(total / pageSize);
    const startItem = isShowingAll ? 1 : (currentPage - 1) * pageSize + 1;
    const endItem = isShowingAll ? total : Math.min(currentPage * pageSize, total);
    
    return {
      page: currentPage,
      pageSize,
      total,
      totalPages,
      startItem,
      endItem,
      isShowingAll,
    };
  }, [sortedData.length, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (onSortChange) {
      // Se tem callback de ordenação externa, usar ele
      const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(key, newDirection);
    } else {
      // Senão, usar ordenação interna
      if (internalSortKey === key) {
        setInternalSortDirection(internalSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setInternalSortKey(key);
        setInternalSortDirection('asc');
      }
    }
  };

  const handleColumnVisibilityChange = (key: string, visible: boolean) => {
    const newVisibility = { ...visibleColumns, [key]: visible };
    setVisibleColumns(newVisibility);
    localStorage.setItem('enhanced-data-table-columns', JSON.stringify(newVisibility));
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const size = newPageSize === "all" ? ALL_ITEMS_VALUE : Number(newPageSize);
    setPageSize(size);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, paginationInfo.totalPages)));
  };

  // Seleção com Shift
  const handleSelectItem = useCallback((item: T, index: number, event?: React.MouseEvent) => {
    if (!onSelectionChange || !getItemId) return;

    const currentDataIndex = (currentPage - 1) * pageSize + index;
    const itemId = getItemId(item);
    const isCurrentlySelected = selectedItems.some(selected => getItemId(selected) === itemId);

    if (event?.shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== currentDataIndex) {
      // Seleção com Shift
      const startIndex = Math.min(lastSelectedIndex, currentDataIndex);
      const endIndex = Math.max(lastSelectedIndex, currentDataIndex);
      
      const itemsToSelect: T[] = [];
      for (let i = startIndex; i <= endIndex; i++) {
        if (i < sortedData.length) {
          itemsToSelect.push(sortedData[i]);
        }
      }
      
      // Adicionar os novos itens aos já selecionados (sem duplicatas)
      const existingIds = selectedItems.map(item => getItemId(item));
      const newItems = itemsToSelect.filter(item => !existingIds.includes(getItemId(item)));
      onSelectionChange([...selectedItems, ...newItems]);
    } else {
      // Seleção normal
      if (isCurrentlySelected) {
        onSelectionChange(selectedItems.filter(selected => getItemId(selected) !== itemId));
      } else {
        onSelectionChange([...selectedItems, item]);
      }
      setLastSelectedIndex(currentDataIndex);
    }
  }, [selectedItems, onSelectionChange, getItemId, lastSelectedIndex, currentPage, pageSize, sortedData]);

  const isAllSelected = selectedItems.length === paginatedData.length && paginatedData.length > 0;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < paginatedData.length;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    
    if (isAllSelected) {
      // Deselecionar todos os itens da página atual
      const currentPageIds = paginatedData.map(item => getItemId?.(item) || JSON.stringify(item));
      onSelectionChange(selectedItems.filter(item => 
        !currentPageIds.includes(getItemId?.(item) || JSON.stringify(item))
      ));
    } else {
      // Selecionar todos os itens da página atual
      const currentPageIds = paginatedData.map(item => getItemId?.(item) || JSON.stringify(item));
      const newItems = paginatedData.filter(item => 
        !selectedItems.some(selected => 
          (getItemId?.(selected) || JSON.stringify(selected)) === (getItemId?.(item) || JSON.stringify(item))
        )
      );
      onSelectionChange([...selectedItems, ...newItems]);
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
                      aria-label="Selecionar todos da página"
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
              {paginatedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={filteredColumns.length + (selectable ? 1 : 0)} 
                    className="p-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => {
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
                            onCheckedChange={(checked) => {
                              // Para Shift+Click, usar o evento onClick
                              if (!checked) {
                                handleSelectItem(item, index);
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectItem(item, index, e);
                            }}
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
        
        {/* Pagination */}
        {pagination && paginationInfo.total > 0 && (
          <div className="border-t bg-muted/25 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Linhas por página:</span>
                  <Select value={pageSize === ALL_ITEMS_VALUE ? "all" : pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  {paginationInfo.isShowingAll 
                    ? `Mostrando todos os ${paginationInfo.total} itens`
                    : `${paginationInfo.startItem}-${paginationInfo.endItem} de ${paginationInfo.total}`
                  }
                </div>
              </div>
              
              {!paginationInfo.isShowingAll && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">Página</span>
                    <span className="text-sm font-medium">{currentPage}</span>
                    <span className="text-sm">de</span>
                    <span className="text-sm font-medium">{paginationInfo.totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === paginationInfo.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(paginationInfo.totalPages)}
                    disabled={currentPage === paginationInfo.totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}