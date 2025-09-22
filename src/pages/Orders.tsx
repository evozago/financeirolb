import React, { useState, useMemo, useEffect } from 'react';
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

interface OrderData {
  id: string;
  referencia: string;
  numero_pedido?: string;
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
  created_at?: string;
  // Relations - podem não existir
  fornecedores?: { nome: string } | null;
  marcas?: { nome: string } | null;
}

export default function Orders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados para dados
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [marcas, setMarcas] = useState<Array<{id: string, nome: string}>>([]);
  const [fornecedores, setFornecedores] = useState<Array<{id: string, nome: string}>>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedFornecedor, setSelectedFornecedor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Estados para ordenação
  const [sortField, setSortField] = useState<keyof OrderData>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Carregar dados do banco
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('Carregando pedidos...');
      
      // Primeiro, tentar carregar pedidos sem relacionamentos para testar
      const { data: ordersData, error: ordersError } = await supabase
        .from('pedidos_produtos')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Resultado pedidos:', { ordersData, ordersError });

      if (ordersError) {
        console.error('Erro ao carregar pedidos:', ordersError);
        toast({
          title: "Erro ao carregar pedidos",
          description: ordersError.message,
          variant: "destructive",
        });
        setOrders([]);
      } else {
        // Processar dados reais
        const processedOrders = ordersData?.map(order => ({
          ...order,
          // Usar numero_pedido se existir, senão usar referencia, senão criar um
          referencia: order.numero_pedido || order.referencia || `PED-${order.id?.slice(0, 8)}`,
          // Garantir que data_pedido existe
          data_pedido: order.data_pedido || order.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          // Status padrão se não existir
          status: order.status || 'pendente',
          // Valores calculados se não existirem
          valor_total_bruto: order.valor_total_bruto || (order.quantidade * order.custo_unitario),
          valor_total_liquido: order.valor_total_liquido || order.valor_total_bruto || (order.quantidade * order.custo_unitario),
          valor_medio_peca: order.valor_medio_peca || (order.valor_total_liquido / order.quantidade) || order.custo_unitario,
          // Valores padrão para campos obrigatórios
          quantidade: order.quantidade || 0,
          custo_unitario: order.custo_unitario || 0,
          descricao: order.descricao || 'Sem descrição'
        })) || [];
        
        console.log('Pedidos processados:', processedOrders.length);
        setOrders(processedOrders);

        // Agora tentar carregar os nomes de fornecedores e marcas separadamente
        if (processedOrders.length > 0) {
          try {
            // Buscar fornecedores
            const fornecedorIds = [...new Set(processedOrders.map(o => o.fornecedor_id).filter(Boolean))];
            if (fornecedorIds.length > 0) {
              const { data: fornecedoresData } = await supabase
                .from('fornecedores')
                .select('id, nome')
                .in('id', fornecedorIds);
              
              if (fornecedoresData) {
                // Mapear nomes dos fornecedores
                const fornecedorMap = new Map(fornecedoresData.map(f => [f.id, f.nome]));
                setOrders(prev => prev.map(order => ({
                  ...order,
                  fornecedores: order.fornecedor_id ? { nome: fornecedorMap.get(order.fornecedor_id) || 'N/A' } : null
                })));
              }
            }

            // Buscar marcas
            const marcaIds = [...new Set(processedOrders.map(o => o.marca_id).filter(Boolean))];
            if (marcaIds.length > 0) {
              const { data: marcasData } = await supabase
                .from('marcas')
                .select('id, nome')
                .in('id', marcaIds);
              
              if (marcasData) {
                // Mapear nomes das marcas
                const marcaMap = new Map(marcasData.map(m => [m.id, m.nome]));
                setOrders(prev => prev.map(order => ({
                  ...order,
                  marcas: order.marca_id ? { nome: marcaMap.get(order.marca_id) || 'N/A' } : null
                })));
              }
            }
          } catch (relationError) {
            console.error('Erro ao carregar relacionamentos:', relationError);
            // Continuar mesmo se os relacionamentos falharem
          }
        }
      }

      // Carregar marcas para filtros
      try {
        console.log('Carregando marcas...');
        const { data: marcasData, error: marcasError } = await supabase
          .from('marcas')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome');
        
        console.log('Marcas carregadas:', marcasData?.length, marcasError);
        setMarcas(marcasData || []);
      } catch (error) {
        console.error('Erro ao carregar marcas:', error);
        setMarcas([]);
      }

      // Carregar fornecedores para filtros
      try {
        console.log('Carregando fornecedores...');
        const { data: fornecedoresData, error: fornecedoresError } = await supabase
          .from('fornecedores')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome');
        
        console.log('Fornecedores carregados:', fornecedoresData?.length, fornecedoresError);
        setFornecedores(fornecedoresData || []);
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        setFornecedores([]);
      }

    } catch (error) {
      console.error('Erro geral ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Verifique a conexão e tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar e ordenar pedidos
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const matchesSearch = !searchTerm || 
        order.referencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.fornecedores?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.marcas?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMarca = !selectedMarca || order.marca_id === selectedMarca;
      const matchesFornecedor = !selectedFornecedor || order.fornecedor_id === selectedFornecedor;
      const matchesStatus = !selectedStatus || order.status === selectedStatus;
      
      const matchesDateRange = (!startDate || order.data_pedido >= startDate) &&
                              (!endDate || order.data_pedido <= endDate);
      
      return matchesSearch && matchesMarca && matchesFornecedor && matchesStatus && matchesDateRange;
    });

    // Ordenar
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [orders, searchTerm, selectedMarca, selectedFornecedor, selectedStatus, startDate, endDate, sortField, sortDirection]);

  // Estatísticas
  const statistics = useMemo(() => {
    const totalPedidos = filteredAndSortedOrders.length;
    const totalQuantidade = filteredAndSortedOrders.reduce((sum, order) => sum + (order.quantidade || 0), 0);
    const totalValor = filteredAndSortedOrders.reduce((sum, order) => sum + (order.valor_total_liquido || 0), 0);
    const valorMedio = totalPedidos > 0 ? totalValor / totalPedidos : 0;

    return { totalPedidos, totalQuantidade, totalValor, valorMedio };
  }, [filteredAndSortedOrders]);

  // Estatísticas por marca
  const marcaStats = useMemo(() => {
    const marcaMap = new Map<string, { pedidos: number; quantidade: number; valor: number }>();
    
    filteredAndSortedOrders.forEach(order => {
      const marcaNome = order.marcas?.nome || 'Sem marca';
      const existing = marcaMap.get(marcaNome) || { pedidos: 0, quantidade: 0, valor: 0 };
      
      marcaMap.set(marcaNome, {
        pedidos: existing.pedidos + 1,
        quantidade: existing.quantidade + (order.quantidade || 0),
        valor: existing.valor + (order.valor_total_liquido || 0)
      });
    });

    return Array.from(marcaMap.entries())
      .map(([nome, stats]) => ({ nome, ...stats }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [filteredAndSortedOrders]);

  const handleSort = (field: keyof OrderData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMarca('');
    setSelectedFornecedor('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pendente': 'bg-yellow-100 text-yellow-800',
      'processando': 'bg-blue-100 text-blue-800',
      'enviado': 'bg-purple-100 text-purple-800',
      'entregue': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSortIcon = (field: keyof OrderData) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pedidos</h1>
            <p className="text-muted-foreground">
              {filteredAndSortedOrders.length} pedidos encontrados
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

      <Tabs defaultValue="lista" className="space-y-6">
        <TabsList>
          <TabsTrigger value="lista">Lista de Pedidos</TabsTrigger>
          <TabsTrigger value="analises">Análises e Gráficos</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filtros */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Buscar</label>
                  <Input
                    placeholder="Referência, descrição, fornecedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Período</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Marca</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedMarca}
                    onChange={(e) => setSelectedMarca(e.target.value)}
                  >
                    <option value="">Todas as marcas</option>
                    {marcas.map(marca => (
                      <option key={marca.id} value={marca.id}>{marca.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Fornecedor</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedFornecedor}
                    onChange={(e) => setSelectedFornecedor(e.target.value)}
                  >
                    <option value="">Todos os fornecedores</option>
                    {fornecedores.map(fornecedor => (
                      <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">Todos os status</option>
                    <option value="pendente">Pendente</option>
                    <option value="processando">Processando</option>
                    <option value="enviado">Enviado</option>
                    <option value="entregue">Entregue</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Pedidos */}
            <div className="lg:col-span-3 space-y-4">
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
                            className="cursor-pointer"
                            onClick={() => handleSort('referencia')}
                          >
                            <div className="flex items-center gap-2">
                              Referência
                              {getSortIcon('referencia')}
                            </div>
                          </TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>Marca</TableHead>
                          <TableHead 
                            className="cursor-pointer text-right"
                            onClick={() => handleSort('quantidade')}
                          >
                            <div className="flex items-center justify-end gap-2">
                              Qtd
                              {getSortIcon('quantidade')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer text-right"
                            onClick={() => handleSort('valor_total_liquido')}
                          >
                            <div className="flex items-center justify-end gap-2">
                              Valor Total
                              {getSortIcon('valor_total_liquido')}
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer"
                            onClick={() => handleSort('data_pedido')}
                          >
                            <div className="flex items-center gap-2">
                              Data
                              {getSortIcon('data_pedido')}
                            </div>
                          </TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              {loading ? 'Carregando pedidos...' : 'Nenhum pedido encontrado'}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAndSortedOrders.map((order) => (
                            <TableRow 
                              key={order.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <TableCell className="font-medium">{order.referencia}</TableCell>
                              <TableCell>{order.descricao}</TableCell>
                              <TableCell>{order.fornecedores?.nome || 'N/A'}</TableCell>
                              <TableCell>{order.marcas?.nome || 'N/A'}</TableCell>
                              <TableCell className="text-right">{formatNumber(order.quantidade)}</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(order.valor_total_liquido)}
                              </TableCell>
                              <TableCell>
                                {new Date(order.data_pedido).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status}
                                </Badge>
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

        <TabsContent value="analises" className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statistics.totalPedidos)}</div>
                <p className="text-xs text-muted-foreground">Pedidos registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quantidade Total</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statistics.totalQuantidade)}</div>
                <p className="text-xs text-muted-foreground">Itens pedidos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistics.totalValor)}</div>
                <p className="text-xs text-muted-foreground">Valor total dos pedidos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistics.valorMedio)}</div>
                <p className="text-xs text-muted-foreground">Por pedido</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Marcas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top Marcas por Valor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marcaStats.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum dado disponível
                  </p>
                ) : (
                  marcaStats.map((marca, index) => (
                    <div key={marca.nome} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{marca.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {marca.pedidos} pedidos • {formatNumber(marca.quantidade)} itens
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(marca.valor)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
