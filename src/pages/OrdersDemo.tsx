import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Package, DollarSign, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Dados de exemplo baseados nos seus CSVs
const DADOS_EXEMPLO = {
  pedidos: [
    {
      id: '1',
      referencia: 'WC05T4',
      descricao: 'Camiseta Infantil PULLA BULLA Verão',
      fornecedor_id: '1',
      marca_id: '1',
      quantidade: 50,
      custo_unitario: 25.90,
      valor_total_liquido: 1295.00,
      data_pedido: '2025-09-20',
      status: 'pendente'
    },
    {
      id: '2',
      referencia: 'MEL1',
      descricao: 'Conjunto BIBI Infantil Rosa',
      fornecedor_id: '2',
      marca_id: '2',
      quantidade: 30,
      custo_unitario: 45.50,
      valor_total_liquido: 1365.00,
      data_pedido: '2025-09-19',
      status: 'processando'
    },
    {
      id: '3',
      referencia: '911',
      descricao: 'Bermuda RESERVA Kids Verde',
      fornecedor_id: '3',
      marca_id: '3',
      quantidade: 25,
      custo_unitario: 38.90,
      valor_total_liquido: 972.50,
      data_pedido: '2025-09-18',
      status: 'enviado'
    },
    {
      id: '4',
      referencia: '3394',
      descricao: 'Vestido BIMBI Festa Branco',
      fornecedor_id: '4',
      marca_id: '4',
      quantidade: 20,
      custo_unitario: 89.90,
      valor_total_liquido: 1798.00,
      data_pedido: '2025-09-17',
      status: 'entregue'
    },
    {
      id: '5',
      referencia: '24260',
      descricao: 'Tênis DIVERSÃO Sport Preto',
      fornecedor_id: '5',
      marca_id: '5',
      quantidade: 40,
      custo_unitario: 65.00,
      valor_total_liquido: 2600.00,
      data_pedido: '2025-09-16',
      status: 'pendente'
    },
    {
      id: '6',
      referencia: '9717',
      descricao: 'Calça Jeans LILICA RIPILICA',
      fornecedor_id: '1',
      marca_id: '6',
      quantidade: 35,
      custo_unitario: 58.50,
      valor_total_liquido: 2047.50,
      data_pedido: '2025-09-15',
      status: 'processando'
    },
    {
      id: '7',
      referencia: '659520',
      descricao: 'Blusa TIGOR T. TIGRE Azul',
      fornecedor_id: '2',
      marca_id: '7',
      quantidade: 45,
      custo_unitario: 42.90,
      valor_total_liquido: 1930.50,
      data_pedido: '2025-09-14',
      status: 'enviado'
    },
    {
      id: '8',
      referencia: 'LUP1',
      descricao: 'Shorts KYLY Verão Colorido',
      fornecedor_id: '3',
      marca_id: '8',
      quantidade: 60,
      custo_unitario: 28.90,
      valor_total_liquido: 1734.00,
      data_pedido: '2025-09-13',
      status: 'entregue'
    }
  ],
  marcas: [
    { id: '1', nome: 'PULLA BULLA' },
    { id: '2', nome: 'BIBI' },
    { id: '3', nome: 'RESERVA' },
    { id: '4', nome: 'BIMBI' },
    { id: '5', nome: 'DIVERSÃO' },
    { id: '6', nome: 'LILICA RIPILICA' },
    { id: '7', nome: 'TIGOR T. TIGRE' },
    { id: '8', nome: 'KYLY' }
  ],
  fornecedores: [
    { id: '1', nome: 'DISTRIBUIDORA BAMBINI LTDA' },
    { id: '2', nome: 'COMERCIAL KIDS FASHION' },
    { id: '3', nome: 'ATACADO INFANTIL BRASIL' },
    { id: '4', nome: 'MODA KIDS DISTRIBUIDORA' },
    { id: '5', nome: 'FASHION BABY ATACADO' }
  ]
};

export default function OrdersDemo() {
  const navigate = useNavigate();
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedFornecedor, setSelectedFornecedor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtrar pedidos
  const filteredOrders = useMemo(() => {
    return DADOS_EXEMPLO.pedidos.filter(order => {
      const matchesSearch = !searchTerm || 
        order.referencia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMarca = !selectedMarca || order.marca_id === selectedMarca;
      const matchesFornecedor = !selectedFornecedor || order.fornecedor_id === selectedFornecedor;
      const matchesStatus = !selectedStatus || order.status === selectedStatus;
      
      const matchesDateRange = (!startDate || order.data_pedido >= startDate) &&
                              (!endDate || order.data_pedido <= endDate);
      
      return matchesSearch && matchesMarca && matchesFornecedor && matchesStatus && matchesDateRange;
    });
  }, [searchTerm, selectedMarca, selectedFornecedor, selectedStatus, startDate, endDate]);

  // Estatísticas
  const statistics = useMemo(() => {
    const totalPedidos = filteredOrders.length;
    const totalQuantidade = filteredOrders.reduce((sum, order) => sum + order.quantidade, 0);
    const totalValor = filteredOrders.reduce((sum, order) => sum + order.valor_total_liquido, 0);
    const valorMedio = totalPedidos > 0 ? totalValor / totalPedidos : 0;

    return { totalPedidos, totalQuantidade, totalValor, valorMedio };
  }, [filteredOrders]);

  // Top marcas
  const marcaStats = useMemo(() => {
    const marcaMap = new Map();
    
    filteredOrders.forEach(order => {
      const marca = DADOS_EXEMPLO.marcas.find(m => m.id === order.marca_id);
      const marcaNome = marca?.nome || 'Sem marca';
      const existing = marcaMap.get(marcaNome) || { pedidos: 0, quantidade: 0, valor: 0 };
      
      marcaMap.set(marcaNome, {
        pedidos: existing.pedidos + 1,
        quantidade: existing.quantidade + order.quantidade,
        valor: existing.valor + order.valor_total_liquido
      });
    });

    return Array.from(marcaMap.entries())
      .map(([nome, stats]) => ({ nome, ...stats }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [filteredOrders]);

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
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
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

  const getMarcaNome = (marcaId: string) => {
    return DADOS_EXEMPLO.marcas.find(m => m.id === marcaId)?.nome || 'N/A';
  };

  const getFornecedorNome = (fornecedorId: string) => {
    return DADOS_EXEMPLO.fornecedores.find(f => f.id === fornecedorId)?.nome || 'N/A';
  };

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
            <h1 className="text-2xl font-bold">Pedidos (Demo com Dados Reais)</h1>
            <p className="text-muted-foreground">
              {filteredOrders.length} pedidos encontrados • Total: {formatCurrency(statistics.totalValor)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate('/orders')}>
            Ver Versão Real
          </Button>
          <Button>
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
                    placeholder="Referência, descrição..."
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
                    {DADOS_EXEMPLO.marcas.map(marca => (
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
                    {DADOS_EXEMPLO.fornecedores.map(fornecedor => (
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
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Referência</th>
                          <th className="text-left p-2">Descrição</th>
                          <th className="text-left p-2">Fornecedor</th>
                          <th className="text-left p-2">Marca</th>
                          <th className="text-left p-2">Qtd</th>
                          <th className="text-left p-2">Valor Total</th>
                          <th className="text-left p-2">Data</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{order.referencia}</td>
                            <td className="p-2">{order.descricao}</td>
                            <td className="p-2">{getFornecedorNome(order.fornecedor_id)}</td>
                            <td className="p-2">{getMarcaNome(order.marca_id)}</td>
                            <td className="p-2">{formatNumber(order.quantidade)}</td>
                            <td className="p-2">{formatCurrency(order.valor_total_liquido)}</td>
                            <td className="p-2">{new Date(order.data_pedido).toLocaleDateString('pt-BR')}</td>
                            <td className="p-2">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalPedidos}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quantidade Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(statistics.totalQuantidade)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistics.totalValor)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistics.valorMedio)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Marcas */}
          <Card>
            <CardHeader>
              <CardTitle>Top Marcas por Valor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marcaStats.map((marca, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{marca.nome}</p>
                        <p className="text-sm text-gray-500">
                          {marca.pedidos} pedidos • {formatNumber(marca.quantidade)} itens
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(marca.valor)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
