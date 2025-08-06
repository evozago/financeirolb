/**
 * Hook para gerenciar personalização de colunas
 */

import { useState, useEffect } from 'react';
import { ColumnConfig } from '@/components/features/payables/ColumnCustomizer';

interface UseColumnCustomizationProps {
  defaultColumns: ColumnConfig[];
  storageKey: string;
}

export function useColumnCustomization({ defaultColumns, storageKey }: UseColumnCustomizationProps) {
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);

  // Carregar configuração salva do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedColumns = JSON.parse(saved);
        // Verificar se todas as colunas padrão existem na configuração salva
        const mergedColumns = defaultColumns.map(defaultCol => {
          const savedCol = savedColumns.find((col: ColumnConfig) => col.key === defaultCol.key);
          return savedCol ? { ...defaultCol, ...savedCol } : defaultCol;
        });
        
        // Ordenar pelas configurações salvas
        mergedColumns.sort((a, b) => a.order - b.order);
        setColumns(mergedColumns);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de colunas:', error);
      setColumns(defaultColumns);
    }
  }, [defaultColumns, storageKey]);

  // Salvar configuração no localStorage
  const saveColumns = (newColumns: ColumnConfig[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newColumns));
      setColumns(newColumns);
    } catch (error) {
      console.error('Erro ao salvar configuração de colunas:', error);
    }
  };

  // Obter apenas colunas visíveis ordenadas
  const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order);

  return {
    columns,
    visibleColumns,
    saveColumns,
    resetColumns: () => {
      try {
        localStorage.removeItem(storageKey);
        setColumns(defaultColumns);
      } catch (error) {
        console.error('Erro ao resetar configuração de colunas:', error);
      }
    }
  };
}