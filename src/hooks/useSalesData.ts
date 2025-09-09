import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Salesperson {
  id: string;
  nome: string;
  meta_mensal: number;
  supermeta_mensal: number;
  metas_mensais: { [key: string]: number }; // key format: "YYYY-MM"
  supermetas_mensais: { [key: string]: number }; // key format: "YYYY-MM"
}

export interface MonthlySales {
  year: number;
  month: number;
  vendedora_id: string;
  vendas: number;
}

export interface YearlySales {
  year: number;
  month: number;
  total_vendas: number;
}

export interface YearConfig {
  years: number[];
}

export interface GrowthSimulation {
  type: 'fixed' | 'percentage';
  value: number;
  enabled: boolean;
}

export function useSalesData() {
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [yearlySales, setYearlySales] = useState<YearlySales[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [growthSimulation, setGrowthSimulation] = useState<GrowthSimulation>({
    type: 'fixed',
    value: 0,
    enabled: false
  });
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load data from Supabase on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSalespeople(),
        loadYearlySales(),
        loadMonthlySales(),
        loadAvailableYears()
      ]);
    } catch (error) {
      console.error('Error loading sales data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Erro ao carregar dados de vendas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSalespeople = async () => {
    try {
      // Try to load from vendedoras table
      const { data } = await supabase
        .from('vendedoras')
        .select('*')
        .eq('ativo', true);

      if (data) {
        const formattedSalespeople: Salesperson[] = data.map(v => ({
          id: v.id,
          nome: v.nome,
          meta_mensal: 0,
          supermeta_mensal: 0,
          metas_mensais: {},
          supermetas_mensais: {}
        }));
        setSalespeople(formattedSalespeople);
      }
    } catch (error) {
      console.error('Error loading salespeople:', error);
    }
  };

  const loadYearlySales = async () => {
    try {
      // Calculate yearly totals from vendas table
      const { data } = await supabase
        .from('vendas')
        .select('valor_venda, data_venda')
        .order('data_venda');

      if (data) {
        // Group by year and month
        const salesByMonth: { [key: string]: number } = {};
        
        data.forEach(venda => {
          const date = new Date(venda.data_venda);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const key = `${year}-${month}`;
          
          salesByMonth[key] = (salesByMonth[key] || 0) + (venda.valor_venda || 0);
        });

        const formattedData: YearlySales[] = Object.entries(salesByMonth).map(([key, total]) => {
          const [year, month] = key.split('-').map(Number);
          return {
            year,
            month,
            total_vendas: total
          };
        });
        
        setYearlySales(formattedData);
      }
    } catch (error) {
      console.error('Error loading yearly sales:', error);
    }
  };

  const loadMonthlySales = async () => {
    try {
      const { data } = await supabase
        .from('vendas')
        .select('valor_venda, data_venda, vendedora_id')
        .order('data_venda');

      if (data) {
        // Group by year, month, and vendedora_id
        const salesByVendedora: { [key: string]: number } = {};
        
        data.forEach(venda => {
          if (!venda.vendedora_id) return;
          
          const date = new Date(venda.data_venda);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const key = `${year}-${month}-${venda.vendedora_id}`;
          
          salesByVendedora[key] = (salesByVendedora[key] || 0) + (venda.valor_venda || 0);
        });

        const formattedData: MonthlySales[] = Object.entries(salesByVendedora).map(([key, vendas]) => {
          const [year, month, vendedora_id] = key.split('-');
          return {
            year: Number(year),
            month: Number(month),
            vendedora_id,
            vendas
          };
        });
        
        setMonthlySales(formattedData);
      }
    } catch (error) {
      console.error('Error loading monthly sales:', error);
    }
  };

  const loadAvailableYears = async () => {
    try {
      const { data } = await supabase
        .from('vendas')
        .select('data_venda')
        .order('data_venda');

      if (data && data.length > 0) {
        const years = [...new Set(data.map(d => new Date(d.data_venda).getFullYear()))];
        const currentYear = new Date().getFullYear();
        const allYears = [...new Set([...years, currentYear, currentYear + 1])].sort();
        setAvailableYears(allYears);
      } else {
        const currentYear = new Date().getFullYear();
        const initialYears = [2022, 2023, currentYear, currentYear + 1];
        setAvailableYears(initialYears);
      }
    } catch (error) {
      console.error('Error loading available years:', error);
      const currentYear = new Date().getFullYear();
      setAvailableYears([2022, 2023, currentYear, currentYear + 1]);
    }
  };

  const updateLastUpdate = () => {
    const now = new Date().toLocaleString('pt-BR');
    setLastUpdate(now);
  };

  // CRUD operations for salespeople  
  const updateSalesperson = async (salesperson: Salesperson) => {
    // Just update local state since we'll store metas separately
    const updated = salespeople.map(s => s.id === salesperson.id ? salesperson : s);
    setSalespeople(updated);
    updateLastUpdate();
  };

  const addSalesperson = async (salesperson: Omit<Salesperson, 'id'>) => {
    const newSalesperson: Salesperson = {
      ...salesperson,
      id: Date.now().toString(),
      metas_mensais: salesperson.metas_mensais || {},
      supermetas_mensais: salesperson.supermetas_mensais || {}
    };
    const updated = [...salespeople, newSalesperson];
    setSalespeople(updated);
    updateLastUpdate();
  };

  const importSalespeople = (newSalespeople: Salesperson[]) => {
    setSalespeople(newSalespeople);
    updateLastUpdate();
  };

  // CRUD operations for monthly sales
  const updateMonthlySale = async (sale: MonthlySales) => {
    // For now, just update local state - we could create actual sales records later
    const existing = monthlySales.findIndex(s => 
      s.year === sale.year && 
      s.month === sale.month && 
      s.vendedora_id === sale.vendedora_id
    );

    let updated;
    if (existing >= 0) {
      updated = monthlySales.map((s, i) => i === existing ? sale : s);
    } else {
      updated = [...monthlySales, sale];
    }
    
    setMonthlySales(updated);
    updateLastUpdate();
  };

  // CRUD operations for yearly sales
  const updateYearlySale = async (sale: YearlySales) => {
    // For now, just update local state - we could store this in a summary table later
    const existing = yearlySales.findIndex(s => 
      s.year === sale.year && s.month === sale.month
    );

    let updated;
    if (existing >= 0) {
      updated = yearlySales.map((s, i) => i === existing ? sale : s);
    } else {
      updated = [...yearlySales, sale];
    }
    
    setYearlySales(updated);
    updateLastUpdate();
  };

  // Growth simulation
  const updateGrowthSimulation = (simulation: GrowthSimulation) => {
    setGrowthSimulation(simulation);
    updateLastUpdate();
  };

  // Apply growth simulation to future months
  const applyGrowthSimulation = (baseYear: number, baseMonth: number) => {
    if (!growthSimulation.enabled) return;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const baseValue = getYearlySales(baseYear, baseMonth);
    let projectedValue = baseValue;

    // Apply simulation to future months
    for (let year = baseYear; year <= currentYear + 2; year++) {
      const startMonth = year === baseYear ? baseMonth + 1 : 1;
      const endMonth = year === currentYear + 2 ? 12 : 12;

      for (let month = startMonth; month <= endMonth; month++) {
        if (year === currentYear && month <= currentMonth) continue;

        if (growthSimulation.type === 'fixed') {
          projectedValue += growthSimulation.value;
        } else {
          projectedValue *= (1 + growthSimulation.value / 100);
        }

        updateYearlySale({
          year,
          month,
          total_vendas: Math.round(projectedValue)
        });
      }
    }
  };

  // Helper functions
  const getYearlySales = (year: number, month: number): number => {
    const sale = yearlySales.find(s => s.year === year && s.month === month);
    return sale?.total_vendas || 0;
  };

  const getMonthlySales = (year: number, month: number, vendedoraId: string): number => {
    const sale = monthlySales.find(s => 
      s.year === year && s.month === month && s.vendedora_id === vendedoraId
    );
    return sale?.vendas || 0;
  };

  const getYearOverYearGrowth = (year: number, month: number): number => {
    const current = getYearlySales(year, month);
    const previous = getYearlySales(year - 1, month);
    
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getAccumulatedGrowth = (year: number): number => {
    const currentTotal = yearlySales
      .filter(s => s.year === year)
      .reduce((sum, s) => sum + s.total_vendas, 0);
    
    const previousTotal = yearlySales
      .filter(s => s.year === year - 1)
      .reduce((sum, s) => sum + s.total_vendas, 0);
    
    if (previousTotal === 0) return currentTotal > 0 ? 100 : 0;
    return ((currentTotal - previousTotal) / previousTotal) * 100;
  };

  const getMonthlyMeta = (vendedoraId: string, year: number, month: number): number => {
    const salesperson = salespeople.find(s => s.id === vendedoraId);
    if (!salesperson) return 0;
    
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    return salesperson.metas_mensais?.[monthKey] || salesperson.meta_mensal || 0;
  };

  const getMonthlySupermeta = (vendedoraId: string, year: number, month: number): number => {
    const salesperson = salespeople.find(s => s.id === vendedoraId);
    if (!salesperson) return 0;
    
    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    return salesperson.supermetas_mensais?.[monthKey] || salesperson.supermeta_mensal || 0;
  };

  const updateMonthlyMeta = async (vendedoraId: string, year: number, month: number, meta: number, supermeta: number) => {
    const salesperson = salespeople.find(s => s.id === vendedoraId);
    if (!salesperson) return;

    const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
    const updatedSalesperson = {
      ...salesperson,
      metas_mensais: {
        ...(salesperson.metas_mensais || {}),
        [monthKey]: meta
      },
      supermetas_mensais: {
        ...(salesperson.supermetas_mensais || {}),
        [monthKey]: supermeta
      }
    };

    try {
      // Try to save to metas_mensais table
      await supabase
        .from('metas_mensais')
        .upsert({
          vendedora_id: vendedoraId,
          ano: year,
          mes: month,
          meta_valor: meta,
          supermeta_valor: supermeta
        });

      const updated = salespeople.map(s => s.id === vendedoraId ? updatedSalesperson : s);
      setSalespeople(updated);
      updateLastUpdate();
    } catch (error) {
      console.error('Error updating monthly meta:', error);
      // Still update local state even if database save fails
      const updated = salespeople.map(s => s.id === vendedoraId ? updatedSalesperson : s);
      setSalespeople(updated);
      updateLastUpdate();
    }
  };

  const calculateCommission = (vendedoraId: string, year: number, month: number): number => {
    const salesperson = salespeople.find(s => s.id === vendedoraId);
    if (!salesperson) return 0;

    const sales = getMonthlySales(year, month, vendedoraId);
    const meta = getMonthlyMeta(vendedoraId, year, month);
    const supermeta = getMonthlySupermeta(vendedoraId, year, month);
    
    if (sales <= meta) {
      return sales * 0.03; // 3% up to goal
    } else if (sales <= supermeta) {
      return meta * 0.03; // 3% on goal amount only
    } else {
      // 3% on goal + 5% on amount exceeding super goal
      const baseCommission = meta * 0.03;
      const superGoalCommission = (sales - supermeta) * 0.05;
      return baseCommission + superGoalCommission;
    }
  };

  const getTotalSalesCurrentYear = (): number => {
    const currentYear = new Date().getFullYear();
    return yearlySales
      .filter(s => s.year === currentYear)
      .reduce((sum, s) => sum + s.total_vendas, 0);
  };

  const getActiveSalespeopleCount = (): number => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const activeSellers = new Set(
      monthlySales
        .filter(s => s.year === currentYear && s.month === currentMonth && s.vendas > 0)
        .map(s => s.vendedora_id)
    );
    
    return activeSellers.size;
  };

  const getMonthlyMetaTotal = (year: number, month: number): number => {
    return salespeople.reduce((total, salesperson) => {
      return total + getMonthlyMeta(salesperson.id, year, month);
    }, 0);
  };

  // Year management
  const addYear = async (year: number) => {
    if (!availableYears.includes(year)) {
      const updated = [...availableYears, year].sort((a, b) => a - b);
      setAvailableYears(updated);
      updateLastUpdate();
    }
  };

  const removeYear = async (year: number) => {
    // Update local state
    const updated = availableYears.filter(y => y !== year);
    setAvailableYears(updated);
    
    const updatedYearlySales = yearlySales.filter(s => s.year !== year);
    setYearlySales(updatedYearlySales);
    
    const updatedMonthlySales = monthlySales.filter(s => s.year !== year);
    setMonthlySales(updatedMonthlySales);
    
    updateLastUpdate();
  };

  return {
    // Data
    salespeople,
    monthlySales,
    yearlySales,
    availableYears,
    growthSimulation,
    lastUpdate,
    loading,
    
    // CRUD operations
    updateSalesperson,
    addSalesperson,
    importSalespeople,
    updateMonthlySale,
    updateYearlySale,
    updateGrowthSimulation,
    applyGrowthSimulation,
    
    // Data loading
    loadAllData,
    
    // Year management
    addYear,
    removeYear,
    
    // Helper functions
    getYearlySales,
    getMonthlySales,
    getYearOverYearGrowth,
    getAccumulatedGrowth,
    calculateCommission,
    getTotalSalesCurrentYear,
    getActiveSalespeopleCount,
    getMonthlyMeta,
    getMonthlySupermeta,
    updateMonthlyMeta,
    getMonthlyMetaTotal
  };
}