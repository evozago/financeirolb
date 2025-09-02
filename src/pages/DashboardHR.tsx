import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, FileText, DollarSign, Clock, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  pendingPayroll: number;
  monthlyPayrollTotal: number;
  averageSalary: number;
}

export default function DashboardHR() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HRStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    pendingPayroll: 0,
    monthlyPayrollTotal: 0,
    averageSalary: 0
  });

  useEffect(() => {
    loadHRStats();
  }, []);

  const loadHRStats = async () => {
    try {
      setLoading(true);

      // Load employee statistics
      const { data: employeeStats, error: employeeError } = await supabase
        .from('funcionarios')
        .select('ativo, salario');

      if (employeeError) throw employeeError;

      const totalEmployees = employeeStats?.length || 0;
      const activeEmployees = employeeStats?.filter(emp => emp.ativo).length || 0;
      const inactiveEmployees = totalEmployees - activeEmployees;
      
      const salaries = employeeStats
        ?.filter(emp => emp.ativo && emp.salario > 0)
        .map(emp => emp.salario) || [];
      
      const averageSalary = salaries.length > 0 
        ? salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length 
        : 0;

      const monthlyPayrollTotal = salaries.reduce((sum, salary) => sum + salary, 0);

      // Load payroll runs for pending count
      const { data: payrollRuns, error: payrollError } = await supabase
        .from('hr_payroll_runs')
        .select('status')
        .eq('status', 'rascunho');

      if (payrollError) throw payrollError;

      setStats({
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        pendingPayroll: payrollRuns?.length || 0,
        monthlyPayrollTotal,
        averageSalary
      });
    } catch (error) {
      console.error('Error loading HR stats:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar estatísticas do RH",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const statCards = [
    {
      title: 'Total de Funcionários',
      value: stats.totalEmployees.toString(),
      icon: Users,
      description: `${stats.activeEmployees} ativos, ${stats.inactiveEmployees} inativos`,
      trend: stats.activeEmployees > stats.inactiveEmployees ? 'up' : 'down',
      onClick: () => navigate('/hr/employees')
    },
    {
      title: 'Folha de Pagamento Mensal',
      value: formatCurrency(stats.monthlyPayrollTotal),
      icon: DollarSign,
      description: `Salário médio: ${formatCurrency(stats.averageSalary)}`,
      trend: 'up',
      onClick: () => navigate('/hr/payroll-runs')
    },
    {
      title: 'Folhas Pendentes',
      value: stats.pendingPayroll.toString(),
      icon: Clock,
      description: 'Aguardando processamento',
      trend: stats.pendingPayroll > 0 ? 'down' : 'neutral',
      onClick: () => navigate('/hr/payroll-runs')
    },
    {
      title: 'Ações Necessárias',
      value: (stats.pendingPayroll + stats.inactiveEmployees).toString(),
      icon: AlertTriangle,
      description: 'Itens que precisam de atenção',
      trend: 'down',
      onClick: () => navigate('/hr')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs />
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard RH</h1>
            <p className="text-muted-foreground">Gestão de recursos humanos e folha de pagamento</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/hr/payroll-runs/new')}>
              <FileText className="h-4 w-4 mr-2" />
              Nova Folha
            </Button>
            <Button onClick={() => navigate('/hr/employees/new')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={card.onClick}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {card.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {card.description}
                      </p>
                      {card.trend === 'up' && (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      )}
                      {card.trend === 'down' && (
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Employee Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestão de Funcionários
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/hr/employees')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Ver Todos os Funcionários
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/hr/employees/new')}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Cadastrar Funcionário
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/hr/employees?status=inactive')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Funcionários Inativos
                </Button>
              </CardContent>
            </Card>

            {/* Payroll Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Folha de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/hr/payroll-runs')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Todas as Folhas
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/hr/process-run')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Processar Folha Atual
                </Button>
                {stats.pendingPayroll > 0 && (
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-md">
                    <span className="text-sm text-yellow-800">
                      {stats.pendingPayroll} folha(s) pendente(s)
                    </span>
                    <Badge variant="outline" className="text-yellow-600">
                      Atenção
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reports and Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Relatórios e Análises
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/reports?module=hr')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Relatório de Custos
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/hr/payroll-runs?export=true')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar Holerites
                </Button>
                <div className="p-2 bg-blue-50 rounded-md">
                  <div className="text-sm font-medium text-blue-900">
                    Custo Total Mensal
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(stats.monthlyPayrollTotal * 1.4)} {/* Estimativa com encargos */}
                  </div>
                  <div className="text-xs text-blue-600">
                    Incluindo encargos estimados
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximos Eventos RH
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div>
                    <div className="font-medium">Fechamento da Folha</div>
                    <div className="text-sm text-muted-foreground">Prazo: {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 25).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <Badge variant="outline">Mensal</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div>
                    <div className="font-medium">Pagamento de Salários</div>
                    <div className="text-sm text-muted-foreground">Prazo: {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <Badge variant="outline">Mensal</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div>
                    <div className="font-medium">Revisão Anual de Salários</div>
                    <div className="text-sm text-muted-foreground">Próxima revisão: Janeiro</div>
                  </div>
                  <Badge variant="outline">Anual</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}