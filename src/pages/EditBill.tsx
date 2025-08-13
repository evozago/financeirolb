import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Calendar, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type ApInstallment = Database['public']['Tables']['ap_installments']['Row'];

const EditBill = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bill, setBill] = useState<ApInstallment | null>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    descricao: "",
    fornecedor: "",
    valor_total: "",
    total_parcelas: "1",
    categoria: "",
    observacoes: "",
    filial_id: ""
  });

  const [installmentDates, setInstallmentDates] = useState<string[]>([]);
  const [currentBillsGroup, setCurrentBillsGroup] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadBillData();
      loadSuppliers();
    }
  }, [id]);

  const loadBillData = async () => {
    try {
      const { data, error } = await supabase
        .from('ap_installments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setBill(data);
      
      // Carregar todas as parcelas do mesmo grupo
      const { data: groupBills, error: groupError } = await supabase
        .from('ap_installments')
        .select('*')
        .eq('valor_total_titulo', data.valor_total_titulo || data.valor)
        .eq('fornecedor', data.fornecedor)
        .order('numero_parcela');

      if (groupError) throw groupError;

      const bills = groupBills || [data];
      setCurrentBillsGroup(bills);
      
      setFormData({
        descricao: data.descricao || "",
        fornecedor: data.fornecedor || "",
        valor_total: (data.valor_total_titulo || data.valor)?.toString() || "",
        total_parcelas: (data.total_parcelas || bills.length)?.toString() || "1",
        categoria: data.categoria || "",
        observacoes: data.observacoes || "",
        filial_id: data.filial_id || ""
      });

      // Configurar datas das parcelas
      const dates = bills.map(bill => bill.data_vencimento);
      setInstallmentDates(dates);
      
    } catch (error) {
      console.error('Error loading bill:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'total_parcelas') {
      const newTotal = parseInt(value) || 1;
      const currentDates = [...installmentDates];
      
      // Ajustar array de datas
      if (newTotal > currentDates.length) {
        // Adicionar novas datas (30 dias entre parcelas)
        const lastDate = currentDates[currentDates.length - 1] || new Date().toISOString().split('T')[0];
        for (let i = currentDates.length; i < newTotal; i++) {
          const date = new Date(lastDate);
          date.setMonth(date.getMonth() + i);
          currentDates.push(date.toISOString().split('T')[0]);
        }
      } else if (newTotal < currentDates.length) {
        // Remover datas extras
        currentDates.splice(newTotal);
      }
      
      setInstallmentDates(currentDates);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (index: number, date: string) => {
    const newDates = [...installmentDates];
    newDates[index] = date;
    setInstallmentDates(newDates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill) return;

    setSaving(true);
    try {
      const totalValue = parseFloat(formData.valor_total);
      const totalInstallments = parseInt(formData.total_parcelas);
      const valuePerInstallment = totalValue / totalInstallments;

      // Primeiro, deletar todas as parcelas do grupo atual (exceto a atual)
      if (currentBillsGroup.length > 1) {
        const otherBillIds = currentBillsGroup
          .filter(b => b.id !== bill.id)
          .map(b => b.id);

        if (otherBillIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('ap_installments')
            .update({ deleted_at: new Date().toISOString() })
            .in('id', otherBillIds);

          if (deleteError) throw deleteError;
        }
      }

      // Atualizar a parcela atual
      const { error: updateError } = await supabase
        .from('ap_installments')
        .update({
          descricao: formData.descricao,
          fornecedor: formData.fornecedor,
          valor: valuePerInstallment,
          valor_total_titulo: totalValue,
          data_vencimento: installmentDates[0],
          numero_parcela: 1,
          total_parcelas: totalInstallments,
          categoria: formData.categoria,
          observacoes: formData.observacoes
        })
        .eq('id', bill.id);

      if (updateError) throw updateError;

      // Criar novas parcelas se necessário
      if (totalInstallments > 1) {
        const newInstallments = [];
        for (let i = 1; i < totalInstallments; i++) {
          newInstallments.push({
            descricao: formData.descricao,
            fornecedor: formData.fornecedor,
            valor: valuePerInstallment,
            valor_total_titulo: totalValue,
            data_vencimento: installmentDates[i],
            numero_parcela: i + 1,
            total_parcelas: totalInstallments,
            categoria: formData.categoria,
            observacoes: formData.observacoes,
            status: 'aberto'
          });
        }

        const { error: insertError } = await supabase
          .from('ap_installments')
          .insert(newInstallments);

        if (insertError) throw insertError;
      }

      toast({
        title: "Sucesso",
        description: "Conta atualizada com sucesso",
      });

      navigate(`/bills/${bill.id}`);
    } catch (error) {
      console.error('Error updating bill:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar conta",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bill) return;
    
    if (!confirm("Tem certeza que deseja excluir esta conta?")) return;

    try {
      const { error } = await supabase
        .from('ap_installments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', bill.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conta excluída com sucesso",
      });

      navigate('/accounts-payable');
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir conta",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Conta não encontrada</h1>
          <Button onClick={() => navigate('/accounts-payable')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Contas a Pagar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/bills/${bill.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Detalhes
        </Button>
        <h1 className="text-3xl font-bold">Editar Conta</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Input
                  id="fornecedor"
                  value={formData.fornecedor}
                  onChange={(e) => handleInputChange('fornecedor', e.target.value)}
                  placeholder="Nome do fornecedor"
                />
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => handleInputChange('categoria', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="filial_id">Filial</Label>
                <Input
                  id="filial_id"
                  value={formData.filial_id}
                  onChange={(e) => handleInputChange('filial_id', e.target.value)}
                  placeholder="ID da filial"
                />
              </div>

              <div>
                <Label htmlFor="valor_total">Valor Total *</Label>
                <Input
                  id="valor_total"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_total}
                  onChange={(e) => handleInputChange('valor_total', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="total_parcelas">Quantidade de Parcelas *</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = parseInt(formData.total_parcelas) || 1;
                      if (current > 1) {
                        handleInputChange('total_parcelas', (current - 1).toString());
                      }
                    }}
                    disabled={parseInt(formData.total_parcelas) <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="total_parcelas"
                    type="number"
                    min="1"
                    max="99"
                    value={formData.total_parcelas}
                    onChange={(e) => handleInputChange('total_parcelas', e.target.value)}
                    className="text-center"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = parseInt(formData.total_parcelas) || 1;
                      if (current < 99) {
                        handleInputChange('total_parcelas', (current + 1).toString());
                      }
                    }}
                    disabled={parseInt(formData.total_parcelas) >= 99}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Valor por parcela: {formData.valor_total && formData.total_parcelas ? 
                    new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(parseFloat(formData.valor_total) / parseInt(formData.total_parcelas)) : 
                    'R$ 0,00'
                  }
                </p>
              </div>
            </div>

            {/* Datas das Parcelas */}
            {parseInt(formData.total_parcelas) > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4" />
                    Datas de Vencimento das Parcelas
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: parseInt(formData.total_parcelas) || 1 }, (_, index) => (
                      <div key={index}>
                        <Label htmlFor={`date-${index}`} className="text-sm">
                          {index + 1}ª Parcela
                        </Label>
                        <Input
                          id={`date-${index}`}
                          type="date"
                          value={installmentDates[index] || ''}
                          onChange={(e) => handleDateChange(index, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Conta
          </Button>

          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditBill;