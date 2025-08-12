/**
 * Página de detalhes de uma conta a pagar (Nível 3 - Drill Down)
 * Exibe informações completas da conta, parcelas e fornecedor
 * Permite edição e navegação para detalhes do fornecedor (Nível 4)
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Building2, 
  Calendar, 
  DollarSign,
  FileText,
  Clock,
  AlertTriangle,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, Column } from '@/components/ui/data-table';
import { BillToPay, BillToPayInstallment } from '@/types/payables';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AuditHistory } from '@/components/features/payables/AuditHistory';
import { StatusChangeControl } from '@/components/features/payables/StatusChangeControl';

import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface BillData {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: string;
  numero_parcela: number;
  total_parcelas: number;
  valor_total_titulo: number;
  fornecedor: string;
  created_at: string;
  updated_at: string;
  data_pagamento?: string;
  categoria?: string;
  forma_pagamento?: string;
  banco?: string;
  observacoes?: string;
}

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bill, setBill] = useState<BillData | null>(null);
  const [relatedInstallments, setRelatedInstallments] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadBillData();
    }
  }, [id]);

  const loadBillData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados da parcela específica diretamente da tabela
      const { data, error } = await supabase
        .from('ap_installments')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      
      if (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro", 
          description: "Conta não encontrada",
          variant: "destructive",
        });
        navigate('/accounts-payable');
        return;
      }
      
      const installment = data;
      
      if (!installment) {
        toast({
          title: "Erro",
          description: "Conta não encontrada",
          variant: "destructive",
        });
        navigate('/accounts-payable');
        return;
      }
      
      setBill(installment);
      
      // Carregar outras parcelas do mesmo título
      const { data: relatedData, error: relatedError } = await supabase
        .from('ap_installments')
        .select('*')
        .eq('valor_total_titulo', installment.valor_total_titulo || installment.valor)
        .eq('fornecedor', installment.fornecedor)
        .neq('id', installment.id)
        .is('deleted_at', null);
      
      if (relatedError) {
        console.error('Erro ao carregar parcelas relacionadas:', relatedError);
      }
      
      setRelatedInstallments(relatedData || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados da conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR');

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('pt-BR');

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'Pendente';
    const currentStatus = isOverdue ? 'Vencido' : status;

    const colors = {
      'Pendente': 'bg-status-pending text-status-pending',
      'Pago': 'bg-status-paid text-status-paid',
      'Vencido': 'bg-status-overdue text-status-overdue',
    };

    return (
      <Badge className={cn('text-xs', colors[currentStatus as keyof typeof colors])}>
        {currentStatus}
      </Badge>
    );
  };

  const calculateProgress = () => {
    if (!bill) return 0;
    const allInstallments = [bill, ...relatedInstallments];
    const paidInstallments = allInstallments.filter(inst => inst.status === 'pago').length;
    return (paidInstallments / bill.total_parcelas) * 100;
  };

  const getTotalPaid = () => {
    if (!bill) return 0;
    const allInstallments = [bill, ...relatedInstallments];
    return allInstallments
      .filter(inst => inst.status === 'pago')
      .reduce((sum, inst) => sum + inst.valor, 0);
  };

  const getTotalPending = () => {
    if (!bill) return 0;
    const allInstallments = [bill, ...relatedInstallments];
    return allInstallments
      .filter(inst => inst.status !== 'pago')
      .reduce((sum, inst) => sum + inst.valor, 0);
  };

  const getOverdueCount = () => {
    if (!bill) return 0;
    const allInstallments = [bill, ...relatedInstallments];
    return allInstallments.filter(inst => {
      const isOverdue = new Date(inst.data_vencimento) < new Date() && inst.status === 'aberto';
      return isOverdue;
    }).length;
  };

  const handleStatusChanged = () => {
    // Recarregar dados quando status for alterado
    loadBillData();
  };

  const handleMarkInstallmentAsPaid = async (installment: BillData) => {
    try {
      const { error } = await supabase
        .from('ap_installments')
        .update({ 
          status: 'pago',
          data_pagamento: new Date().toISOString().split('T')[0],
          data_hora_pagamento: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', installment.id);
      
      if (error) throw error;
      
      // Atualizar estado local
      if (bill?.id === installment.id) {
        setBill(prev => prev ? { ...prev, status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] } : null);
      } else {
        setRelatedInstallments(prev => 
          prev.map(inst => 
            inst.id === installment.id 
              ? { ...inst, status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] } 
              : inst
          )
        );
      }
      
      toast({
        title: "Sucesso",
        description: "Parcela marcada como paga",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao marcar parcela como paga",
        variant: "destructive",
      });
    }
  };
  
  const handleDelete = async () => {
    if (!bill) return;
    try {
      const { error } = await supabase
        .from('ap_installments')
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', bill.id);
      if (error) throw error;
      toast({ title: "Conta excluída", description: "A conta foi movida para a lixeira." });
      navigate('/accounts-payable');
    } catch (err) {
      console.error('Erro ao excluir conta:', err);
      toast({ title: "Erro", description: "Falha ao excluir conta.", variant: "destructive" });
    }
  };

  const installmentColumns: Column<BillData>[] = [
    {
      key: 'numero_parcela',
      header: 'Parcela',
      cell: (item) => (
        <div className="font-medium text-center">
          {item.numero_parcela}/{item.total_parcelas}
        </div>
      ),
      className: 'text-center w-20',
    },
    {
      key: 'valor',
      header: 'Valor',
      cell: (item) => (
        <div className="font-mono">{formatCurrency(item.valor)}</div>
      ),
      className: 'text-right',
    },
    {
      key: 'data_vencimento',
      header: 'Vencimento',
      cell: (item) => {
        const isOverdue = new Date(item.data_vencimento) < new Date() && item.status === 'aberto';
        return (
          <div className={cn('font-mono', isOverdue && 'text-destructive font-medium')}>
            {formatDate(item.data_vencimento)}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => getStatusBadge(item.status, item.data_vencimento),
    },
    {
      key: 'actions',
      header: '',
      cell: (item) => (
        item.status !== 'pago' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleMarkInstallmentAsPaid(item)}
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Pagar
          </Button>
        )
      ),
      className: 'w-24',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Carregando...</h1>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Conta não encontrada</h1>
          <Button onClick={() => navigate('/accounts-payable')}>
            Voltar para Contas a Pagar
          </Button>
        </div>
      </div>
    );
  }

  const overdueCount = getOverdueCount();
  const allInstallments = [bill, ...relatedInstallments];

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/accounts-payable')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Detalhes da Conta</h1>
                <p className="text-muted-foreground">
                  ID: {bill.id} • {bill.total_parcelas} parcelas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => navigate(`/bills/${id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta conta? Esta ação pode ser desfeita.')) {
                    handleDelete();
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Abas principais */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="status">Alterar Status</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Informações Gerais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Informações da Conta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{bill.descricao}</h3>
                      <p className="text-muted-foreground">
                        Criada em {formatDateTime(bill.created_at)}
                      </p>
                      {bill.created_at !== bill.updated_at && (
                        <p className="text-xs text-muted-foreground">
                          Atualizada em {formatDateTime(bill.updated_at)}
                        </p>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Valor Total</p>
                          <p className="text-2xl font-bold">{formatCurrency(bill.valor_total_titulo || bill.valor)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Parcelas</p>
                          <p className="text-2xl font-bold">{bill.total_parcelas}x</p>
                        </div>
                      </div>
                    </div>

                    {/* Informações adicionais */}
                    {(bill.categoria || bill.forma_pagamento || bill.banco) && (
                      <>
                        <Separator />
                        <div className="grid gap-4 md:grid-cols-2">
                          {bill.categoria && (
                            <div>
                              <p className="font-medium text-muted-foreground">Categoria</p>
                              <p>{bill.categoria}</p>
                            </div>
                          )}
                          {bill.forma_pagamento && (
                            <div>
                              <p className="font-medium text-muted-foreground">Forma de Pagamento</p>
                              <p>{bill.forma_pagamento}</p>
                            </div>
                          )}
                          {bill.banco && (
                            <div>
                              <p className="font-medium text-muted-foreground">Banco</p>
                              <p>{bill.banco}</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {bill.observacoes && (
                      <>
                        <Separator />
                        <div>
                          <p className="font-medium text-muted-foreground">Observações</p>
                          <p className="text-sm">{bill.observacoes}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Alertas */}
                {overdueCount > 0 && (
                  <Alert className="border-destructive">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription>
                      <strong>Atenção:</strong> {overdueCount} parcela{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''}. 
                      É necessário regularizar o pagamento.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Tabela de Parcelas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Parcelas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      data={allInstallments}
                      columns={installmentColumns}
                      getItemId={(item) => item.id}
                      emptyMessage="Nenhuma parcela encontrada"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="status" className="space-y-6">
                <StatusChangeControl
                  installments={allInstallments}
                  onStatusChanged={handleStatusChanged}
                />
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <AuditHistory recordId={bill.id} />
                
                {/* Histórico de parcelas relacionadas */}
                {relatedInstallments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Histórico das Parcelas Relacionadas</h3>
                    {relatedInstallments.map((installment) => (
                      <AuditHistory 
                        key={installment.id} 
                        recordId={installment.id}
                        className="border-l-4 border-l-muted-foreground/20"
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progresso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Progresso de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Concluído</span>
                    <span>{calculateProgress().toFixed(0)}%</span>
                  </div>
                  <Progress value={calculateProgress()} />
                </div>
                
                <div className="grid gap-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pago:</span>
                    <span className="font-medium text-success">
                      {formatCurrency(getTotalPaid())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pendente:</span>
                    <span className="font-medium text-warning">
                      {formatCurrency(getTotalPending())}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(bill.valor_total_titulo || bill.valor)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fornecedor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-base">{bill.fornecedor}</p>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // Navegar para fornecedores e buscar pelo nome
                    navigate('/suppliers');
                  }}
                >
                  Ver Fornecedores
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}