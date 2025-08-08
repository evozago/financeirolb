import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, ShoppingCart, FileText, ArrowUpDown, ArrowUp, ArrowDown, Package, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderData {
  id: string;
  referencia: string;
  descricao: string;
  fornecedor_id: string;
  marca_id: string;
  quantidade: number;
  custo_unitario: number;
  valor_total_bruto: number;
  valor_total_liquido: number;
  valor_medio_peca: number;
  data_pedido: string;
  status: string;
  observacoes: string;
  arquivo_origem: string;
  // Relations
  fornecedores?: { nome: string };
  marcas?: { nome: string };
}

type SortField = 'referencia' | 'fornecedor' | 'marca' | 'quantidade' | 'custo_unitario' | 'valor_total' | 'data_pedido' | 'status';
type SortDirection = 'asc' | 'desc';

export default function Orders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('data_pedido');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos_produtos')
        .select(`
          *,
          fornecedores:fornecedor_id(nome),
          marcas:marca_id(nome)
        `)
        .order('data_pedido', { ascending: false });

      if (error) {
        console.error('Error loading orders:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar pedidos",
          variant: "destructive",
        });
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = orders.filter(order =>
        order.referencia.toLowerCase().includes(searchLower) ||
        order.descricao?.toLowerCase().includes(searchLower) ||
        order.fornecedores?.nome.toLowerCase().includes(searchLower) ||
        order.marcas?.nome.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar ordenação
    return filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'referencia':
          aValue = a.referencia;
          bValue = b.referencia;
          break;
        case 'fornecedor':
          aValue = a.fornecedores?.nome || '';
          bValue = b.fornecedores?.nome || '';
          break;
        case 'marca':
          aValue = a.marcas?.nome || '';
          bValue = b.marcas?.nome || '';
          break;
        case 'quantidade':
          aValue = a.quantidade;
          bValue = b.quantidade;
          break;
        case 'custo_unitario':
          aValue = a.custo_unitario || a.valor_medio_peca || 0;
          bValue = b.custo_unitario || b.valor_medio_peca || 0;
          break;
        case 'valor_total':
          aValue = a.valor_total_liquido || a.valor_total_bruto || (a.custo_unitario * a.quantidade) || 0;
          bValue = b.valor_total_liquido || b.valor_total_bruto || (b.custo_unitario * b.quantidade) || 0;
          break;
        case 'data_pedido':
          aValue = new Date(a.data_pedido || 0);
          bValue = new Date(b.data_pedido || 0);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [search, orders, sortField, sortDirection]);

  // Calcular totalizadores
  const totals = useMemo(() => {
    const totalPecas = filteredOrders.reduce((sum, order) => sum + order.quantidade, 0);
    const totalValor = filteredOrders.reduce((sum, order) => {
      const valor = order.valor_total_liquido || order.valor_total_bruto || (order.custo_unitario * order.quantidade) || 0;
      return sum + valor;
    }, 0);
    
    return {
      totalPecas,
      totalValor,
      totalPedidos: filteredOrders.length
    };
  }, [filteredOrders]);

  const handleRowClick = (order: OrderData) => {
    navigate(`/orders/${order.id}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'default';
      case 'enviado': return 'secondary';
      case 'recebido': return 'outline';
      default: return 'default';
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
                <p className="text-muted-foreground">
                  {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''} encontrado{filteredOrders.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate('/orders/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Dashboard - Totalizadores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
                    <p className="text-2xl font-bold">{totals.totalPedidos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Package className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Peças</p>
                    <p className="text-2xl font-bold">{totals.totalPecas.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(totals.totalValor)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Busca */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por referência, descrição, fornecedor ou marca..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Pedidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Lista de Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-semibold"
                            onClick={() => handleSort('referencia')}
                          >
                            Referência {getSortIcon('referencia')}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-semibold"
                            onClick={() => handleSort('fornecedor')}
                          >
                            Fornecedor {getSortIcon('fornecedor')}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-semibold"
                            onClick={() => handleSort('marca')}
                          >
                            Marca {getSortIcon('marca')}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-semibold"
                            onClick={() => handleSort('quantidade')}
                          >
                            Quantidade {getSortIcon('quantidade')}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-semibold"
                            onClick={() => handleSort('custo_unitario')}
                          >
                            Valor Unit. {getSortIcon('custo_unitario')}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-semibold"
                            onClick={() => handleSort('valor_total')}
                          >
                            Total {getSortIcon('valor_total')}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-semibold"
                            onClick={() => handleSort('data_pedido')}
                          >
                            Data {getSortIcon('data_pedido')}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 font-semibold"
                            onClick={() => handleSort('status')}
                          >
                            Status {getSortIcon('status')}
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-12 w-12 text-muted-foreground/50" />
                            <p>Nenhum pedido encontrado</p>
                            {search && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSearch('')}
                              >
                                Limpar busca
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(order)}
                        >
                          <TableCell className="font-medium">{order.referencia}</TableCell>
                          <TableCell>{order.fornecedores?.nome || '-'}</TableCell>
                          <TableCell>{order.marcas?.nome || '-'}</TableCell>
                          <TableCell>{order.quantidade}</TableCell>
                          <TableCell>{formatCurrency(order.custo_unitario || order.valor_medio_peca || 0)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(order.valor_total_liquido || order.valor_total_bruto || (order.custo_unitario * order.quantidade) || 0)}
                          </TableCell>
                          <TableCell>
                            {order.data_pedido ? new Date(order.data_pedido).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(order);
                              }}
                            >
                              Ver Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}