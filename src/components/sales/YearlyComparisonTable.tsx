import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Edit3, Check, X, Plus, Trash2, Calendar } from "lucide-react";
import { useSalesData } from "@/hooks/useSalesData";
import { cn } from "@/lib/utils";

export function YearlyComparisonTable() {
  const { 
    yearlySales, 
    updateYearlySale, 
    getYearlySales, 
    getYearOverYearGrowth,
    availableYears,
    addYear,
    removeYear,
    getMonthlyMetaTotal,
    saveAllData
  } = useSalesData();
  const [editingCell, setEditingCell] = useState<{ year: number; month: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newYear, setNewYear] = useState<string>('');
  const [showYearManager, setShowYearManager] = useState<boolean>(false);

  const currentYear = new Date().getFullYear();
  const months = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Fev' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Ago' },
    { value: 9, label: 'Set' },
    { value: 10, label: 'Out' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dez' },
  ];

  const handleAddYear = () => {
    const year = parseInt(newYear);
    if (!isNaN(year) && year > 1900 && year < 2100) {
      addYear(year);
      setNewYear('');
    }
  };

  const handleRemoveYear = (year: number) => {
    if (availableYears.length > 1) { // Keep at least one year
      removeYear(year);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleCellClick = (year: number, month: number) => {
    setEditingCell({ year, month });
    setEditValue(getYearlySales(year, month).toString());
  };

  const handleSave = () => {
    if (!editingCell) return;
    
    const value = parseFloat(editValue) || 0;
    updateYearlySale({
      year: editingCell.year,
      month: editingCell.month,
      total_vendas: value
    });
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Prepare chart data
  const chartData = months.map(month => {
    const dataPoint: any = { month: month.label };
    availableYears.forEach(year => {
      dataPoint[year.toString()] = getYearlySales(year, month.value);
    });
    return dataPoint;
  });

  const getYearTotal = (year: number) => {
    return months.reduce((sum, month) => sum + getYearlySales(year, month.value), 0);
  };

  const getCellBackground = (year: number, month: number) => {
                       const growth = getYearOverYearGrowth(year, month);
    if (growth > 15) return 'bg-green-50 border-green-200';
    if (growth > 0) return 'bg-green-25 border-green-100';
    if (growth < -15) return 'bg-red-50 border-red-200';
    if (growth < 0) return 'bg-red-25 border-red-100';
    return 'bg-background';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Comparativo Ano a Ano - Vendas Mensais
            </CardTitle>
            <Button onClick={saveAllData} variant="default" size="sm">
              💾 Salvar Alterações
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Clique em qualquer célula para editar os valores. As cores indicam crescimento vs ano anterior.
          </p>
        </CardHeader>
        <CardContent>
          {/* Year Management */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowYearManager(!showYearManager)}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Gerenciar Anos
              </Button>
            </div>
            
            {showYearManager && (
              <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Adicionar ano (ex: 2025)"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-48"
                  />
                  <Button onClick={handleAddYear} size="sm" disabled={!newYear}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {availableYears.map(year => (
                    <Badge key={year} variant="secondary" className="flex items-center gap-2">
                      {year}
                      {availableYears.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveYear(year)}
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-border p-3 text-left font-medium">Mês</th>
                  {availableYears.map(year => (
                    <th key={year} className="border border-border p-3 text-center font-medium min-w-32">
                      {year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map(month => (
                  <tr key={month.value}>
                    <td className="border border-border p-3 font-medium bg-muted/50">
                      {month.label}
                    </td>
                    {availableYears.map(year => {
                      const value = getYearlySales(year, month.value);
                      const growth = getYearOverYearGrowth(year, month.value);
                      const isEditing = editingCell?.year === year && editingCell?.month === month.value;
                      
                      // Check if it's a future month and show meta as forecast
                      const currentDate = new Date();
                      const currentYear = currentDate.getFullYear();
                      const currentMonth = currentDate.getMonth() + 1;
                      const isFutureMonth = year === currentYear && month.value > currentMonth;
                      const metaTotal = getMonthlyMetaTotal(year, month.value);
                      const displayValue = isFutureMonth && value === 0 && metaTotal > 0 ? metaTotal : value;
                      
                      return (
                        <td
                          key={year}
                          className={cn(
                            "border border-border p-1 text-center cursor-pointer hover:bg-muted/30 transition-colors",
                            getCellBackground(year, month.value)
                          )}
                          onClick={() => !isEditing && handleCellClick(year, month.value)}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-8 text-sm text-center"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSave();
                                  if (e.key === 'Escape') handleCancel();
                                }}
                              />
                              <div className="flex gap-1 justify-center">
                                <Button size="sm" variant="outline" onClick={handleSave} className="h-6 px-2">
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancel} className="h-6 px-2">
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className={cn(
                                "font-medium text-sm",
                                isFutureMonth && value === 0 && metaTotal > 0 && "text-muted-foreground italic"
                              )}>
                                {displayValue > 0 ? formatCurrency(displayValue) : '-'}
                                {isFutureMonth && value === 0 && metaTotal > 0 && (
                                  <span className="text-xs ml-1">(meta)</span>
                                )}
                              </div>
                              {year > availableYears[0] && (
                                <div className={cn(
                                  "text-xs flex items-center justify-center gap-1",
                                  growth > 0 ? "text-green-600" : growth < 0 ? "text-red-600" : "text-muted-foreground"
                                )}>
                                  {growth > 0 ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : growth < 0 ? (
                                    <TrendingDown className="h-3 w-3" />
                                  ) : null}
                                  {growth !== 0 ? `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%` : '-'}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Total row */}
                <tr className="bg-muted/50 border-t-2 border-border">
                  <td className="border border-border p-3 font-bold">TOTAL</td>
                  {availableYears.map(year => {
                    const total = getYearTotal(year);
                    const previousTotal = getYearTotal(year - 1);
                    const totalGrowth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;
                    
                    return (
                      <td key={year} className="border border-border p-3 text-center font-bold">
                        <div className="space-y-1">
                          <div className="text-sm">
                            {total > 0 ? formatCurrency(total) : '-'}
                          </div>
                          {year > availableYears[0] && (
                            <div className={cn(
                              "text-xs flex items-center justify-center gap-1",
                              totalGrowth > 0 ? "text-green-600" : totalGrowth < 0 ? "text-red-600" : "text-muted-foreground"
                            )}>
                              {totalGrowth > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : totalGrowth < 0 ? (
                                <TrendingDown className="h-3 w-3" />
                              ) : null}
                              {totalGrowth !== 0 ? `${totalGrowth > 0 ? '+' : ''}${totalGrowth.toFixed(1)}%` : '-'}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução das Vendas por Ano</CardTitle>
          <p className="text-sm text-muted-foreground">
            Gráfico de linha mostrando o crescimento mensal comparativo entre os anos
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              {availableYears.map((year, index) => (
                <Line
                  key={year}
                  type="monotone"
                  dataKey={year.toString()}
                  stroke={`hsl(${(index * 90) % 360}, 70%, 50%)`}
                  strokeWidth={2}
                  name={year.toString()}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}