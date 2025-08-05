/**
 * Página de detalhes do fornecedor (Nível 3 - Drill Down)
 * Exibe informações completas do fornecedor e suas contas
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, FileText, Calendar, DollarSign, MapPin, Phone, Mail, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillToPayInstallment, Supplier } from '@/types/payables';

// Mock data - substituir por dados reais da API
const mockSuppliers: Supplier[] = [
  { 
    id: 'sup1', 
    name: 'KYLY INDUSTRIA TEXTIL LTDA', 
    legalName: 'KYLY INDUSTRIA TEXTIL LTDA', 
    cnpj: '12.345.678/0001-90',
    brandId: 'brand1'
  },
  { 
    id: 'sup2', 
    name: 'CONFECCOES ACUCENA LTDA', 
    legalName: 'CONFECCOES ACUCENA LTDA', 
    cnpj: '98.765.432/0001-10',
    brandId: 'brand2'
  },
  { 
    id: 'sup3', 
    name: 'PIMPOLHO PRODUTOS INFANTIS LTDA', 
    legalName: 'PIMPOLHO PRODUTOS INFANTIS LTDA', 
    cnpj: '11.222.333/0001-44',
    brandId: 'brand3'
  },
  { 
    id: 'sup4', 
    name: 'ABRANGE IND E COM CONF LTDA', 
    legalName: 'ABRANGE IND E COM CONF LTDA', 
    cnpj: '55.666.777/0001-88',
    brandId: 'brand4'
  },
];

// Mock contas do fornecedor
const mockSupplierBills: BillToPayInstallment[] = [
  {
    id: '1',
    installmentNumber: 1,
    amount: 2120.22,
    dueDate: '2024-08-01',
    status: 'Vencido',
    billId: 'bill1',
    bill: {
      id: 'bill1',
      description: 'NFe 3095349 - Parcela 001',
      totalAmount: 2120.22,
      totalInstallments: 6,
      createdAt: '2024-07-01',
      updatedAt: '2024-07-01',
      supplierId: 'sup1',
      userId: 'user1',
      supplier: mockSuppliers[0],
      installments: [],
    },
  },
  {
    id: '5',
    installmentNumber: 2,
    amount: 2120.22,
    dueDate: '2024-09-01',
    status: 'Pendente',
    billId: 'bill1',
    bill: {
      id: 'bill1',
      description: 'NFe 3095349 - Parcela 002',
      totalAmount: 2120.22,
      totalInstallments: 6,
      createdAt: '2024-07-01',
      updatedAt: '2024-07-01',
      supplierId: 'sup1',
      userId: 'user1',
      supplier: mockSuppliers[0],
      installments: [],
    },
  },
];

export default function SupplierDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Encontrar fornecedor
  const supplier = mockSuppliers.find(s => s.id === id);
  
  // Filtrar contas do fornecedor
  const supplierBills = useMemo(() => {
    return mockSupplierBills.filter(bill => bill.bill?.supplierId === id);
  }, [id]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = supplierBills.reduce((sum, bill) => sum + bill.amount, 0);
    const overdue = supplierBills.filter(bill => 
      new Date(bill.dueDate) < new Date() && bill.status === 'Pendente'
    ).length;
    const pending = supplierBills.filter(bill => bill.status === 'Pendente').length;
    const paid = supplierBills.filter(bill => bill.status === 'Pago').length;

    return { total, overdue, pending, paid, totalBills: supplierBills.length };
  }, [supplierBills]);

  if (!supplier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Fornecedor não encontrado</h1>
          <Button onClick={() => navigate('/suppliers')}>
            Voltar para Fornecedores
          </Button>
        </div>
      </div>
    );
  }

  const formatCNPJ = (cnpj: string) => {
    const clean = cnpj.replace(/\D/g, '');
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'Pendente';
    const currentStatus = isOverdue ? 'Vencido' : status;
    
    const variants = {
      'Pendente': 'secondary' as const,
      'Pago': 'default' as const,
      'Vencido': 'destructive' as const,
    };
    
    return (
      <Badge variant={variants[currentStatus as keyof typeof variants] || 'secondary'}>
        {currentStatus}
      </Badge>
    );
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
                onClick={() => navigate('/suppliers')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{supplier.name}</h1>
                  <p className="text-muted-foreground">{formatCNPJ(supplier.cnpj)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total em Contas</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.total)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contas Vencidas</p>
                    <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contas Pendentes</p>
                    <p className="text-2xl font-bold text-warning">{stats.pending}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contas Pagas</p>
                    <p className="text-2xl font-bold text-success">{stats.paid}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs de Conteúdo */}
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList>
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="bills">Contas a Pagar ({stats.totalBills})</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Fornecedor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nome Fantasia</label>
                        <p className="text-lg font-medium">{supplier.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Razão Social</label>
                        <p className="text-lg font-medium">{supplier.legalName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
                        <p className="text-lg font-mono">{formatCNPJ(supplier.cnpj)}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="mt-1">
                          <Badge variant="default">Ativo</Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Data de Cadastro</label>
                        <p className="text-lg">{formatDate('2024-01-15')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Última Atualização</label>
                        <p className="text-lg">{formatDate('2024-07-20')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bills">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Contas a Pagar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Parcela</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supplierBills.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <FileText className="h-12 w-12 text-muted-foreground/50" />
                                <p>Nenhuma conta encontrada para este fornecedor</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          supplierBills.map((bill) => (
                            <TableRow
                              key={bill.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => navigate(`/bills/${bill.billId}`)}
                            >
                              <TableCell className="font-medium">{bill.bill?.description}</TableCell>
                              <TableCell>{bill.installmentNumber}/{bill.bill?.totalInstallments}</TableCell>
                              <TableCell className="font-mono">{formatCurrency(bill.amount)}</TableCell>
                              <TableCell>{formatDate(bill.dueDate)}</TableCell>
                              <TableCell>{getStatusBadge(bill.status, bill.dueDate)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/bills/${bill.billId}`);
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}