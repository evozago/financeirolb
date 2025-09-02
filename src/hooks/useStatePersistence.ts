import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStatePersistence as useStatePersistenceContext } from '@/contexts/StatePersistenceContext';

interface UseStatePersistenceOptions {
  key?: string;
  defaultFilters?: Record<string, any>;
  defaultPagination?: { page: number; pageSize: number };
  defaultSorting?: { column: string; direction: 'asc' | 'desc' };
  defaultColumnOrder?: string[];
  defaultColumnVisibility?: Record<string, boolean>;
}

export function useStatePersistence(options: UseStatePersistenceOptions = {}) {
  const location = useLocation();
  const persistenceContext = useStatePersistenceContext();
  
  // Use provided key or derive from pathname
  const pageKey = options.key || location.pathname;
  
  const pageState = persistenceContext.getPageState(pageKey);
  
  const [filters, setFilters] = useState(pageState.filters || options.defaultFilters || {});
  const [pagination, setPagination] = useState(pageState.pagination || options.defaultPagination || { page: 1, pageSize: 50 });
  const [sorting, setSorting] = useState(pageState.sorting || options.defaultSorting || { column: '', direction: 'asc' as const });
  const [selectedItems, setSelectedItems] = useState<string[]>(pageState.selectedItems || []);
  const [columnOrder, setColumnOrder] = useState<string[]>(pageState.columnOrder || options.defaultColumnOrder || []);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(pageState.columnVisibility || options.defaultColumnVisibility || {});

  // Update persistence context when local state changes
  useEffect(() => {
    persistenceContext.updateFilters(pageKey, filters);
  }, [filters, pageKey, persistenceContext]);

  useEffect(() => {
    persistenceContext.updatePagination(pageKey, pagination);
  }, [pagination, pageKey, persistenceContext]);

  useEffect(() => {
    persistenceContext.updateSorting(pageKey, sorting);
  }, [sorting, pageKey, persistenceContext]);

  useEffect(() => {
    persistenceContext.updateSelection(pageKey, selectedItems);
  }, [selectedItems, pageKey, persistenceContext]);

  useEffect(() => {
    persistenceContext.updateColumnSettings(pageKey, columnOrder, columnVisibility);
  }, [columnOrder, columnVisibility, pageKey, persistenceContext]);

  // Restore state when navigating back to the page
  useEffect(() => {
    const savedState = persistenceContext.getPageState(pageKey);
    if (savedState.filters) setFilters(savedState.filters);
    if (savedState.pagination) setPagination(savedState.pagination);
    if (savedState.sorting) setSorting(savedState.sorting);
    if (savedState.selectedItems) setSelectedItems(savedState.selectedItems);
    if (savedState.columnOrder) setColumnOrder(savedState.columnOrder);
    if (savedState.columnVisibility) setColumnVisibility(savedState.columnVisibility);
  }, [pageKey, persistenceContext]);

  const clearState = () => {
    persistenceContext.clearPageState(pageKey);
    setFilters(options.defaultFilters || {});
    setPagination(options.defaultPagination || { page: 1, pageSize: 50 });
    setSorting(options.defaultSorting || { column: '', direction: 'asc' });
    setSelectedItems([]);
    setColumnOrder(options.defaultColumnOrder || []);
    setColumnVisibility(options.defaultColumnVisibility || {});
  };

  return {
    filters,
    setFilters,
    pagination,
    setPagination,
    sorting,
    setSorting,
    selectedItems,
    setSelectedItems,
    columnOrder,
    setColumnOrder,
    columnVisibility,
    setColumnVisibility,
    clearState,
  };
}