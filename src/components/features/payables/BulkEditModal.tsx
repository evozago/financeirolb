/**
 * Modal para edição em massa de contas a pagar
 * Permite alterar campos comuns de múltiplas parcelas simultaneamente
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Calendar, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface BulkEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSave: (updates: BulkEditData) => void;
  loading?: boolean;
}

export interface BulkEditData {
  categoria?: string;
  status?: string;
  data_vencimento?: string;
  forma_pagamento?: string;
  observacoes?: string;
  banco?: string;
  filial_id?: string;
}

const STATUS_OPTIONS = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'pago', label: 'Pago' },
  { value: 'cancelado', label: 'Cancelado' }
];

const PAYMENT_METHODS = [
  { value: 'PIX', label: 'PIX' },
  { value: 'Transferência', label: 'Transferência Bancária' },
  { value: 'Boleto', label: 'Boleto' },
  { value: 'Cartão', label: 'Cartão' },
  { value: 'Dinheiro', label: 'Dinheiro' },
  { value: 'Cheque', label: 'Cheque' }
];

interface Category {
  id: string;
  nome: string;
}

interface Filial {
  id: string;
  nome: string;
}

export function BulkEditModal({ 
  open, 
  onOpenChange, 
  selectedCount, 
  onSave, 
  loading = false 
}: BulkEditModalProps) {
  const [formData, setFormData] = useState<BulkEditData>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);

  useEffect(() => {
    if (open) {
      loadCategories();
      loadFiliais();
    }
  }, [open]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_produtos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar categorias:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadFiliais = async () => {
    try {
      const { data, error } = await supabase
        .from('filiais')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar filiais:', error);
        return;
      }

      setFiliais(data || []);
    } catch (error) {
      console.error('Erro ao carregar filiais:', error);
    }
  };

  const handleSave = () => {
    const updates: BulkEditData = {};
    
    // Só inclui campos que foram alterados
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        updates[key as keyof BulkEditData] = value;
      }
    });

    if (selectedDate) {
      updates.data_vencimento = format(selectedDate, 'yyyy-MM-dd');
    }

    onSave(updates);
  };

  const handleReset = () => {
    setFormData({});
    setSelectedDate(undefined);
  };

  const hasChanges = Object.values(formData).some(value => value !== undefined && value !== '') || selectedDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Edição em Massa
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {selectedCount} parcela(s) selecionada(s). Apenas os campos preenchidos serão atualizados.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select 
                value={formData.categoria || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.nome}>
                      {category.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filial">Filial</Label>
              <Select 
                value={formData.filial_id || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, filial_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar filial" />
                </SelectTrigger>
                <SelectContent>
                  {filiais.map(filial => (
                    <SelectItem key={filial.id} value={filial.id}>
                      {filial.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select 
                value={formData.forma_pagamento || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, forma_pagamento: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banco">Banco</Label>
              <Input
                id="banco"
                placeholder="Nome do banco"
                value={formData.banco || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, banco: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_vencimento">Nova Data de Vencimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações adicionais"
              value={formData.observacoes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges || loading}>
            Limpar
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || loading}>
            {loading ? 'Salvando...' : `Atualizar ${selectedCount} Parcela(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}