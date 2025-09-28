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
import { useSalesData } from "@/hooks/useSalesData";

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


  const addNewYear = () => {
    // For now, just change the current year to view it
    // Adding new years would require backend implementation
    setCurrentYear(newYear);
    setIsAddYearOpen(false);
    toast.success(`Ano ${newYear} selecionado para visualização!`);
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

  const calculateGrowth = (current: number, previous: number) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatGrowth = (growth: number) => {
    if (growth === 0) return "0%";
    return `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
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
                    <TableHead className="text-right">{currentYear}</TableHead>
                    <TableHead className="text-center">Crescimento</TableHead>
                    <TableHead className="text-right">{currentYear - 1}</TableHead>
                    <TableHead className="text-center">Crescimento</TableHead>
                    <TableHead className="text-right">{currentYear - 2}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {yearlyData.map((row) => {
                    const currentValue = row.years[currentYear] || 0;
                    const previousValue = row.years[currentYear - 1] || 0;
                    const prevPrevValue = row.years[currentYear - 2] || 0;
                    
                    const growthCurrent = calculateGrowth(currentValue, previousValue);
                    const growthPrevious = calculateGrowth(previousValue, prevPrevValue);
                    
                    return (
                      <TableRow key={row.month}>
                        <TableCell className="font-medium">{row.monthName}</TableCell>
                        
                        {/* Current Year */}
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={typeof row.years[currentYear] === 'number' ? row.years[currentYear] : ''}
                            onChange={(e) => updateYearlySale(row.month, currentYear, e.target.value)}
                            className="text-right w-32 ml-auto"
                            placeholder="0"
                          />
                        </TableCell>
                        
                        {/* Growth vs Previous Year */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {getGrowthIcon(growthCurrent)}
                            <span className={`text-sm font-medium ${getGrowthColor(growthCurrent)}`}>
                              {formatGrowth(growthCurrent)}
                            </span>
                          </div>
                        </TableCell>
                        
                        {/* Previous Year */}
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={typeof row.years[currentYear - 1] === 'number' ? row.years[currentYear - 1] : ''}
                            onChange={(e) => updateYearlySale(row.month, currentYear - 1, e.target.value)}
                            className="text-right w-32 ml-auto"
                            placeholder="0"
                          />
                        </TableCell>
                        
                        {/* Growth vs Previous Previous Year */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {getGrowthIcon(growthPrevious)}
                            <span className={`text-sm font-medium ${getGrowthColor(growthPrevious)}`}>
                              {formatGrowth(growthPrevious)}
                            </span>
                          </div>
                        </TableCell>
                        
                        {/* Year Before Previous */}
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={typeof row.years[currentYear - 2] === 'number' ? row.years[currentYear - 2] : ''}
                            onChange={(e) => updateYearlySale(row.month, currentYear - 2, e.target.value)}
                            className="text-right w-32 ml-auto"
                            placeholder="0"
                          />
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