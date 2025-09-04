import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Target, DollarSign, TrendingUp, Download } from "lucide-react";
import { useSalesData, Salesperson } from "@/hooks/useSalesData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function SalespersonPanel() {
  const {
    salespeople,
    monthlySales,
    updateSalesperson,
    updateMonthlySale,
    calculateCommission,
    getMonthlySales,
    importSalespeople
  } = useSalesData();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
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

  // Import salespeople from database
  const importFromDatabase = async () => {
    setLoading(true);
    try {
      // Try to get from pessoas table where tipo includes 'vendedora'
      const { data: pessoasData, error: pessoasError } = await supabase
        .from('pessoas')
        .select('id, nome, tipo')
        .ilike('tipo', '%vendedora%');

      let vendedorasData: any[] = [];

      // If no vendedoras found in pessoas, try vendedoras table
      if (!pessoasData || pessoasData.length === 0) {
        const { data: vendedorasTableData, error: vendedorasError } = await supabase
          .from('vendedoras')
          .select('id, nome')
          .eq('ativo', true);

        if (vendedorasError) throw vendedorasError;
        vendedorasData = vendedorasTableData || [];
      } else {
        vendedorasData = pessoasData;
      }

      const importedSalespeople: Salesperson[] = vendedorasData.map(person => ({
        id: person.id,
        nome: person.nome,
        meta_mensal: 0,
        supermeta_mensal: 0
      }));

      importSalespeople(importedSalespeople);
      
      toast({
        title: "Importação realizada",
        description: `${importedSalespeople.length} vendedora(s) importada(s) com sucesso`,
      });
    } catch (error) {
      console.error('Error importing salespeople:', error);
      toast({
        title: "Erro",
        description: "Erro ao importar vendedoras do banco de dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSales = (vendedoraId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateMonthlySale({
      year: selectedYear,
      month: selectedMonth,
      vendedora_id: vendedoraId,
      vendas: numValue
    });
  };

  const updateMeta = (vendedoraId: string, field: 'meta_mensal' | 'supermeta_mensal', value: string) => {
    const salesperson = salespeople.find(s => s.id === vendedoraId);
    if (!salesperson) return;

    const numValue = parseFloat(value) || 0;
    updateSalesperson({
      ...salesperson,
      [field]: numValue
    });
  };

  // Calculate monthly commission data for chart
  const getMonthlyCommissionData = () => {
    return months.map(month => {
      const totalCommission = salespeople.reduce((sum, salesperson) => {
        return sum + calculateCommission(salesperson.id, selectedYear, month.value);
      }, 0);

      const totalSales = salespeople.reduce((sum, salesperson) => {
        return sum + getMonthlySales(selectedYear, month.value, salesperson.id);
      }, 0);

      return {
        month: month.label,
        comissao: totalCommission,
        vendas: totalSales
      };
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Painel de Vendedoras
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie metas, vendas e acompanhe comissões por vendedora
              </p>
            </div>
            <Button onClick={importFromDatabase} disabled={loading} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Importar do Cadastro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
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

          {salespeople.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma vendedora cadastrada</p>
              <p className="text-sm">Clique em "Importar do Cadastro" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Vendedora</th>
                    <th className="text-center p-3 font-medium min-w-32">Meta Mensal</th>
                    <th className="text-center p-3 font-medium min-w-32">Super Meta</th>
                    <th className="text-center p-3 font-medium min-w-32">Vendas do Mês</th>
                    <th className="text-center p-3 font-medium min-w-32">% da Meta</th>
                    <th className="text-center p-3 font-medium min-w-32">Comissão</th>
                    <th className="text-center p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {salespeople.map((salesperson) => {
                    const sales = getMonthlySales(selectedYear, selectedMonth, salesperson.id);
                    const commission = calculateCommission(salesperson.id, selectedYear, selectedMonth);
                    const metaPercentage = salesperson.meta_mensal > 0 
                      ? (sales / salesperson.meta_mensal) * 100 
                      : 0;

                    return (
                      <tr key={salesperson.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{salesperson.nome}</td>
                        
                        <td className="p-3">
                          <Input
                            type="number"
                            value={salesperson.meta_mensal || ''}
                            onChange={(e) => updateMeta(salesperson.id, 'meta_mensal', e.target.value)}
                            className="text-center"
                            placeholder="0"
                          />
                        </td>

                        <td className="p-3">
                          <Input
                            type="number"
                            value={salesperson.supermeta_mensal || ''}
                            onChange={(e) => updateMeta(salesperson.id, 'supermeta_mensal', e.target.value)}
                            className="text-center"
                            placeholder="0"
                          />
                        </td>

                        <td className="p-3">
                          <Input
                            type="number"
                            value={sales || ''}
                            onChange={(e) => updateSales(salesperson.id, e.target.value)}
                            className="text-center"
                            placeholder="0"
                          />
                        </td>

                        <td className="p-3 text-center">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">
                              {metaPercentage.toFixed(1)}%
                            </div>
                            <Progress 
                              value={Math.min(metaPercentage, 100)} 
                              className="h-2"
                            />
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(commission)}
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <Badge 
                            variant={
                              sales >= salesperson.supermeta_mensal ? "default" :
                              sales >= salesperson.meta_mensal ? "secondary" : 
                              "outline"
                            }
                          >
                            {sales >= salesperson.supermeta_mensal ? "Super Meta" :
                             sales >= salesperson.meta_mensal ? "Meta Atingida" : 
                             "Em Andamento"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Analysis Chart */}
      {salespeople.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Análise de Comissões - {selectedYear}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Evolução mensal das comissões baseada nas vendas e metas
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getMonthlyCommissionData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="comissao" fill="hsl(var(--primary))" name="Comissão Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}