import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RecurringBill } from '@/types/payables';

interface RecurringBillFormProps {
  bill?: RecurringBill | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Supplier {
  id: string;
  nome: string;
}

interface Category {
  id: string;
  nome: string;
}

interface Branch {
  id: string;
  nome: string;
}

export const RecurringBillForm: React.FC<RecurringBillFormProps> = ({
  bill,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    supplier_id: '',
    category_id: '',
    filial_id: '',               // 👈 novo campo
    closing_day: '',
    due_day: '',
    expected_amount: '',
    open_ended: true,
    end_date: '',
    notes: ''
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); // 👈 lista de filiais
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSuppliers();
    loadCategories();
    loadBranches();

    if (bill) {
      setFormData({
        name: bill.name,
        supplier_id: (bill as any).supplier_id || '',
        category_id: (bill as any).category_id || '',
        filial_id: (bill as any).filial_id || '', // 👈 preenche ao editar
        closing_day: (bill as any).closing_day?.toString() || '',
        due_day: (bill as any).due_day?.toString() || '',
        expected_amount: (bill as any).expected_amount?.toString() || '',
        open_ended: (bill as any).open_ended ?? true,
        end_date: (bill as any).end_date || '',
        notes: (bill as any).notes || ''
      });
    }
  }, [bill]);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_produtos')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // 👇 carrega filiais ativas
  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('filiais')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.due_day || !formData.expected_amount) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        name: formData.name,
        supplier_id: formData.supplier_id || null,
        category_id: formData.category_id || null,
        filial_id: formData.filial_id || null, // 👈 persiste filial
        closing_day: formData.closing_day ? parseInt(formData.closing_day) : null,
        due_day: parseInt(formData.due_day),
        expected_amount: parseFloat(formData.expected_amount),
        open_ended: formData.open_ended,
        end_date: formData.end_date || null,
        notes: formData.notes || null
      };

      let result;
      if (bill) {
        result = await supabase
          .from('recurring_bills' as any)
          .update(submitData)
          .eq('id', (bill as any).id);
      } else {
        result = await supabase
          .from('recurring_bills' as any)
          .insert([submitData]);
      }

      if ((result as any).error) throw (result as any).error;

      onSuccess();
    } catch (error) {
      console.error('Error saving recurring bill:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar conta recorrente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">
          {bill ? 'Editar Conta Recorrente' : 'Nova Conta Recorrente'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Conta *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Equatorial Energia"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select
                  value={formData.supplier_id || undefined}
                  onValueChange={(value) => handleInputChange('supplier_id', value || '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 👇 Campo de Filial */}
              <div className="space-y-2">
                <Label>Filial</Label>
                <Select
                  value={formData.filial_id || undefined}
                  onValueChange={(value) => handleInputChange('filial_id', value || '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category_id || undefined}
                  onValueChange={(value) => handleInputChange('category_id', value || '')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_amount">Valor Esperado *</Label>
                <Input
                  id="expected_amount"
                  type="number"
                  step="0.01"
                  value={formData.expected_amount}
                  onChange={(e) => handleInputChange('expected_amount', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing_day">Dia do Fechamento</Label>
                <Input
                  id="closing_day"
                  type="number"
                  min={1}
                  max={31}
                  value={formData.closing_day}
                  onChange={(e) => handleInputChange('closing_day', e.target.value)}
                  placeholder="Ex: 25"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_day">Dia do Vencimento *</Label>
                <Input
                  id="due_day"
                  type="number"
                  min={1}
                  max={31}
                  value={formData.due_day}
                  onChange={(e) => handleInputChange('due_day', e.target.value)}
                  placeholder="Ex: 4"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="open_ended"
                  checked={formData.open_ended}
                  onCheckedChange={(checked) => handleInputChange('open_ended', checked)}
                />
                <Label htmlFor="open_ended">Conta sem data final (contínua)</Label>
              </div>

              {!formData.open_ended && (
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data Final</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
