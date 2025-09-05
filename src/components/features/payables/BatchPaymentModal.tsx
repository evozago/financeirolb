/**
 * Modal avançado para pagamento em lote de contas a pagar
 * Permite registrar informações detalhadas de pagamento incluindo código identificador
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, DollarSign, CreditCard, Building2, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
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
  dataPagamento: string;
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
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [codigoIdentificador, setCodigoIdentificador] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [installmentValues, setInstallmentValues] = useState<Record<string, {
    valorPago: number;
    tipoAjuste: 'desconto' | 'juros' | 'normal';
    valorAjuste: number;
  }>>({});

  // Carregar contas bancárias
  useEffect(() => {
    if (open) {
      loadBankAccounts();
      // Inicializar valores com os valores originais
      const initialValues: Record<string, any> = {};
      installments.forEach(inst => {
        initialValues[inst.id] = {
          valorPago: inst.amount,
          tipoAjuste: 'normal' as const,
          valorAjuste: 0
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

  const handleValueChange = (installmentId: string, field: string, value: string | number) => {
    setInstallmentValues(prev => {
      const current = prev[installmentId] || { valorPago: 0, tipoAjuste: 'normal', valorAjuste: 0 };
      
      if (field === 'valorPago') {
        const valorPago = typeof value === 'string' ? parseCurrency(value) : value;
        const installment = installments.find(i => i.id === installmentId);
        const valorOriginal = installment?.amount || 0;
        
        // Calcular ajuste automaticamente
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
          [installmentId]: {
            ...current,
            valorPago,
            tipoAjuste,
            valorAjuste
          }
        };
      }
      
      return {
        ...prev,
        [installmentId]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  const calculateTotals = () => {
    const originalTotal = installments.reduce((sum, inst) => sum + inst.amount, 0);
    const paidTotal = Object.values(installmentValues).reduce((sum, value) => sum + (value?.valorPago || 0), 0);
    const totalDesconto = Object.values(installmentValues).reduce((sum, value) => 
      sum + (value?.tipoAjuste === 'desconto' ? value.valorAjuste : 0), 0);
    const totalJuros = Object.values(installmentValues).reduce((sum, value) => 
      sum + (value?.tipoAjuste === 'juros' ? value.valorAjuste : 0), 0);

    return {
      originalTotal,
      paidTotal,
      totalDesconto,
      totalJuros,
      economia: totalDesconto - totalJuros
    };
  };

  const getAjusteIndicator = (installmentId: string) => {
    const value = installmentValues[installmentId];
    if (!value || value.tipoAjuste === 'normal' || value.valorAjuste <= 0.01) return null;

    const isDesconto = value.tipoAjuste === 'desconto';
    return (
      <Badge 
        variant={isDesconto ? 'default' : 'destructive'} 
        className={cn('text-xs', isDesconto ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}
      >
        {isDesconto ? '↓' : '↑'} {formatCurrency(value.valorAjuste)}
      </Badge>
    );
  };

  const handleConfirm = () => {
    const paymentData: BatchPaymentData[] = installments.map(inst => {
      const values = installmentValues[inst.id] || { valorPago: inst.amount, tipoAjuste: 'normal', valorAjuste: 0 };
      return {
        installmentId: inst.id,
        valorPago: values.valorPago,
        valorOriginal: inst.amount,
        bancoPagador: selectedBank,
        bankAccountId: bankAccounts.find(b => b.nome_banco === selectedBank)?.id,
        dataPagamento: format(paymentDate, 'yyyy-MM-dd'),
        codigoIdentificador,
        tipoAjuste: values.tipoAjuste,
        valorAjuste: values.valorAjuste,
        observacoes: observacoes
      };
    });

    onPaymentConfirm(paymentData);
  };

  const handleReset = () => {
    const initialValues: Record<string, any> = {};
    installments.forEach(inst => {
      initialValues[inst.id] = {
        valorPago: inst.amount,
        tipoAjuste: 'normal',
        valorAjuste: 0
      };
    });
    setInstallmentValues(initialValues);
    setSelectedBank('');
    setPaymentDate(new Date());
    setCodigoIdentificador('');
    setObservacoes('');
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pagamento em Lote
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {installments.length} conta(s) selecionada(s) para pagamento
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Informações Gerais do Pagamento */}
          <div className="grid grid-cols-2 gap-4">
            {/* Data de Pagamento */}
            <div className="space-y-2">
              <Label htmlFor="payment-date">Data de Pagamento *</Label>
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
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Banco Pagador */}
            <div className="space-y-2">
              <Label htmlFor="bank">Banco Pagador *</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar banco" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map(bank => (
                    <SelectItem key={bank.id} value={bank.nome_banco}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{bank.nome_banco}</span>
                          {(bank.conta || bank.agencia) && (
                            <span className="text-xs text-muted-foreground">
                              {bank.agencia && `Ag: ${bank.agencia}`} {bank.conta && `Cc: ${bank.conta}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Código Identificador */}
          <div className="space-y-2">
            <Label htmlFor="codigo">Código Identificador do Pagamento</Label>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <Input
                id="codigo"
                placeholder="Ex: TED123456, PIX789, DOC001, etc."
                value={codigoIdentificador}
                onChange={(e) => setCodigoIdentificador(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de Contas com Valores */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Valores das Contas</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
              {installments.map((installment) => (
                <div key={installment.id} className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {installment.bill?.supplier.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Parcela {installment.installmentNumber}/{installment.bill?.totalInstallments} • 
                      Venc: {new Date(installment.dueDate).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {installment.bill?.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Original</div>
                      <div className="text-sm font-medium">{formatCurrency(installment.amount)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Pago</div>
                      <Input
                        type="text"
                        className="w-28 text-right text-sm"
                        value={formatCurrency(installmentValues[installment.id]?.valorPago || installment.amount)}
                        onChange={(e) => handleValueChange(installment.id, 'valorPago', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      {getAjusteIndicator(installment.id)}
                    </div>
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
            {totals.totalDesconto > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm font-medium">Desconto Total:</span>
                <span className="font-medium">{formatCurrency(totals.totalDesconto)}</span>
              </div>
            )}
            {totals.totalJuros > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span className="text-sm font-medium">Juros Total:</span>
                <span className="font-medium">{formatCurrency(totals.totalJuros)}</span>
              </div>
            )}
            {totals.economia !== 0 && (
              <div className={cn("flex justify-between items-center border-t pt-2 font-medium", 
                totals.economia > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                <span className="text-sm">
                  {totals.economia > 0 ? 'Economia Total:' : 'Custo Adicional:'}
                </span>
                <span>{formatCurrency(Math.abs(totals.economia))}</span>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Pagamento via PIX, desconto por antecipação, juros por atraso, etc."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Alerta de Validação */}
          {(!selectedBank || !paymentDate) && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Preencha a data de pagamento e selecione o banco para continuar
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 gap-2">
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            Resetar
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || !selectedBank || !paymentDate}
          >
            {loading ? 'Processando...' : `Confirmar Pagamento (${installments.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}