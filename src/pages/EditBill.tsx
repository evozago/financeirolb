import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    valor: "",
    data_vencimento: "",
    numero_parcela: "1",
    categoria: "",
    observacoes: ""
  });

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
      setFormData({
        descricao: data.descricao || "",
        fornecedor: data.fornecedor || "",
        valor: data.valor?.toString() || "",
        data_vencimento: data.data_vencimento || "",
        numero_parcela: data.numero_parcela?.toString() || "1",
        categoria: data.categoria || "",
        observacoes: data.observacoes || ""
      });
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('ap_installments')
        .update({
          descricao: formData.descricao,
          fornecedor: formData.fornecedor,
          valor: parseFloat(formData.valor),
          data_vencimento: formData.data_vencimento,
          numero_parcela: parseInt(formData.numero_parcela),
          categoria: formData.categoria,
          observacoes: formData.observacoes
        })
        .eq('id', bill.id);

      if (error) throw error;

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
        .delete()
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
              <div>
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
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => handleInputChange('valor', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => handleInputChange('data_vencimento', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="numero_parcela">Número da Parcela</Label>
                <Input
                  id="numero_parcela"
                  type="number"
                  min="1"
                  value={formData.numero_parcela}
                  onChange={(e) => handleInputChange('numero_parcela', e.target.value)}
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
            </div>

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