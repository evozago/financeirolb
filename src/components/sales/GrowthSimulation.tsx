import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useSalesData } from "@/hooks/useSalesData";

export function GrowthSimulation() {
  const { yearlyData, currentYear } = useSalesData();
  const [growthRate, setGrowthRate] = useState<string>('10');
  const [simulationResult, setSimulationResult] = useState<number | null>(null);

  const calculateCurrentTotal = () => {
    return yearlyData.reduce((sum, row) => {
      const yearValue = row.years[currentYear];
      return sum + (typeof yearValue === 'number' ? yearValue : 0);
    }, 0);
  };

  const runSimulation = () => {
    const currentTotal = calculateCurrentTotal();
    const rate = parseFloat(growthRate) || 0;
    const projectedValue = currentTotal * (1 + rate / 100);
    setSimulationResult(projectedValue);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Simulação de Crescimento
        </CardTitle>
        <CardDescription>
          Projete cenários de crescimento baseados nas vendas atuais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="growth-rate">Taxa de Crescimento (%)</Label>
            <Input
              id="growth-rate"
              type="number"
              placeholder="Ex: 10"
              value={growthRate}
              onChange={(e) => setGrowthRate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={runSimulation} className="gap-2">
              <Calculator className="h-4 w-4" />
              Simular
            </Button>
          </div>
        </div>

        {simulationResult !== null && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="grid gap-2 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Vendas Atuais ({currentYear})</p>
                <p className="text-lg font-semibold">{formatCurrency(calculateCurrentTotal())}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Crescimento Projetado</p>
                <p className="text-lg font-semibold text-green-600">+{growthRate}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vendas Projetadas ({currentYear + 1})</p>
                <p className="text-lg font-semibold text-primary">{formatCurrency(simulationResult)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}