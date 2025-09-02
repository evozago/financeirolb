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