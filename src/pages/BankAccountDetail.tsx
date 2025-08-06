/**
 * Página de detalhes da conta bancária com histórico de movimentações
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, CreditCard, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BankAccount {
  id: string;
  nome_banco: string;
  agencia?: string;
  conta?: string;
  tipo_conta?: string;
  saldo_atual: number;
  ativo: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentTransaction {
  id: string;
  descricao: string;
  fornecedor: string;
  valor: number;
  data_pagamento: string;
  data_hora_pagamento?: string;
  status: string;
}

export default function BankAccountDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/bank-accounts');
      return;
    }

    loadAccountData();
  }, [id]);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      
      // Load account details
      const { data: accountData, error: accountError } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('id', id)
        .single();

      if (accountError) {
        console.error('Error loading bank account:', accountError);
        toast({
          title: "Erro",
          description: "Conta bancária não encontrada",
          variant: "destructive"
        });
        navigate('/bank-accounts');
        return;
      }

      setAccount(accountData);

      // Load related payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('ap_installments')
        .select('id, descricao, fornecedor, valor, data_pagamento, data_hora_pagamento, status')
        .eq('conta_bancaria_id', id)
        .eq('status', 'pago')
        .order('data_pagamento', { ascending: false })
        .limit(50);

      if (paymentsError) {
        console.error('Error loading payments:', paymentsError);
      } else {
        setTransactions(paymentsData || []);
      }

    } catch (error) {
      console.error('Error loading account data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados da conta",
        variant: "destructive"
      });
      navigate('/bank-accounts');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);

  const formatDate = (date: string) =>
    format(new Date(date), "dd/MM/yyyy", { locale: ptBR });

  const totalPaid = transactions.reduce((sum, transaction) => sum + transaction.valor, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/bank-accounts')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{account.nome_banco}</h1>
              <p className="text-muted-foreground">Detalhes da conta e movimentações</p>
            </div>
          </div>
          <Button onClick={() => navigate(`/bank-accounts/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Conta
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Account Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={account.ativo ? "default" : "secondary"}>
                      {account.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                    <Badge variant={account.saldo_atual >= 0 ? "default" : "destructive"}>
                      {account.saldo_atual >= 0 ? "Positivo" : "Negativo"}
                    </Badge>
                  </div>
                </div>

                {account.tipo_conta && (
                  <div>
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <div className="font-medium">{account.tipo_conta}</div>
                  </div>
                )}

                {account.agencia && (
                  <div>
                    <span className="text-sm text-muted-foreground">Agência:</span>
                    <div className="font-medium">{account.agencia}</div>
                  </div>
                )}

                {account.conta && (
                  <div>
                    <span className="text-sm text-muted-foreground">Conta:</span>
                    <div className="font-medium">{account.conta}</div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Saldo Atual:</span>
                  <div className={`text-2xl font-bold ${
                    account.saldo_atual >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {formatCurrency(account.saldo_atual)}
                  </div>
                </div>

                {account.observacoes && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Observações:</span>
                    <div className="text-sm mt-1">{account.observacoes}</div>
                  </div>
                )}

                <div className="pt-2 border-t text-xs text-muted-foreground">
                  <div>Criada em: {formatDate(account.created_at)}</div>
                  <div>Atualizada em: {formatDate(account.updated_at)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Resumo de Movimentações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total de Pagamentos:</span>
                  <span className="font-medium">{transactions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Valor Total Pago:</span>
                  <span className="font-medium text-destructive">{formatCurrency(totalPaid)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Histórico de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma movimentação encontrada</h3>
                    <p className="text-muted-foreground">
                      Ainda não há pagamentos registrados para esta conta.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{transaction.descricao}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.fornecedor}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Pago em: {formatDate(transaction.data_pagamento)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-destructive">
                            -{formatCurrency(transaction.valor)}
                          </div>
                          <Badge variant="default" className="text-xs">
                            Pago
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}