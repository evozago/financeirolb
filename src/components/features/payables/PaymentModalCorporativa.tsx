import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { FatoParcelas, PagamentoParcela } from '@/types/corporativo';
import { formatCurrency, parseCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BankAccount {
  id: string;
  nome_banco: string;
  conta: string;
  agencia: string;
}

interface PaymentModalCorporativaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcela: FatoParcelas | null;
  onPaymentConfirm: (payment: PagamentoParcela) => Promise<void>;
  loading: boolean;
}

const PAYMENT_METHODS = [
  'Dinheiro',
  'PIX',
  'TED',
  'DOC',
  'Cartão de Débito',
  'Cartão de Crédito',
  'Boleto',
  'Cheque',
];

export const PaymentModalCorporativa: React.FC<PaymentModalCorporativaProps> = ({
  open,
  onOpenChange,
  parcela,
  onPaymentConfirm,
  loading,
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentData, setPaymentData] = useState<Partial<PagamentoParcela>>({
    valor_pago: 0,
    data_pagamento: format(new Date(), 'yyyy-MM-dd'),
    juros: 0,
    multa: 0,
    desconto: 0,
  });
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadBankAccounts();
      if (parcela) {
        setPaymentData({
          parcela_id: parcela.id,
          valor_pago: parcela.valor_parcela,
          data_pagamento: format(new Date(), 'yyyy-MM-dd'),
          juros: 0,
          multa: 0,
          desconto: 0,
        });
      }
    }
  }, [open, parcela]);

  const loadBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('id, nome_banco, conta, agencia')
        .eq('ativo', true)
        .order('nome_banco');

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas bancárias:', error);
    }
  };

  const handleValueChange = (field: keyof PagamentoParcela, value: string | number) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCurrencyChange = (field: 'valor_pago' | 'juros' | 'multa' | 'desconto', value: string) => {
    const numericValue = parseCurrency(value);
    handleValueChange(field, numericValue);
  };

  const calculateTotals = () => {
    if (!parcela) return { original: 0, paid: 0, discount: 0, discountPercentage: 0 };

    const original = parcela.valor_parcela;
    const juros = paymentData.juros || 0;
    const multa = paymentData.multa || 0;
    const desconto = paymentData.desconto || 0;
    const paid = (paymentData.valor_pago || 0) + juros + multa - desconto;
    const discountAmount = desconto;
    const discountPercentage = original > 0 ? (discountAmount / original) * 100 : 0;

    return {
      original,
      paid,
      discount: discountAmount,
      discountPercentage,
      juros,
      multa,
    };
  };

  const handleConfirm = async () => {
    if (!parcela || !paymentData.valor_pago) {
      toast({
        title: 'Erro',
        description: 'Valor pago é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onPaymentConfirm({
        parcela_id: parcela.id,
        valor_pago: paymentData.valor_pago,
        data_pagamento: format(paymentDate, 'yyyy-MM-dd'),
        meio_pagamento: paymentData.meio_pagamento,
        conta_bancaria_id: paymentData.conta_bancaria_id,
        juros: paymentData.juros || 0,
        multa: paymentData.multa || 0,
        desconto: paymentData.desconto || 0,
        observacoes: paymentData.observacoes,
      });
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
    }
  };

  const handleReset = () => {
    if (parcela) {
      setPaymentData({
        parcela_id: parcela.id,
        valor_pago: parcela.valor_parcela,
        data_pagamento: format(new Date(), 'yyyy-MM-dd'),
        juros: 0,
        multa: 0,
        desconto: 0,
      });
      setPaymentDate(new Date());
    }
  };

  const totals = calculateTotals();

  if (!parcela) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Parcela */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Detalhes da Parcela</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Credor:</span>
                <div className="font-medium">{parcela.credor_nome}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Valor Original:</span>
                <div className="font-medium">{formatCurrency(parcela.valor_parcela)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Vencimento:</span>
                <div className="font-medium">{format(new Date(parcela.data_vencimento), 'dd/MM/yyyy')}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Parcela:</span>
                <div className="font-medium">{parcela.numero_parcela}/{parcela.total_parcelas}</div>
              </div>
            </div>
          </div>

          {/* Dados do Pagamento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor_pago">Valor Pago *</Label>
              <Input
                id="valor_pago"
                value={formatCurrency(paymentData.valor_pago || 0)}
                onChange={(e) => handleCurrencyChange('valor_pago', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="data_pagamento">Data do Pagamento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(paymentDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(date) => date && setPaymentDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="meio_pagamento">Forma de Pagamento</Label>
              <Select 
                value={paymentData.meio_pagamento || ''} 
                onValueChange={(value) => handleValueChange('meio_pagamento', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="conta_bancaria_id">Conta Bancária</Label>
              <Select 
                value={paymentData.conta_bancaria_id || ''} 
                onValueChange={(value) => handleValueChange('conta_bancaria_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.nome_banco} - {account.agencia}/{account.conta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="juros">Juros</Label>
              <Input
                id="juros"
                value={formatCurrency(paymentData.juros || 0)}
                onChange={(e) => handleCurrencyChange('juros', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="multa">Multa</Label>
              <Input
                id="multa"
                value={formatCurrency(paymentData.multa || 0)}
                onChange={(e) => handleCurrencyChange('multa', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="desconto">Desconto</Label>
              <Input
                id="desconto"
                value={formatCurrency(paymentData.desconto || 0)}
                onChange={(e) => handleCurrencyChange('desconto', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={paymentData.observacoes || ''}
              onChange={(e) => handleValueChange('observacoes', e.target.value)}
              placeholder="Observações sobre o pagamento..."
            />
          </div>

          {/* Resumo do Pagamento */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Resumo do Pagamento</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Valor Original:</span>
                <span>{formatCurrency(totals.original)}</span>
              </div>
              {totals.juros > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Juros:</span>
                  <span>+ {formatCurrency(totals.juros)}</span>
                </div>
              )}
              {totals.multa > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Multa:</span>
                  <span>+ {formatCurrency(totals.multa)}</span>
                </div>
              )}
              {totals.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto:</span>
                  <span>- {formatCurrency(totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total a Pagar:</span>
                <span>{formatCurrency(totals.paid)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Limpar
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Processando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};