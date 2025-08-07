import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";

interface OrderData {
  id: string;
  referencia: string;
  descricao: string;
  quantidade: number;
  valor_total_bruto: number;
  desconto_porcentagem: number;
  desconto_valor: number;
  tipo_desconto: string;
  valor_total_liquido: number;
  valor_medio_peca: number;
  data_pedido: string;
  status: string;
  observacoes: string;
  cor: string;
  tamanho: string;
  codigo_barras: string;
  fornecedor_id: string;
  marca_id: string;
  produto_id: string;
  arquivo_origem: string;
  numero_pedido: string;
  quantidade_referencias: number;
  representante_nome: string;
  representante_telefone: string;
  representante_email: string;
}

interface Supplier {
  id: string;
  nome: string;
}

interface Brand {
  id: string;
  nome: string;
}

export default function EditOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    loadOrder();
    loadSuppliers();
    loadBrands();
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('pedidos_produtos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setOrder(data);
    } catch (error: any) {
      console.error('Erro ao carregar pedido:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o pedido.",
        variant: "destructive",
      });
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('marcas')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setBrands(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar marcas:', error);
    }
  };

  const handleSave = async () => {
    if (!order) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('pedidos_produtos')
        .update({
          referencia: order.referencia,
          descricao: order.descricao,
          quantidade: order.quantidade,
          valor_total_bruto: order.valor_total_bruto,
          desconto_porcentagem: order.desconto_porcentagem,
          desconto_valor: order.desconto_valor,
          tipo_desconto: order.tipo_desconto,
          data_pedido: order.data_pedido,
          status: order.status,
          observacoes: order.observacoes,
          cor: order.cor,
          tamanho: order.tamanho,
          codigo_barras: order.codigo_barras,
          fornecedor_id: order.fornecedor_id,
          marca_id: order.marca_id,
          produto_id: order.produto_id,
          arquivo_origem: order.arquivo_origem,
          numero_pedido: order.numero_pedido,
          quantidade_referencias: order.quantidade_referencias,
          representante_nome: order.representante_nome,
          representante_telefone: order.representante_telefone,
          representante_email: order.representante_email,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pedido atualizado com sucesso!",
      });

      navigate(`/orders/${id}`);
    } catch (error: any) {
      console.error('Erro ao salvar pedido:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o pedido.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Pedido não encontrado</h2>
          <p className="text-gray-600 mt-2">O pedido solicitado não existe ou foi removido.</p>
          <Button onClick={() => navigate('/orders')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Pedidos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/orders/${id}`)}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Editar Pedido</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="referencia">Referência</Label>
              <Input
                id="referencia"
                value={order.referencia}
                onChange={(e) => setOrder({ ...order, referencia: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={order.descricao || ''}
                onChange={(e) => setOrder({ ...order, descricao: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="cor">Cor</Label>
              <Input
                id="cor"
                value={order.cor || ''}
                onChange={(e) => setOrder({ ...order, cor: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tamanho">Tamanho</Label>
              <Input
                id="tamanho"
                value={order.tamanho || ''}
                onChange={(e) => setOrder({ ...order, tamanho: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="codigo_barras">Código de Barras</Label>
              <Input
                id="codigo_barras"
                value={order.codigo_barras || ''}
                onChange={(e) => setOrder({ ...order, codigo_barras: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="numero_pedido">Número do Pedido</Label>
              <Input
                id="numero_pedido"
                value={order.numero_pedido || ''}
                onChange={(e) => setOrder({ ...order, numero_pedido: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="quantidade_referencias">Quantidade de Referências</Label>
              <Input
                id="quantidade_referencias"
                type="number"
                value={order.quantidade_referencias || 0}
                onChange={(e) => setOrder({ ...order, quantidade_referencias: parseInt(e.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fornecedor e Marca</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Select
                value={order.fornecedor_id || ''}
                onValueChange={(value) => setOrder({ ...order, fornecedor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="marca">Marca</Label>
              <Select
                value={order.marca_id || ''}
                onValueChange={(value) => setOrder({ ...order, marca_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valores e Quantidades</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                value={order.quantidade}
                onChange={(e) => setOrder({ ...order, quantidade: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="valor_total_bruto">Valor Total Bruto</Label>
              <Input
                id="valor_total_bruto"
                type="number"
                step="0.01"
                value={order.valor_total_bruto}
                onChange={(e) => setOrder({ ...order, valor_total_bruto: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="desconto_porcentagem">Desconto (%)</Label>
              <Input
                id="desconto_porcentagem"
                type="number"
                step="0.01"
                value={order.desconto_porcentagem || 0}
                onChange={(e) => setOrder({ ...order, desconto_porcentagem: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="desconto_valor">Desconto (Valor)</Label>
              <Input
                id="desconto_valor"
                type="number"
                step="0.01"
                value={order.desconto_valor || 0}
                onChange={(e) => setOrder({ ...order, desconto_valor: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="tipo_desconto">Tipo de Desconto</Label>
              <Select
                value={order.tipo_desconto || 'valor'}
                onValueChange={(value) => setOrder({ ...order, tipo_desconto: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valor">Valor</SelectItem>
                  <SelectItem value="porcentagem">Porcentagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Representante</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="representante_nome">Nome do Representante</Label>
              <Input
                id="representante_nome"
                value={order.representante_nome || ''}
                onChange={(e) => setOrder({ ...order, representante_nome: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="representante_telefone">Telefone do Representante</Label>
              <Input
                id="representante_telefone"
                value={order.representante_telefone || ''}
                onChange={(e) => setOrder({ ...order, representante_telefone: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="representante_email">Email do Representante</Label>
              <Input
                id="representante_email"
                type="email"
                value={order.representante_email || ''}
                onChange={(e) => setOrder({ ...order, representante_email: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_pedido">Data do Pedido</Label>
              <Input
                id="data_pedido"
                type="date"
                value={order.data_pedido || ''}
                onChange={(e) => setOrder({ ...order, data_pedido: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={order.status}
                onValueChange={(value) => setOrder({ ...order, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="arquivo_origem">Link/Anexo</Label>
              <Textarea
                id="arquivo_origem"
                value={order.arquivo_origem || ''}
                onChange={(e) => setOrder({ ...order, arquivo_origem: e.target.value })}
                rows={2}
                placeholder="Cole aqui o link ou caminho do arquivo de origem"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={order.observacoes || ''}
                onChange={(e) => setOrder({ ...order, observacoes: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}