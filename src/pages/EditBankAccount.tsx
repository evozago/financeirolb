/**
 * Página para editar conta bancária existente
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BankAccountForm } from '@/components/features/banks/BankAccountForm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BankAccount {
  id: string;
  nome_banco: string;
  agencia?: string;
  conta?: string;
  tipo_conta?: string;
  saldo_atual: number;
  ativo: boolean;
  observacoes?: string;
}

export default function EditBankAccount() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/bank-accounts');
      return;
    }

    loadAccount();
  }, [id]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading bank account:', error);
        toast({
          title: "Erro",
          description: "Conta bancária não encontrada",
          variant: "destructive"
        });
        navigate('/bank-accounts');
        return;
      }

      setAccount(data);
    } catch (error) {
      console.error('Error loading bank account:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar conta bancária",
        variant: "destructive"
      });
      navigate('/bank-accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from('contas_bancarias')
        .update({
          nome_banco: data.nome_banco,
          agencia: data.agencia || null,
          conta: data.conta || null,
          tipo_conta: data.tipo_conta || null,
          saldo_atual: data.saldo_atual,
          ativo: data.ativo,
          observacoes: data.observacoes || null,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating bank account:', error);
        toast({
          title: "Erro",
          description: "Falha ao atualizar conta bancária",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Conta bancária atualizada com sucesso"
      });

      navigate('/bank-accounts');
    } catch (error) {
      console.error('Error updating bank account:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar conta bancária",
        variant: "destructive"
      });
    }
  };

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/bank-accounts')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editar Conta Bancária</h1>
            <p className="text-muted-foreground">Altere os dados da conta "{account.nome_banco}"</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <BankAccountForm 
              initialData={account}
              onSubmit={handleSubmit}
              submitLabel="Salvar Alterações"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}