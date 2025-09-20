import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SalesKPIData {
  total_sales: number;
  total_goal: number;
  goal_achievement_percentage: number;
  mom_growth_percentage: number;
  yoy_growth_percentage: number;
  active_salespeople: number;
  top_performer_name: string;
  top_performer_sales: number;
}

interface SalespersonGrowth {
  vendedora_id: string;
  vendedora_nome: string;
  current_sales: number;
  previous_sales?: number;
  previous_year_sales?: number;
  growth_percentage: number;
}

interface MonthlySalesData {
  mes: string;
  vendas: number;
  meta: number;
}

export function useDashboardSalesData(year: number, month: number) {
  const [kpiData, setKpiData] = useState<SalesKPIData | null>(null);
  const [momGrowthData, setMomGrowthData] = useState<SalespersonGrowth[]>([]);
  const [yoyGrowthData, setYoyGrowthData] = useState<SalespersonGrowth[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlySalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Função para buscar vendedoras reais do banco
  const fetchRealSalespeople = async () => {
    try {
      // Primeiro, tentar buscar da tabela vendedoras
      let { data: vendedoras, error: vendError } = await supabase
        .from('vendedoras')
        .select('id, nome, ativo')
        .eq('ativo', true)
        .limit(10);

      if (vendError || !vendedoras || vendedoras.length === 0) {
        // Se não encontrar, tentar buscar fornecedores que são vendedoras
        const { data: fornecedores, error: fornError } = await supabase
          .from('fornecedores')
          .select('id, nome, ativo')
          .eq('eh_vendedora', true)
          .eq('ativo', true)
          .limit(10);

        if (!fornError && fornecedores && fornecedores.length > 0) {
          vendedoras = fornecedores;
        }
      }

      return vendedoras || [];
    } catch (error) {
      console.warn('Erro ao buscar vendedoras reais:', error);
      return [];
    }
  };

  const fetchKPIData = async () => {
    try {
      // Tentar buscar dados reais primeiro
      const { data, error } = await supabase.rpc('get_sales_kpi_data', {
        p_year: year,
        p_month: month
      });

      if (error) {
        console.warn('Erro ao buscar KPI data:', error);
        // Buscar vendedoras reais para criar dados básicos
        const realSalespeople = await fetchRealSalespeople();
        const activeSalespeopleCoun = realSalespeople.length;
        
        setKpiData({
          total_sales: 0,
          total_goal: 0,
          goal_achievement_percentage: 0,
          mom_growth_percentage: 0,
          yoy_growth_percentage: 0,
          active_salespeople: activeSalespeopleCoun,
          top_performer_name: realSalespeople[0]?.nome || "Nenhuma vendedora encontrada",
          top_performer_sales: 0
        });
        return;
      }

      if (data && data.length > 0) {
        setKpiData(data[0]);
      } else {
        // Se não há dados, criar estrutura básica com vendedoras reais
        const realSalespeople = await fetchRealSalespeople();
        setKpiData({
          total_sales: 0,
          total_goal: 0,
          goal_achievement_percentage: 0,
          mom_growth_percentage: 0,
          yoy_growth_percentage: 0,
          active_salespeople: realSalespeople.length,
          top_performer_name: realSalespeople[0]?.nome || "Nenhuma vendedora encontrada",
          top_performer_sales: 0
        });
      }
    } catch (error) {
      console.warn('Erro ao buscar KPI data:', error);
      const realSalespeople = await fetchRealSalespeople();
      setKpiData({
        total_sales: 0,
        total_goal: 0,
        goal_achievement_percentage: 0,
        mom_growth_percentage: 0,
        yoy_growth_percentage: 0,
        active_salespeople: realSalespeople.length,
        top_performer_name: realSalespeople[0]?.nome || "Nenhuma vendedora encontrada",
        top_performer_sales: 0
      });
    }
  };

  const fetchGrowthData = async () => {
    try {
      // Buscar vendedoras reais primeiro
      const realSalespeople = await fetchRealSalespeople();

      // Tentar buscar dados reais de crescimento MoM
      const { data: momData, error: momError } = await supabase.rpc('calculate_mom_growth', {
        p_year: year,
        p_month: month
      });

      if (momError || !momData || momData.length === 0) {
        console.warn('Erro ao buscar dados MoM:', momError);
        // Criar dados básicos com vendedoras reais
        const basicMomData = realSalespeople.map((vendedora, index) => ({
          vendedora_id: vendedora.id,
          vendedora_nome: vendedora.nome,
          current_sales: 0,
          previous_sales: 0,
          growth_percentage: 0
        }));
        setMomGrowthData(basicMomData);
      } else {
        setMomGrowthData(momData);
      }

      // Tentar buscar dados reais de crescimento YoY
      const { data: yoyData, error: yoyError } = await supabase.rpc('calculate_yoy_growth', {
        p_year: year,
        p_month: month
      });

      if (yoyError || !yoyData || yoyData.length === 0) {
        console.warn('Erro ao buscar dados YoY:', yoyError);
        // Criar dados básicos com vendedoras reais
        const basicYoyData = realSalespeople.map((vendedora, index) => ({
          vendedora_id: vendedora.id,
          vendedora_nome: vendedora.nome,
          current_sales: 0,
          previous_year_sales: 0,
          growth_percentage: 0
        }));
        setYoyGrowthData(basicYoyData);
      } else {
        setYoyGrowthData(yoyData);
      }
    } catch (error) {
      console.warn('Erro ao buscar dados de crescimento:', error);
      const realSalespeople = await fetchRealSalespeople();
      const basicData = realSalespeople.map((vendedora) => ({
        vendedora_id: vendedora.id,
        vendedora_nome: vendedora.nome,
        current_sales: 0,
        previous_sales: 0,
        growth_percentage: 0
      }));
      setMomGrowthData(basicData);
      setYoyGrowthData(basicData);
    }
  };

  const fetchMonthlySalesData = async () => {
    try {
      // Tentar buscar dados da materialized view
      const { data, error } = await supabase
        .from('sales_monthly_summary')
        .select('ano, mes, total_vendas, meta_mensal')
        .eq('ano', year)
        .order('mes');

      const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];

      if (error || !data || data.length === 0) {
        console.warn('Erro ao buscar dados mensais:', error);
        // Criar estrutura básica com zeros
        const basicMonthlyData = months.map((name) => ({
          mes: name,
          vendas: 0,
          meta: 0
        }));
        setMonthlySalesData(basicMonthlyData);
        return;
      }

      // Processar dados reais se disponíveis
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthData = data?.filter(item => item.mes === i + 1) || [];
        const totalSales = monthData.reduce((sum, item) => sum + (item.total_vendas || 0), 0);
        const totalGoal = monthData.reduce((sum, item) => sum + (item.meta_mensal || 0), 0);

        return {
          mes: months[i],
          vendas: totalSales,
          meta: totalGoal
        };
      });

      setMonthlySalesData(monthlyData);
    } catch (error) {
      console.warn('Erro ao buscar dados mensais:', error);
      const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];
      const basicMonthlyData = months.map((name) => ({
        mes: name,
        vendas: 0,
        meta: 0
      }));
      setMonthlySalesData(basicMonthlyData);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchKPIData(),
          fetchGrowthData(),
          fetchMonthlySalesData()
        ]);
      } catch (error) {
        console.error('Erro geral ao buscar dados:', error);
        toast({
          title: "Aviso",
          description: "Dados de vendas não configurados. Configure vendedoras e metas no sistema.",
          variant: "default",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year, month]);

  return {
    kpiData,
    momGrowthData,
    yoyGrowthData,
    monthlySalesData,
    loading
  };
}
