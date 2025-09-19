import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, TrendingDown, Target, Users, Trophy, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export default function DashboardSales() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [kpiData, setKpiData] = useState<SalesKPIData | null>(null);
  const [momGrowthData, setMomGrowthData] = useState<SalespersonGrowth[]>([]);
  const [yoyGrowthData, setYoyGrowthData] = useState<SalespersonGrowth[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlySalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const fetchKPIData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_sales_kpi_data', {
        p_year: selectedYear,
        p_month: selectedMonth
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setKpiData(data[0]);
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de KPI",
        variant: "destructive",
      });
    }
  };

  const fetchGrowthData = async () => {
    try {
      // Fetch MoM growth data
      const { data: momData, error: momError } = await supabase.rpc('calculate_mom_growth', {
        p_year: selectedYear,
        p_month: selectedMonth
      });

      if (momError) throw momError;
      setMomGrowthData(momData || []);

      // Fetch YoY growth data
      const { data: yoyData, error: yoyError } = await supabase.rpc('calculate_yoy_growth', {
        p_year: selectedYear,
        p_month: selectedMonth
      });

      if (yoyError) throw yoyError;
      setYoyGrowthData(yoyData || []);
    } catch (error) {
      console.error('Error fetching growth data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de crescimento",
        variant: "destructive",
      });
    }
  };

  const fetchMonthlySalesData = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_monthly_summary')
        .select('ano, mes, total_vendas, meta_mensal')
        .eq('ano', selectedYear)
        .order('mes');

      if (error) throw error;

      // Aggregate by month
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthData = data?.filter(item => item.mes === i + 1) || [];
        const totalSales = monthData.reduce((sum, item) => sum + (item.total_vendas || 0), 0);
        const totalGoal = monthData.reduce((sum, item) => sum + (item.meta_mensal || 0), 0);

        return {
          mes: months[i].label,
          vendas: totalSales,
          meta: totalGoal
        };
      });

      setMonthlySalesData(monthlyData);
    } catch (error) {
      console.error('Error fetching monthly sales data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados mensais",
        variant: "destructive",
      });
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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedMonth]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Vendas</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho das vendas e metas mensais
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      {kpiData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpiData.total_sales)}</div>
              <p className="text-xs text-muted-foreground">
                Meta: {formatCurrency(kpiData.total_goal)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atingimento da Meta</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.goal_achievement_percentage}%</div>
              <Badge variant={kpiData.goal_achievement_percentage >= 100 ? "default" : "secondary"}>
                {kpiData.goal_achievement_percentage >= 100 ? "Meta atingida" : "Abaixo da meta"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crescimento MoM</CardTitle>
              {kpiData.mom_growth_percentage >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpiData.mom_growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kpiData.mom_growth_percentage > 0 ? '+' : ''}{kpiData.mom_growth_percentage}%
              </div>
              <p className="text-xs text-muted-foreground">vs mês anterior</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crescimento YoY</CardTitle>
              {kpiData.yoy_growth_percentage >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpiData.yoy_growth_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kpiData.yoy_growth_percentage > 0 ? '+' : ''}{kpiData.yoy_growth_percentage}%
              </div>
              <p className="text-xs text-muted-foreground">vs ano anterior</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas vs Meta - {selectedYear}</CardTitle>
            <CardDescription>
              Acompanhamento mensal das vendas realizadas versus metas estabelecidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="vendas" fill="hsl(var(--primary))" name="Vendas" />
                <Bar dataKey="meta" fill="hsl(var(--muted))" name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendedoras - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardTitle>
            <CardDescription>
              Ranking das melhores performances do mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {momGrowthData.slice(0, 5).map((vendedora, index) => (
                <div key={vendedora.vendedora_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{vendedora.vendedora_nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(vendedora.current_sales)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={vendedora.growth_percentage >= 0 ? "default" : "secondary"}>
                    {vendedora.growth_percentage > 0 ? '+' : ''}{vendedora.growth_percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Analysis */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Crescimento Mês vs Mês</CardTitle>
            <CardDescription>
              Performance comparativa com o mês anterior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={momGrowthData.slice(0, 8).map(item => ({
                ...item,
                color: item.growth_percentage >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendedora_nome" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Crescimento']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar 
                  dataKey="growth_percentage" 
                  fill="hsl(var(--primary))"
                  name="Crescimento %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crescimento Ano vs Ano</CardTitle>
            <CardDescription>
              Performance comparativa com o mesmo mês do ano anterior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yoyGrowthData.slice(0, 8).map(item => ({
                ...item,
                color: item.growth_percentage >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendedora_nome" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Crescimento']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar 
                  dataKey="growth_percentage" 
                  fill="hsl(var(--primary))"
                  name="Crescimento %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      {kpiData && (
        <Card>
          <CardHeader>
            <CardTitle>Insights Principais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Trophy className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="font-medium">Top Performer</p>
                  <p className="text-sm text-muted-foreground">{kpiData.top_performer_name}</p>
                  <p className="text-sm font-medium">{formatCurrency(kpiData.top_performer_sales)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">Vendedoras Ativas</p>
                  <p className="text-2xl font-bold">{kpiData.active_salespeople}</p>
                  <p className="text-sm text-muted-foreground">participaram das vendas</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Calendar className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">Período</p>
                  <p className="text-sm font-medium">
                    {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                  </p>
                  <p className="text-sm text-muted-foreground">dados atualizados</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}