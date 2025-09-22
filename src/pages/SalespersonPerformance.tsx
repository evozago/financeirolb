import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Target, DollarSign, TrendingUp, Award, CalendarDays, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, isSameMonth, isSameYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RoleManagementPanel } from "@/components/roles/RoleManagementPanel";

interface SalespersonPerformanceData {
  vendedora_id: string;
  vendedora_nome: string;
  vendas_periodo: number;
  meta_periodo: number;
  percentual_meta: number;
  comissao_calculada: number;
  vendas_mes_anterior: number;
  crescimento_mom: number;
  dias_ferias: number;
}

interface VacationPeriod {
  id: string;
  data_inicio: string;
  data_fim: string;
  tipo_ferias: string;
  aprovado: boolean;
}

interface MonthlyPerformance {
  mes: string;
  vendas: number;
  meta: number;
  comissao: number;
}

export default function SalespersonPerformance() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedVendedora, setSelectedVendedora] = useState<string>('all');
  const [performanceData, setPerformanceData] = useState<SalespersonPerformanceData[]>([]);
  const [vendedoras, setVendedoras] = useState<any[]>([]);
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformance[]>([]);
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

  const fetchVendedoras = async () => {
    try {
      const { data, error } = await supabase
        .from('pessoas')
        .select('id, nome')
        .eq('ativo', true)
        .contains('papeis', ['vendedora'])
        .order('nome');

      if (error) throw error;
      setVendedoras(data || []);
    } catch (error) {
      console.error('Error fetching vendedoras:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar vendedoras",
        variant: "destructive",
      });
    }
  };

  const fetchPerformanceData = async () => {
    try {
      let salesQuery = supabase
        .from('vendas')
        .select(`
          vendedora_id,
          valor_venda,
          data_venda,
          vendedoras!inner(nome)
        `)
        .gte('data_venda', `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`)
        .lt('data_venda', `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-01`);

      if (selectedVendedora !== 'all') {
        salesQuery = salesQuery.eq('vendedora_id', selectedVendedora);
      }

      const { data: salesData, error: salesError } = await salesQuery;
      if (salesError) throw salesError;

      let goalsQuery = supabase
        .from('metas_mensais')
        .select(`
          vendedora_id,
          meta_valor,
          vendedoras!inner(nome)
        `)
        .eq('ano', selectedYear)
        .eq('mes', selectedMonth);

      if (selectedVendedora !== 'all') {
        goalsQuery = goalsQuery.eq('vendedora_id', selectedVendedora);
      }

      const { data: goalsData, error: goalsError } = await goalsQuery;
      if (goalsError) throw goalsError;

      // Process performance data
      const performanceByVendedora = new Map();

      // Initialize with goals
      goalsData?.forEach(goal => {
        performanceByVendedora.set(goal.vendedora_id, {
          vendedora_id: goal.vendedora_id,
          vendedora_nome: (goal.vendedoras as any)?.nome || '',
          vendas_periodo: 0,
          meta_periodo: goal.meta_valor,
          percentual_meta: 0,
          comissao_calculada: 0,
          vendas_mes_anterior: 0,
          crescimento_mom: 0,
          dias_ferias: 0
        });
      });

      // Add sales data
      salesData?.forEach(sale => {
        const current = performanceByVendedora.get(sale.vendedora_id) || {
          vendedora_id: sale.vendedora_id,
          vendedora_nome: (sale.vendedoras as any)?.nome || '',
          vendas_periodo: 0,
          meta_periodo: 0,
          percentual_meta: 0,
          comissao_calculada: 0,
          vendas_mes_anterior: 0,
          crescimento_mom: 0,
          dias_ferias: 0
        };

        current.vendas_periodo += sale.valor_venda;
        performanceByVendedora.set(sale.vendedora_id, current);
      });

      // Calculate percentages and commissions
      performanceByVendedora.forEach((performance, vendedoraId) => {
        if (performance.meta_periodo > 0) {
          performance.percentual_meta = (performance.vendas_periodo / performance.meta_periodo) * 100;
        }

        // Calculate commission: 3% up to goal, 5% above
        if (performance.vendas_periodo <= performance.meta_periodo) {
          performance.comissao_calculada = performance.vendas_periodo * 0.03;
        } else {
          const baseCommission = performance.meta_periodo * 0.03;
          const extraCommission = (performance.vendas_periodo - performance.meta_periodo) * 0.05;
          performance.comissao_calculada = baseCommission + extraCommission;
        }
      });

      setPerformanceData(Array.from(performanceByVendedora.values()));
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de performance",
        variant: "destructive",
      });
    }
  };

  const fetchVacationPeriods = async () => {
    if (selectedVendedora === 'all') return;

    try {
      const { data, error } = await supabase
        .from('vendedora_ferias')
        .select('*')
        .eq('vendedora_id', selectedVendedora)
        .eq('aprovado', true)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      setVacationPeriods(data || []);
    } catch (error) {
      console.error('Error fetching vacation periods:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar períodos de férias",
        variant: "destructive",
      });
    }
  };

  const fetchMonthlyPerformance = async () => {
    if (selectedVendedora === 'all') return;

    try {
      const { data, error } = await supabase
        .from('sales_monthly_summary')
        .select('ano, mes, total_vendas, meta_mensal')
        .eq('vendedora_id', selectedVendedora)
        .eq('ano', selectedYear)
        .order('mes');

      if (error) throw error;

      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthData = data?.find(item => item.mes === i + 1);
        const sales = monthData?.total_vendas || 0;
        const goal = monthData?.meta_mensal || 0;
        
        // Calculate commission
        let commission = 0;
        if (sales <= goal) {
          commission = sales * 0.03;
        } else {
          commission = (goal * 0.03) + ((sales - goal) * 0.05);
        }

        return {
          mes: months[i].label,
          vendas: sales,
          meta: goal,
          comissao: commission
        };
      });

      setMonthlyPerformance(monthlyData);
    } catch (error) {
      console.error('Error fetching monthly performance:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar performance mensal",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchVendedoras();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchPerformanceData(),
          fetchVacationPeriods(),
          fetchMonthlyPerformance()
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedMonth, selectedVendedora]);

  const isOnVacation = (vendedoraId: string) => {
    const today = new Date();
    return vacationPeriods.some(vacation => {
      const startDate = new Date(vacation.data_inicio);
      const endDate = new Date(vacation.data_fim);
      return today >= startDate && today <= endDate;
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance das Vendedoras</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho individual, metas, comissões e gerencie papéis
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedVendedora} onValueChange={setSelectedVendedora}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Vendedoras</SelectItem>
              {vendedoras.map((vendedora) => (
                <SelectItem key={vendedora.id} value={vendedora.id}>
                  {vendedora.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="roles">
            <Users className="h-4 w-4 mr-2" />
            Gerenciar Papéis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {performanceData.map((vendedora) => (
          <Card key={vendedora.vendedora_id} className="relative">
            {selectedVendedora !== 'all' && isOnVacation(vendedora.vendedora_id) && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <CalendarDays className="w-3 h-3 mr-1" />
                  Férias
                </Badge>
              </div>
            )}
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{vendedora.vendedora_nome}</CardTitle>
              <CardDescription>
                {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Vendas vs Meta</span>
                  <span className="text-sm font-medium">
                    {vendedora.percentual_meta.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(vendedora.percentual_meta, 100)} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatCurrency(vendedora.vendas_periodo)}</span>
                  <span>{formatCurrency(vendedora.meta_periodo)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Comissão</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(vendedora.comissao_calculada)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={vendedora.percentual_meta >= 100 ? "default" : "secondary"}>
                    {vendedora.percentual_meta >= 100 ? "Meta atingida" : "Em andamento"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Individual Performance Details */}
      {selectedVendedora !== 'all' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Monthly Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Anual - {selectedYear}</CardTitle>
              <CardDescription>
                Vendas vs Meta mensal da vendedora selecionada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyPerformance}>
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

          {/* Commission Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução da Comissão - {selectedYear}</CardTitle>
              <CardDescription>
                Comissões mensais baseadas nas vendas realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="comissao" fill="hsl(var(--primary))" name="Comissão" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vacation Periods */}
      {selectedVendedora !== 'all' && vacationPeriods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Períodos de Férias</CardTitle>
            <CardDescription>
              Histórico de férias da vendedora selecionada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vacationPeriods.slice(0, 5).map((vacation) => (
                <div key={vacation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(vacation.data_inicio), 'dd/MM/yyyy')} - {format(new Date(vacation.data_fim), 'dd/MM/yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {vacation.tipo_ferias}
                      </p>
                    </div>
                  </div>
                  <Badge variant={vacation.aprovado ? "default" : "secondary"}>
                    {vacation.aprovado ? "Aprovado" : "Pendente"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {performanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo Estatístico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {performanceData.filter(p => p.percentual_meta >= 100).length}
                </p>
                <p className="text-sm text-muted-foreground">Metas Atingidas</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(performanceData.reduce((sum, p) => sum + p.comissao_calculada, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total Comissões</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">
                  {formatCurrency(performanceData.reduce((sum, p) => sum + p.vendas_periodo, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Total Vendas</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {((performanceData.reduce((sum, p) => sum + p.vendas_periodo, 0) / 
                     performanceData.reduce((sum, p) => sum + p.meta_periodo, 0)) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Performance Geral</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RoleManagementPanel 
            showAllEntities={true}
            onRoleChange={(entityId, roles) => {
              // Atualizar dados quando papéis mudarem
              if (roles.includes('vendedora')) {
                // Recarregar vendedoras se o papel vendedora foi adicionado/removido
                fetchVendedoras();
                fetchPerformanceData();
              }
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}