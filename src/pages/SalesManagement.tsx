import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesHeader } from "@/components/sales/SalesHeader";
import { YearlyComparisonTable } from "@/components/sales/YearlyComparisonTable";
import { SalespersonPanel } from "@/components/sales/SalespersonPanel";
import { GrowthSimulation } from "@/components/sales/GrowthSimulation";

export default function SalesManagement() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <SalesHeader />

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