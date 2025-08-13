/**
 * Modal avançado para controle de pagamentos
 * Permite editar valor pago, selecionar banco pagador e adicionar observações
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, DollarSign } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface InstallmentData {
  id: string;
  numero_parcela: number;
  total_parcelas: number;
  valor: number;
  data_vencimento: string;
  status: string;
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installments: InstallmentData[];
  onPaymentConfirm: (paymentData: PaymentData[]) => void;
  loading?: boolean;
}

export interface PaymentData {
  installmentId: string;
  valorPago: number;
  bancoPagador?: string;
  bankAccountId?: string;
  dataPagamento: string;
  observacoes?: string;
}

interface BankAccount {
  id: string;
  nome_banco: string;
  conta?: string;
  agencia?: string;
}

export function PaymentModal({ 
  open, 
  onOpenChange, 
  installments, 
  onPaymentConfirm, 
  loading = false 
}: PaymentModalProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [observacoes, setObservacoes] = useState<string>('');
  const [installmentValues, setInstallmentValues] = useState<Record<string, number>>({});

  // Carregar contas bancárias
  useEffect(() => {
    if (open) {
      loadBankAccounts();
      // Inicializar valores com os valores originais
      const initialValues: Record<string, number> = {};
      installments.forEach(inst => {
        initialValues[inst.id] = inst.valor;
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
    // Remove formatação e converte para número
    const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleValueChange = (installmentId: string, value: string) => {
    const numericValue = parseCurrency(value);
    setInstallmentValues(prev => ({
      ...prev,
      [installmentId]: numericValue
    }));
  };

  const calculateTotals = () => {
    const originalTotal = installments.reduce((sum, inst) => sum + inst.valor, 0);
    const paidTotal = Object.values(installmentValues).reduce((sum, value) => sum + value, 0);
    const discount = originalTotal - paidTotal;
    const discountPercent = originalTotal > 0 ? (discount / originalTotal) * 100 : 0;

    return {
      originalTotal,
      paidTotal,
      discount,
      discountPercent
    };
  };

  const handleConfirm = () => {
    const paymentData: PaymentData[] = installments.map(inst => ({
      installmentId: inst.id,
      valorPago: installmentValues[inst.id] || inst.valor,
      bancoPagador: selectedBank,
      bankAccountId: bankAccounts.find(b => b.nome_banco === selectedBank)?.id,
      dataPagamento: format(paymentDate, 'yyyy-MM-dd'),
      observacoes: observacoes
    }));

    onPaymentConfirm(paymentData);
  };

  const handleReset = () => {
    const initialValues: Record<string, number> = {};
    installments.forEach(inst => {
      initialValues[inst.id] = inst.valor;
    });
    setInstallmentValues(initialValues);
    setSelectedBank('');
    setPaymentDate(new Date());
    setObservacoes('');
  };

  const totals = calculateTotals();
  const hasDiscount = totals.discount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Confirmar Pagamento
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {installments.length} parcela(s) selecionada(s) para pagamento
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Lista de Parcelas com Valores */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Valores das Parcelas</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {installments.map((installment) => (
                <div key={installment.id} className="flex items-center justify-between gap-4 p-2 bg-muted/30 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      Parcela {installment.numero_parcela}/{installment.total_parcelas}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Venc: {new Date(installment.data_vencimento).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Original:</span>
                    <span className="text-sm font-medium">{formatCurrency(installment.valor)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Pago:</span>
                    <Input
                      type="text"
                      className="w-24 text-right text-sm"
                      value={formatCurrency(installmentValues[installment.id] || installment.valor)}
                      onChange={(e) => handleValueChange(installment.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo dos Totais */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Original:</span>
              <span className="font-medium">{formatCurrency(totals.originalTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total a Pagar:</span>
              <span className="font-medium">{formatCurrency(totals.paidTotal)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between items-center text-green-600 border-t pt-2">
                <span className="text-sm font-medium">Desconto:</span>
                <span className="font-medium">
                  {formatCurrency(totals.discount)} ({totals.discountPercent.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>

          {/* Data de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="payment-date">Data de Pagamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Banco Pagador */}
          <div className="space-y-2">
            <Label htmlFor="bank">Banco Pagador</Label>
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar banco" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(bank => (
                  <SelectItem key={bank.id} value={bank.nome_banco}>
                    <div className="flex flex-col">
                      <span>{bank.nome_banco}</span>
                      {(bank.conta || bank.agencia) && (
                        <span className="text-xs text-muted-foreground">
                          {bank.agencia && `Ag: ${bank.agencia}`} {bank.conta && `Cc: ${bank.conta}`}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Desconto por pagamento antecipado, taxa bancária, etc."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            Resetar
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Processando...' : `Confirmar Pagamento`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}