import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, DollarSign, ShoppingCart, TrendingUp, BarChart3, PieChart } from 'lucide-react';

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
  fornecedores?: { nome: string };
  marcas?: { nome: string };
}

interface OrderChartsProps {
  orders: OrderData[];
}

export function OrderCharts({ orders }: OrderChartsProps) {
  const statistics = useMemo(() => {
    const totalPedidos = orders.length;
    const totalQuantidade = orders.reduce((sum, order) => sum + order.quantidade, 0);
    const totalValor = orders.reduce((sum, order) => sum + order.valor_total_liquido, 0);
    const valorMedio = totalPedidos > 0 ? totalValor / totalPedidos : 0;

    return {
      totalPedidos,
      totalQuantidade,
      totalValor,
      valorMedio
    };
  }, [orders]);

  const marcaStats = useMemo(() => {
    const marcaMap = new Map<string, { pedidos: number; quantidade: number; valor: number }>();
    
    orders.forEach(order => {
      const marcaNome = order.marcas?.nome || 'Sem marca';
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
  }, [orders]);

  const statusStats = useMemo(() => {
    const statusMap = new Map<string, number>();
    
    orders.forEach(order => {
      const status = order.status || 'Indefinido';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    return Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [orders]);

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

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(statistics.totalPedidos)}</div>
            <p className="text-xs text-muted-foreground">
              Pedidos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantidade Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(statistics.totalQuantidade)}</div>
            <p className="text-xs text-muted-foreground">
              Itens pedidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.totalValor)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total dos pedidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.valorMedio)}</div>
            <p className="text-xs text-muted-foreground">
              Por pedido
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Marcas por Valor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top 10 Marcas por Valor
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

        {/* Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusStats.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado disponível
                </p>
              ) : (
                statusStats.map((item) => {
                  const percentage = statistics.totalPedidos > 0 
                    ? (item.count / statistics.totalPedidos * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status || 'Indefinido'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.count} pedidos</p>
                        <p className="text-sm text-muted-foreground">{percentage}%</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por Marca - Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Detalhado por Marca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Marca</th>
                  <th className="text-right py-2">Pedidos</th>
                  <th className="text-right py-2">Quantidade</th>
                  <th className="text-right py-2">Valor Total</th>
                  <th className="text-right py-2">Valor Médio</th>
                </tr>
              </thead>
              <tbody>
                {marcaStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum dado disponível
                    </td>
                  </tr>
                ) : (
                  marcaStats.map((marca) => (
                    <tr key={marca.nome} className="border-b">
                      <td className="py-2 font-medium">{marca.nome}</td>
                      <td className="py-2 text-right">{formatNumber(marca.pedidos)}</td>
                      <td className="py-2 text-right">{formatNumber(marca.quantidade)}</td>
                      <td className="py-2 text-right font-mono">{formatCurrency(marca.valor)}</td>
                      <td className="py-2 text-right font-mono">
                        {formatCurrency(marca.pedidos > 0 ? marca.valor / marca.pedidos : 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
