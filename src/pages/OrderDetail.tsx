import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OrderDetailData {
  id: string;
  referencia: string;
  descricao: string | null;
  quantidade: number;
  quantidade_referencias: number | null;
  valor_total_bruto: number | null;
  tipo_desconto: string | null;
  desconto_valor: number | null;
  desconto_porcentagem: number | null;
  valor_total_liquido: number | null;
  valor_medio_peca: number | null;
  data_pedido: string | null;
  status: string;
  representante_nome: string | null;
  representante_telefone: string | null;
  representante_email: string | null;
  fornecedores?: {
    nome: string;
  };
  marcas?: {
    nome: string;
  };
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos_produtos')
        .select(`
          *,
          fornecedores(nome),
          marcas(nome)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar pedido:', error);
        toast.error('Erro ao carregar dados do pedido');
        return;
      }

      if (!data) {
        toast.error('Pedido não encontrado');
        navigate('/orders');
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro inesperado ao carregar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!order || !window.confirm('Tem certeza que deseja excluir este pedido?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pedidos_produtos')
        .delete()
        .eq('id', order.id);

      if (error) {
        console.error('Erro ao excluir pedido:', error);
        toast.error('Erro ao excluir pedido');
        return;
      }

      toast.success('Pedido excluído com sucesso');
      navigate('/orders');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro inesperado ao excluir pedido');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendente':
        return 'default';
      case 'confirmado':
        return 'secondary';
      case 'entregue':
        return 'default';
      case 'cancelado':
        return 'destructive';
      default:
        return 'default';
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

  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Pedido não encontrado</h2>
          <Button onClick={() => navigate('/orders')}>
            Voltar para Lista de Pedidos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Detalhes do Pedido</h1>
            <p className="text-muted-foreground">Pedido #{order.referencia}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate(`/orders/${order.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Número do Pedido</Label>
              <p className="font-medium">{order.referencia}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
              <p className="font-medium">{order.descricao || 'Não informado'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Fornecedor</Label>
              <p className="font-medium">{order.fornecedores?.nome || 'Não informado'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Marca</Label>
              <p className="font-medium">{order.marcas?.nome || 'Não informado'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quantities and Values */}
        <Card>
          <CardHeader>
            <CardTitle>Quantidades e Valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Quantidade Total</Label>
              <p className="font-medium">{order.quantidade?.toLocaleString('pt-BR') || 0}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Quantidade de Referências</Label>
              <p className="font-medium">{order.quantidade_referencias?.toLocaleString('pt-BR') || 0}</p>
            </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Valor Total Bruto</Label>
              <p className="font-medium text-lg">{formatCurrency(order.valor_total_bruto || 0)}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Desconto</Label>
              <p className="font-medium">
                {order.tipo_desconto === 'valor' 
                  ? formatCurrency(order.desconto_valor || 0)
                  : `${order.desconto_porcentagem || 0}%`
                }
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Valor Total Líquido</Label>
              <p className="font-medium text-lg text-primary">{formatCurrency(order.valor_total_liquido || 0)}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Valor Médio por Peça</Label>
              <p className="font-medium">{formatCurrency(order.valor_medio_peca || 0)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Datas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.data_pedido && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Data do Pedido</Label>
                <p className="font-medium">{formatDate(order.data_pedido)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Representative Data */}
        {(order.representante_nome || order.representante_telefone || order.representante_email) && (
          <Card>
            <CardHeader>
              <CardTitle>Dados do Representante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.representante_nome && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                  <p className="font-medium">{order.representante_nome}</p>
                </div>
              )}
              
              {order.representante_telefone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                  <p className="font-medium">{order.representante_telefone}</p>
                </div>
              )}
              
              {order.representante_email && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="font-medium">{order.representante_email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}