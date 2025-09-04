import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";
import { useSalesData } from "@/hooks/useSalesData";

export function SalesHeader() {
  const { 
    getTotalSalesCurrentYear, 
    getAccumulatedGrowth, 
    getActiveSalespeopleCount,
    lastUpdate 
  } = useSalesData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const currentYear = new Date().getFullYear();
  const totalSales = getTotalSalesCurrentYear();
  const accumulatedGrowth = getAccumulatedGrowth(currentYear);
  const activeSalespeople = getActiveSalespeopleCount();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sistema de Gestão de Vendas</h1>
        <p className="text-muted-foreground">
          Painel interativo para gerenciamento de vendas, metas e simulações de crescimento
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido {currentYear}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              Acumulado até {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento Acumulado</CardTitle>
            <TrendingUp className={`h-4 w-4 ${accumulatedGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${accumulatedGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {accumulatedGrowth > 0 ? '+' : ''}{accumulatedGrowth.toFixed(1)}%
            </div>
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
            <div className="text-2xl font-bold">{activeSalespeople}</div>
            <p className="text-xs text-muted-foreground">
              com vendas este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Last Update Footer */}
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs">
          <Calendar className="w-3 h-3 mr-1" />
          Última atualização: {lastUpdate}
        </Badge>
      </div>
    </div>
  );
}