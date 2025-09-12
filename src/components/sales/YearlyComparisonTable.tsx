import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Save } from "lucide-react";

interface YearlyData {
  year: number;
  months: number[];
  total: number;
  growth: number;
}

export function YearlyComparisonTable() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Mock data
  const [yearlyData] = useState<YearlyData[]>([
    {
      year: 2024,
      months: [45000, 52000, 48000, 55000, 60000, 58000, 62000, 59000, 61000, 65000, 68000, 70000],
      total: 703000,
      growth: 8.5
    },
    {
      year: 2023,
      months: [42000, 48000, 44000, 51000, 55000, 53000, 57000, 54000, 56000, 60000, 62000, 65000],
      total: 647000,
      growth: 12.3
    },
    {
      year: 2022,
      months: [38000, 43000, 40000, 46000, 50000, 48000, 51000, 49000, 51000, 54000, 56000, 58000],
      total: 584000,
      growth: -2.1
    }
  ]);

  const months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comparação Anual de Vendas</CardTitle>
          <CardDescription>
            Histórico de vendas mensais e crescimento ano a ano
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex justify-between items-center">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearlyData.map((data) => (
                  <SelectItem key={data.year} value={data.year.toString()}>
                    {data.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button size="sm">
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>

          {/* Yearly Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {yearlyData.slice(0, 3).map((data) => (
              <Card key={data.year} className={data.year === selectedYear ? "ring-2 ring-primary" : ""}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{data.year}</p>
                      <p className="text-2xl font-bold">{formatCurrency(data.total)}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {getGrowthIcon(data.growth)}
                        <span className={`text-sm font-medium ${getGrowthColor(data.growth)}`}>
                          {data.growth > 0 ? '+' : ''}{data.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento Mensal - {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {months.map((month, index) => {
                    const currentData = yearlyData.find(d => d.year === selectedYear);
                    const value = currentData?.months[index] || 0;
                    
                    return (
                      <TableRow key={month}>
                        <TableCell className="font-medium">{month}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            defaultValue={value}
                            className="text-right w-32 ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{formatCurrency(value)}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}