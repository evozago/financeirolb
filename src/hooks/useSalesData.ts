// src/hooks/useSalesData.ts
// Arquivo COMPLETO — substitua integralmente o existente por este
// Objetivo: usar TABELAS REAIS do Supabase (store_monthly_sales, sales_goals, vendedoras)
// e garantir que tudo fique SALVO no banco (nada se perde ao atualizar a página).

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/components/ui/use-toast';

// Tipos para as tabelas usadas
export interface YearlySale {
  entity_id: string;
  year: number;
  month: number;
  total_sales: number;
}

export interface SalespersonGoal {
  salesperson_id: string;
  entity_id: string;
  year: number;
  month: number;
  goal_amount: number;
}

// Estruturas para os componentes
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

const months = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

export function useSalesData() {
  const { primaryEntity } = useAuth(); // entity selecionada no app
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Comparativo Anual (tabela da esquerda)
  const [yearlyData, setYearlyData] = useState<YearlyComparisonData[]>([]);

  // Painel de Vendedoras (tabela da direita)
  const [salespersonData, setSalespersonData] = useState<SalespersonPanelData[]>([]);

  // Carrega TUDO do banco
  const fetchAllData = useCallback(async () => {
    if (!primaryEntity) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // 1) Comparativo anual: lê store_monthly_sales para (ano atual, -1, -2)
      const yearsToFetch = [currentYear, currentYear - 1, currentYear - 2];
      const { data: yearlySales, error: yearlyError } = await supabase
        .from('store_monthly_sales')
        .select('*')
        .eq('entity_id', primaryEntity.id)
        .in('year', yearsToFetch);
      if (yearlyError) throw yearlyError;

      const formattedYearlyData: YearlyComparisonData[] = months.map((monthName, idx) => {
        const month = idx + 1;
        const row: YearlyComparisonData = { month, monthName, years: {} };
        yearsToFetch.forEach((y) => {
          const hit = yearlySales?.find((s) => s.year === y && s.month === month);
          row.years[y] = hit ? Number(hit.total_sales) : '';
        });
        return row;
      });
      setYearlyData(formattedYearlyData);

      // 2) Painel de vendedoras: ler vendedoras ATIVAS + metas já salvas no ano atual
      const { data: people, error: peopleError } = await supabase
        .from('vendedoras')
        .select('id, nome, ativo')
        .eq('ativo', true);
      if (peopleError) throw peopleError;

      const { data: goals, error: goalsError } = await supabase
        .from('sales_goals')
        .select('*')
        .eq('entity_id', primaryEntity.id)
        .eq('year', currentYear);
      if (goalsError) throw goalsError;

      const formattedSalesperson: SalespersonPanelData[] = (people ?? []).map((p) => {
        const person: SalespersonPanelData = {
          salesperson_id: p.id,
          salesperson_name: p.nome,
          monthly_goals: {}
        };
        for (let m = 1; m <= 12; m++) {
          const g = (goals ?? []).find((gg) => gg.salesperson_id === p.id && gg.month === m);
          person.monthly_goals[m] = g ? Number(g.goal_amount) : '';
        }
        return person;
      });
      setSalespersonData(formattedSalesperson);
    } catch (err: any) {
      console.error('Erro ao buscar dados de vendas:', err);
      toast({ title: 'Erro ao buscar dados', description: err.message ?? String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [primaryEntity, currentYear]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Atualiza valor em memória (tabela comparativo anual)
  const updateYearlySale = (month: number, year: number, value: string) => {
    setYearlyData((prev) =>
      prev.map((row) =>
        row.month === month ? { ...row, years: { ...row.years, [year]: value } } : row
      )
    );
  };

  // Atualiza valor em memória (tabela metas por vendedora)
  const updateSalespersonGoal = (salesperson_id: string, month: number, value: string) => {
    setSalespersonData((prev) =>
      prev.map((p) =>
        p.salesperson_id === salesperson_id
          ? { ...p, monthly_goals: { ...p.monthly_goals, [month]: value } }
          : p
      )
    );
  };

  // SALVAR TUDO no banco (upsert — não duplica)
  const saveAllData = async () => {
    if (!primaryEntity) return;
    setLoading(true);

    try {
      // 1) store_monthly_sales
      const toUpsertYearly: YearlySale[] = [];
      yearlyData.forEach((row) => {
        Object.entries(row.years).forEach(([yStr, val]) => {
          if (val !== '' && val !== null && !Number.isNaN(Number(val))) {
            toUpsertYearly.push({
              entity_id: primaryEntity.id,
              year: Number(yStr),
              month: row.month,
              total_sales: Number(val),
            });
          }
        });
      });
      if (toUpsertYearly.length > 0) {
        const { error } = await supabase
          .from('store_monthly_sales')
          .upsert(toUpsertYearly, { onConflict: 'entity_id, year, month' });
        if (error) throw error;
      }

      // 2) sales_goals
      const toUpsertGoals: SalespersonGoal[] = [];
      salespersonData.forEach((p) => {
        Object.entries(p.monthly_goals).forEach(([mStr, val]) => {
          if (val !== '' && val !== null && !Number.isNaN(Number(val))) {
            toUpsertGoals.push({
              entity_id: primaryEntity.id,
              salesperson_id: p.salesperson_id,
              year: currentYear,
              month: Number(mStr),
              goal_amount: Number(val),
            });
          }
        });
      });
      if (toUpsertGoals.length > 0) {
        const { error } = await supabase
          .from('sales_goals')
          .upsert(toUpsertGoals, { onConflict: 'salesperson_id, entity_id, year, month' });
        if (error) throw error;
      }

      toast({ title: 'Sucesso!', description: 'Dados de vendas e metas salvos no Supabase.' });
    } catch (err: any) {
      console.error('Erro ao salvar dados:', err);
      toast({ title: 'Erro ao salvar', description: err.message ?? String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    currentYear,
    setCurrentYear,
    yearlyData,
    updateYearlySale,
    salespersonData,
    updateSalespersonGoal,
    saveAllData,
  };
}
