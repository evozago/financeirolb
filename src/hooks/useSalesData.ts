import { useState, useEffect } from 'react';

export interface Salesperson {
  id: string;
  nome: string;
  meta_mensal: number;
  supermeta_mensal: number;
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

export interface GrowthSimulation {
  type: 'fixed' | 'percentage';
  value: number;
  enabled: boolean;
}

const STORAGE_KEYS = {
  salespeople: 'sales_management_salespeople',
  monthlySales: 'sales_management_monthly_sales',
  yearlySales: 'sales_management_yearly_sales',
  growthSimulation: 'sales_management_growth_simulation',
  lastUpdate: 'sales_management_last_update'
};

export function useSalesData() {
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [yearlySales, setYearlySales] = useState<YearlySales[]>([]);
  const [growthSimulation, setGrowthSimulation] = useState<GrowthSimulation>({
    type: 'fixed',
    value: 0,
    enabled: false
  });
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const storedSalespeople = localStorage.getItem(STORAGE_KEYS.salespeople);
      const storedMonthlySales = localStorage.getItem(STORAGE_KEYS.monthlySales);
      const storedYearlySales = localStorage.getItem(STORAGE_KEYS.yearlySales);
      const storedGrowthSimulation = localStorage.getItem(STORAGE_KEYS.growthSimulation);
      const storedLastUpdate = localStorage.getItem(STORAGE_KEYS.lastUpdate);

      if (storedSalespeople) setSalespeople(JSON.parse(storedSalespeople));
      if (storedMonthlySales) setMonthlySales(JSON.parse(storedMonthlySales));
      
      if (storedYearlySales) {
        setYearlySales(JSON.parse(storedYearlySales));
      } else {
        // Initialize with 2022 data from the image
        const initial2022Data: YearlySales[] = [
          { year: 2022, month: 1, total_vendas: 145440 },
          { year: 2022, month: 2, total_vendas: 51912 },
          { year: 2022, month: 3, total_vendas: 76282.37 },
          { year: 2022, month: 4, total_vendas: 85641.82 },
          { year: 2022, month: 5, total_vendas: 194924.83 },
          { year: 2022, month: 6, total_vendas: 179640.11 },
          { year: 2022, month: 7, total_vendas: 119190.72 },
          { year: 2022, month: 8, total_vendas: 101530.41 },
          { year: 2022, month: 9, total_vendas: 113588.43 },
          { year: 2022, month: 10, total_vendas: 171966.21 },
          { year: 2022, month: 11, total_vendas: 216776.78 },
          { year: 2022, month: 12, total_vendas: 272129.87 }
        ];
        setYearlySales(initial2022Data);
        saveToStorage(STORAGE_KEYS.yearlySales, initial2022Data);
      }
      
      if (storedGrowthSimulation) setGrowthSimulation(JSON.parse(storedGrowthSimulation));
      if (storedLastUpdate) setLastUpdate(storedLastUpdate);
      else updateLastUpdate();
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Save to localStorage whenever data changes
  const saveToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      updateLastUpdate();
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const updateLastUpdate = () => {
    const now = new Date().toLocaleString('pt-BR');
    setLastUpdate(now);
    localStorage.setItem(STORAGE_KEYS.lastUpdate, now);
  };

  // CRUD operations for salespeople
  const updateSalesperson = (salesperson: Salesperson) => {
    const updated = salespeople.map(s => s.id === salesperson.id ? salesperson : s);
    setSalespeople(updated);
    saveToStorage(STORAGE_KEYS.salespeople, updated);
  };

  const addSalesperson = (salesperson: Omit<Salesperson, 'id'>) => {
    const newSalesperson: Salesperson = {
      ...salesperson,
      id: Date.now().toString()
    };
    const updated = [...salespeople, newSalesperson];
    setSalespeople(updated);
    saveToStorage(STORAGE_KEYS.salespeople, updated);
  };

  const importSalespeople = (newSalespeople: Salesperson[]) => {
    setSalespeople(newSalespeople);
    saveToStorage(STORAGE_KEYS.salespeople, newSalespeople);
  };

  // CRUD operations for monthly sales
  const updateMonthlySale = (sale: MonthlySales) => {
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
    saveToStorage(STORAGE_KEYS.monthlySales, updated);
  };

  // CRUD operations for yearly sales
  const updateYearlySale = (sale: YearlySales) => {
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
    saveToStorage(STORAGE_KEYS.yearlySales, updated);
  };

  // Growth simulation
  const updateGrowthSimulation = (simulation: GrowthSimulation) => {
    setGrowthSimulation(simulation);
    saveToStorage(STORAGE_KEYS.growthSimulation, simulation);
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

  const calculateCommission = (vendedoraId: string, year: number, month: number): number => {
    const salesperson = salespeople.find(s => s.id === vendedoraId);
    if (!salesperson) return 0;

    const sales = getMonthlySales(year, month, vendedoraId);
    
    if (sales <= salesperson.meta_mensal) {
      return sales * 0.03; // 3% up to goal
    } else if (sales <= salesperson.supermeta_mensal) {
      return salesperson.meta_mensal * 0.03; // 3% on goal amount only
    } else {
      // 3% on goal + 5% on amount exceeding super goal
      const baseCommission = salesperson.meta_mensal * 0.03;
      const superGoalCommission = (sales - salesperson.supermeta_mensal) * 0.05;
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

  return {
    // Data
    salespeople,
    monthlySales,
    yearlySales,
    growthSimulation,
    lastUpdate,
    
    // CRUD operations
    updateSalesperson,
    addSalesperson,
    importSalespeople,
    updateMonthlySale,
    updateYearlySale,
    updateGrowthSimulation,
    applyGrowthSimulation,
    
    // Helper functions
    getYearlySales,
    getMonthlySales,
    getYearOverYearGrowth,
    getAccumulatedGrowth,
    calculateCommission,
    getTotalSalesCurrentYear,
    getActiveSalespeopleCount
  };
}