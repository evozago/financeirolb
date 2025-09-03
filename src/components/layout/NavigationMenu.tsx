import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, FileText, Building2, BarChart3, Settings, CreditCard, 
  ShoppingCart, MapPin, Repeat, Users, ChevronDown, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface NavigationCategory {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavigationItem[];
  mainPath?: string;
}

export function NavigationMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  const categories: NavigationCategory[] = [
    {
      label: 'Dashboard',
      icon: Home,
      mainPath: '/',
      items: [
        { path: '/', label: 'Visão Geral', icon: Home, description: 'Dashboard principal' },
      ]
    },
    {
      label: 'Financeiro',
      icon: FileText,
      items: [
        { path: '/accounts-payable', label: 'Contas a Pagar', icon: FileText, description: 'Gestão de pagamentos' },
        { path: '/recurring-bills', label: 'Contas Recorrentes', icon: Repeat, description: 'Contas mensais automáticas' },
        { path: '/bank-accounts', label: 'Contas Bancárias', icon: CreditCard, description: 'Gestão bancária' },
      ]
    },
    {
      label: 'Compras',
      icon: ShoppingCart,
      items: [
        { path: '/suppliers', label: 'Fornecedores', icon: Building2, description: 'Cadastro de fornecedores' },
        { path: '/orders', label: 'Pedidos', icon: ShoppingCart, description: 'Pedidos de compra' },
      ]
    },
    {
      label: 'Vendas',
      icon: TrendingUp,
      items: [
        { path: '/dashboard/sales', label: 'Dashboard Vendas', icon: TrendingUp, description: 'Performance e metas de vendas' },
        { path: '/sales/performance', label: 'Performance Vendedoras', icon: Users, description: 'Acompanhamento individual' },
      ]
    },
    {
      label: 'RH',
      icon: Users,
      items: [
        { path: '/hr', label: 'Painel RH', icon: Users, description: 'Dashboard de recursos humanos' },
        { path: '/hr/employees', label: 'Funcionários', icon: Users, description: 'Gestão de funcionários' },
        { path: '/hr/payroll-runs', label: 'Folha de Pagamento', icon: FileText, description: 'Processamento da folha' },
      ]
    },
    {
      label: 'Configurações',
      icon: Settings,
      items: [
        { path: '/settings', label: 'Cadastros', icon: Settings, description: 'Configurações gerais' },
        { path: '/filiais', label: 'Filiais', icon: MapPin, description: 'Gestão de filiais' },
      ]
    }
  ];

  const isActiveCategory = (category: NavigationCategory) => {
    if (category.mainPath && location.pathname === category.mainPath) return true;
    return category.items.some(item => 
      location.pathname === item.path || 
      location.pathname.startsWith(item.path + '/')
    );
  };

  const isActiveItem = (item: NavigationItem) => {
    return location.pathname === item.path || 
           location.pathname.startsWith(item.path + '/');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <nav className="flex items-center gap-1">
      {categories.map((category) => {
        const isActive = isActiveCategory(category);
        
        if (category.mainPath) {
          // Dashboard - botão direto
          return (
            <Button
              key={category.label}
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleNavigation(category.mainPath!)}
              className={cn(
                "flex items-center gap-2",
                isActive && "bg-secondary"
              )}
            >
              <category.icon className="h-4 w-4" />
              {category.label}
            </Button>
          );
        }

        // Outras categorias - dropdown
        return (
          <DropdownMenu key={category.label}>
            <DropdownMenuTrigger asChild>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "flex items-center gap-2",
                  isActive && "bg-secondary"
                )}
              >
                <category.icon className="h-4 w-4" />
                {category.label}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="flex items-center gap-2">
                <category.icon className="h-4 w-4" />
                {category.label}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {category.items.map((item) => (
                <DropdownMenuItem
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 cursor-pointer",
                    isActiveItem(item) && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.description && (
                    <span className="text-xs text-muted-foreground ml-6">
                      {item.description}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}

      {/* Relatórios - item separado */}
      <Button
        variant={location.pathname === '/reports' ? "secondary" : "ghost"}
        size="sm"
        onClick={() => handleNavigation('/reports')}
        className={cn(
          "flex items-center gap-2",
          location.pathname === '/reports' && "bg-secondary"
        )}
      >
        <BarChart3 className="h-4 w-4" />
        Relatórios
      </Button>
    </nav>
  );
}