/**
 * Main HR/Payroll Management Page
 * Central hub for employee management and payroll processing
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, FileText, Calendar, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HR() {
  const navigate = useNavigate();

  // Mock stats - will be replaced with real data
  const [stats] = useState({
    totalEmployees: 12,
    activeContracts: 10,
    pendingPayroll: 1,
    lastPayrollDate: '2025-01-15'
  });

  const hrModules = [
    {
      title: 'Funcionários',
      description: 'Gerenciar cadastro de funcionários e contratos',
      icon: Users,
      path: '/hr/employees',
      color: 'bg-blue-500',
      count: stats.totalEmployees
    },
    {
      title: 'Folhas de Pagamento',
      description: 'Visualizar e gerenciar folhas processadas',
      icon: FileText,
      path: '/hr/payroll-runs',
      color: 'bg-green-500',
      count: stats.pendingPayroll
    },
    {
      title: 'Processar Folha',
      description: 'Wizard para processamento de nova folha',
      icon: DollarSign,
      path: '/hr/process-run',
      color: 'bg-purple-500',
      highlight: true
    },
    {
      title: 'Holerites',
      description: 'Visualizar e exportar holerites em PDF',
      icon: Calendar,
      path: '/hr/payslips',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Recursos Humanos</h1>
              <p className="text-muted-foreground">Sistema de gestão de pessoal e folha de pagamento</p>
            </div>
            <Button onClick={() => navigate('/hr/employees/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Funcionário
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Funcionários</p>
                  <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contratos Ativos</p>
                  <p className="text-2xl font-bold">{stats.activeContracts}</p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Folhas Pendentes</p>
                  <p className="text-2xl font-bold">{stats.pendingPayroll}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última Folha</p>
                  <p className="text-2xl font-bold">{new Date(stats.lastPayrollDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hrModules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Card 
                key={module.path} 
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  module.highlight ? 'ring-2 ring-purple-500 ring-opacity-50' : ''
                }`}
                onClick={() => navigate(module.path)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${module.color} text-white`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                    {module.count !== undefined && (
                      <Badge variant="secondary" className="ml-2">
                        {module.count}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    {module.highlight && (
                      <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">
                        Recomendado
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" className="ml-auto gap-2">
                      Acessar
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => navigate('/hr/process-run')} className="gap-2">
                <DollarSign className="h-4 w-4" />
                Processar Folha do Mês
              </Button>
              <Button variant="outline" onClick={() => navigate('/hr/employees/new')} className="gap-2">
                <Users className="h-4 w-4" />
                Cadastrar Funcionário
              </Button>
              <Button variant="outline" onClick={() => navigate('/hr/payslips')} className="gap-2">
                <FileText className="h-4 w-4" />
                Gerar Relatórios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}