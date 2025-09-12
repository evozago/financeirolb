import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, RotateCcw, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function GrowthSimulation() {
  const [baseYear, setBaseYear] = useState(new Date().getFullYear());
  const [baseMonth, setBaseMonth] = useState(new Date().getMonth() + 1);
  const [growthRate, setGrowthRate] = useState(5);
  
  // Mock data for simulation
  const [simulationData] = useState([
    { month: 'Jan', current: 45000, projected: 47250 },
    { month: 'Fev', current: 52000, projected: 54600 },
    { month: 'Mar', current: 48000, projected: 50400 },
    { month: 'Abr', current: 55000, projected: 57750 },
    { month: 'Mai', current: 60000, projected: 63000 },
    { month: 'Jun', current: 58000, projected: 60900 },
  ]);

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

  const totalCurrent = simulationData.reduce((sum, month) => sum + month.current, 0);
  const totalProjected = simulationData.reduce((sum, month) => sum + month.projected, 0);
  const projectedGrowth = ((totalProjected - totalCurrent) / totalCurrent) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simulação de Crescimento</CardTitle>
          <CardDescription>
            Projete cenários de crescimento baseados em dados históricos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Simulation Controls */}
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="base-year">Ano Base</Label>
              <Select value={baseYear.toString()} onValueChange={(value) => setBaseYear(parseInt(value))}>
                <SelectTrigger id="base-year">
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

            <div>
              <Label htmlFor="base-month">Mês Base</Label>
              <Select value={baseMonth.toString()} onValueChange={(value) => setBaseMonth(parseInt(value))}>
                <SelectTrigger id="base-month">
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
            </div>

            <div>
              <Label htmlFor="growth-rate">Taxa de Crescimento (%)</Label>
              <Input
                id="growth-rate"
                type="number"
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                step="0.1"
                min="0"
                max="100"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Simular
              </Button>
              <Button variant="outline" size="icon">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{formatCurrency(totalCurrent)}</div>
                <p className="text-xs text-muted-foreground">Vendas Atuais</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalProjected)}</div>
                <p className="text-xs text-muted-foreground">Projeção com Crescimento</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  +{projectedGrowth.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Crescimento Projetado</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Comparação: Atual vs Projetado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={simulationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="current" fill="hsl(var(--muted))" name="Atual" />
                  <Bar dataKey="projected" fill="hsl(var(--primary))" name="Projetado" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline">
              Aplicar Simulação
            </Button>
            <Button variant="outline">
              Exportar Resultados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}