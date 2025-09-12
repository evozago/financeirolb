import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client'; // Caminho corrigido
import { Sale, SalespersonGoal } from '../types/payables'; // Caminho corrigido

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
      const { data, error } = await supabase
        .from('store_monthly_sales')
        .select('*')
        .eq('entity_id', entityId)
        .eq('year', year);

      if (error) throw error;
      
      // Preenche os meses que não têm dados
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const existing = data.find(d => d.month === month);
        return existing || { entity_id: entityId, year, month, total_sales: 0 };
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
        const recordToUpsert = {
            entity_id: sale.entity_id,
            year: sale.year,
            month: sale.month,
            total_sales: sale.total_sales
        };

      const { error } = await supabase
        .from('store_monthly_sales')
        .upsert(recordToUpsert, { onConflict: 'entity_id, year, month' });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving store monthly sale:', error);
    }
  }, [entityId]);

  const fetchSalespersonGoals = useCallback(async (year: number) => {
    if (!entityId) return [];
    try {
      // 1. Busca todos os vendedores (pessoas)
      const { data: people, error: peopleError } = await supabase
        .from('pessoas')
        .select('id, nome_razao_social')
        .eq('tipo_pessoa', 'Vendedor'); // ou qualquer que seja o seu filtro para vendedores

      if (peopleError) throw peopleError;

      // 2. Busca as metas já existentes para o ano
      const { data: goals, error: goalsError } = await supabase
        .from('sales_goals')
        .select('*')
        .eq('entity_id', entityId)
        .eq('year', year);

      if (goalsError) throw goalsError;
      
      // 3. Combina os dados
      const combinedData = people.map(person => {
        const monthlyGoals = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const goalRecord = goals.find(g => g.salesperson_id === person.id && g.month === month);
          return {
            month,
            goal_amount: goalRecord ? goalRecord.goal_amount : 0
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
        const recordToUpsert = {
            entity_id: goal.entity_id,
            salesperson_id: goal.salesperson_id,
            year: goal.year,
            month: goal.month,
            goal_amount: goal.goal_amount
        };

      const { error } = await supabase
        .from('sales_goals')
        .upsert(recordToUpsert, { onConflict: 'salesperson_id, entity_id, year, month' });

      if (error) throw error;
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

