import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Edit3, Check, X } from "lucide-react";
import { useSalesData } from "@/hooks/useSalesData";
import { cn } from "@/lib/utils";

export function YearlyComparisonTable() {
  const { yearlySales, updateYearlySale, getYearlySales, getYearOverYearGrowth } = useSalesData();
  const [editingCell, setEditingCell] = useState<{ year: number; month: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
    years.forEach(year => {
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
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Comparativo Ano a Ano - Vendas Mensais
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Clique em qualquer célula para editar os valores. As cores indicam crescimento vs ano anterior.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-border p-3 text-left font-medium">Mês</th>
                  {years.map(year => (
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
                    {years.map(year => {
                      const value = getYearlySales(year, month.value);
                      const growth = getYearOverYearGrowth(year, month.value);
                      const isEditing = editingCell?.year === year && editingCell?.month === month.value;
                      
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
                              <div className="font-medium text-sm">
                                {value > 0 ? formatCurrency(value) : '-'}
                              </div>
                              {year > years[0] && (
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
                  {years.map(year => {
                    const total = getYearTotal(year);
                    const previousTotal = getYearTotal(year - 1);
                    const totalGrowth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;
                    
                    return (
                      <td key={year} className="border border-border p-3 text-center font-bold">
                        <div className="space-y-1">
                          <div className="text-sm">
                            {total > 0 ? formatCurrency(total) : '-'}
                          </div>
                          {year > years[0] && (
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
              {years.map((year, index) => (
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