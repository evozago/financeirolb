import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SalesHeader } from "@/components/sales/SalesHeader";
import { YearlyComparisonTable } from "@/components/sales/YearlyComparisonTable";
import { SalespersonPanel } from "@/components/sales/SalespersonPanel";
import { GrowthSimulation } from "@/components/sales/GrowthSimulation";
import { useSalesData } from "@/hooks/useSalesData";
import { Save } from "lucide-react";

export default function SalesManagement() {
  const { loading, saveAllData } = useSalesData();

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Vendas</h1>
          <p className="text-muted-foreground">
            Configure metas de vendedoras e analise o crescimento das vendas
          </p>
        </div>

        <Button onClick={saveAllData} disabled={loading} className="gap-2">
          <Save className="h-4 w-4" />
          {loading ? "Salvando..." : "Salvar Tudo"}
        </Button>
      </div>

      <SalesHeader />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comparativo Anual</CardTitle>
            <CardDescription>
              Vendas mensais por ano para análise de tendências
            </CardDescription>
          </CardHeader>
          <CardContent>
            <YearlyComparisonTable />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestão de Vendedoras</CardTitle>
            <CardDescription>
              Configure metas mensais e acompanhe performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SalespersonPanel />
          </CardContent>
        </Card>
      </div>

      <GrowthSimulation />
    </div>
  );
}

