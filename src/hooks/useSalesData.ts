import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../components/auth/AuthProvider';
import { toast } from '../components/ui/use-toast';

// Tipos de dados para as tabelas
export interface YearlySale {
  id?: string;
  year: number;
  month: number;
  total_sales: number;
}

export interface SalespersonGoal {
  id?: string;
  salesperson_id: string;
  year: number;
  month: number;
  goal_amount: number;
}

// Estrutura de dados que os componentes irão usar
export interface YearlyComparisonData {
  month: number;
  monthName: string;
  years: { [year: number]: number | string };
}

export interface SalespersonPanelData {
  salesperson_id: string;
  salesperson_name: string;
  monthly_goals: { [month: number]: number | string };
}

const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function useSalesData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [entityNotSelected, setEntityNotSelected] = useState(false);
  
  // Estado para a tabela de Comparativo Anual
  const [yearlyData, setYearlyData] = useState<YearlyComparisonData[]>([]);
  
  // Estado para o painel de Vendedoras
  const [salespersonData, setSalespersonData] = useState<SalespersonPanelData[]>([]);

  const fetchAllData = useCallback(async () => {
    if (!user) {
        setEntityNotSelected(true);
        setLoading(false);
        return;
    }
    setEntityNotSelected(false);
    setLoading(true);

    try {
      // Initialize with mock data for demonstration
      const yearsToFetch = [currentYear, currentYear - 1, currentYear - 2];
      
      const formattedYearlyData = months.map((monthName, index) => {
        const month = index + 1;
        const data: YearlyComparisonData = {
          month,
          monthName,
          years: {},
        };
        yearsToFetch.forEach(year => {
          data.years[year] = '';
        });
        return data;
      });
      setYearlyData(formattedYearlyData);

      // Initialize with mock salesperson data
      const formattedSalespersonData: SalespersonPanelData[] = [
        {
          salesperson_id: '1',
          salesperson_name: 'Vendedora 1',
          monthly_goals: {}
        },
        {
          salesperson_id: '2', 
          salesperson_name: 'Vendedora 2',
          monthly_goals: {}
        }
      ];
      
      setSalespersonData(formattedSalespersonData);

    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast({ title: "Erro ao buscar dados", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, currentYear]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Funções para atualizar o estado localmente
  const updateYearlySale = (month: number, year: number, value: string) => {
    setYearlyData(prevData =>
      prevData.map(row =>
        row.month === month
          ? { ...row, years: { ...row.years, [year]: value } }
          : row
      )
    );
  };

  const updateSalespersonGoal = (salesperson_id: string, month: number, value: string) => {
    setSalespersonData(prevData =>
      prevData.map(person =>
        person.salesperson_id === salesperson_id
          ? { ...person, monthly_goals: { ...person.monthly_goals, [month]: value } }
          : person
      )
    );
  };

  const saveAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Mock save - would implement actual database saving here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: "Sucesso!", description: "Todos os dados de vendas foram salvos." });
    } catch (error) {
      console.error('Error saving all data:', error);
      toast({ title: "Erro ao salvar", description: (error as Error).message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  return {
    loading,
    entityNotSelected,
    currentYear,
    setCurrentYear,
    yearlyData,
    updateYearlySale,
    salespersonData,
    updateSalespersonGoal,
    saveAllData,
  };
}
