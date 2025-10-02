import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BatchPaymentModal, BatchPaymentData } from './PaymentModal';

interface InstallmentData {
  id: string;
  numero_parcela: number;
  total_parcelas: number;
  valor: number;
  data_vencimento: string;
  status: string;
  data_pagamento?: string;
}

interface StatusChangeControlProps {
  installments: InstallmentData[];
  onStatusChanged: () => void;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: 'aberto', label: 'Aberto', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'pago', label: 'Pago', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'cancelado', label: 'Cancelado', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200' }
];

export function StatusChangeControl({ installments, onStatusChanged, className }: StatusChangeControlProps) {
  const [selectedInstallments, setSelectedInstallments] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR');

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'aberto';
    const currentStatus = isOverdue ? 'vencido' : status;
    
    const statusConfig = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    const Icon = statusConfig.icon;
    
    return (
      <Badge className={cn('text-xs flex items-center gap-1', 
        isOverdue ? 'bg-red-100 text-red-800 border-red-200' : statusConfig.color
      )}>
        <Icon className="h-3 w-3" />
        {isOverdue ? 'Vencido' : statusConfig.label}
      </Badge>
    );
  };

  const handleInstallmentToggle = (installmentId: string) => {
    setSelectedInstallments(prev => 
      prev.includes(installmentId)
        ? prev.filter(id => id !== installmentId)
        : [...prev, installmentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInstallments.length === installments.length) {
      setSelectedInstallments([]);
    } else {
      setSelectedInstallments(installments.map(inst => inst.id));
    }
  };

  const handleStatusChange = async () => {
    if (selectedInstallments.length === 0 || !newStatus) {
      toast({
        title: "Erro",
        description: "Selecione ao menos uma parcela e um status",
        variant: "destructive",
      });
      return;
    }

    // Se o status for 'pago', abrir modal de pagamento
    if (newStatus === 'pago') {
      setPaymentModalOpen(true);
      return;
    }

    // Para outros status, processar diretamente
    await processStatusChange();
  };

  const processStatusChange = async () => {
    setLoading(true);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Se voltar para aberto, remover dados de pagamento
      if (newStatus === 'aberto') {
        updateData.data_pagamento = null;
        updateData.data_hora_pagamento = null;
        updateData.valor_pago = null;
        updateData.banco_pagador = null;
      }

      const { error } = await supabase
        .from('ap_installments')
        .update(updateData)
        .in('id', selectedInstallments);

      if (error) {
        throw error;
      }

      const selectedCount = selectedInstallments.length;
      const statusLabel = STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus;

      toast({
        title: "Sucesso",
        description: `${selectedCount} parcela(s) alterada(s) para "${statusLabel}"`,
      });

      setSelectedInstallments([]);
      setNewStatus('');
      onStatusChanged();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar status das parcelas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfirm = async (paymentData: BatchPaymentData[]) => {
    setLoading(true);
    try {
      // Processar cada pagamento
      for (const payment of paymentData) {
        const updateData = {
          status: 'pago',
          data_pagamento: payment.dataPagamento,
          data_hora_pagamento: new Date().toISOString(),
          valor_pago: payment.valorPago,
          banco_pagador: payment.bancoPagador || null,
          observacoes: payment.observacoes || null,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('ap_installments')
          .update(updateData)
          .eq('id', payment.installmentId);

        if (error) {
          throw error;
        }
      }

      toast({
        title: "Sucesso",
        description: `${paymentData.length} parcela(s) marcada(s) como paga(s)`,
      });

      setSelectedInstallments([]);
      setNewStatus('');
      setPaymentModalOpen(false);
      onStatusChanged();
    } catch (error) {
      console.error('Erro ao processar pagamentos:', error);
      toast({
        title: "Erro",
        description: "Falha ao processar pagamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTotal = installments
    .filter(inst => selectedInstallments.includes(inst.id))
    .reduce((sum, inst) => sum + inst.valor, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Alterar Status das Parcelas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles de Seleção */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedInstallments.length === installments.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
          </Button>
          {selectedInstallments.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedInstallments.length} selecionada(s) • {formatCurrency(selectedTotal)}
            </div>
          )}
        </div>

        {/* Lista de Parcelas */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {installments.map((installment) => (
            <div
              key={installment.id}
              className={cn(
                "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                selectedInstallments.includes(installment.id)
                  ? "bg-primary/10 border-primary"
                  : "bg-background hover:bg-muted/50"
              )}
              onClick={() => handleInstallmentToggle(installment.id)}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedInstallments.includes(installment.id)}
                  onChange={() => handleInstallmentToggle(installment.id)}
                  className="rounded"
                />
                <div>
                  <div className="font-medium">
                    Parcela {installment.numero_parcela}/{installment.total_parcelas}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Venc: {formatDate(installment.data_vencimento)} • {formatCurrency(installment.valor)}
                  </div>
                </div>
              </div>
              <div>
                {getStatusBadge(installment.status, installment.data_vencimento)}
              </div>
            </div>
          ))}
        </div>

        {/* Controles de Alteração */}
        {selectedInstallments.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Novo Status
              </label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => {
                    const Icon = status.icon;
                    return (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {status.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleStatusChange}
              disabled={loading || !newStatus}
              className="w-full"
            >
              {loading ? 'Alterando...' : `Alterar Status de ${selectedInstallments.length} Parcela(s)`}
            </Button>
          </div>
        )}

        {/* Modal de Pagamento Avançado */}
        <BatchPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          installments={installments.filter(inst => selectedInstallments.includes(inst.id)).map(inst => ({
            id: inst.id,
            installmentNumber: inst.numero_parcela,
            amount: inst.valor,
            dueDate: inst.data_vencimento,
            status: inst.status as 'Pendente' | 'Pago' | 'Vencido',
            billId: inst.id
          }))}
          onPaymentConfirm={handlePaymentConfirm}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
}