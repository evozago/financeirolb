import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  path: string;
  label: string;
}

const pathLabels: Record<string, string> = {
  '': 'Dashboard',
  'accounts-payable': 'Contas a Pagar',
  'recurring-bills': 'Contas Recorrentes',
  'suppliers': 'Fornecedores',
  'orders': 'Pedidos',
  'bank-accounts': 'Contas Bancárias',
  'filiais': 'Filiais',
  'hr': 'Recursos Humanos',
  'employees': 'Funcionários',
  'payroll-runs': 'Folha de Pagamento',
  'process-run': 'Processar Folha',
  'settings': 'Cadastros',
  'reports': 'Relatórios',
  'new': 'Novo',
  'edit': 'Editar',
  'detail': 'Detalhes',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    { path: '/', label: 'Dashboard' }
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Skip UUID segments (they look like: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(segment);
    
    let label = pathLabels[segment] || segment;
    
    // Handle special cases
    if (isUUID) {
      label = 'Detalhes';
    } else if (segment === 'new') {
      label = 'Novo';
    } else if (segment === 'edit') {
      label = 'Editar';
    } else if (index === pathSegments.length - 1 && pathSegments[index - 1] && /^[0-9a-f-]+$/i.test(pathSegments[index - 1])) {
      // If this is the last segment and previous was UUID, this might be an action
      label = pathLabels[segment] || 'Ação';
    }

    breadcrumbs.push({
      path: currentPath,
      label: label.charAt(0).toUpperCase() + label.slice(1)
    });
  });

  // Remove duplicate dashboard entries
  const filteredBreadcrumbs = breadcrumbs.filter((item, index, arr) => {
    if (index === 0) return true; // Always keep first item (Dashboard)
    return item.path !== arr[0].path;
  });

  if (filteredBreadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs on dashboard
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      {filteredBreadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.path} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-1" />
          )}
          {index === 0 && (
            <Home className="h-4 w-4 mr-1" />
          )}
          {index === filteredBreadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">
              {breadcrumb.label}
            </span>
          ) : (
            <Link
              to={breadcrumb.path}
              className={cn(
                "hover:text-foreground transition-colors",
                index === 0 && "font-medium"
              )}
            >
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}