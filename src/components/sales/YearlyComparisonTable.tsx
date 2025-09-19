import { useState } from "react";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Minus, Save, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSalesData } from "@/hooks/useSalesData";

interface YearlyData {
  year: number;
  months: number[];
  total: number;
  growth: number;
}

export function YearlyComparisonTable() {
  const { 
    loading, 
    currentYear, 
    setCurrentYear, 
    yearlyData, 
    updateYearlySale, 
    saveAllData,
    hasEntity 
  } = useSalesData();

  const [newYear, setNewYear] = useState(new Date().getFullYear() + 1);
  const [isAddYearOpen, setIsAddYearOpen] = useState(false);
  
  // Editable data
  const [yearlyData, setYearlyData] = useState<YearlyData[]>([
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

  // Calculate growth and totals
  const calculateMetrics = (data: YearlyData[]) => {
    return data.map((yearData, index) => {
      const total = yearData.months.reduce((sum, month) => sum + month, 0);
      let growth = 0;
      
      if (index < data.length - 1) {
        const prevYear = data[index + 1];
        const prevTotal = prevYear.months.reduce((sum, month) => sum + month, 0);
        growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
      }
      
      return { ...yearData, total, growth };
    });
  };

  const updateMonthValue = (year: number, monthIndex: number, value: number) => {
    setYearlyData(prev => {
      const updated = prev.map(data => 
        data.year === year 
          ? { ...data, months: data.months.map((m, i) => i === monthIndex ? value : m) }
          : data
      );
      return calculateMetrics(updated);
    });
  };

  const addNewYear = () => {
    if (yearlyData.some(data => data.year === newYear)) {
      toast.error("Ano já existe!");
      return;
    }
    
    const newYearData: YearlyData = {
      year: newYear,
      months: Array(12).fill(0),
      total: 0,
      growth: 0
    };
    
    setYearlyData(prev => {
      const updated = [newYearData, ...prev].sort((a, b) => b.year - a.year);
      return calculateMetrics(updated);
    });
    
    setIsAddYearOpen(false);
    toast.success(`Ano ${newYear} adicionado com sucesso!`);
  };

  const handleSaveAll = () => {
    if (!hasEntity) {
      toast.error("Nenhuma entidade configurada. Configure uma entidade corporativa primeiro.");
      return;
    }
    saveAllData();
  };

  // Listen for save event from main page
  React.useEffect(() => {
    const handleSave = () => handleSaveAll();
    window.addEventListener('saveAllSalesData', handleSave);
    return () => window.removeEventListener('saveAllSalesData', handleSave);
  }, [hasEntity]);

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
            <div className="flex gap-2">
              <Select value={currentYear.toString()} onValueChange={(value) => setCurrentYear(parseInt(value))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={isAddYearOpen} onOpenChange={setIsAddYearOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Ano
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Ano</DialogTitle>
                    <DialogDescription>
                      Adicione um novo ano para comparação de vendas
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="new-year">Ano</Label>
                      <Input
                        id="new-year"
                        type="number"
                        value={newYear}
                        onChange={(e) => setNewYear(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddYearOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addNewYear}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <Button size="sm" onClick={handleSaveAll} disabled={loading || !hasEntity}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>

          {/* Yearly Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {[currentYear, currentYear - 1, currentYear - 2].map((year) => {
              const yearTotal = yearlyData
                .filter(row => row.years[year] && typeof row.years[year] === 'number')
                .reduce((sum, row) => sum + Number(row.years[year]), 0);

              return (
                <Card key={year} className={year === currentYear ? "ring-2 ring-primary" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{year}</p>
                        <p className="text-2xl font-bold">{formatCurrency(yearTotal)}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {getGrowthIcon(0)}
                          <span className={`text-sm font-medium ${getGrowthColor(0)}`}>
                            +8.5%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Monthly Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento Mensal - {currentYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    {[currentYear, currentYear - 1, currentYear - 2].map(year => (
                      <TableHead key={year} className="text-right">{year}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearlyData.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">{row.monthName}</TableCell>
                      {[currentYear, currentYear - 1, currentYear - 2].map(year => {
                        const value = row.years[year];
                        const displayValue = typeof value === 'number' ? value : '';
                        
                        return (
                          <TableCell key={year} className="text-right">
                            <Input
                              type="number"
                              value={displayValue}
                              onChange={(e) => updateYearlySale(row.month, year, e.target.value)}
                              className="text-right w-32 ml-auto"
                              placeholder="0"
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}