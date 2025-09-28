// Update this page (the content is just a fallback if you fail to update the page)

import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Building2, 
  Calendar, 
  CreditCard,
  DollarSign,
  FileText,
  ShoppingCart,
  TrendingUp,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Index = () => {
  const quickAccessItems = [
    {
      title: 'Dashboard Financeiro',
      description: 'Visão geral das finanças',
      icon: DollarSign,
      href: '/dashboard/financial',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Contas a Pagar',
      description: 'Gerencie suas contas e pagamentos',
      icon: CreditCard,
      href: '/accounts-payable',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Contas Recorrentes',
      description: 'Controle contas mensais automáticas',
      icon: Calendar,
      href: '/recurring-bills',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Fornecedores',
      description: 'Cadastro e gestão de fornecedores',
      icon: Building2,
      href: '/suppliers',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Gestão de Vendas',
      description: 'Sistema interativo de vendas',
      icon: TrendingUp,
      href: '/sales-management',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200'
    },
    {
      title: 'Pedidos',
      description: 'Gestão de pedidos de compra',
      icon: ShoppingCart,
      href: '/orders',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      title: 'Entidades',
      description: 'Sistema unificado de cadastros',
      icon: Users,
      href: '/entidades-corporativas',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },
    {
      title: 'Relatórios',
      description: 'Análises e relatórios gerenciais',
      icon: BarChart3,
      href: '/reports',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">SiS Lui Bambini</h1>
          <p className="text-lg text-muted-foreground">Sistema de Gestão Empresarial</p>
        </div>
        
        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {quickAccessItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={index} to={item.href} className="block h-full">
                <Card 
                  className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-2 ${item.borderColor} ${item.bgColor} h-full`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-gray-900">
                        {item.title}
                      </CardTitle>
                      <Icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild variant="default" size="sm">
              <Link to="/accounts-payable/new">
                <CreditCard className="h-4 w-4 mr-2" />
                Nova Conta
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/suppliers/new">
                <Building2 className="h-4 w-4 mr-2" />
                Novo Fornecedor
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/orders/new">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Novo Pedido
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
