import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  AlertTriangle, CheckCircle, Clock, Plus, FileText 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FinancialPanel } from '@/components/features/dashboard/FinancialPanel';
import { ExpensesByCategoryChart } from '@/components/features/dashboard/ExpensesByCategoryChart';
import RecurringEventsWidget from '@/components/features/recurring-bills/RecurringEventsWidget';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FinancialStats {
  totalPending: number;
  totalOverdue: number;
  totalPaidToday: number;
  totalDueToday: number;
  cashFlow: number;
  monthlyExpenses: number;
}

export default function DashboardFinancial() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinancialStats>({
    totalPending: 0,
    totalOverdue: 0,
    totalPaidToday: 0,
    totalDueToday: 0,
    cashFlow: 0,
    monthlyExpenses: 0
  });

  useEffect(() => {
    loadFinancialStats();
  }, []);

  const loadFinancialStats = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('get_financial_panel_stats_extended');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const financialData = data[0];
        setStats({
          totalPending: parseFloat(String(financialData.contas_pendentes_nao_recorrentes || 0)),
          totalOverdue: parseFloat(String(financialData.contas_vencidas || 0)),
          totalPaidToday: parseFloat(String(financialData.contas_pagas_hoje || 0)),
          totalDueToday: parseFloat(String(financialData.contas_vencendo_hoje || 0)),
          cashFlow: parseFloat(String(financialData.contas_pagas_hoje || 0)) - parseFloat(String(financialData.contas_vencendo_hoje || 0)),
          monthlyExpenses: parseFloat(String(financialData.contas_vencendo_ate_fim_mes || 0))
        });
      }
    } catch (error) {
      console.error('Error loading financial stats:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados financeiros",
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

  const handleCardClick = (filter: string) => {
    navigate(`/accounts-payable?filter=${filter}`);
  };

  const quickStats = [
    {
      title: 'Fluxo de Caixa Diário',
      value: formatCurrency(stats.cashFlow),
      icon: stats.cashFlow >= 0 ? TrendingUp : TrendingDown,
      description: 'Entradas vs saídas hoje',
      color: stats.cashFlow >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.cashFlow >= 0 ? 'bg-green-50' : 'bg-red-50',
      onClick: () => navigate('/accounts-payable')
    },
    {
      title: 'Contas Vencidas',
      value: formatCurrency(stats.totalOverdue),
      icon: AlertTriangle,
      description: 'Necessitam pagamento urgente',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      onClick: () => handleCardClick('overdue')
    },
    {
      title: 'Vencem Hoje',
      value: formatCurrency(stats.totalDueToday),
      icon: Clock,
      description: 'Pagamentos do dia',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      onClick: () => handleCardClick('today')
    },
    {
      title: 'Pagos Hoje',
      value: formatCurrency(stats.totalPaidToday),
      icon: CheckCircle,
      description: 'Já processados',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => handleCardClick('paid-today')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs />
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Financeiro</h1>
            <p className="text-sm text-muted-foreground">Controle financeiro e gestão de pagamentos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/recurring-bills/new')}>
              <Calendar className="h-4 w-4 mr-2" />
              Nova Conta Recorrente
            </Button>
            <Button onClick={() => navigate('/accounts-payable/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={stat.onClick}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-xs font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className={`text-xl font-bold ${stat.color} mb-1`}>
                      {stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Financial Panel */}
          <FinancialPanel onCardClick={handleCardClick} />

          {/* Charts and Widgets Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expenses Chart */}
            <div className="space-y-4">
              <ExpensesByCategoryChart />
            </div>

            {/* Actions and Info */}
            <div className="space-y-4">
              {/* Recurring Events */}
              <RecurringEventsWidget />

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Ações Rápidas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/bank-accounts')}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Gerenciar Contas Bancárias
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/suppliers')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Cadastrar Fornecedores
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate('/reports')}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Relatórios Financeiros
                  </Button>
                  
                  <div className="pt-3 border-t">
                    <div className="text-sm font-medium mb-2">Resumo Mensal</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Despesas do Mês:</span>
                        <span className="font-medium">{formatCurrency(stats.monthlyExpenses)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pendentes:</span>
                        <span className="font-medium text-yellow-600">{formatCurrency(stats.totalPending)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}