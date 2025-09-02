/**
 * HR Payroll Runs Management Page
 * View and manage payroll processing runs
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, DollarSign, FileText, Play, Eye, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useStatePersistence } from '@/hooks/useStatePersistence';
import { useUndoActions } from '@/hooks/useUndoActions';
import { supabase } from '@/integrations/supabase/client';

interface PayrollRun {
  id: string;
  ano: number;
  mes: number;
  tipo_folha: string;
  descricao: string;
  status: string;
  data_competencia: string;
  data_processamento: string;
  data_fechamento: string;
  total_proventos: number;
  total_descontos: number;
  total_liquido: number;
  observacoes: string;
  created_at: string;
}

export default function HRPayrollRuns() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addUndoAction } = useUndoActions();
  
  const {
    filters,
    pagination,
    setFilters,
    setPagination,
    clearState
  } = useStatePersistence({
    defaultFilters: { year: new Date().getFullYear().toString(), status: '', tipo_folha: '' },
    defaultPagination: { page: 1, pageSize: 20 }
  });

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [filters, pagination]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('hr_payroll_runs')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.year) {
        query = query.eq('ano', parseInt(filters.year));
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.tipo_folha) {
        query = query.eq('tipo_folha', filters.tipo_folha);
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query.order('data_competencia', { ascending: false });
      
      if (error) throw error;
      
      setPayrollRuns(data || []);
      setTotalCount(count || 0);
      
    } catch (error) {
      console.error('Error loading payroll runs:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar folhas de pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayroll = async (payrollRun: PayrollRun) => {
    try {
      const { error } = await supabase.rpc('process_payroll_run', {
        p_payroll_run_id: payrollRun.id
      });
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Folha de pagamento processada com sucesso",
      });
      
      loadData();
      
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast({
        title: "Erro",
        description: "Falha ao processar folha de pagamento",
        variant: "destructive",
      });
    }
  };

  const handleClosePayroll = async (payrollRun: PayrollRun) => {
    if (!confirm(`Tem certeza que deseja fechar a folha de ${getMonthName(payrollRun.mes)}/${payrollRun.ano}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const originalData = { ...payrollRun };
      
      const { error } = await supabase
        .from('hr_payroll_runs')
        .update({ 
          status: 'fechada',
          data_fechamento: new Date().toISOString()
        })
        .eq('id', payrollRun.id);
      
      if (error) throw error;
      
      addUndoAction({
        id: payrollRun.id,
        type: 'bulkEdit',
        data: { id: payrollRun.id, status: 'fechada' },
        originalData: originalData
      });
      
      toast({
        title: "Sucesso",
        description: "Folha de pagamento fechada com sucesso",
      });
      
      loadData();
      
    } catch (error) {
      console.error('Error closing payroll:', error);
      toast({
        title: "Erro",
        description: "Falha ao fechar folha de pagamento",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'simulacao':
        return <Badge variant="secondary">Simulação</Badge>;
      case 'processada':
        return <Badge variant="default" className="bg-green-500">Processada</Badge>;
      case 'fechada':
        return <Badge variant="destructive">Fechada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTipoFolhaBadge = (tipo: string) => {
    switch (tipo) {
      case 'mensal':
        return <Badge variant="default">Mensal</Badge>;
      case 'decimo_terceiro':
        return <Badge variant="secondary">13º Salário</Badge>;
      case 'ferias':
        return <Badge className="bg-blue-500">Férias</Badge>;
      case 'rescisao':
        return <Badge className="bg-orange-500">Rescisão</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
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

  const totalPages = Math.ceil(totalCount / pagination.pageSize);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
                <h1 className="text-2xl font-bold text-foreground">Folhas de Pagamento</h1>
                <p className="text-muted-foreground">
                  Visualizar e gerenciar folhas processadas
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/hr/process-run')} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Folha
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={filters.year}
                onValueChange={(value) => setFilters({ ...filters, year: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os Status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="simulacao">Simulação</SelectItem>
                  <SelectItem value="processada">Processada</SelectItem>
                  <SelectItem value="fechada">Fechada</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.tipo_folha}
                onValueChange={(value) => setFilters({ ...filters, tipo_folha: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Folha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os Tipos</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="decimo_terceiro">13º Salário</SelectItem>
                  <SelectItem value="ferias">Férias</SelectItem>
                  <SelectItem value="rescisao">Rescisão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearState}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competência</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Proventos</TableHead>
                    <TableHead>Descontos</TableHead>
                    <TableHead>Líquido</TableHead>
                    <TableHead>Processamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="animate-pulse">Carregando folhas de pagamento...</div>
                      </TableCell>
                    </TableRow>
                  ) : payrollRuns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Nenhuma folha de pagamento encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    payrollRuns.map((payrollRun) => (
                      <TableRow key={payrollRun.id}>
                        <TableCell className="font-medium">
                          {getMonthName(payrollRun.mes)}/{payrollRun.ano}
                        </TableCell>
                        <TableCell>{getTipoFolhaBadge(payrollRun.tipo_folha)}</TableCell>
                        <TableCell>{getStatusBadge(payrollRun.status)}</TableCell>
                        <TableCell>{formatCurrency(payrollRun.total_proventos)}</TableCell>
                        <TableCell>{formatCurrency(payrollRun.total_descontos)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payrollRun.total_liquido)}
                        </TableCell>
                        <TableCell>
                          {payrollRun.data_processamento ? 
                            new Date(payrollRun.data_processamento).toLocaleDateString('pt-BR') : 
                            '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/hr/payslips?payroll_run_id=${payrollRun.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {payrollRun.status === 'rascunho' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleProcessPayroll(payrollRun)}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            {payrollRun.status === 'processada' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleClosePayroll(payrollRun)}
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-muted-foreground">
              Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a {Math.min(pagination.page * pagination.pageSize, totalCount)} de {totalCount} folhas
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === totalPages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}