import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, TrendingUp, Users, DollarSign, Target } from "lucide-react";

interface SalesData {
  id: string;
  vendedora_id: string;
  data_venda: string;
  valor_venda: number;
  forma_pagamento?: string;
  cliente_nome?: string;
  observacoes?: string;
}

interface SalesStats {
  totalVendas: number;
  totalValor: number;
  mediaVenda: number;
  vendasMes: number;
}

export default function SalesManagementFixed() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    totalVendas: 0,
    totalValor: 0,
    mediaVenda: 0,
    vendasMes: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      
      const { data: vendas, error } = await supabase
        .from('vendas')
        .select('*')
        .order('data_venda', { ascending: false });

      if (error) {
        console.error('Erro ao buscar vendas:', error);
        toast({
          title: "Erro ao carregar vendas",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setSalesData(vendas || []);
      
      // Calcular estatísticas
      const totalVendas = vendas?.length || 0;
      const totalValor = vendas?.reduce((sum, venda) => sum + parseFloat(venda.valor_venda || '0'), 0) || 0;
      const mediaVenda = totalVendas > 0 ? totalValor / totalVendas : 0;
      
      // Vendas do mês atual
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const vendasMes = vendas?.filter(venda => {
        const vendaDate = new Date(venda.data_venda);
        return vendaDate.getMonth() === currentMonth && vendaDate.getFullYear() === currentYear;
      }).length || 0;

      setStats({
        totalVendas,
        totalValor,
        mediaVenda,
        vendasMes
      });

    } catch (error) {
      console.error('Erro ao buscar dados de vendas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de vendas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Vendas</h1>
          <p className="text-muted-foreground">
            Sistema interativo de gestão e análise de vendas
          </p>
        </div>
        <Button onClick={fetchSalesData} size="lg" className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          💾 ATUALIZAR DADOS
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVendas}</div>
            <p className="text-xs text-muted-foreground">
              vendas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValor)}</div>
            <p className="text-xs text-muted-foreground">
              em vendas realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.mediaVenda)}</div>
            <p className="text-xs text-muted-foreground">
              valor médio por venda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vendasMes}</div>
            <p className="text-xs text-muted-foreground">
              vendas no mês atual
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vendas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vendas">Lista de Vendas</TabsTrigger>
          <TabsTrigger value="analises">Análises</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendas Registradas</CardTitle>
            </CardHeader>
            <CardContent>
              {salesData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma venda encontrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Forma de Pagamento</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.map((venda) => (
                        <TableRow key={venda.id}>
                          <TableCell>{formatDate(venda.data_venda)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(parseFloat(venda.valor_venda.toString()))}
                          </TableCell>
                          <TableCell>{venda.cliente_nome || 'N/A'}</TableCell>
                          <TableCell>{venda.forma_pagamento || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="default">Concluída</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analises" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análises de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Performance Geral</h3>
                    <p className="text-sm text-muted-foreground">
                      Total de {stats.totalVendas} vendas realizadas com valor médio de {formatCurrency(stats.mediaVenda)}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Mês Atual</h3>
                    <p className="text-sm text-muted-foreground">
                      {stats.vendasMes} vendas realizadas no mês atual
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Funcionalidade de relatórios em desenvolvimento.
                </p>
                <Button variant="outline" onClick={fetchSalesData}>
                  Gerar Relatório
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
