import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/components/ui/use-toast';

// --- Interfaces de Tipos ---
export interface YearlySale {
  id?: string;
  entity_id: string;
  year: number;
  month: number;
  total_sales: number;
}

export interface SalespersonGoal {
  id?: string;
  salesperson_id: string;
  entity_id: string;
  year: number;
  month: number;
  goal_amount: number;
}

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

// --- Definição do Contexto ---
interface SalesDataContextType {
  loading: boolean;
  entityNotSelected: boolean;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  yearlyData: YearlyComparisonData[];
  updateYearlySale: (month: number, year: number, value: string) => void;
  salespersonData: SalespersonPanelData[];
  updateSalespersonGoal: (salesperson_id: string, month: number, value: string) => void;
  saveAllData: () => Promise<void>;
}

const SalesDataContext = createContext<SalesDataContextType | undefined>(undefined);

const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// --- Componente Provedor ---
export function SalesDataProvider({ children }: { children: ReactNode }) {
  const { primaryEntity } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [entityNotSelected, setEntityNotSelected] = useState(false);
  
  const [yearlyData, setYearlyData] = useState<YearlyComparisonData[]>([]);
  const [salespersonData, setSalespersonData] = useState<SalespersonPanelData[]>([]);

  const fetchAllData = useCallback(async () => {
    if (!primaryEntity) {
      setEntityNotSelected(true);
      setLoading(false);
      return;
    }
    setEntityNotSelected(false);
    setLoading(true);

    try {
      const yearsToFetch = [currentYear, currentYear - 1, currentYear - 2];
      const { data: yearlySales, error: yearlyError } = await supabase
        .from('store_monthly_sales')
        .select('*')
        .eq('entity_id', primaryEntity.id)
        .in('year', yearsToFetch);
      if (yearlyError) throw yearlyError;

      const formattedYearlyData = months.map((monthName, index) => {
        const month = index + 1;
        const data: YearlyComparisonData = { month, monthName, years: {} };
        yearsToFetch.forEach(year => {
          const sale = yearlySales.find(s => s.year === year && s.month === month);
          data.years[year] = sale ? sale.total_sales : '';
        });
        return data;
      });
      setYearlyData(formattedYearlyData);

      const { data: people, error: peopleError } = await supabase
        .from('pessoas')
        .select('id, nome_razao_social')
        .eq('tipo_pessoa', 'Vendedor');
      if (peopleError) throw peopleError;

      const { data: goals, error: goalsError } = await supabase
        .from('sales_goals')
        .select('*')
        .eq('entity_id', primaryEntity.id)
        .eq('year', currentYear);
      if (goalsError) throw goalsError;

      const formattedSalespersonData = people.map(person => {
        const personGoals: SalespersonPanelData = {
          salesperson_id: person.id,
          salesperson_name: person.nome_razao_social,
          monthly_goals: {},
        };
        months.forEach((_, index) => {
          const month = index + 1;
          const goal = goals.find(g => g.salesperson_id === person.id && g.month === month);
          personGoals.monthly_goals[month] = goal ? goal.goal_amount : '';
        });
        return personGoals;
      });
      setSalespersonData(formattedSalespersonData);

    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast({ title: "Erro ao buscar dados", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [primaryEntity, currentYear]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const updateYearlySale = (month: number, year: number, value: string) => {
    setYearlyData(prevData =>
      prevData.map(row =>
        row.month === month ? { ...row, years: { ...row.years, [year]: value } } : row
      )
    );
  };

  const updateSalespersonGoal = (salesperson_id: string, month: number, value: string) => {
    setSalespersonData(prevData =>
      prevData.map(person =>
        person.salesperson_id === salesperson_id ? { ...person, monthly_goals: { ...person.monthly_goals, [month]: value } } : person
      )
    );
  };

  const saveAllData = async () => {
    if (!primaryEntity) return;
    setLoading(true);
    try {
      const yearlySalesToUpsert: YearlySale[] = [];
      yearlyData.forEach(row => {
        Object.entries(row.years).forEach(([year, total_sales]) => {
          if (total_sales !== '' && total_sales !== null) {
            yearlySalesToUpsert.push({
              entity_id: primaryEntity.id,
              year: parseInt(year),
              month: row.month,
              total_sales: parseFloat(String(total_sales)),
            });
          }
        });
      });

      if (yearlySalesToUpsert.length > 0) {
        const { error: yearlyError } = await supabase.from('store_monthly_sales').upsert(yearlySalesToUpsert, { onConflict: 'entity_id, year, month' });
        if (yearlyError) throw yearlyError;
      }

      const salespersonGoalsToUpsert: SalespersonGoal[] = [];
      salespersonData.forEach(person => {
        Object.entries(person.monthly_goals).forEach(([month, goal_amount]) => {
          if (goal_amount !== '' && goal_amount !== null) {
            salespersonGoalsToUpsert.push({
              entity_id: primaryEntity.id,
              salesperson_id: person.salesperson_id,
              year: currentYear,
              month: parseInt(month),
              goal_amount: parseFloat(String(goal_amount)),
            });
          }
        });
      });
      
      if (salespersonGoalsToUpsert.length > 0) {
        const { error: goalsError } = await supabase.from('sales_goals').upsert(salespersonGoalsToUpsert, { onConflict: 'salesperson_id, entity_id, year, month' });
        if (goalsError) throw goalsError;
      }

      toast({ title: "Sucesso!", description: "Todos os dados de vendas foram salvos." });
      
    } catch (error) {
      console.error('Error saving all data:', error);
      toast({ title: "Erro ao salvar", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const value = {
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

  return <SalesDataContext.Provider value={value}>{children}</SalesDataContext.Provider>;
}

// --- Hook para Consumir o Contexto ---
export function useSalesData() {
  const context = useContext(SalesDataContext);
  if (context === undefined) {
    throw new Error('useSalesData must be used within a SalesDataProvider');
  }
  return context;
}

