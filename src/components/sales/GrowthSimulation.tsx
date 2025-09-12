import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, Play, RotateCcw } from "lucide-react";
import { useSalesData } from "@/hooks/useSalesData";
import { useToast } from "@/hooks/use-toast";

export function GrowthSimulation() {
  const {
    growthSimulation,
    updateGrowthSimulation,
    applyGrowthSimulation,
    getYearlySales,
    yearlySales
  } = useSalesData();

  const [baseYear, setBaseYear] = useState(new Date().getFullYear());
  const [baseMonth, setBaseMonth] = useState(new Date().getMonth() + 1);
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
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
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSimulationChange = (field: string, value: any) => {
    updateGrowthSimulation({
      ...growthSimulation,
      [field]: value
    });
  };

  const runSimulation = () => {
    if (growthSimulation.value === 0) {
      toast({
        title: "Atenção",
        description: "Defina um valor de crescimento diferente de zero",
        variant: "destructive"
      });
      return;
    }

    applyGrowthSimulation(baseYear, baseMonth);
    toast({
      title: "Simulação aplicada",
      description: `Crescimento ${growthSimulation.type === 'fixed' ? 'fixo' : 'percentual'} aplicado aos próximos meses`,
    });
  };

  const resetSimulation = () => {
    handleSimulationChange('enabled', false);
    handleSimulationChange('value', 0);
    toast({
      title: "Simulação resetada",
      description: "Configurações de crescimento foram resetadas"
    });
  };

  // Prepare chart data for projection
  const getProjectionData = () => {
    const data = [];
    const baseValue = getYearlySales(baseYear, baseMonth);
    let projectedValue = baseValue;

    // Add historical data (last 6 months)
    for (let i = 5; i >= 0; i--) {
      let month = baseMonth - i;
      let year = baseYear;
      
      if (month <= 0) {
        month += 12;
        year -= 1;
      }

      const monthLabel = months.find(m => m.value === month)?.label || '';
      const actualValue = getYearlySales(year, month);
      
      data.push({
        period: `${monthLabel}/${year}`,
        actual: actualValue,
        projected: null,
        isBase: year === baseYear && month === baseMonth
      });
    }

    // Add projected data (next 12 months)
    if (growthSimulation.enabled && growthSimulation.value !== 0) {
      for (let i = 1; i <= 12; i++) {
        let month = baseMonth + i;
        let year = baseYear;
        
        if (month > 12) {
          month -= 12;
          year += 1;
        }

        if (growthSimulation.type === 'fixed') {
          projectedValue += growthSimulation.value;
        } else {
          projectedValue *= (1 + growthSimulation.value / 100);
        }

        const monthLabel = months.find(m => m.value === month)?.label || '';
        
        data.push({
          period: `${monthLabel}/${year}`,
          actual: null,
          projected: Math.round(projectedValue),
          isBase: false
        });
      }
    }

    return data;
  };

  const projectionData = getProjectionData();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Simulação de Crescimento
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure e aplique simulações de crescimento para projeção de vendas futuras
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Simulation Controls */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="simulation-enabled">Ativar Simulação</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch
                    id="simulation-enabled"
                    checked={growthSimulation.enabled}
                    onCheckedChange={(checked) => handleSimulationChange('enabled', checked)}
                  />
                  <span className="text-sm text-muted-foreground">
                    {growthSimulation.enabled ? 'Ativada' : 'Desativada'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Período Base</Label>
                <div className="flex gap-2">
                  <Select value={baseMonth.toString()} onValueChange={(value) => setBaseMonth(parseInt(value))}>
                    <SelectTrigger className="flex-1">
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

                  <Select value={baseYear.toString()} onValueChange={(value) => setBaseYear(parseInt(value))}>
                    <SelectTrigger className="w-24">
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
                <p className="text-xs text-muted-foreground">
                  Valor base: {formatCurrency(getYearlySales(baseYear, baseMonth))}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Tipo de Crescimento</Label>
                <Select 
                  value={growthSimulation.type} 
                  onValueChange={(value) => handleSimulationChange('type', value)}
                  disabled={!growthSimulation.enabled}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Valor Fixo Mensal</SelectItem>
                    <SelectItem value="percentage">Percentual Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  {growthSimulation.type === 'fixed' ? 'Valor Mensal (R$)' : 'Percentual Mensal (%)'}
                </Label>
                <Input
                  type="number"
                  value={growthSimulation.value || ''}
                  onChange={(e) => handleSimulationChange('value', parseFloat(e.target.value) || 0)}
                  disabled={!growthSimulation.enabled}
                  placeholder={growthSimulation.type === 'fixed' ? '5000' : '10'}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {growthSimulation.type === 'fixed' 
                    ? 'Ex: +R$ 5.000 por mês'
                    : 'Ex: +10% por mês'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={runSimulation} 
              disabled={!growthSimulation.enabled || growthSimulation.value === 0}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Aplicar Simulação
            </Button>
            <Button variant="outline" onClick={resetSimulation}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
          </div>

          {/* Preview */}
          {growthSimulation.enabled && growthSimulation.value !== 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Prévia da Simulação</h4>
              <p className="text-sm text-muted-foreground">
                A partir de {months.find(m => m.value === baseMonth)?.label}/{baseYear}, 
                aplicando {growthSimulation.type === 'fixed' 
                  ? `+${formatCurrency(growthSimulation.value)} por mês`
                  : `+${growthSimulation.value}% por mês`
                }
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Valor em 6 meses: {formatCurrency(
                  growthSimulation.type === 'fixed' 
                    ? getYearlySales(baseYear, baseMonth) + (growthSimulation.value * 6)
                    : getYearlySales(baseYear, baseMonth) * Math.pow(1 + growthSimulation.value / 100, 6)
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projection Chart */}
      {projectionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Projeção de Crescimento</CardTitle>
            <p className="text-sm text-muted-foreground">
              Histórico recente e projeção futura baseada na simulação
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value: number) => value ? formatCurrency(value) : 'N/A'}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <ReferenceLine 
                  x={`${months.find(m => m.value === baseMonth)?.label}/${baseYear}`}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  label="Base"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Vendas Reais"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Projeção"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}