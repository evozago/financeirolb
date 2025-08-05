/**
 * Dashboard principal do módulo de contas a pagar
 * Exibe KPIs clicáveis e gráficos de evolução das despesas
 * Segue a filosofia de navegação drill-down
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, FileSpreadsheet, Settings, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SummaryCardsGrid } from '@/components/features/dashboard/PayablesSummaryCard';
import { ImportModal } from '@/components/features/payables/ImportModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalPending: number;
  totalOverdue: number;
  totalDueThisWeek: number;
  totalDueThisMonth: number;
  totalPaid: number;
}

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
  const { toast } = useToast();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'xml' | 'spreadsheet'>('xml');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardStats>({
    totalPending: 0,
    totalOverdue: 0,
    totalDueThisWeek: 0,
    totalDueThisMonth: 0,
    totalPaid: 0,
  });

  // Load dashboard statistics from Supabase using the database function
  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Use the database function for better performance
      const { data, error } = await supabase
        .rpc('get_dashboard_stats');
      
      if (error) {
        console.error('Error loading dashboard stats:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar estatísticas do dashboard",
          variant: "destructive",
        });
        return;
      }

      if (data && data.length > 0) {
        const stats = data[0];
        setSummary({
          totalPending: parseFloat(String(stats.total_aberto || 0)),
          totalOverdue: parseFloat(String(stats.vencidos || 0)),
  totalDueThisWeek: parseFloat(String(stats.vencendo_semana || 0)), // Supondo que você tenha esse campo
  totalDueThisMonth: parseFloat(String(stats.vencendo_mes || 0)),   // Ou qualquer que seja o nome correto do campo
          totalPaid: parseFloat(String(stats.pagos_mes_atual || 0)),
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar estatísticas do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(loadDashboardStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Add effect to refresh when coming back to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleCardClick = (filter: string) => {
    // Navegação drill-down para listagem filtrada
    navigate(`/accounts-payable?filter=${filter}`);
  };

  const handleImport = async (files: File[]) => {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      let totalImported = 0;

      for (const file of files) {
        try {
          if (importMode === 'xml') {
            // Process XML file and save to Supabase
            const xmlContent = await file.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
            
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
              errors.push(`Erro ao processar ${file.name}: XML inválido`);
              continue;
            }

            const nfeElement = xmlDoc.querySelector('infNFe') || xmlDoc.querySelector('NFe');
            if (!nfeElement) {
              errors.push(`${file.name}: Estrutura de NFe não encontrada`);
              continue;
            }

            const emit = xmlDoc.querySelector('emit');
            if (!emit) {
              errors.push(`${file.name}: Dados do fornecedor não encontrados`);
              continue;
            }

            const cnpj = emit.querySelector('CNPJ')?.textContent || '';
            const supplierName = emit.querySelector('xNome')?.textContent || 'Fornecedor não identificado';
            
            // Create supplier if not exists
            let entidadeId = null;
            const { data: existingFornecedor } = await supabase
              .from('fornecedores')
              .select('id')
              .eq('cnpj_cpf', cnpj)
              .single();
            
            if (existingFornecedor) {
              entidadeId = existingFornecedor.id;
            } else {
              const { data: newFornecedor, error: fornecedorError } = await supabase
                .from('fornecedores')
                .insert({
                  nome: supplierName,
                  cnpj_cpf: cnpj,
                  ativo: true
                })
                .select('id')
                .single();
              
              if (fornecedorError) {
                errors.push(`Erro ao criar fornecedor ${supplierName}: ${fornecedorError.message}`);
                continue;
              }
              entidadeId = newFornecedor.id;
            }

            const totalElement = xmlDoc.querySelector('vNF');
            const totalAmount = parseFloat(totalElement?.textContent || '0');
            const duplicatas = xmlDoc.querySelectorAll('dup');
            
            if (duplicatas.length === 0) {
              // Single installment
              const { error: insertError } = await supabase
                .from('ap_installments')
                .insert({
                  descricao: `NFe ${file.name.replace('.xml', '')} - Parcela única`,
                  fornecedor: supplierName,
                  valor: totalAmount,
                  valor_total_titulo: totalAmount,
                  data_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  status: 'aberto',
                  numero_parcela: 1,
                  total_parcelas: 1,
                  entidade_id: entidadeId
                });
              
              if (insertError) {
                errors.push(`Erro ao inserir parcela de ${file.name}: ${insertError.message}`);
              } else {
                totalImported++;
              }
            } else {
              // Multiple installments
              const installmentsToInsert = [];
              duplicatas.forEach((dup, index) => {
                const valor = parseFloat(dup.querySelector('vDup')?.textContent || '0');
                const vencimento = dup.querySelector('dVenc')?.textContent || 
                  new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                
                installmentsToInsert.push({
                  descricao: `NFe ${file.name.replace('.xml', '')} - Parcela ${index + 1}`,
                  fornecedor: supplierName,
                  valor: valor,
                  valor_total_titulo: totalAmount,
                  data_vencimento: vencimento,
                  status: 'aberto',
                  numero_parcela: index + 1,
                  total_parcelas: duplicatas.length,
                  entidade_id: entidadeId
                });
              });
              
              const { error: insertError } = await supabase
                .from('ap_installments')
                .insert(installmentsToInsert);
              
              if (insertError) {
                errors.push(`Erro ao inserir parcelas de ${file.name}: ${insertError.message}`);
              } else {
                totalImported += installmentsToInsert.length;
              }
            }
          } else {
            warnings.push(`Planilha ${file.name}: Implementação pendente`);
          }
        } catch (fileError) {
          errors.push(`Erro ao processar ${file.name}: ${(fileError as Error).message}`);
        }
      }

      // Refresh dashboard data after import
      if (totalImported > 0) {
        // Force reload with a small delay to ensure database transaction is complete
        setTimeout(async () => {
          await loadDashboardStats();
        }, 500);
        
        toast({
          title: "Importação concluída",
          description: `${totalImported} parcelas importadas com sucesso`,
        });
      }

      return {
        success: totalImported > 0,
        processed: totalImported,
        errors,
        warnings: warnings.length > 0 ? warnings : [`${totalImported} parcela(s) processada(s) com sucesso`],
      };
    } catch (error) {
      console.error('Import error:', error);
      return {
        success: false,
        processed: 0,
        errors: [`Erro geral na importação: ${(error as Error).message}`],
        warnings: [],
      };
    }
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
    <div className="bg-background">
      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
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
            <Button onClick={() => navigate('/accounts-payable/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* KPIs Cards */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Resumo Financeiro</h2>
            <SummaryCardsGrid
              totalPending={summary.totalPending}
              totalOverdue={summary.totalOverdue}
              totalDueThisWeek={summary.totalDueThisWeek}
              totalDueThisMonth={summary.totalDueThisMonth}
              totalPaid={summary.totalPaid}
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