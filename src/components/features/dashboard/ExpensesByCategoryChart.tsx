/**
 * Gráfico em pizza das despesas por categoria com período selecionável
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CategoryData {
  categoria: string;
  total_valor: number;
  count_items: number;
}

interface ChartData {
  name: string;
  value: number;
  count: number;
  percentage: number;
}

// Cores para o gráfico usando o sistema de design
const CHART_COLORS = [
  'hsl(217 91% 50%)',   // primary
  'hsl(142 76% 36%)',   // success  
  'hsl(38 92% 50%)',    // warning
  'hsl(0 84% 60%)',     // destructive
  'hsl(220 9% 46%)',    // muted
  'hsl(217 91% 40%)',   // primary variant
  'hsl(142 76% 30%)',   // success variant
  'hsl(38 92% 40%)',    // warning variant
];

export function ExpensesByCategoryChart() {
  const { toast } = useToast();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      
      const { data: categoryData, error } = await supabase.rpc('get_expenses_by_category', {
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd')
      });

      if (error) {
        console.error('Error loading category data:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar dados por categoria",
          variant: "destructive"
        });
        return;
      }

      if (categoryData && categoryData.length > 0) {
        const totalValue = categoryData.reduce((sum: number, item: CategoryData) => 
          sum + parseFloat(String(item.total_valor || 0)), 0);

        const chartData: ChartData[] = categoryData.map((item: CategoryData) => {
          const value = parseFloat(String(item.total_valor || 0));
          return {
            name: item.categoria,
            value,
            count: Number(item.count_items),
            percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
          };
        });

        setData(chartData);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Error loading category data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados por categoria",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategoryData();
  }, [startDate, endDate]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-card-foreground">{data.name}</p>
          <p className="text-primary font-semibold">{formatCurrency(data.value)}</p>
          <p className="text-muted-foreground text-sm">{data.count} conta(s)</p>
          <p className="text-muted-foreground text-sm">{data.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    if (!payload || payload.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1 text-sm">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Despesas por Categoria</CardTitle>
          <div className="flex items-center gap-2">
            <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      setStartDate(date);
                      setShowStartCalendar(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-muted-foreground">até</span>
            
            <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      setEndDate(date);
                      setShowEndCalendar(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">Carregando dados...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Nenhuma despesa encontrada</p>
              <p className="text-sm text-muted-foreground">para o período selecionado</p>
            </div>
          </div>
        ) : (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  outerRadius={120}
                  innerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[index % CHART_COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}