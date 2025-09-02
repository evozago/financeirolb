/**
 * HR Process Payroll Run Wizard
 * Step-by-step wizard for processing payroll with Brazilian compliance
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, DollarSign, FileText, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PayrollData {
  ano: number;
  mes: number;
  tipo_folha: string;
  descricao: string;
  data_competencia: string;
  observacoes: string;
}

interface Employee {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  salario_base: number;
  dias_trabalhados: number;
  horas_extras: number;
  comissao_vendas: number;
}

interface PayslipPreview {
  funcionario_id: string;
  funcionario_nome: string;
  salario_base: number;
  total_proventos: number;
  total_descontos: number;
  salario_liquido: number;
}

export default function HRProcessRun() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Step 1: Basic payroll data
  const [payrollData, setPayrollData] = useState<PayrollData>({
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    tipo_folha: 'mensal',
    descricao: '',
    data_competencia: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  // Step 2: Employee data
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Step 3: Preview data
  const [payslipPreviews, setPayslipPreviews] = useState<PayslipPreview[]>([]);
  const [payrollRunId, setPayrollRunId] = useState<string>('');

  useEffect(() => {
    if (currentStep === 2) {
      loadEmployees();
    }
  }, [currentStep]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('funcionarios')
        .select(`
          id, nome, cargo, setor, salario,
          hr_contracts!hr_contracts_funcionario_id_fkey(salario_base, ativo)
        `)
        .eq('ativo', true)
        .eq('status_funcionario', 'ativo');
      
      if (error) throw error;
      
      const employeeData = data?.map(emp => ({
        id: emp.id,
        nome: emp.nome,
        cargo: emp.cargo || '',
        setor: emp.setor || '',
        salario_base: emp.hr_contracts?.[0]?.salario_base || emp.salario || 0,
        dias_trabalhados: 30,
        horas_extras: 0,
        comissao_vendas: 0
      })) || [];
      
      setEmployees(employeeData);
      
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar funcionários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStepNext = async () => {
    if (currentStep === 1) {
      await createPayrollRun();
    } else if (currentStep === 2) {
      await generatePreview();
    } else if (currentStep === 3) {
      await processPayroll();
    }
  };

  const createPayrollRun = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('hr_payroll_runs')
        .insert({
          ...payrollData,
          status: 'rascunho'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setPayrollRunId(data.id);
      setCurrentStep(2);
      
    } catch (error) {
      console.error('Error creating payroll run:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar folha de pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    try {
      setLoading(true);
      
      const previews: PayslipPreview[] = [];
      
      for (const employee of employees) {
        // Simulate payroll calculation
        const salario_proporcional = employee.salario_base * (employee.dias_trabalhados / 30);
        const horas_extras_valor = employee.horas_extras * (employee.salario_base / 220) * 1.5;
        const total_proventos = salario_proporcional + horas_extras_valor + employee.comissao_vendas;
        
        // Simplified tax calculations
        const vale_transporte = Math.min(189.20, employee.salario_base * 0.06);
        const inss = total_proventos <= 1412.00 ? total_proventos * 0.075 :
                    total_proventos <= 2666.68 ? total_proventos * 0.09 :
                    total_proventos <= 4000.03 ? total_proventos * 0.12 :
                    total_proventos * 0.14;
        
        const total_descontos = vale_transporte + inss;
        const salario_liquido = total_proventos - total_descontos;
        
        previews.push({
          funcionario_id: employee.id,
          funcionario_nome: employee.nome,
          salario_base: employee.salario_base,
          total_proventos,
          total_descontos,
          salario_liquido
        });
      }
      
      setPayslipPreviews(previews);
      setCurrentStep(3);
      
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar prévia da folha",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processPayroll = async () => {
    try {
      setLoading(true);
      
      // Process each employee's payroll
      for (const employee of employees) {
        await supabase.rpc('calculate_brazilian_payroll', {
          p_funcionario_id: employee.id,
          p_payroll_run_id: payrollRunId,
          p_salario_base: employee.salario_base,
          p_dias_trabalhados: employee.dias_trabalhados,
          p_horas_extras: employee.horas_extras,
          p_comissao_vendas: employee.comissao_vendas
        });
      }
      
      // Update payroll run status
      const { error } = await supabase
        .from('hr_payroll_runs')
        .update({ status: 'simulacao' })
        .eq('id', payrollRunId);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Folha de pagamento processada com sucesso",
      });
      
      navigate(`/hr/payslips?payroll_run_id=${payrollRunId}`);
      
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast({
        title: "Erro",
        description: "Falha ao processar folha de pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEmployeeData = (employeeId: string, field: keyof Employee, value: number) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId ? { ...emp, [field]: value } : emp
    ));
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const totalLiquido = payslipPreviews.reduce((sum, preview) => sum + preview.salario_liquido, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/hr')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para RH
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Processar Folha de Pagamento</h1>
                <p className="text-muted-foreground">
                  Wizard para processamento de nova folha
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep >= 1 ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
            }`}>
              {currentStep > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <div className={`w-16 h-1 ${currentStep > 1 ? 'bg-primary' : 'bg-border'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep >= 2 ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
            }`}>
              {currentStep > 2 ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <div className={`w-16 h-1 ${currentStep > 2 ? 'bg-primary' : 'bg-border'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep >= 3 ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
            }`}>
              {currentStep > 3 ? <Check className="h-4 w-4" /> : '3'}
            </div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações da Folha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ano">Ano</Label>
                  <Input
                    id="ano"
                    type="number"
                    value={payrollData.ano}
                    onChange={(e) => setPayrollData(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mes">Mês</Label>
                  <Select
                    value={payrollData.mes.toString()}
                    onValueChange={(value) => setPayrollData(prev => ({ ...prev, mes: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <SelectItem key={month} value={month.toString()}>
                          {getMonthName(month)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tipo_folha">Tipo de Folha</Label>
                  <Select
                    value={payrollData.tipo_folha}
                    onValueChange={(value) => setPayrollData(prev => ({ ...prev, tipo_folha: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">Folha Mensal</SelectItem>
                      <SelectItem value="decimo_terceiro">13º Salário</SelectItem>
                      <SelectItem value="ferias">Férias</SelectItem>
                      <SelectItem value="rescisao">Rescisão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data_competencia">Data de Competência</Label>
                  <Input
                    id="data_competencia"
                    type="date"
                    value={payrollData.data_competencia}
                    onChange={(e) => setPayrollData(prev => ({ ...prev, data_competencia: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={payrollData.descricao}
                  onChange={(e) => setPayrollData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Folha de Janeiro 2025"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={payrollData.observacoes}
                  onChange={(e) => setPayrollData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais sobre esta folha..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Dados dos Funcionários
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse">Carregando funcionários...</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Salário Base</TableHead>
                        <TableHead>Dias Trabalhados</TableHead>
                        <TableHead>Horas Extras</TableHead>
                        <TableHead>Comissão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.nome}</TableCell>
                          <TableCell>{employee.cargo}</TableCell>
                          <TableCell>{formatCurrency(employee.salario_base)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="31"
                              value={employee.dias_trabalhados}
                              onChange={(e) => updateEmployeeData(employee.id, 'dias_trabalhados', parseInt(e.target.value) || 0)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={employee.horas_extras}
                              onChange={(e) => updateEmployeeData(employee.id, 'horas_extras', parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={employee.comissao_vendas}
                              onChange={(e) => updateEmployeeData(employee.id, 'comissao_vendas', parseFloat(e.target.value) || 0)}
                              className="w-32"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Revise cuidadosamente os valores antes de confirmar o processamento. 
                Esta ação irá gerar os holerites para todos os funcionários.
              </AlertDescription>
            </Alert>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Prévia da Folha - {getMonthName(payrollData.mes)}/{payrollData.ano}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Salário Base</TableHead>
                        <TableHead>Total Proventos</TableHead>
                        <TableHead>Total Descontos</TableHead>
                        <TableHead>Salário Líquido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payslipPreviews.map((preview) => (
                        <TableRow key={preview.funcionario_id}>
                          <TableCell className="font-medium">{preview.funcionario_nome}</TableCell>
                          <TableCell>{formatCurrency(preview.salario_base)}</TableCell>
                          <TableCell>{formatCurrency(preview.total_proventos)}</TableCell>
                          <TableCell>{formatCurrency(preview.total_descontos)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(preview.salario_liquido)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Líquido da Folha:</span>
                    <span className="text-2xl font-bold">{formatCurrency(totalLiquido)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate('/hr')}
            disabled={loading}
          >
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </Button>
          
          <Button
            onClick={handleStepNext}
            disabled={loading}
          >
            {loading ? 'Processando...' : 
             currentStep === 3 ? 'Confirmar Processamento' : 'Próximo'}
          </Button>
        </div>
      </div>
    </div>
  );
}