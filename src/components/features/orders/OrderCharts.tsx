import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Package, DollarSign, ShoppingCart } from 'lucide-react';

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
  className?: string;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
];

export function OrderCharts({ orders, className }: OrderChartsProps) {
  // Dados agregados por marca
  const brandData = useMemo(() => {
    const brandMap = new Map<string, {
      nome: string;
      quantidade: number;
      valor: number;
      pedidos: number;
    }>();

    orders.forEach(order => {
      const brandName = order.marcas?.nome || 'Sem marca';
      const existing = brandMap.get(brandName) || {
        nome: brandName,
        quantidade: 0,
        valor: 0,
        pedidos: 0
      };

      existing.quantidade += order.quantidade;
      existing.valor += order.valor_total_liquido || 0;
      existing.pedidos += 1;

      brandMap.set(brandName, existing);
    });

    return Array.from(brandMap.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10); // Top 10 marcas
  }, [orders]);

  // Dados por período (últimos 6 meses)
  const periodData = useMemo(() => {
    const periodMap = new Map<string, {
      periodo: string;
      quantidade: number;
      valor: number;
      pedidos: number;
    }>();

    orders.forEach(order => {
      const date = new Date(order.data_pedido);
      const periodo = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      const existing = periodMap.get(periodo) || {
        periodo,
        quantidade: 0,
        valor: 0,
        pedidos: 0
      };

      existing.quantidade += order.quantidade;
      existing.valor += order.valor_total_liquido || 0;
      existing.pedidos += 1;

      periodMap.set(periodo, existing);
    });

    return Array.from(periodMap.values())
      .sort((a, b) => {
        const [monthA, yearA] = a.periodo.split('/').map(Number);
        const [monthB, yearB] = b.periodo.split('/').map(Number);
        return new Date(yearA, monthA - 1).getTime() - new Date(yearB, monthB - 1).getTime();
      })
      .slice(-6); // Últimos 6 meses
  }, [orders]);

  // Dados por status
  const statusData = useMemo(() => {
    const statusMap = new Map<string, number>();
    
    orders.forEach(order => {
      const status = order.status || 'Indefinido';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / orders.length) * 100).toFixed(1)
    }));
  }, [orders]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalQuantidade = orders.reduce((sum, order) => sum + order.quantidade, 0);
    const totalValor = orders.reduce((sum, order) => sum + (order.valor_total_liquido || 0), 0);
    const totalPedidos = orders.length;
    const valorMedio = totalPedidos > 0 ? totalValor / totalPedidos : 0;

    return {
      totalQuantidade,
      totalValor,
      totalPedidos,
      valorMedio
    };
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

  return (
    <div className={className}>
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
                <p className="text-2xl font-bold">{formatNumber(stats.totalPedidos)}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quantidade Total</p>
                <p className="text-2xl font-bold">{formatNumber(stats.totalQuantidade)}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalValor)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.valorMedio)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico por Marca - Valor */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Marcas por Valor</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={brandData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nome" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  labelStyle={{ color: '#000' }}
                />
                <Bar dataKey="valor" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico por Marca - Quantidade */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Marcas por Quantidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={brandData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nome" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => formatNumber(value)}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number) => [formatNumber(value), 'Quantidade']}
                  labelStyle={{ color: '#000' }}
                />
                <Bar dataKey="quantidade" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico por Período */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={periodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" fontSize={12} />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                  labelStyle={{ color: '#000' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Resumo por Marca */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resumo por Marca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Marca</th>
                  <th className="text-right p-2">Pedidos</th>
                  <th className="text-right p-2">Quantidade</th>
                  <th className="text-right p-2">Valor Total</th>
                  <th className="text-right p-2">Valor Médio</th>
                </tr>
              </thead>
              <tbody>
                {brandData.map((brand, index) => (
                  <tr key={brand.nome} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{brand.nome}</td>
                    <td className="p-2 text-right">{formatNumber(brand.pedidos)}</td>
                    <td className="p-2 text-right">{formatNumber(brand.quantidade)}</td>
                    <td className="p-2 text-right">{formatCurrency(brand.valor)}</td>
                    <td className="p-2 text-right">
                      {formatCurrency(brand.pedidos > 0 ? brand.valor / brand.pedidos : 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
