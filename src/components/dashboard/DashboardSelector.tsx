import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
}

const dashboardOptions: DashboardOption[] = [
  {
    id: 'general',
    label: 'Visão Geral',
    description: 'Dashboard principal com resumo de todos os módulos',
    icon: Home,
    path: '/',
    color: 'bg-primary/10 text-primary border-primary/20'
  },
  {
    id: 'financial',
    label: 'Financeiro',
    description: 'Contas a pagar, fluxo de caixa e gestão financeira',
    icon: FileText,
    path: '/dashboard/financial',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  },
  {
    id: 'sales',
    label: 'Vendas',
    description: 'Metas, performance e acompanhamento de vendas',
    icon: TrendingUp,
    path: '/dashboard/sales',
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20'
  },
  {
    id: 'purchases',
    label: 'Compras',
    description: 'Fornecedores, pedidos e gestão de compras',
    icon: ShoppingCart,
    path: '/dashboard/purchases',
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
  }
];

export function DashboardSelector() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentDashboard = dashboardOptions.find(option => 
    location.pathname === option.path
  )?.id || 'general';

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-foreground">Selecionar Dashboard</h3>
          <span className="text-xs text-muted-foreground">
            Escolha o contexto de trabalho
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {dashboardOptions.map((option) => {
            const isActive = currentDashboard === option.id;
            const Icon = option.icon;
            
            return (
              <Button
                key={option.id}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                onClick={() => navigate(option.path)}
                className={cn(
                  "h-auto p-3 flex flex-col items-center gap-2 text-center",
                  isActive && option.color
                )}
              >
                <Icon className="h-5 w-5" />
                <div>
                  <div className="font-medium text-xs">{option.label}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {option.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}