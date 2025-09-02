import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Package, Truck, Building2, 
  TrendingUp, AlertCircle, CheckCircle, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PurchaseStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSuppliers: number;
  activeSuppliers: number;
  monthlyOrderValue: number;
}

export default function DashboardPurchases() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PurchaseStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSuppliers: 0,
    activeSuppliers: 0,
    monthlyOrderValue: 0
  });

  useEffect(() => {
    loadPurchaseStats();
  }, []);

  const loadPurchaseStats = async () => {
    try {
      setLoading(true);

      // Load orders statistics
      const { data: ordersData, error: ordersError } = await supabase
        .from('pedidos_produtos')
        .select('status, valor_total_liquido, created_at');

      if (ordersError) throw ordersError;

      // Load suppliers statistics
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('fornecedores')
        .select('ativo');

      if (suppliersError) throw suppliersError;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const totalOrders = ordersData?.length || 0;
      const pendingOrders = ordersData?.filter(order => order.status === 'pendente').length || 0;
      const completedOrders = ordersData?.filter(order => order.status === 'concluido').length || 0;
      
      const monthlyOrders = ordersData?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      }) || [];

      const monthlyOrderValue = monthlyOrders.reduce((sum, order) => sum + (order.valor_total_liquido || 0), 0);

      const totalSuppliers = suppliersData?.length || 0;
      const activeSuppliers = suppliersData?.filter(supplier => supplier.ativo).length || 0;

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSuppliers,
        activeSuppliers,
        monthlyOrderValue
      });
    } catch (error) {
      console.error('Error loading purchase stats:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de compras",
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
      title: 'Total de Pedidos',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      description: `${stats.pendingOrders} pendentes, ${stats.completedOrders} finalizados`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => navigate('/orders')
    },
    {
      title: 'Pedidos Pendentes',
      value: stats.pendingOrders.toString(),
      icon: AlertCircle,
      description: 'Necessitam acompanhamento',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      onClick: () => navigate('/orders?status=pendente')
    },
    {
      title: 'Fornecedores Ativos',
      value: `${stats.activeSuppliers}/${stats.totalSuppliers}`,
      icon: Building2,
      description: 'Parceiros cadastrados',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => navigate('/suppliers')
    },
    {
      title: 'Compras do Mês',
      value: formatCurrency(stats.monthlyOrderValue),
      icon: TrendingUp,
      description: 'Volume financeiro mensal',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => navigate('/orders?period=current-month')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs />
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Compras</h1>
            <p className="text-muted-foreground">Gestão de fornecedores e pedidos de compra</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/suppliers/new')}>
              <Building2 className="h-4 w-4 mr-2" />
              Novo Fornecedor
            </Button>
            <Button onClick={() => navigate('/orders/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
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
                    <div className={`p-2 rounded-full ${card.bgColor}`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${card.color}`}>
                      {card.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pedidos Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/orders?status=pendente')}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Ver Pedidos Pendentes ({stats.pendingOrders})
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/orders?status=em-andamento')}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Pedidos em Andamento
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/orders?status=concluido')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Pedidos Finalizados
                </Button>
                
                <div className="pt-3 border-t">
                  <div className="text-sm font-medium mb-2">Performance Mensal</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total em Pedidos:</span>
                      <span className="font-medium">{formatCurrency(stats.monthlyOrderValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pedidos Ativos:</span>
                      <span className="font-medium text-blue-600">{stats.pendingOrders + stats.completedOrders}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supplier Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Gestão de Fornecedores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/suppliers')}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Todos os Fornecedores
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/suppliers/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Fornecedor
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/suppliers?status=inactive')}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Fornecedores Inativos
                </Button>

                {/* Top Suppliers */}
                <div className="pt-3 border-t">
                  <div className="text-sm font-medium mb-2">Principais Parceiros</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                      <span className="text-sm">Fornecedores Ativos</span>
                      <Badge variant="outline">{stats.activeSuppliers}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                      <span className="text-sm">Total Cadastrados</span>
                      <Badge variant="outline">{stats.totalSuppliers}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/orders/new')}>
              <CardContent className="p-6 text-center">
                <ShoppingCart className="h-8 w-8 mx-auto mb-4 text-primary" />
                <h3 className="font-medium mb-2">Criar Novo Pedido</h3>
                <p className="text-sm text-muted-foreground">
                  Solicitar produtos dos fornecedores cadastrados
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/suppliers/new')}>
              <CardContent className="p-6 text-center">
                <Building2 className="h-8 w-8 mx-auto mb-4 text-primary" />
                <h3 className="font-medium mb-2">Cadastrar Fornecedor</h3>
                <p className="text-sm text-muted-foreground">
                  Adicionar novos parceiros comerciais
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/reports?module=purchases')}>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-4 text-primary" />
                <h3 className="font-medium mb-2">Relatórios</h3>
                <p className="text-sm text-muted-foreground">
                  Análise de compras e fornecedores
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}