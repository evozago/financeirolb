import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Building2, BarChart3, Settings, LogOut, CreditCard, ShoppingCart, MapPin, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/accounts-payable', label: 'Contas a Pagar', icon: FileText },
    { path: '/recurring-bills', label: 'Contas Recorrentes', icon: Repeat },
    { path: '/suppliers', label: 'Fornecedores', icon: Building2 },
    { path: '/orders', label: 'Pedidos', icon: ShoppingCart },
    { path: '/bank-accounts', label: 'Contas Bancárias', icon: CreditCard },
    { path: '/filiais', label: 'Filiais', icon: MapPin },
    { path: '/settings', label: 'Configurações', icon: Settings },
    { path: '/reports', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="font-bold text-xl text-primary">SiS Lui Bambini</div>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path === '/accounts-payable' && location.pathname.startsWith('/bills')) ||
                  (item.path === '/bank-accounts' && location.pathname.startsWith('/bank-accounts')) ||
                  (item.path === '/orders' && location.pathname.startsWith('/orders')) ||
                  (item.path === '/recurring-bills' && location.pathname.startsWith('/recurring-bills'));
                
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "flex items-center gap-2",
                      isActive && "bg-secondary"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}