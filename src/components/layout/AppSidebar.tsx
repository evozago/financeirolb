import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Briefcase,
  Home
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    label: 'Dashboard',
    items: [
      {
        href: '/',
        label: 'Dashboard Principal',
        icon: Home,
        description: 'Visão geral do sistema'
      },
      {
        href: '/dashboard/financial',
        label: 'Financeiro',
        icon: DollarSign,
        description: 'Visão geral das finanças'
      },
      {
        href: '/dashboard/sales',
        label: 'Vendas',
        icon: TrendingUp,
        description: 'Desempenho de vendas'
      },
      {
        href: '/dashboard/purchases',
        label: 'Compras',
        icon: Package,
        description: 'Gestão de compras'
      },
    ]
  },
  {
    label: 'Sistema Corporativo',
    items: [
      {
        href: '/entidades-corporativas',
        label: 'Entidades Corporativas',
        icon: Building2,
        description: 'Sistema unificado de pessoas físicas e jurídicas'
      },
    ]
  },
  {
    label: 'Financeiro',
    items: [
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
    ]
  },
  {
    label: 'Compras',
    items: [
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
    ]
  },
  {
    label: 'Cadastros',
    items: [
      {
        href: '/pessoas',
        label: 'Pessoas',
        icon: Users,
        description: 'Cadastro de pessoas'
      },
    ]
  },
  {
    label: 'Sistema',
    items: [
      {
        href: '/reports',
        label: 'Relatórios',
        icon: BarChart3,
        description: 'Relatórios e análises'
      },
      {
        href: '/settings',
        label: 'Configurações',
        icon: Settings,
        description: 'Configurações do sistema'
      },
    ]
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const getNavClassName = (href: string) => {
    const active = isActive(href);
    return active 
      ? 'bg-primary text-primary-foreground font-medium' 
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground';
  };

  return (
    <Sidebar 
      className={collapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent>
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {!collapsed && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        asChild
                        className={getNavClassName(item.href)}
                        tooltip={collapsed ? item.label : undefined}
                        size={collapsed ? "sm" : "default"}
                      >
                        <NavLink to={item.href}>
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          {!collapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="truncate">{item.label}</div>
                              {item.description && !active && (
                                <div className="text-xs opacity-70 truncate">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}