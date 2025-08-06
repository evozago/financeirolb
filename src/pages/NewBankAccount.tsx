/**
 * Página para cadastrar nova conta bancária
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BankAccountForm } from '@/components/features/banks/BankAccountForm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function NewBankAccount() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from('contas_bancarias')
        .insert({
          nome_banco: data.nome_banco,
          agencia: data.agencia || null,
          conta: data.conta || null,
          tipo_conta: data.tipo_conta || null,
          saldo_atual: data.saldo_atual,
          ativo: data.ativo,
          observacoes: data.observacoes || null,
        });

      if (error) {
        console.error('Error creating bank account:', error);
        toast({
          title: "Erro",
          description: "Falha ao criar conta bancária",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Conta bancária criada com sucesso"
      });

      navigate('/bank-accounts');
    } catch (error) {
      console.error('Error creating bank account:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar conta bancária",
        variant: "destructive"
      });
    }
  };

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
            <h1 className="text-3xl font-bold text-foreground">Nova Conta Bancária</h1>
            <p className="text-muted-foreground">Cadastre uma nova conta para gerenciar pagamentos</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <BankAccountForm 
              onSubmit={handleSubmit}
              submitLabel="Criar Conta"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}