import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageState {
  filters?: Record<string, any>;
  pagination?: {
    page: number;
    pageSize: number;
  };
  sorting?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  selectedItems?: string[];
  columnOrder?: string[];
  columnVisibility?: Record<string, boolean>;
  viewMode?: string;
  selectedEntity?: string;
  selectedAccount?: string;
  selectedFilial?: string;
  searchTerm?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
  customSettings?: Record<string, any>;
}

interface StatePersistenceContextType {
  getPageState: (pageKey: string) => PageState;
  setPageState: (pageKey: string, state: Partial<PageState>) => void;
  clearPageState: (pageKey: string) => void;
  updateFilters: (pageKey: string, filters: Record<string, any>) => void;
  updatePagination: (pageKey: string, pagination: { page: number; pageSize: number }) => void;
  updateSorting: (pageKey: string, sorting: { column: string; direction: 'asc' | 'desc' }) => void;
  updateSelection: (pageKey: string, selectedItems: string[]) => void;
  updateColumnSettings: (pageKey: string, columnOrder?: string[], columnVisibility?: Record<string, boolean>) => void;
  updateViewMode: (pageKey: string, viewMode: string) => void;
  updateSelectedEntity: (pageKey: string, entityId: string) => void;
  updateSelectedAccount: (pageKey: string, accountId: string) => void;
  updateSelectedFilial: (pageKey: string, filialId: string) => void;
  updateSearchTerm: (pageKey: string, searchTerm: string) => void;
  updateDateRange: (pageKey: string, dateRange: { from?: string; to?: string }) => void;
  updateCustomSetting: (pageKey: string, key: string, value: any) => void;
  clearAllStates: () => void;
  exportStates: () => string;
  importStates: (statesJson: string) => boolean;
}

const StatePersistenceContext = createContext<StatePersistenceContextType | undefined>(undefined);

interface StatePersistenceProviderProps {
  children: ReactNode;
}

export function StatePersistenceProvider({ children }: StatePersistenceProviderProps) {
  const [pageStates, setPageStates] = useState<Record<string, PageState>>({});
  const location = useLocation();

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedStates = localStorage.getItem('pageStates');
      if (savedStates) {
        setPageStates(JSON.parse(savedStates));
      }
    } catch (error) {
      console.error('Error loading page states:', error);
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('pageStates', JSON.stringify(pageStates));
    } catch (error) {
      console.error('Error saving page states:', error);
    }
  }, [pageStates]);

  const getPageState = (pageKey: string): PageState => {
    return pageStates[pageKey] || {};
  };

  const setPageState = (pageKey: string, state: Partial<PageState>) => {
    setPageStates(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        ...state,
      },
    }));
  };

  const clearPageState = (pageKey: string) => {
    setPageStates(prev => {
      const newStates = { ...prev };
      delete newStates[pageKey];
      return newStates;
    });
  };

  const updateFilters = (pageKey: string, filters: Record<string, any>) => {
    setPageState(pageKey, { filters });
  };

  const updatePagination = (pageKey: string, pagination: { page: number; pageSize: number }) => {
    setPageState(pageKey, { pagination });
  };

  const updateSorting = (pageKey: string, sorting: { column: string; direction: 'asc' | 'desc' }) => {
    setPageState(pageKey, { sorting });
  };

  const updateSelection = (pageKey: string, selectedItems: string[]) => {
    setPageState(pageKey, { selectedItems });
  };

  const updateColumnSettings = (pageKey: string, columnOrder?: string[], columnVisibility?: Record<string, boolean>) => {
    const updates: Partial<PageState> = {};
    if (columnOrder) updates.columnOrder = columnOrder;
    if (columnVisibility) updates.columnVisibility = columnVisibility;
    setPageState(pageKey, updates);
  };

  const updateViewMode = (pageKey: string, viewMode: string) => {
    setPageState(pageKey, { viewMode });
  };

  const updateSelectedEntity = (pageKey: string, entityId: string) => {
    setPageState(pageKey, { selectedEntity: entityId });
  };

  const updateSelectedAccount = (pageKey: string, accountId: string) => {
    setPageState(pageKey, { selectedAccount: accountId });
  };

  const updateSelectedFilial = (pageKey: string, filialId: string) => {
    setPageState(pageKey, { selectedFilial: filialId });
  };

  const updateSearchTerm = (pageKey: string, searchTerm: string) => {
    setPageState(pageKey, { searchTerm });
  };

  const updateDateRange = (pageKey: string, dateRange: { from?: string; to?: string }) => {
    setPageState(pageKey, { dateRange });
  };

  const updateCustomSetting = (pageKey: string, key: string, value: any) => {
    const currentState = getPageState(pageKey);
    const customSettings = { ...currentState.customSettings, [key]: value };
    setPageState(pageKey, { customSettings });
  };

  const clearAllStates = () => {
    setPageStates({});
  };

  const exportStates = () => {
    return JSON.stringify(pageStates);
  };

  const importStates = (statesJson: string) => {
    try {
      const states = JSON.parse(statesJson);
      setPageStates(states);
      return true;
    } catch (error) {
      console.error('Erro ao importar estados:', error);
      return false;
    }
  };

  return (
    <StatePersistenceContext.Provider
      value={{
        getPageState,
        setPageState,
        clearPageState,
        updateFilters,
        updatePagination,
        updateSorting,
        updateSelection,
        updateColumnSettings,
        updateViewMode,
        updateSelectedEntity,
        updateSelectedAccount,
        updateSelectedFilial,
        updateSearchTerm,
        updateDateRange,
        updateCustomSetting,
        clearAllStates,
        exportStates,
        importStates,
      }}
    >
      {children}
    </StatePersistenceContext.Provider>
  );
}

export function useStatePersistence() {
  const context = useContext(StatePersistenceContext);
  if (context === undefined) {
    throw new Error('useStatePersistence must be used within a StatePersistenceProvider');
  }
  return context;
}