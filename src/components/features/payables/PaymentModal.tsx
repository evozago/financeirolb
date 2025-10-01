/**
 * Modal avançado para pagamento em lote de contas a pagar
 * Banco e Data são opcionais na UI.
 * Se a data não for informada, usa a data de hoje no submit.
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, DollarSign, CreditCard, Building2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format as formatDateFns } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { BillToPayInstallment } from '@/types/payables';

interface BatchPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installments: BillToPayInstallment[];
  onPaymentConfirm: (paymentData: BatchPaymentData[]) => void;
  loading?: boolean;
}

export interface BatchPaymentData {
  installmentId: string;
  valorPago: number;
  valorOriginal: number;
  bancoPagador?: string;
  bankAccountId?: string;
  dataPagamento: string; // sempre enviado; se o usuário não escolher, usamos hoje
  codigoIdentificador?: string;
  tipoAjuste?: 'desconto' | 'juros' | 'normal';
  valorAjuste?: number;
  observacoes?: string;
}

interface BankAccount {
  id: string;
  nome_banco: string;
  conta?: string;
  agencia?: string;
}

export function BatchPaymentModal({
  open,
  onOpenChange,
  installments,
  onPaymentConfirm,
  loading = false
}: BatchPaymentModalProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [observacoes, setObservacoes] = useState<string>('');
  const [installmentValues, setInstallmentValues] = useState<Record<string, {
    valorPago: number;
    tipoAjuste: 'desconto' | 'juros' | 'normal';
    valorAjuste: number;
    bancoPagador?: string;
    dataPagamento?: Date;
    codigoIdentificador?: string;
  }>>({});

  // Carregar contas bancárias e inicializar valores
  useEffect(() => {
    if (open) {
      loadBankAccounts();
      const initialValues: Record<string, any> = {};
      installments.forEach(inst => {
        initialValues[inst.id] = {
          valorPago: inst.amount,
          tipoAjuste: 'normal' as const,
          valorAjuste: 0,
          bancoPagador: undefined,   // agora realmente opcional
          dataPagamento: undefined,  // opcional, cai para hoje no submit
          codigoIdentificador: ''
        };
      });
      setInstallmentValues(initialValues);
    }
  }, [open, installments]);

  const loadBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('id, nome_banco, conta, agencia')
        .eq('ativo', true)
        .order('nome_banco');

      if (error) {
        console.error('Erro ao carregar contas bancárias:', error);
        return;
      }

      setBankAccounts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleValueChange = (installmentId: string, field: string, value: string | number | Date | undefined) => {
    setInstallmentValues(prev => {
      const current = prev[installmentId];
      if (!current) return prev;

      if (field === 'valorPago') {
        const valorPago = typeof value === 'string' ? parseCurrency(value) : (value as number);
        const installment = installments.find(i => i.id === installmentId);
        const valorOriginal = installment?.amount || 0;

        const diferenca = valorOriginal - valorPago;
        let tipoAjuste: 'desconto' | 'juros' | 'normal' = 'normal';
        let valorAjuste = 0;

        if (diferenca > 0.01) {
          tipoAjuste = 'desconto';
          valorAjuste = diferenca;
        } else if (diferenca < -0.01) {
          tipoAjuste = 'juros';
          valorAjuste = Math.abs(diferenca);
        }

        return {
          ...prev,
          [installmentId]: { ...current, valorPago, tipoAjuste, valorAjuste }
        };
      }

      return { ...prev, [installmentId]: { ...current, [field]: value } };
    });
  };

  const calculateTotals = () => {
    const originalTotal = installments.reduce((sum, inst) => sum + inst.amount, 0);
    const paidTotal = Object.values(installmentValues).reduce((sum, v) => sum + (v?.valorPago || 0), 0);
    const totalDesconto = Object.values(installmentValues).reduce((s, v) => s + (v?.tipoAjuste === 'desconto' ? v.valorAjuste : 0), 0);
    const totalJuros = Object.values(installmentValues).reduce((s, v) => s + (v?.tipoAjuste === 'juros' ? v.valorAjuste : 0), 0);

    return { originalTotal, paidTotal, totalDesconto, totalJuros, economia: totalDesconto - totalJuros };
  };

  const yyyymmdd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const handleConfirm = () => {
    const hoje = new Date();
    const paymentData: BatchPaymentData[] = installments.map(inst => {
      const values = installmentValues[inst.id];
      const data = values?.dataPagamento ?? hoje;

      return {
        installmentId: inst.id,
        valorPago: values?.valorPago ?? inst.amount,
        valorOriginal: inst.amount,
        bancoPagador: values?.bancoPagador || undefined,
        bankAccountId: values?.bancoPagador
          ? bankAccounts.find(b => b.nome_banco === values.bancoPagador)?.id
          : undefined,
        dataPagamento: yyyymmdd(data),
        codigoIdentificador: values?.codigoIdentificador || undefined,
        tipoAjuste: values?.tipoAjuste || 'normal',
        valorAjuste: values?.valorAjuste || 0,
        observacoes
      };
    });

    onPaymentConfirm(paymentData);
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pagamento em Lote
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {installments.length} conta(s) selecionada(s) para pagamento
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {installments.map((installment) => {
            const values = installmentValues[installment.id];
            return (
              <div key={installment.id} className="bg-muted/30 rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{installment.bill?.supplier.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Parcela {installment.installmentNumber}/{installment.bill?.totalInstallments} •
                      Venc: {new Date(installment.dueDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="text"
                      className="w-28 text-right text-sm"
                      value={formatCurrency(values?.valorPago ?? installment.amount)}
                      onChange={(e) => handleValueChange(installment.id, 'valorPago', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Data opcional */}
                  <div className="space-y-2">
                    <Label className="text-xs">Data de Pagamento (opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left text-xs">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {values?.dataPagamento
                            ? formatDateFns(values.dataPagamento, 'dd/MM/yyyy', { locale: ptBR })
                            : 'Hoje'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={values?.dataPagamento}
                          onSelect={(date) => handleValueChange(installment.id, 'dataPagamento', date || undefined)}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Banco opcional */}
                  <div className="space-y-2">
                    <Label className="text-xs">Banco Pagador (opcional)</Label>
                    <Select
                      value={values?.bancoPagador || ''}
                      onValueChange={(v) => handleValueChange(installment.id, 'bancoPagador', v)}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Não informado" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map(bank => (
                          <SelectItem key={bank.id} value={bank.nome_banco}>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              <span className="text-xs">{bank.nome_banco}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Código Identificador */}
                  <div className="space-y-2">
                    <Label className="text-xs">Código Identificador</Label>
                    <Input
                      className="text-xs"
                      placeholder="Ex: TED123"
                      value={values?.codigoIdentificador || ''}
                      onChange={(e) => handleValueChange(installment.id, 'codigoIdentificador', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Totais */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between"><span>Total Original:</span><span>{formatCurrency(totals.originalTotal)}</span></div>
            <div className="flex justify-between"><span>Total a Pagar:</span><span>{formatCurrency(totals.paidTotal)}</span></div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Ex: Pagamento via PIX, desconto por antecipação..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Processando...' : `Confirmar Pagamento (${installments.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
