import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Upload, Save, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Salesperson {
  id: string;
  name: string;
  baseSalary: number;
  commissionRate: number;
  metaBase: number;
  supermetaRate: number;
}

export function SalespersonPanel() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Mock data
  const [salespeople] = useState<Salesperson[]>([
    { id: '1', name: 'Maria Silva', baseSalary: 2000, commissionRate: 0.03, metaBase: 15000, supermetaRate: 0.05 },
    { id: '2', name: 'Ana Costa', baseSalary: 2000, commissionRate: 0.03, metaBase: 15000, supermetaRate: 0.05 },
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Painel de Vendedoras</CardTitle>
          <CardDescription>
            Gerencie informações das vendedoras, metas e comissões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
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
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>

          {/* Salespeople List */}
          <div className="grid gap-4 md:grid-cols-2">
            {salespeople.map((person) => (
              <Card key={person.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{person.name}</CardTitle>
                  <CardDescription>
                    Meta: {formatCurrency(person.metaBase)} | Comissão: {(person.commissionRate * 100).toFixed(1)}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`sales-${person.id}`} className="text-sm">
                        Vendas do Mês
                      </Label>
                      <Input
                        id={`sales-${person.id}`}
                        type="number"
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`goal-${person.id}`} className="text-sm">
                        Meta Mensal
                      </Label>
                      <Input
                        id={`goal-${person.id}`}
                        type="number"
                        defaultValue={person.metaBase}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <Badge variant="secondary">
                      <Target className="w-3 h-3 mr-1" />
                      0% da meta
                    </Badge>
                    <span className="text-sm font-medium">
                      Comissão: {formatCurrency(0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Nova Vendedora
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}