import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SalesHeader } from "@/components/sales/SalesHeader";
import { YearlyComparisonTable } from "@/components/sales/YearlyComparisonTable";
import { SalespersonPanel } from "@/components/sales/SalespersonPanel";
import { GrowthSimulation } from "@/components/sales/GrowthSimulation";
import { useSalesData } from "@/hooks/useSalesData";
import { Save } from "lucide-react";

export default function SalesManagement() {
  const { salesBySalesperson, loadingSalesperson } = useSalesData('1'); // Mock entity ID

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <SalesHeader />
        <Button onClick={() => {
          // Trigger save in all components
          window.dispatchEvent(new CustomEvent('saveAllSalesData'));
          console.log('Saving all sales management data...');
        }} size="lg" className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          💾 SALVAR TODOS OS DADOS
        </Button>
      </div>

      <Tabs defaultValue="comparison" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Comparativo Anual</TabsTrigger>
          <TabsTrigger value="salespeople">Vendedoras</TabsTrigger>
          <TabsTrigger value="simulation">Simulação</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          <YearlyComparisonTable />
        </TabsContent>

        <TabsContent value="salespeople" className="space-y-6">
          <SalespersonPanel />
        </TabsContent>

        <TabsContent value="simulation" className="space-y-6">
          <GrowthSimulation />
        </TabsContent>
      </Tabs>
    </div>
  );
}