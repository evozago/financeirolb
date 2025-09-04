import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Building2,
  CreditCard,
  BarChart3,
  ShoppingCart,
  Users,
  Settings,
  FileText,
  DollarSign,
  Calendar,
  TrendingUp,
  Package,
  UserCheck,
  Briefcase
} from 'lucide-react';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  // Sistema Corporativo
  {
    href: '/entidades-corporativas',
    label: 'Entidades Corporativas',
    icon: Building2,
    description: 'Sistema unificado de pessoas físicas e jurídicas'
  },
  
  // Financeiro
  {
    href: '/dashboard/financial',
    label: 'Dashboard Financeiro',
    icon: DollarSign,
    description: 'Visão geral das finanças'
  },
  {
    href: '/accounts-payable',
    label: 'Contas a Pagar',
    icon: CreditCard,
    description: 'Gestão de contas a pagar'
  },
  {
    href: '/recurring-bills',
    label: 'Contas Recorrentes',
    icon: Calendar,
    description: 'Contas que se repetem mensalmente'
  },
  {
    href: '/bank-accounts',
    label: 'Contas Bancárias',
    icon: Briefcase,
    description: 'Contas bancárias da empresa'
  },
  
  // Vendas
  {
    href: '/dashboard/sales',
    label: 'Dashboard Vendas',
    icon: TrendingUp,
    description: 'Desempenho de vendas'
  },
  
  // Compras
  {
    href: '/dashboard/purchases',
    label: 'Dashboard Compras',
    icon: Package,
    description: 'Gestão de compras'
  },
  {
    href: '/orders',
    label: 'Pedidos',
    icon: ShoppingCart,
    description: 'Pedidos de compra'
  },
  {
    href: '/suppliers',
    label: 'Fornecedores',
    icon: Building2,
    description: 'Cadastro de fornecedores'
  },
  
  // Cadastros
  {
    href: '/pessoas',
    label: 'Pessoas',
    icon: Users,
    description: 'Cadastro de pessoas'
  },
  {
    href: '/cadastros',
    label: 'Cadastros Gerais',
    icon: FileText,
    description: 'Outros cadastros'
  },
  
  // RH
  {
    href: '/dashboard/hr',
    label: 'Dashboard RH',
    icon: UserCheck,
    description: 'Recursos humanos'
  },
  {
    href: '/hr',
    label: 'RH',
    icon: Users,
    description: 'Gestão de recursos humanos'
  },
  
  // Relatórios
  {
    href: '/reports',
    label: 'Relatórios',
    icon: BarChart3,
    description: 'Relatórios e análises'
  },
  
  // Configurações
  {
    href: '/settings',
    label: 'Configurações',
    icon: Settings,
    description: 'Configurações do sistema'
  },
];

export function NavigationLinks() {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="space-y-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            <div className="flex-1">
              <div>{item.label}</div>
              {item.description && !active && (
                <div className="text-xs opacity-70">{item.description}</div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}