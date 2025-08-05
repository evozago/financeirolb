/**
 * Dashboard principal do módulo de contas a pagar
 * Exibe KPIs clicáveis e gráficos de evolução das despesas
 * Segue a filosofia de navegação drill-down
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, FileSpreadsheet, Settings, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SummaryCardsGrid } from '@/components/features/dashboard/PayablesSummaryCard';
import { ImportModal } from '@/components/features/payables/ImportModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// Mock data - substituir por dados reais da API
const mockSummary = {
  totalPending: 150000.50,
  totalOverdue: 25000.75,
  totalDueThisWeek: 45000.25,
  totalDueThisMonth: 89000.00,
  totalPaid: 120000.00,
};

const mockChartData = [
  { month: 'Jan', total: 120000, pago: 110000, pendente: 10000 },
  { month: 'Fev', total: 140000, pago: 125000, pendente: 15000 },
  { month: 'Mar', total: 160000, pago: 140000, pendente: 20000 },
  { month: 'Abr', total: 180000, pago: 160000, pendente: 20000 },
  { month: 'Mai', total: 200000, pago: 175000, pendente: 25000 },
  { month: 'Jun', total: 220000, pago: 195000, pendente: 25000 },
];

const mockTrendData = [
  { day: '1', valor: 12000 },
  { day: '2', valor: 15000 },
  { day: '3', valor: 18000 },
  { day: '4', valor: 14000 },
  { day: '5', valor: 22000 },
  { day: '6', valor: 25000 },
  { day: '7', valor: 28000 },
];

export default function DashboardPayables() {
  const navigate = useNavigate();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'xml' | 'spreadsheet'>('xml');

  const handleCardClick = (filter: string) => {
    // Navegação drill-down para listagem filtrada
    navigate(`/accounts-payable?filter=${filter}`);
  };

  const handleImport = async (files: File[]) => {
    // Mock implementation - substituir por chamada real da API
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          processed: files.length,
          errors: [],
          warnings: [`${files.length} arquivo(s) processado(s) com sucesso`],
        });
      }, 2000);
    });
  };

  const handleDownloadTemplate = () => {
    // Mock - substituir por download real
    console.log('Download template');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Contas a Pagar</h1>
              <p className="text-muted-foreground">Gestão financeira e controle de pagamentos</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setImportMode('spreadsheet');
                  setImportModalOpen(true);
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Importar Planilha
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setImportMode('xml');
                  setImportModalOpen(true);
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar XML
              </Button>
              <Button onClick={() => navigate('/bills/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* KPIs Cards */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Resumo Financeiro</h2>
            <SummaryCardsGrid
              totalPending={mockSummary.totalPending}
              totalOverdue={mockSummary.totalOverdue}
              totalDueThisWeek={mockSummary.totalDueThisWeek}
              totalDueThisMonth={mockSummary.totalDueThisMonth}
              totalPaid={mockSummary.totalPaid}
              onCardClick={handleCardClick}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Evolução Mensal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Evolução das Despesas (6 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0 
                        }).format(value)
                      }
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Bar dataKey="pago" fill="hsl(var(--status-paid))" name="Pago" />
                    <Bar dataKey="pendente" fill="hsl(var(--status-pending))" name="Pendente" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tendência Semanal */}
            <Card>
              <CardHeader>
                <CardTitle>Tendência dos Últimos 7 Dias</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis 
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0 
                        }).format(value)
                      }
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Valor']}
                      labelFormatter={(label) => `Dia ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="valor" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/suppliers')}
                >
                  <Settings className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-medium">Gerenciar Fornecedores</div>
                    <div className="text-sm text-muted-foreground">Cadastrar e editar fornecedores</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/accounts-payable?filter=overdue')}
                >
                  <TrendingUp className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-medium">Contas Vencidas</div>
                    <div className="text-sm text-muted-foreground">Visualizar pagamentos em atraso</div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate('/reports')}
                >
                  <FileSpreadsheet className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-medium">Relatórios</div>
                    <div className="text-sm text-muted-foreground">Exportar dados e relatórios</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        mode={importMode}
        onImport={handleImport}
        onDownloadTemplate={importMode === 'spreadsheet' ? handleDownloadTemplate : undefined}
      />
    </div>
  );
}