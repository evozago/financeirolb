import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useStatePersistence } from '@/contexts/StatePersistenceContext';

/**
 * Hook personalizado para persistência automática de estado de página
 * Facilita o uso do contexto de persistência com uma API mais simples
 */
export function usePagePersistence(pageKey?: string) {
  const location = useLocation();
  const persistence = useStatePersistence();
  
  // Usar o pathname como chave padrão se não fornecida
  const key = pageKey || location.pathname;
  
  // Obter estado atual da página
  const pageState = persistence.getPageState(key);
  
  // Funções de conveniência para atualizar diferentes tipos de estado
  const updateFilters = useCallback((filters: Record<string, any>) => {
    persistence.updateFilters(key, filters);
  }, [key, persistence]);
  
  const updatePagination = useCallback((pagination: { page: number; pageSize: number }) => {
    persistence.updatePagination(key, pagination);
  }, [key, persistence]);
  
  const updateSorting = useCallback((sorting: { column: string; direction: 'asc' | 'desc' }) => {
    persistence.updateSorting(key, sorting);
  }, [key, persistence]);
  
  const updateSelection = useCallback((selectedItems: string[]) => {
    persistence.updateSelection(key, selectedItems);
  }, [key, persistence]);
  
  const updateViewMode = useCallback((viewMode: string) => {
    persistence.updateViewMode(key, viewMode);
  }, [key, persistence]);
  
  const updateSelectedEntity = useCallback((entityId: string) => {
    persistence.updateSelectedEntity(key, entityId);
  }, [key, persistence]);
  
  const updateSelectedAccount = useCallback((accountId: string) => {
    persistence.updateSelectedAccount(key, accountId);
  }, [key, persistence]);
  
  const updateSelectedFilial = useCallback((filialId: string) => {
    persistence.updateSelectedFilial(key, filialId);
  }, [key, persistence]);
  
  const updateSearchTerm = useCallback((searchTerm: string) => {
    persistence.updateSearchTerm(key, searchTerm);
  }, [key, persistence]);
  
  const updateDateRange = useCallback((dateRange: { from?: string; to?: string }) => {
    persistence.updateDateRange(key, dateRange);
  }, [key, persistence]);
  
  const updateCustomSetting = useCallback((settingKey: string, value: any) => {
    persistence.updateCustomSetting(key, settingKey, value);
  }, [key, persistence]);
  
  const clearPageState = useCallback(() => {
    persistence.clearPageState(key);
  }, [key, persistence]);
  
  // Função para atualizar múltiplos campos de uma vez
  const updatePageState = useCallback((state: any) => {
    persistence.setPageState(key, state);
  }, [key, persistence]);
  
  return {
    // Estado atual
    pageState,
    
    // Funções de atualização específicas
    updateFilters,
    updatePagination,
    updateSorting,
    updateSelection,
    updateViewMode,
    updateSelectedEntity,
    updateSelectedAccount,
    updateSelectedFilial,
    updateSearchTerm,
    updateDateRange,
    updateCustomSetting,
    
    // Funções gerais
    updatePageState,
    clearPageState,
    
    // Chave da página atual
    pageKey: key,
  };
}

/**
 * Hook para persistir automaticamente filtros de uma página
 * Sincroniza o estado local com o estado persistido
 */
export function usePersistedFilters<T extends Record<string, any>>(
  initialFilters: T,
  pageKey?: string
) {
  const { pageState, updateFilters } = usePagePersistence(pageKey);
  
  // Mesclar filtros iniciais com filtros persistidos
  const filters = {
    ...initialFilters,
    ...pageState.filters,
  } as T;
  
  const setFilters = useCallback((newFilters: T | ((prev: T) => T)) => {
    const updatedFilters = typeof newFilters === 'function' 
      ? newFilters(filters)
      : newFilters;
    
    updateFilters(updatedFilters);
  }, [filters, updateFilters]);
  
  return [filters, setFilters] as const;
}

/**
 * Hook para persistir automaticamente paginação
 */
export function usePersistedPagination(
  initialPagination: { page: number; pageSize: number },
  pageKey?: string
) {
  const { pageState, updatePagination } = usePagePersistence(pageKey);
  
  const pagination = {
    ...initialPagination,
    ...pageState.pagination,
  };
  
  const setPagination = useCallback((newPagination: { page: number; pageSize: number }) => {
    updatePagination(newPagination);
  }, [updatePagination]);
  
  return [pagination, setPagination] as const;
}

/**
 * Hook para persistir automaticamente ordenação
 */
export function usePersistedSorting(
  initialSorting: { column: string; direction: 'asc' | 'desc' },
  pageKey?: string
) {
  const { pageState, updateSorting } = usePagePersistence(pageKey);
  
  const sorting = {
    ...initialSorting,
    ...pageState.sorting,
  };
  
  const setSorting = useCallback((newSorting: { column: string; direction: 'asc' | 'desc' }) => {
    updateSorting(newSorting);
  }, [updateSorting]);
  
  return [sorting, setSorting] as const;
}

/**
 * Hook para persistir seleção de itens
 */
export function usePersistedSelection(pageKey?: string) {
  const { pageState, updateSelection } = usePagePersistence(pageKey);
  
  const selectedItems = pageState.selectedItems || [];
  
  const setSelectedItems = useCallback((items: string[]) => {
    updateSelection(items);
  }, [updateSelection]);
  
  return [selectedItems, setSelectedItems] as const;
}
