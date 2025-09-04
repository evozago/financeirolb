/**
 * HR Employees Management Page
 * Manage employee records and contracts with Brazilian compliance
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Filter, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedSelect } from '@/components/ui/enhanced-select';
import { useToast } from '@/hooks/use-toast';
import { useStatePersistence } from '@/hooks/useStatePersistence';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cargo: string;
  setor: string;
  data_admissao: string;
  status_funcionario: string;
  ativo: boolean;
  salario: number;
  cargo_id?: string;
  setor_id?: string;
  dados_funcionario?: any;
}

interface Position {
  id: string;
  nome: string;
  salario_base_sugerido: number;
}

interface Department {
  id: string;
  nome: string;
}

export default function HREmployees() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    filters,
    pagination,
    selectedItems,
    setFilters,
    setPagination,
    setSelectedItems,
    clearState
  } = useStatePersistence({
    defaultFilters: { search: '', status: '', cargo: '', setor: '' },
    defaultPagination: { page: 1, pageSize: 20 }
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadData();
    loadLookupData();
  }, [filters, pagination]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Query employees from the new corporate entities system
      let query = supabase
        .from('entidades_corporativas')
        .select(`
          id,
          nome_razao_social,
          cpf_cnpj,
          email,
          telefone,
          ativo,
          created_at,
          entidade_papeis!inner(
            papel_id,
            papeis_corporativos!inner(nome)
          ),
          funcionarios_detalhes(
            cargo_id,
            setor_id,
            data_admissao,
            salario_base,
            status_funcionario,
            hr_cargos(nome),
            hr_setores(nome)
          )
        `, { count: 'exact' })
        .eq('tipo_pessoa', 'PF')
        .eq('entidade_papeis.papeis_corporativos.nome', 'Funcionário')
        .eq('entidade_papeis.ativo', true);

      // Apply filters
      if (filters.search) {
        query = query.or(`nome_razao_social.ilike.%${filters.search}%,cpf_cnpj.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'ativo') {
          query = query.eq('ativo', true).eq('funcionarios_detalhes.status_funcionario', 'ativo');
        } else if (filters.status === 'inativo') {
          query = query.or('ativo.eq.false,funcionarios_detalhes.status_funcionario.eq.inativo');
        } else if (filters.status === 'rescindido') {
          query = query.eq('funcionarios_detalhes.status_funcionario', 'rescindido');
        }
      }
      
      if (filters.cargo) {
        query = query.eq('funcionarios_detalhes.hr_cargos.nome', filters.cargo);
      }
      
      if (filters.setor) {
        query = query.eq('funcionarios_detalhes.hr_setores.nome', filters.setor);
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query.order('nome_razao_social');
      
      if (error) throw error;
      
      // Transform data to match expected format
      const transformedData = (data || []).map(entity => {
        const funcionarioDetails = entity.funcionarios_detalhes?.[0];
        const statusFuncionario = funcionarioDetails?.status_funcionario || 'ativo';
        const ativoGeral = entity.ativo && statusFuncionario === 'ativo';
        
        return {
          id: entity.id,
          nome: entity.nome_razao_social,
          cpf: entity.cpf_cnpj || '',
          email: entity.email || '',
          telefone: entity.telefone || '',
          cargo: funcionarioDetails?.hr_cargos?.nome || '',
          setor: funcionarioDetails?.hr_setores?.nome || '',
          data_admissao: funcionarioDetails?.data_admissao || '',
          status_funcionario: statusFuncionario,
          ativo: ativoGeral,
          salario: funcionarioDetails?.salario_base || 0,
          cargo_id: funcionarioDetails?.cargo_id,
          setor_id: funcionarioDetails?.setor_id,
          dados_funcionario: funcionarioDetails
        };
      });
      
      setEmployees(transformedData);
      setTotalCount(count || 0);
      
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

  const loadLookupData = async () => {
    try {
      const [positionsResponse, departmentsResponse] = await Promise.all([
        supabase.from('hr_cargos').select('*').eq('ativo', true).order('nome'),
        supabase.from('hr_setores').select('*').eq('ativo', true).order('nome')
      ]);

      if (positionsResponse.error) throw positionsResponse.error;
      if (departmentsResponse.error) throw departmentsResponse.error;

      setPositions(positionsResponse.data || []);
      setDepartments(departmentsResponse.data || []);
      
    } catch (error) {
      console.error('Error loading lookup data:', error);
    }
  };

  const handleCreatePosition = async (data: Record<string, string>) => {
    const { data: newPosition, error } = await supabase
      .from('hr_cargos')
      .insert({ nome: data.name.trim() })
      .select('id, nome')
      .single();
    
    if (error) throw error;
    
    await loadLookupData();
    return { id: newPosition.id, label: newPosition.nome };
  };

  const handleCreateDepartment = async (data: Record<string, string>) => {
    const { data: newDepartment, error } = await supabase
      .from('hr_setores')
      .insert({ nome: data.name.trim() })
      .select('id, nome')
      .single();
    
    if (error) throw error;
    
    await loadLookupData();
    return { id: newDepartment.id, label: newDepartment.nome };
  };

  const handleToggleEmployeeStatus = async (employee: Employee) => {
    try {
      const newActive = !employee.ativo;
      
      const { error } = await supabase
        .from('entidades_corporativas')
        .update({ ativo: newActive })
        .eq('id', employee.id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Funcionário ${newActive ? 'ativado' : 'desativado'} com sucesso`,
      });
      
      loadData();
      
    } catch (error) {
      console.error('Error toggling employee status:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar status do funcionário",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
      case 'inativo':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'rescindido':
        return <Badge variant="destructive">Rescindido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCount / pagination.pageSize);

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
                <h1 className="text-2xl font-bold text-foreground">Funcionários</h1>
                <p className="text-muted-foreground">
                  Gerenciar cadastro de funcionários e contratos
                </p>
              </div>
            </div>
            <Button onClick={() => navigate('/hr/employees/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Funcionário
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF ou email..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
              
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="rescindido">Rescindido</SelectItem>
                </SelectContent>
              </Select>

              <EnhancedSelect
                value={filters.cargo}
                onValueChange={(value) => setFilters({ ...filters, cargo: value })}
                options={positions.map(pos => ({ value: pos.nome, label: pos.nome }))}
                placeholder="Cargo"
                allowCreate={true}
                createLabel="Adicionar cargo"
                createTitle="Novo Cargo"
                onCreateNew={handleCreatePosition}
                onRefresh={loadLookupData}
              />

              <EnhancedSelect
                value={filters.setor}
                onValueChange={(value) => setFilters({ ...filters, setor: value })}
                options={departments.map(dept => ({ value: dept.nome, label: dept.nome }))}
                placeholder="Setor"
                allowCreate={true}
                createLabel="Adicionar setor"
                createTitle="Novo Setor"
                onCreateNew={handleCreateDepartment}
                onRefresh={loadLookupData}
              />
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
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Admissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Salário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="animate-pulse">Carregando funcionários...</div>
                      </TableCell>
                    </TableRow>
                  ) : employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Nenhum funcionário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.nome}</TableCell>
                        <TableCell>{employee.cpf || '-'}</TableCell>
                        <TableCell>{employee.cargo || '-'}</TableCell>
                        <TableCell>{employee.setor || '-'}</TableCell>
                        <TableCell>
                          {employee.data_admissao ? 
                            new Date(employee.data_admissao).toLocaleDateString('pt-BR') : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>{getStatusBadge(employee.status_funcionario)}</TableCell>
                        <TableCell>
                          {employee.salario ? 
                            new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            }).format(employee.salario) : 
                            '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/hr/employees/${employee.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleEmployeeStatus(employee)}
                            >
                              {employee.status_funcionario === 'ativo' ? 
                                <UserX className="h-4 w-4" /> : 
                                <UserCheck className="h-4 w-4" />
                              }
                            </Button>
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
              Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a {Math.min(pagination.page * pagination.pageSize, totalCount)} de {totalCount} funcionários
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