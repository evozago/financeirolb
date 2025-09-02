import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Building2, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  color: string;
}

export function QuickActions() {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'new-bill',
      label: 'Nova Conta',
      description: 'Criar uma nova conta a pagar',
      icon: Plus,
      action: () => navigate('/accounts-payable/new'),
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'new-supplier',
      label: 'Novo Fornecedor',
      description: 'Cadastrar fornecedor',
      icon: Building2,
      action: () => navigate('/suppliers/new'),
      color: 'bg-blue-500/10 text-blue-600'
    },
    {
      id: 'new-employee',
      label: 'Novo Funcionário',
      description: 'Cadastrar funcionário',
      icon: Users,
      action: () => navigate('/hr/employees/new'),
      color: 'bg-green-500/10 text-green-600'
    },
    {
      id: 'reports',
      label: 'Relatórios',
      description: 'Visualizar relatórios',
      icon: FileText,
      action: () => navigate('/reports'),
      color: 'bg-purple-500/10 text-purple-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="ghost"
                onClick={action.action}
                className={`h-auto p-3 flex flex-col items-center gap-2 ${action.color} hover:bg-opacity-20`}
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="text-xs font-medium">{action.label}</div>
                  <div className="text-xs opacity-70">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}