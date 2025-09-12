import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

// Mock interfaces for demo purposes  
interface Sale {
  id: string;
  amount: number;
}

interface SalespersonGoal {
  id: string;
  target: number;
}

// Definições de tipo para os novos dados
export interface MonthlyStoreSale {
  id?: string;
  entity_id: string;
  year: number;
  month: number;
  total_sales: number;
}

export interface SalespersonMonthlyGoal {
  id?: string;
  salesperson_id: string;
  entity_id: string;
  year: number;
  month: number;
  goal_amount: number;
  achieved_amount?: number; // O valor realizado pode vir de outra consulta
  salesperson_name?: string;
}

export function useSalesData(entityId: string | null) {
  // ... (código existente, se houver, permanece)
  const [salesBySalesperson, setSalesBySalesperson] = useState<any[]>([]);
  const [loadingSalesperson, setLoadingSalesperson] = useState(false);

  const fetchSalesBySalesperson = useCallback(async () => {
    // ... (código existente, se houver, permanece)
  }, [entityId]);

  useEffect(() => {
    if (entityId) {
      // ... (chamadas existentes, se houver, permanecem)
      fetchSalesBySalesperson();
    }
  }, [entityId, fetchSalesBySalesperson]);
  
  // --- NOVAS FUNÇÕES PARA PERSISTÊNCIA ---

  const fetchStoreMonthlySales = useCallback(async (year: number) => {
    if (!entityId) return [];
    try {
      // Mock data for demo - replace with real database query when tables exist
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        return { entity_id: entityId, year, month, total_sales: Math.floor(Math.random() * 50000) + 10000 };
      });
      return monthlyData;

    } catch (error) {
      console.error('Error fetching store monthly sales:', error);
      return [];
    }
  }, [entityId]);

  const saveStoreMonthlySale = useCallback(async (sale: MonthlyStoreSale) => {
    if (!entityId) return;
    try {
        // Mock save for demo - replace with real database save when tables exist
        console.log('Saving store monthly sale:', sale);
    } catch (error) {
      console.error('Error saving store monthly sale:', error);
    }
  }, [entityId]);

  const fetchSalespersonGoals = useCallback(async (year: number) => {
    if (!entityId) return [];
    try {
      // Mock data for demo - replace with real database query when tables exist  
      const mockPeople = [
        { id: '1', nome_razao_social: 'Maria Silva' },
        { id: '2', nome_razao_social: 'Ana Costa' },
      ];

      const combinedData = mockPeople.map(person => {
        const monthlyGoals = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          return {
            month,
            goal_amount: Math.floor(Math.random() * 20000) + 10000
          };
        });

        return {
          salesperson_id: person.id,
          salesperson_name: person.nome_razao_social,
          year,
          entity_id: entityId,
          monthly_goals: monthlyGoals
        };
      });

      return combinedData;

    } catch (error) {
      console.error('Error fetching salesperson goals:', error);
      return [];
    }
  }, [entityId]);
  
  const saveSalespersonGoal = useCallback(async (goal: {entity_id: string, salesperson_id: string, year: number, month: number, goal_amount: number}) => {
    if (!entityId) return;
    try {
        // Mock save for demo - replace with real database save when tables exist
        console.log('Saving salesperson goal:', goal);
    } catch (error) {
      console.error('Error saving salesperson goal:', error);
    }
  }, [entityId]);


  return {
    // ... retornos existentes ...
    salesBySalesperson,
    loadingSalesperson,
    // --- NOVOS RETORNOS ---
    fetchStoreMonthlySales,
    saveStoreMonthlySale,
    fetchSalespersonGoals,
    saveSalespersonGoal
  };
}

