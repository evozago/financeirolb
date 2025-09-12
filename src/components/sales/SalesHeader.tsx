import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Calendar, Target } from "lucide-react";
import { useSalesData } from "@/hooks/useSalesData";

export function SalesHeader() {
  const { currentYear, yearlyData, salespersonData } = useSalesData();

  const getTotalSalesCurrentYear = () => {
    const currentYearTotal = yearlyData.reduce((sum, row) => {
      const yearValue = row.years[currentYear];
      return sum + (typeof yearValue === 'number' ? yearValue : 0);
    }, 0);
    return currentYearTotal;
  };

  const getActiveSalespeopleCount = () => {
    return salespersonData.length;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas Totais {currentYear}</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(getTotalSalesCurrentYear())}</div>
          <p className="text-xs text-muted-foreground">
            Acumulado no ano
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+12.5%</div>
          <p className="text-xs text-muted-foreground">
            vs ano anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendedoras Ativas</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{getActiveSalespeopleCount()}</div>
          <p className="text-xs text-muted-foreground">
            cadastradas no sistema
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Hoje</div>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}