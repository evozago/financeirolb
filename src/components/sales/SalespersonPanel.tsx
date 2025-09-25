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
    updateSalespersonSales,
    saveAllData,
    hasEntity,
  } = useSalesData();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);
  const [existingEmployees, setExistingEmployees] = useState<ExistingEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  
  // Local overrides to reflect edits/deletes immediately
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [editedNames, setEditedNames] = useState<Record<string, string>>({});
  
  // Local salespeople data (legacy - not used for rendering, kept for form state)
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);

  // New salesperson form
  const [newSalesperson, setNewSalesperson] = useState({
    name: '',
    baseSalary: undefined as number | undefined,
    commissionRate: undefined as number | undefined,
    metaBase: undefined as number | undefined,
    supermetaRate: undefined as number | undefined
  });

  // Load existing employees from pessoas table
  const loadExistingEmployees = async () => {
    try {
      // Buscar pessoas ativas
      const { data: pessoas, error: pessoasError } = await supabase
        .from('pessoas')
        .select('id, nome, cpf, cnpj, email, telefone, tipo_pessoa, cpf_cnpj_normalizado, dados_vendedora')
        .eq('ativo', true)
        .order('nome');
      if (pessoasError) throw pessoasError;

      // Converter para formato esperado
      const employees: ExistingEmployee[] = (pessoas || []).map((p) => ({
        id: p.id || '',
        nome: p.nome || '',
        cpf: p.cpf || p.cnpj || undefined,
        email: p.email || undefined,
        telefone: p.telefone || undefined,
        salario: p.dados_vendedora?.salario_base ? Number(p.dados_vendedora.salario_base) : undefined,
      }));

      setExistingEmployees(employees);
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

  const addSalesperson = async () => {
    if (!newSalesperson.name.trim()) {
      toast.error("Nome é obrigatório!");
      return;
    }

    try {
<<<<<<< HEAD
      const vendedoraPapelId = 'e63522f6-da7e-49fe-884e-2b65b82e8456'; // ID do papel vendedora
      
      if (selectedEmployee) {
        // Atualizar pessoa existente
        const dadosVendedora = {
          salario_base: newSalesperson.baseSalary || null,
          comissao_padrao: newSalesperson.commissionRate != null ? newSalesperson.commissionRate * 100 : null,
          comissao_supermeta: newSalesperson.supermetaRate != null ? newSalesperson.supermetaRate * 100 : null,
          meta_mensal: newSalesperson.metaBase || null,
        };

        // Atualizar dados da pessoa
        const { error: updateError } = await supabase
          .from('pessoas')
          .update({
            nome: newSalesperson.name,
            dados_vendedora: dadosVendedora,
          })
          .eq('id', selectedEmployee);
        if (updateError) throw updateError;
=======
      console.log('Adicionando vendedora:', newSalesperson.name);
      
      if (selectedEmployee) {
        if (selectedEmployee.startsWith('entidade:')) {
          // Criar/atualizar registro a partir de uma entidade corporativa
          const entidadeId = selectedEmployee.split(':')[1];
          console.log('Buscando entidade:', entidadeId);
          
          const { data: ent, error: entErr } = await supabase
            .from('entidades_corporativas')
            .select('id, nome_razao_social, cpf_cnpj, cpf_cnpj_normalizado, email, telefone, tipo_pessoa')
            .eq('id', entidadeId)
            .maybeSingle();
          if (entErr) throw entErr;

          console.log('Entidade encontrada:', ent);

          // Adicionar papel de vendedora à entidade corporativa
          const { data: papelVendedora, error: papelErr } = await supabase
            .from('papeis')
            .select('id')
            .ilike('nome', 'vendedor%')
            .maybeSingle();
            
          if (papelErr) throw papelErr;
          
          if (papelVendedora) {
            console.log('Adicionando papel de vendedora:', papelVendedora.id);
            
            // Verificar se já tem o papel
            const { data: existingRole } = await supabase
              .from('entidade_papeis')
              .select('id')
              .eq('entidade_id', entidadeId)
              .eq('papel_id', papelVendedora.id)
              .eq('ativo', true)
              .maybeSingle();

            if (!existingRole) {
              const { error: roleError } = await supabase
                .from('entidade_papeis')
                .insert({
                  entidade_id: entidadeId,
                  papel_id: papelVendedora.id,
                  data_inicio: new Date().toISOString().split('T')[0],
                  ativo: true,
                });
              
              if (roleError) {
                console.error('Erro ao adicionar papel de vendedora:', roleError);
              }
            }
          }

          // Também manter a compatibilidade com a tabela fornecedores (legado)
          const normDoc = ent?.cpf_cnpj_normalizado || (ent?.cpf_cnpj ? String(ent.cpf_cnpj).replace(/\D/g, '') : null);
          let fornecedorId: string | null = null;
>>>>>>> 83992e163d2cee7fbd9860f7b854169875474e97

        // Verificar se já tem papel de vendedora
        const { data: existingRole } = await supabase
          .from('papeis_pessoa')
          .select('id')
          .eq('pessoa_id', selectedEmployee)
          .eq('papel_id', vendedoraPapelId)
          .eq('ativo', true)
          .maybeSingle();

<<<<<<< HEAD
        // Se não tem papel, adicionar
        if (!existingRole) {
          const { error: roleError } = await supabase
            .from('papeis_pessoa')
            .insert([{
              pessoa_id: selectedEmployee,
              papel_id: vendedoraPapelId,
              ativo: true,
            }]);
          if (roleError) throw roleError;
        }
      } else {
        // Criar nova pessoa
        const dadosVendedora = {
          salario_base: newSalesperson.baseSalary || null,
          comissao_padrao: newSalesperson.commissionRate != null ? newSalesperson.commissionRate * 100 : null,
          comissao_supermeta: newSalesperson.supermetaRate != null ? newSalesperson.supermetaRate * 100 : null,
          meta_mensal: newSalesperson.metaBase || null,
        };

        const { data: newPerson, error: insertError } = await supabase
          .from('pessoas')
          .insert([{
=======
          if (fornecedorId) {
            const { error } = await supabase
              .from('fornecedores')
              .update({
                eh_vendedora: true,
                nome: newSalesperson.name,
                salario: newSalesperson.baseSalary ?? null,
                comissao_padrao: newSalesperson.commissionRate != null ? newSalesperson.commissionRate * 100 : null,
                comissao_supermeta: newSalesperson.supermetaRate != null ? newSalesperson.supermetaRate * 100 : null,
                meta_mensal: newSalesperson.metaBase ?? null,
              })
              .eq('id', fornecedorId);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('fornecedores')
              .insert([{ 
                nome: newSalesperson.name || ent?.nome_razao_social || '',
                tipo_pessoa: ent?.tipo_pessoa || 'pessoa_fisica',
                ativo: true,
                eh_vendedora: true,
                salario: newSalesperson.baseSalary ?? null,
                comissao_padrao: newSalesperson.commissionRate != null ? newSalesperson.commissionRate * 100 : null,
                comissao_supermeta: newSalesperson.supermetaRate != null ? newSalesperson.supermetaRate * 100 : null,
                meta_mensal: newSalesperson.metaBase ?? null,
                cnpj_cpf: ent?.cpf_cnpj || null,
                cpf_cnpj_normalizado: normDoc || null,
                email: ent?.email || null,
                telefone: ent?.telefone || null,
              }]);
            if (error) throw error;
          }
        } else {
          // Marcar fornecedor existente como vendedora
          console.log('Atualizando fornecedor existente:', selectedEmployee);
          
          const { error } = await supabase
            .from('fornecedores')
            .update({
              eh_vendedora: true,
              nome: newSalesperson.name,
              salario: newSalesperson.baseSalary ?? null,
              comissao_padrao: newSalesperson.commissionRate != null ? newSalesperson.commissionRate * 100 : null,
              comissao_supermeta: newSalesperson.supermetaRate != null ? newSalesperson.supermetaRate * 100 : null,
              meta_mensal: newSalesperson.metaBase ?? null,
            })
            .eq('id', selectedEmployee);
          if (error) throw error;
        }
      } else {
        // Criar nova pessoa e definir como vendedora
        console.log('Criando nova pessoa como vendedora');
        
        // 1. Criar na tabela entidades_corporativas
        const { data: novaEntidade, error: entidadeError } = await supabase
          .from('entidades_corporativas')
          .insert({
            nome_razao_social: newSalesperson.name,
            tipo_pessoa: 'pessoa_fisica',
            ativo: true,
          })
          .select()
          .single();
          
        if (entidadeError) throw entidadeError;
        
        console.log('Nova entidade criada:', novaEntidade);
        
        // 2. Adicionar papel de vendedora
        const { data: papelVendedora, error: papelErr } = await supabase
          .from('papeis')
          .select('id')
          .ilike('nome', 'vendedor%')
          .maybeSingle();
          
        if (papelVendedora) {
          const { error: roleError } = await supabase
            .from('entidade_papeis')
            .insert({
              entidade_id: novaEntidade.id,
              papel_id: papelVendedora.id,
              data_inicio: new Date().toISOString().split('T')[0],
              ativo: true,
            });
            
          if (roleError) {
            console.error('Erro ao adicionar papel de vendedora:', roleError);
          }
        }

        // 3. Também criar na tabela fornecedores para compatibilidade
        const { error: fornecedorError } = await supabase
          .from('fornecedores')
          .insert([{ 
>>>>>>> 83992e163d2cee7fbd9860f7b854169875474e97
            nome: newSalesperson.name,
            tipo_pessoa: 'pessoa_fisica',
            ativo: true,
            dados_vendedora: dadosVendedora,
          }])
          .select('id')
          .single();
        if (insertError) throw insertError;

        // Adicionar papel de vendedora
        const { error: roleError } = await supabase
          .from('papeis_pessoa')
          .insert([{
            pessoa_id: newPerson.id,
            papel_id: vendedoraPapelId,
            ativo: true,
          }]);
<<<<<<< HEAD
        if (roleError) throw roleError;
      }

      // Atualizar lista
=======
        if (fornecedorError) {
          console.warn('Erro ao criar na tabela fornecedores (legado):', fornecedorError);
        }
      }

      // Atualizar listas
>>>>>>> 83992e163d2cee7fbd9860f7b854169875474e97
      await loadExistingEmployees();

      // Resetar form
      setNewSalesperson({ name: '', baseSalary: undefined, commissionRate: undefined, metaBase: undefined, supermetaRate: undefined });
      setSelectedEmployee('');
      setIsAddDialogOpen(false);
      toast.success("Vendedora adicionada com sucesso!");
    } catch (e: any) {
      console.error('Erro ao adicionar vendedora:', e);
      toast.error(e?.message || 'Falha ao adicionar vendedora');
    }
  };

  const editSalesperson = async (person: Salesperson) => {
    try {
      // Load current data from pessoas
      const { data, error } = await supabase
        .from('pessoas')
        .select('id, nome, dados_vendedora')
        .eq('id', person.id)
        .single();
      if (error) throw error;

      const dadosVendedora = data.dados_vendedora || {};
      
      setEditingSalesperson({ 
        id: data.id, 
        name: data.nome, 
        baseSalary: Number(dadosVendedora.salario_base || 0), 
        commissionRate: Number(dadosVendedora.comissao_padrao || 0) / 100, 
        metaBase: Number(dadosVendedora.meta_mensal || 0), 
        supermetaRate: Number(dadosVendedora.comissao_supermeta || 0) / 100 
      });
      
      setNewSalesperson({
        name: data.nome || '',
        baseSalary: dadosVendedora.salario_base ? Number(dadosVendedora.salario_base) : undefined,
        commissionRate: dadosVendedora.comissao_padrao != null ? Number(dadosVendedora.comissao_padrao) / 100 : undefined,
        metaBase: dadosVendedora.meta_mensal ? Number(dadosVendedora.meta_mensal) : undefined,
        supermetaRate: dadosVendedora.comissao_supermeta != null ? Number(dadosVendedora.comissao_supermeta) / 100 : undefined,
      });
    } catch (e: any) {
      console.error('Erro ao carregar vendedora:', e);
      toast.error('Não foi possível carregar os dados da vendedora');
    }
  };

  const saveEditSalesperson = async () => {
    if (!editingSalesperson || !newSalesperson.name.trim()) {
      toast.error("Nome é obrigatório!");
      return;
    }
    try {
      const dadosVendedora = {
        salario_base: newSalesperson.baseSalary || null,
        comissao_padrao: newSalesperson.commissionRate != null ? newSalesperson.commissionRate * 100 : null,
        comissao_supermeta: newSalesperson.supermetaRate != null ? newSalesperson.supermetaRate * 100 : null,
        meta_mensal: newSalesperson.metaBase || null,
      };

      const { error } = await supabase
        .from('pessoas')
        .update({
          nome: newSalesperson.name,
          dados_vendedora: dadosVendedora,
        })
        .eq('id', editingSalesperson.id);
      if (error) throw error;

      setEditedNames((prev) => ({ ...prev, [editingSalesperson.id]: newSalesperson.name }));

      setEditingSalesperson(null);
      setNewSalesperson({ name: '', baseSalary: undefined, commissionRate: undefined, metaBase: undefined, supermetaRate: undefined });
      toast.success("Vendedora atualizada com sucesso!");
    } catch (e: any) {
      console.error('Erro ao salvar vendedora:', e);
      toast.error('Falha ao salvar alterações');
    }
  };

  const deleteSalesperson = async (id: string) => {
    try {
      const vendedoraPapelId = 'e63522f6-da7e-49fe-884e-2b65b82e8456'; // ID do papel vendedora
      
      // Desativar papel de vendedora
      const { error } = await supabase
        .from('papeis_pessoa')
        .update({ ativo: false })
        .eq('pessoa_id', id)
        .eq('papel_id', vendedoraPapelId);
      if (error) throw error;

      setRemovedIds((prev) => [...prev, id]);
      toast.success("Vendedora removida do painel!");
    } catch (e: any) {
      console.error('Erro ao remover vendedora:', e);
      toast.error('Não foi possível remover');
    }
  };

  const updateGoalForMonth = (salespersonId: string, value: string) => {
    updateSalespersonGoal(salespersonId, selectedMonth, value);
  };

  const updateSalesForMonth = (salespersonId: string, value: string) => {
    updateSalespersonSales(salespersonId, selectedMonth, value);
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
            {salespersonData && salespersonData.length > 0 ? (
              salespersonData
                .filter((p) => !removedIds.includes(p.salesperson_id))
                .map((person) => {
                const monthlyGoal = person.monthly_goals[selectedMonth] || '';
                const progress = typeof monthlyGoal === 'number' && monthlyGoal > 0 ? 50 : 0; // Placeholder
                const displayName = editedNames[person.salesperson_id] ?? person.salesperson_name;
                
                return (
                  <Card key={person.salesperson_id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{displayName}</CardTitle>
                          <CardDescription>
                            Meta {months.find(m => m.value === selectedMonth)?.label}: {
                              typeof monthlyGoal === 'number' ? formatCurrency(monthlyGoal) : 'Não definida'
                            }
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => editSalesperson({
                              id: person.salesperson_id,
                              name: displayName,
                              baseSalary: 0,
                              commissionRate: 0.03,
                              metaBase: 0,
                              supermetaRate: 0.05
                            })}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja remover ${displayName}?`)) {
                                deleteSalesperson(person.salesperson_id);
                              }
                            }}
                          >
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
                        
                        <div>
                          <Label htmlFor={`sales-${person.salesperson_id}`} className="text-sm">
                            Vendas Realizadas - {months.find(m => m.value === selectedMonth)?.label}
                          </Label>
                          <CurrencyInput
                            value={person.monthly_sales?.[selectedMonth] || undefined}
                            onValueChange={(value) => updateSalesForMonth(person.salesperson_id, value?.toString() || '')}
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
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">
                  {loading ? 'Carregando vendedoras...' : 'Nenhuma vendedora encontrada. Adicione vendedoras usando o botão abaixo.'}
                </p>
              </div>
            )}
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
                      {existingEmployees.map((employee, idx) => (
                        <SelectItem key={`${employee.id}-${idx}`} value={employee.id}>
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