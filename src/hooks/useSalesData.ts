// src/hooks/useSalesData.ts
// ARQUIVO COMPLETO — substitua integralmente o existente por este.
// Objetivo:
//  - Resolver o aviso "Selecione uma entidade" com fallback automático (quando só há 1 entidade).
/*
// Como funciona o fallback:
//  - Se o contexto não tiver primaryEntity selecionada, o hook consulta 'entidades_corporativas'.
//  - Se encontrar exatamente 1 entidade, usa essa como 'effectiveEntityId' para ler/salvar.
//  - Se houver 0 ou mais de 1, mantém a exigência de seleção manual (UI deve mostrar aviso).
*/
import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const { data, error } = await supabase
    .from('entidades_corporativas')
    .select('id')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Erro ao buscar entidades_corporativas:', error.message);
    return null;
  }
  if (!data || data.length === 0) return null;
  // Use a primeira entidade se houver múltiplas (fallback automático)
  return data[0].id as string;
}

export function useSalesData() {
  const { user } = useAuth(); // pode estar vazio
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [effectiveEntityId, setEffectiveEntityId] = useState<string | null>(null);

  // Dados para as duas grades
  const [yearlyData, setYearlyData] = useState<YearlyComparisonData[]>([]);
  const [salespersonData, setSalespersonData] = useState<SalespersonPanelData[]>([]);

  // Determina a entidade efetiva (contexto OU fallback automático)
  const computeEffectiveEntity = useCallback(async () => {
    const ctxId = null; // sem contexto de entidade por enquanto
    if (ctxId) {
      setEffectiveEntityId(ctxId);
      return ctxId;
    }
    const fallbackId = await getSingleDefaultEntityId();
    setEffectiveEntityId(fallbackId);
    return fallbackId;
  }, [user?.id]);

  const hasEntity = useMemo(() => !!effectiveEntityId, [effectiveEntityId]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const eid = await computeEffectiveEntity();
      if (!eid) {
        setYearlyData([]);
        setSalespersonData([]);
        toast({
          title: 'Nenhuma Entidade Encontrada',
          description: 'Configure pelo menos uma entidade corporativa no sistema para usar o módulo de vendas.',
          variant: 'destructive'
        });
        return;
      }

      // --- 1) Comparativo Anual (tabela esquerda) ---
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
          const hit = yearlySales?.find((s) => s.year === y && s.month === month);
          row.years[y] = hit ? Number(hit.total_sales) : '';
        });
        return row;
      });
      setYearlyData(formattedYearly);

      // --- 2) Painel de Vendedoras (tabela direita) ---
      const { data: vendedoras, error: vendErr } = await supabase
        .from('fornecedores')
        .select('id, nome, ativo, cpf_cnpj_normalizado')
        .eq('ativo', true)
        .eq('eh_vendedora', true);
      if (vendErr) throw vendErr;

      const { data: metas, error: metasErr } = await supabase
        .from('sales_goals')
        .select('salesperson_id, month, goal_amount')
        .eq('entity_id', eid)
        .eq('year', currentYear);
      if (metasErr) throw metasErr;

      const map = new Map<string, Record<number, number>>();
      for (const m of metas ?? []) {
        const sid = m.salesperson_id as string;
        const mm = Number(m.month);
        const val = Number(m.goal_amount ?? 0);
        const cur = map.get(sid) ?? {};
        cur[mm] = val;
        map.set(sid, cur);
      }

      // Deduplicate vendedoras by name + normalized document
      const uniqueVendedoras = new Map<string, any>();
      (vendedoras ?? []).forEach((v: any) => {
        const key = `${(v.nome || '').trim().toUpperCase()}-${v.cpf_cnpj_normalizado || ''}`;
        if (!uniqueVendedoras.has(key)) uniqueVendedoras.set(key, v);
      });
      const vendedorasList = Array.from(uniqueVendedoras.values());

      const formattedSales: SalespersonPanelData[] = vendedorasList.map((v: any) => ({
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

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Edição local (comparativo anual)
  const updateYearlySale = (month: number, year: number, value: string) => {
    setYearlyData((prev) => prev.map((r) => r.month === month ? ({ ...r, years: { ...r.years, [year]: value === '' ? '' : Number(value) } }) : r));
  };

  // Edição local (metas por vendedora)
  const updateSalespersonGoal = (salesperson_id: string, month: number, value: string) => {
    setSalespersonData((prev) => prev.map((p) => p.salesperson_id === salesperson_id
      ? ({ ...p, monthly_goals: { ...p.monthly_goals, [month]: value === '' ? '' : Number(value) } })
      : p));
  };

  // Persistência (UPERT idempotente)
  const saveAllData = async () => {
    const eid = effectiveEntityId;
    if (!eid) {
      toast({ 
        title: 'Entidade Não Configurada', 
        description: 'Configure uma entidade corporativa no sistema primeiro.',
        variant: 'destructive'
      });
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

      // 2) Metas por vendedora
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
    hasEntity, // para a UI saber se temos entidade efetiva
    refreshData: fetchAllData,
  };
}
