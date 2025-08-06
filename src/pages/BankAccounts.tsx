/**
 * Página de gerenciamento de contas bancárias
 * Lista todas as contas com saldos e permite CRUD
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, CreditCard, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

export default function BankAccounts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .order('nome_banco');

      if (error) {
        console.error('Error loading bank accounts:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar contas bancárias",
          variant: "destructive"
        });
        return;
      }

      setAccounts(data || []);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar contas bancárias", 
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contas_bancarias')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting bank account:', error);
        toast({
          title: "Erro",
          description: "Falha ao excluir conta bancária",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Conta bancária excluída com sucesso"
      });
      
      loadAccounts();
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast({
        title: "Erro", 
        description: "Falha ao excluir conta bancária",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);

  const totalBalance = accounts.reduce((sum, account) => 
    account.ativo ? sum + (account.saldo_atual || 0) : sum, 0);

  const activeAccounts = accounts.filter(account => account.ativo);
  const positiveAccounts = activeAccounts.filter(account => account.saldo_atual > 0);
  const negativeAccounts = activeAccounts.filter(account => account.saldo_atual < 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contas Bancárias</h1>
            <p className="text-muted-foreground">Gerencie suas contas e acompanhe saldos</p>
          </div>
          <Button onClick={() => navigate('/bank-accounts/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contas Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{activeAccounts.length}</div>
                <CreditCard className="h-5 w-5 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Positivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{positiveAccounts.length}</div>
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Negativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{negativeAccounts.length}</div>
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className={`relative ${!account.ativo ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{account.nome_banco}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={account.ativo ? "default" : "secondary"}>
                      {account.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                    <Badge variant={account.saldo_atual >= 0 ? "default" : "destructive"}>
                      {account.saldo_atual >= 0 ? "Positivo" : "Negativo"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Account Details */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {account.agencia && (
                      <div>
                        <span className="text-muted-foreground">Agência:</span>
                        <div className="font-medium">{account.agencia}</div>
                      </div>
                    )}
                    {account.conta && (
                      <div>
                        <span className="text-muted-foreground">Conta:</span>
                        <div className="font-medium">{account.conta}</div>
                      </div>
                    )}
                    {account.tipo_conta && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Tipo:</span>
                        <div className="font-medium">{account.tipo_conta}</div>
                      </div>
                    )}
                  </div>

                  {/* Balance */}
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-sm">Saldo Atual:</span>
                    <div className={`text-xl font-bold ${
                      account.saldo_atual >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {formatCurrency(account.saldo_atual)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/bank-accounts/${account.id}`)}
                      className="flex-1"
                    >
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/bank-accounts/${account.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a conta bancária "{account.nome_banco}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(account.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {accounts.length === 0 && (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma conta bancária encontrada</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Comece cadastrando sua primeira conta bancária para gerenciar pagamentos.
                  </p>
                  <Button onClick={() => navigate('/bank-accounts/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeira Conta
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}