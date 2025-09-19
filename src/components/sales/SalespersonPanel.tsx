import { useState, useEffect } from "react";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Download, Upload, Save, Target, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSalesData } from "@/hooks/useSalesData";

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

interface ExistingEmployee {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  salario?: number;
}

interface SalesData {
  [key: string]: {
    sales: number;
    goal: number;
  };
}

export function SalespersonPanel() {
  const { 
    loading, 
    currentYear, 
    setCurrentYear, 
    salespersonData, 
    updateSalespersonGoal, 
    saveAllData,
    hasEntity 
  } = useSalesData();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
  const [existingEmployees, setExistingEmployees] = useState<ExistingEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  
  // Local salespeople data
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);

  // New salesperson form
  const [newSalesperson, setNewSalesperson] = useState({
    name: '',
    baseSalary: undefined as number | undefined,
    commissionRate: undefined as number | undefined,
    metaBase: undefined as number | undefined,
    supermetaRate: undefined as number | undefined
  });

  // Load existing employees (funcionários and vendedoras)
  const loadExistingEmployees = async () => {
    try {
      // Get from funcionarios_unified view
      const { data: funcionarios, error: funcError } = await supabase
        .from('funcionarios_unified')
        .select('id, nome, cpf, email, telefone, salario')
        .eq('ativo', true);

      // Get from vendedoras table
      const { data: vendedoras, error: vendError } = await supabase
        .from('vendedoras')
        .select('id, nome')
        .eq('ativo', true);

      if (funcError) console.error('Error loading funcionarios:', funcError);
      if (vendError) console.error('Error loading vendedoras:', vendError);

      const combined: ExistingEmployee[] = [
        ...(funcionarios || []).map(f => ({
          id: f.id || '',
          nome: f.nome || '',
          cpf: f.cpf,
          email: f.email,
          telefone: f.telefone,
          salario: f.salario ? Number(f.salario) : undefined
        })),
        ...(vendedoras || []).map(v => ({
          id: v.id || '',
          nome: v.nome || ''
        }))
      ];

      setExistingEmployees(combined);
    } catch (error) {
      console.error('Error loading existing employees:', error);
      toast.error('Erro ao carregar funcionários/vendedoras');
    }
  };

  useEffect(() => {
    loadExistingEmployees();
  }, []);

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

    const id = selectedEmployee || Date.now().toString();
    setSalespeople(prev => [...prev, { ...newSalesperson, id }]);
    
    setNewSalesperson({
      name: '',
      baseSalary: undefined,
      commissionRate: undefined,
      metaBase: undefined,
      supermetaRate: undefined
    });
    setSelectedEmployee('');
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
    toast.success("Vendedora removida com sucesso!");
  };

  const updateGoalForMonth = (salespersonId: string, value: string) => {
    updateSalespersonGoal(salespersonId, selectedMonth, value);
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

  // Fill salesperson form from selected employee
  const selectExistingEmployee = (employeeId: string) => {
    const employee = existingEmployees.find(e => e.id === employeeId);
    if (employee) {
      setNewSalesperson(prev => ({
        ...prev,
        name: employee.nome,
        baseSalary: employee.salario || undefined
      }));
    }
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

              <Select value={currentYear.toString()} onValueChange={(value) => setCurrentYear(parseInt(value))}>
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
              <Button size="sm" onClick={handleSaveAll} disabled={loading || !hasEntity}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>

          {/* Salespeople List */}
          <div className="grid gap-4 md:grid-cols-2">
            {salespersonData.map((person) => {
              const monthlyGoal = person.monthly_goals[selectedMonth] || '';
              const progress = typeof monthlyGoal === 'number' && monthlyGoal > 0 ? 50 : 0; // Placeholder
              
              return (
                <Card key={person.salesperson_id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{person.salesperson_name}</CardTitle>
                        <CardDescription>
                          Meta {months.find(m => m.value === selectedMonth)?.label}: {
                            typeof monthlyGoal === 'number' ? formatCurrency(monthlyGoal) : 'Não definida'
                          }
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor={`goal-${person.salesperson_id}`} className="text-sm">
                          Meta Mensal - {months.find(m => m.value === selectedMonth)?.label}
                        </Label>
                        <CurrencyInput
                          value={typeof monthlyGoal === 'number' ? monthlyGoal : undefined}
                          onValueChange={(value) => updateGoalForMonth(person.salesperson_id, value?.toString() || '')}
                          placeholder="R$ 0,00"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <Badge variant={progress >= 100 ? "default" : "secondary"}>
                        <Target className="w-3 h-3 mr-1" />
                        Meta definida
                      </Badge>
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
                  <Label htmlFor="existing">Selecionar Funcionário/Vendedora Existente</Label>
                  <Select value={selectedEmployee} onValueChange={(value) => {
                    setSelectedEmployee(value);
                    selectExistingEmployee(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolher do cadastro existente (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.nome} {employee.cpf ? `(${employee.cpf})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
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
                    <CurrencyInput
                      value={newSalesperson.baseSalary}
                      onValueChange={(value) => setNewSalesperson(prev => ({ ...prev, baseSalary: value }))}
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="metaBase">Meta Base</Label>
                    <CurrencyInput
                      value={newSalesperson.metaBase}
                      onValueChange={(value) => setNewSalesperson(prev => ({ ...prev, metaBase: value }))}
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commissionRate">Comissão Base (%)</Label>
                    <NumberInput
                      value={newSalesperson.commissionRate ? newSalesperson.commissionRate * 100 : undefined}
                      onValueChange={(value) => setNewSalesperson(prev => ({ 
                        ...prev, 
                        commissionRate: value ? value / 100 : undefined 
                      }))}
                      decimals={2}
                      min={0}
                      max={100}
                      placeholder="Ex: 3.50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supermetaRate">Super Meta (%)</Label>
                    <NumberInput
                      value={newSalesperson.supermetaRate ? newSalesperson.supermetaRate * 100 : undefined}
                      onValueChange={(value) => setNewSalesperson(prev => ({ 
                        ...prev, 
                        supermetaRate: value ? value / 100 : undefined 
                      }))}
                      decimals={2}
                      min={0}
                      max={100}
                      placeholder="Ex: 5.00"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingSalesperson(null);
                  setSelectedEmployee('');
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