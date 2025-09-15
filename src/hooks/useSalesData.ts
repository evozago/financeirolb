// ARQUIVO COMPLETO — substitua integralmente.
// Fallback automático de entidade: se não houver primaryEntity no contexto
// e existir exatamente 1 entidade corporativa, usa-a para ler/salvar.

import { useState, useEffect, useCallback, useMemo } from 'react';
// ATENÇÃO: ajuste o import abaixo conforme seu projeto.
// Se o seu caminho for "@/src/integrations/supabase/client", troque:
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from '@/components/ui/use-toast';

type YearlySale = {
  entity_id: string;
  year: number;
  month: number;
  total_sales: number;
};

type SalespersonGoal = {
  salesperson_id: string;
  entity_id: string;
  year: number;
  month: number;
  goal_amount: number;
};

export type YearlyComparisonData = {
  month: number;
  monthName: string;
  years: Record<number, number | ''>;
};

export type SalespersonPanelData = {
  salesperson_id: string;
  salesperson_name: string;
  monthly_goals: Record<number, number | ''>;
};

const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

async function getSingleDefaultEntityId(): Promise<string | null> {
  // Tenta nas entidades_corporativas (usadas pela UI). Se não existir, tenta entidades.
  const tryTables = ['entidades_corporativas', 'entidades'];
  for (const tbl of tryTables) {
    const { data, error } = await supabase.from(tbl).select('id').order('created_at', { ascending: true });
    if (!error && data && data.length === 1) return (data[0] as any).id as string;
  }
  return null;
}

export function useSalesData() {
  const { primaryEntity } = useAuth(); // pode estar vazio
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [effectiveEntityId, setEffectiveEntityId] = useState<string | null>(null);

  const [yearlyData, setYearlyData] = useState<YearlyComparisonData[]>([]);
  const [salespersonData, setSalespersonData] = useState<SalespersonPanelData[]>([]);

  const computeEffectiveEntity = useCallback(async () => {
    const ctxId = (primaryEntity as any)?.id ?? null;
    if (ctxId) {
      setEffectiveEntityId(ctxId);
      return ctxId;
    }
    const fallbackId = await getSingleDefaultEntityId();
    setEffectiveEntityId(fallbackId);
    return fallbackId;
  }, [(primaryEntity as any)?.id]);

  const hasEntity = useMemo(() => !!effectiveEntityId, [effectiveEntityId]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const eid = await computeEffectiveEntity();
      if (!eid) {
        setYearlyData([]);
        setSalespersonData([]);
        toast({
          title: 'Selecione a Entidade',
          description: 'Não foi possível determinar automaticamente. Selecione a entidade/filial no topo.',
        });
        return;
      }

      // 1) Comparativo Anual
      const yearsToFetch = [currentYear, currentYear - 1, currentYear - 2];
      const { data: yearlySales, error: yearlyErr } = await supabase
        .from('store_monthly_sales')
        .select('*')
        .eq('entity_id', eid)
        .in('year', yearsToFetch);
      if (yearlyErr) throw yearlyErr;

      const formattedYearly: YearlyComparisonData[] = months.map((name, idx) => {
        const month = idx + 1;
        const row: YearlyComparisonData = { month, monthName: name, years: {} };
        yearsToFetch.forEach((y) => {
          const hit = (yearlySales ?? []).find((s: any) => s.year === y && s.month === month);
          row.years[y] = hit ? Number(hit.total_sales) : '';
        });
        return row;
      });
      setYearlyData(formattedYearly);

      // 2) Painel de Vendedoras
      const { data: vendedoras, error: vendErr } = await supabase
        .from('vendedoras')
        .select('id, nome, ativo')
        .eq('ativo', true);
      if (vendErr) throw vendErr;

      const { data: metas, error: metasErr } = await supabase
        .from('sales_goals')
        .select('salesperson_id, month, goal_amount')
        .eq('entity_id', eid)
        .eq('year', currentYear);
      if (metasErr) throw metasErr;

      const map = new Map<string, Record<number, number>>();
      for (const m of metas ?? []) {
        const sid = (m as any).salesperson_id as string;
        const mm = Number((m as any).month);
        const val = Number((m as any).goal_amount ?? 0);
        const cur = map.get(sid) ?? {};
        cur[mm] = val;
        map.set(sid, cur);
      }

      const formattedSales: SalespersonPanelData[] = (vendedoras ?? []).map((v: any) => ({
        salesperson_id: v.id,
        salesperson_name: v.nome,
        monthly_goals: map.get(v.id) ?? {},
      }));
      setSalespersonData(formattedSales);
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      toast({ title: 'Falha ao carregar', description: err.message ?? String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [computeEffectiveEntity, currentYear]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const updateYearlySale = (month: number, year: number, value: string) => {
    setYearlyData((prev) => prev.map((r) => r.month === month ? ({ ...r, years: { ...r.years, [year]: value } }) : r));
  };

  const updateSalespersonGoal = (salesperson_id: string, month: number, value: string) => {
    setSalespersonData((prev) => prev.map((p) =>
      p.salesperson_id === salesperson_id ? ({ ...p, monthly_goals: { ...p.monthly_goals, [month]: value } }) : p
    ));
  };

  const saveAllData = async () => {
    const eid = (primaryEntity as any)?.id ?? effectiveEntityId;
    if (!eid) {
      toast({ title: 'Selecione a Entidade', description: 'Escolha a entidade/filial e tente novamente.' });
      return;
    }
    setLoading(true);
    try {
      // 1) Totais mensais
      const toUpsertTotals: YearlySale[] = [];
      yearlyData.forEach((row) => {
        Object.entries(row.years).forEach(([yearStr, val]) => {
          if (val !== '' && val !== null && !Number.isNaN(Number(val))) {
            toUpsertTotals.push({
              entity_id: eid,
              year: Number(yearStr),
              month: row.month,
              total_sales: Number(val),
            });
          }
        });
      });
      if (toUpsertTotals.length) {
        const { error } = await supabase
          .from('store_monthly_sales')
          .upsert(toUpsertTotals, { onConflict: 'entity_id, year, month' });
        if (error) throw error;
      }

      -- 2) Metas por vendedora
      const toUpsertGoals: SalespersonGoal[] = [];
      salespersonData.forEach((p) => {
        Object.entries(p.monthly_goals).forEach(([mStr, val]) => {
          if (val !== '' && val !== null && !Number.isNaN(Number(val))) {
            toUpsertGoals.push({
              entity_id: eid,
              salesperson_id: p.salesperson_id,
              year: currentYear,
              month: Number(mStr),
              goal_amount: Number(val),
            });
          }
        });
      });
      if (toUpsertGoals.length) {
        const { error } = await supabase
          .from('sales_goals')
          .upsert(toUpsertGoals, { onConflict: 'salesperson_id, entity_id, year, month' });
        if (error) throw error;
      }

      toast({ title: 'Salvo!', description: 'Vendas e metas persistidas no Supabase.' });
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      toast({ title: 'Falha ao salvar', description: err.message ?? String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    currentYear, setCurrentYear,
    yearlyData, updateYearlySale,
    salespersonData, updateSalespersonGoal,
    saveAllData,
    hasEntity,
  };
}
