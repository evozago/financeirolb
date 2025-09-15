import { useState } from "react";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Download, Upload, Save, Target, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Add selectedEntity to window type
declare global {
  interface Window {
    selectedEntity?: string;
  }
}

interface Salesperson {
  id: string;
  name: string;
  baseSalary: number;
  commissionRate: number;
  metaBase: number;
  supermetaRate: number;
  currentSales?: number;
  currentGoal?: number;
}

interface SalesData {
  [key: string]: {
    sales: number;
    goal: number;
  };
}

export function SalespersonPanel() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
  
  // Editable salespeople data
  const [salespeople, setSalespeople] = useState<Salesperson[]>([
    { id: '1', name: 'Maria Silva', baseSalary: 2000, commissionRate: 0.03, metaBase: 15000, supermetaRate: 0.05 },
    { id: '2', name: 'Ana Costa', baseSalary: 2000, commissionRate: 0.03, metaBase: 15000, supermetaRate: 0.05 },
  ]);

  // Sales data for current month/year
  const [salesData, setSalesData] = useState<SalesData>({
    '1': { sales: 18000, goal: 15000 },
    '2': { sales: 12000, goal: 15000 },
  });

  // New salesperson form
  const [newSalesperson, setNewSalesperson] = useState({
    name: '',
    baseSalary: 2000,
    commissionRate: 0.03,
    metaBase: 15000,
    supermetaRate: 0.05
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateCommission = (sales: number, goal: number, person: Salesperson) => {
    if (sales >= goal) {
      return sales * person.supermetaRate; // Super meta rate
    }
    return sales * person.commissionRate; // Base commission rate
  };

  const calculateProgress = (sales: number, goal: number) => {
    return goal > 0 ? Math.min((sales / goal) * 100, 100) : 0;
  };

  const addSalesperson = () => {
    if (!newSalesperson.name.trim()) {
      toast.error("Nome é obrigatório!");
      return;
    }

    const id = Date.now().toString();
    setSalespeople(prev => [...prev, { ...newSalesperson, id }]);
    setSalesData(prev => ({ ...prev, [id]: { sales: 0, goal: newSalesperson.metaBase } }));
    
    setNewSalesperson({
      name: '',
      baseSalary: 2000,
      commissionRate: 0.03,
      metaBase: 15000,
      supermetaRate: 0.05
    });
    
    setIsAddDialogOpen(false);
    toast.success("Vendedora adicionada com sucesso!");
  };

  const editSalesperson = (person: Salesperson) => {
    setEditingSalesperson(person);
    setNewSalesperson({
      name: person.name,
      baseSalary: person.baseSalary,
      commissionRate: person.commissionRate,
      metaBase: person.metaBase,
      supermetaRate: person.supermetaRate
    });
  };

  const saveEditSalesperson = () => {
    if (!editingSalesperson || !newSalesperson.name.trim()) {
      toast.error("Nome é obrigatório!");
      return;
    }

    setSalespeople(prev => prev.map(p => 
      p.id === editingSalesperson.id 
        ? { ...p, ...newSalesperson }
        : p
    ));
    
    setEditingSalesperson(null);
    setNewSalesperson({
      name: '',
      baseSalary: 2000,
      commissionRate: 0.03,
      metaBase: 15000,
      supermetaRate: 0.05
    });
    
    toast.success("Vendedora atualizada com sucesso!");
  };

  const deleteSalesperson = (id: string) => {
    setSalespeople(prev => prev.filter(p => p.id !== id));
    setSalesData(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    toast.success("Vendedora removida com sucesso!");
  };

  const updateSalesData = (salespersonId: string, field: 'sales' | 'goal', value: number) => {
    setSalesData(prev => ({
      ...prev,
      [salespersonId]: {
        ...prev[salespersonId],
        [field]: value
      }
    }));
  };

  const saveAllData = async () => {
    if (!window.selectedEntity) {
      toast.error("Selecione uma entidade antes de salvar");
      return;
    }

    try {
      const entityId = window.selectedEntity;
      
      // Save sales goals for all salespeople
      const goalPromises = salespeople.map(person => {
        const personData = salesData[person.id] || { sales: 0, goal: person.metaBase };
        return supabase.from('sales_goals').upsert({
          entity_id: entityId,
          salesperson_id: person.id,
          year: selectedYear,
          month: selectedMonth,
          goal_amount: personData.goal
        }, { onConflict: 'salesperson_id,entity_id,year,month' });
      });

      await Promise.all(goalPromises);
      toast.success("Dados salvos com sucesso!");
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error("Erro ao salvar dados");
    }
  };

  // Listen for save event from main page
  React.useEffect(() => {
    const handleSave = () => saveAllData();
    window.addEventListener('saveAllSalesData', handleSave);
    return () => window.removeEventListener('saveAllSalesData', handleSave);
  }, []);

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
              <Button size="sm" onClick={saveAllData}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>

          {/* Salespeople List */}
          <div className="grid gap-4 md:grid-cols-2">
            {salespeople.map((person) => {
              const personData = salesData[person.id] || { sales: 0, goal: person.metaBase };
              const progress = calculateProgress(personData.sales, personData.goal);
              const commission = calculateCommission(personData.sales, personData.goal, person);
              
              return (
                <Card key={person.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{person.name}</CardTitle>
                        <CardDescription>
                          Meta Base: {formatCurrency(person.metaBase)} | Comissão: {(person.commissionRate * 100).toFixed(1)}%
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editSalesperson(person)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSalesperson(person.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
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
                          value={personData.sales}
                          onChange={(e) => updateSalesData(person.id, 'sales', parseInt(e.target.value) || 0)}
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
                          value={personData.goal}
                          onChange={(e) => updateSalesData(person.id, 'goal', parseInt(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <Badge variant={progress >= 100 ? "default" : "secondary"}>
                        <Target className="w-3 h-3 mr-1" />
                        {progress.toFixed(0)}% da meta
                      </Badge>
                      <span className="text-sm font-medium">
                        Comissão: {formatCurrency(commission)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Dialog open={isAddDialogOpen || !!editingSalesperson} onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditingSalesperson(null);
              setNewSalesperson({
                name: '',
                baseSalary: 2000,
                commissionRate: 0.03,
                metaBase: 15000,
                supermetaRate: 0.05
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Nova Vendedora
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSalesperson ? 'Editar Vendedora' : 'Adicionar Nova Vendedora'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados da vendedora
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newSalesperson.name}
                    onChange={(e) => setNewSalesperson(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="baseSalary">Salário Base</Label>
                    <Input
                      id="baseSalary"
                      type="number"
                      value={newSalesperson.baseSalary}
                      onChange={(e) => setNewSalesperson(prev => ({ ...prev, baseSalary: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="metaBase">Meta Base</Label>
                    <Input
                      id="metaBase"
                      type="number"
                      value={newSalesperson.metaBase}
                      onChange={(e) => setNewSalesperson(prev => ({ ...prev, metaBase: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commissionRate">Comissão Base (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={newSalesperson.commissionRate * 100}
                      onChange={(e) => setNewSalesperson(prev => ({ ...prev, commissionRate: (parseFloat(e.target.value) || 0) / 100 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supermetaRate">Super Meta (%)</Label>
                    <Input
                      id="supermetaRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={newSalesperson.supermetaRate * 100}
                      onChange={(e) => setNewSalesperson(prev => ({ ...prev, supermetaRate: (parseFloat(e.target.value) || 0) / 100 }))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingSalesperson(null);
                }}>
                  Cancelar
                </Button>
                <Button onClick={editingSalesperson ? saveEditSalesperson : addSalesperson}>
                  {editingSalesperson ? 'Salvar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}