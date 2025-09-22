import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, ShoppingCart, FileText, ArrowUpDown, ArrowUp, ArrowDown, Package, DollarSign, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImportExportModal } from '@/components/features/orders/ImportExportModal';
import { OrderFilters } from '@/components/features/orders/OrderFilters';
import { OrderCharts } from '@/components/features/orders/OrderCharts';

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

interface FilterOptions {
  search: string;
  startDate: string;
  endDate: string;
  marca: string;
  fornecedor: string;
  status: string;
}

type SortField = 'referencia' | 'fornecedor' | 'marca' | 'quantidade' | 'custo_unitario' | 'valor_total' | 'data_pedido' | 'status';
type SortDirection = 'asc' | 'desc';

export default function Orders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados principais
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('data_pedido');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Estados de filtros
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    startDate: '',
    endDate: '',
    marca: '',
    fornecedor: '',
    status: ''
  });

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

  // Aplicar filtros
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    // Filtro de busca por texto
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(order =>
        order.referencia.toLowerCase().includes(searchLower) ||
        order.descricao?.toLowerCase().includes(searchLower) ||
        order.fornecedores?.nome.toLowerCase().includes(searchLower) ||
        order.marcas?.nome.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por data inicial
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.data_pedido);
        return orderDate >= startDate;
      });
    }

    // Filtro por data final
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.data_pedido);
        return orderDate <= endDate;
      });
    }

    // Filtro por marca
    if (filters.marca) {
      filtered = filtered.filter(order => order.marca_id === filters.marca);
    }

    // Filtro por fornecedor
    if (filters.fornecedor) {
      filtered = filtered.filter(order => order.fornecedor_id === filters.fornecedor);
    }

    // Filtro por status
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
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
          aValue = a.custo_unitario;
          bValue = b.custo_unitario;
          break;
        case 'valor_total':
          aValue = a.valor_total_liquido;
          bValue = b.valor_total_liquido;
          break;
        case 'data_pedido':
          aValue = new Date(a.data_pedido);
          bValue = new Date(b.data_pedido);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.referencia;
          bValue = b.referencia;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, filters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendente': { variant: 'secondary' as const, label: 'Pendente' },
      'processando': { variant: 'default' as const, label: 'Processando' },
      'enviado': { variant: 'outline' as const, label: 'Enviado' },
      'entregue': { variant: 'default' as const, label: 'Entregue' },
      'cancelado': { variant: 'destructive' as const, label: 'Cancelado' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { variant: 'secondary' as const, label: status || 'Indefinido' };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
                  <p className="text-muted-foreground">
                    {filteredOrders.length} de {orders.length} pedidos
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ImportExportModal onImportComplete={loadOrders} />
              <Button onClick={() => navigate('/orders/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Lista de Pedidos
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análises e Gráficos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Filtros */}
              <div className="lg:col-span-1">
                <OrderFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>

              {/* Lista de Pedidos */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Pedidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('referencia')}
                            >
                              <div className="flex items-center gap-2">
                                Referência
                                {getSortIcon('referencia')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('fornecedor')}
                            >
                              <div className="flex items-center gap-2">
                                Fornecedor
                                {getSortIcon('fornecedor')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('marca')}
                            >
                              <div className="flex items-center gap-2">
                                Marca
                                {getSortIcon('marca')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50 text-right"
                              onClick={() => handleSort('quantidade')}
                            >
                              <div className="flex items-center gap-2 justify-end">
                                Qtd
                                {getSortIcon('quantidade')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50 text-right"
                              onClick={() => handleSort('custo_unitario')}
                            >
                              <div className="flex items-center gap-2 justify-end">
                                Custo Unit.
                                {getSortIcon('custo_unitario')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50 text-right"
                              onClick={() => handleSort('valor_total')}
                            >
                              <div className="flex items-center gap-2 justify-end">
                                Valor Total
                                {getSortIcon('valor_total')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('data_pedido')}
                            >
                              <div className="flex items-center gap-2">
                                Data
                                {getSortIcon('data_pedido')}
                              </div>
                            </TableHead>
                            <TableHead 
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort('status')}
                            >
                              <div className="flex items-center gap-2">
                                Status
                                {getSortIcon('status')}
                              </div>
                            </TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                  <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
                                  <p>Nenhum pedido encontrado</p>
                                  {(filters.search || filters.startDate || filters.endDate || filters.marca || filters.fornecedor || filters.status) && (
                                    <p className="text-sm">Tente ajustar os filtros</p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredOrders.map((order) => (
                              <TableRow
                                key={order.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                <TableCell className="font-medium">{order.referencia}</TableCell>
                                <TableCell>{order.fornecedores?.nome || '-'}</TableCell>
                                <TableCell>{order.marcas?.nome || '-'}</TableCell>
                                <TableCell className="text-right">{order.quantidade.toLocaleString('pt-BR')}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(order.custo_unitario)}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(order.valor_total_liquido)}</TableCell>
                                <TableCell>{formatDate(order.data_pedido)}</TableCell>
                                <TableCell>{getStatusBadge(order.status)}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/orders/${order.id}`);
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
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <OrderCharts orders={filteredOrders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
