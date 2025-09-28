/**
 * Página de detalhes do fornecedor (Nível 3 - Drill Down)
 * Exibe informações completas do fornecedor e suas contas
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, FileText, Calendar, DollarSign, MapPin, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SupplierData {
  id: string;
  nome: string;
  cnpj_cpf: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SupplierBill {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: string;
  numero_parcela: number;
  total_parcelas: number;
  fornecedor: string;
}

export default function SupplierDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [supplierBills, setSupplierBills] = useState<SupplierBill[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      loadSupplierData();
    }
  }, [id]);

  const loadSupplierData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do fornecedor
      const { data: supplierData, error: supplierError } = await supabase
        .from('pessoas')
        .select('*').contains('categorias', ['fornecedor'])
        .eq('id', id)
        .single();
      
      if (supplierError) {
        console.error('Erro ao carregar fornecedor:', supplierError);
        setSupplier(null);
        return;
      }
      
      setSupplier(supplierData);
      
      // Carregar contas do fornecedor diretamente (excluindo soft deleted)
      const { data: billsData, error: billsError } = await supabase
        .from('ap_installments')
        .select('*')
        .eq('fornecedor', supplierData.nome)
        .is('deleted_at', null)
        .order('data_vencimento', { ascending: true });
      
      if (billsError) {
        console.error('Erro ao carregar contas:', billsError);
        setSupplierBills([]);
      } else {
        // Transformar dados para o formato esperado incluindo status calculado
        const transformedBills = (billsData || []).map((item: any) => {
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          const dueDate = new Date(item.data_vencimento + 'T23:59:59');
          
          let calculatedStatus = item.status;
          if (item.data_pagamento) {
            calculatedStatus = 'pago';
          } else if (dueDate < today && (item.status === 'aberto' || item.status === 'pendente')) {
            calculatedStatus = 'vencido';
          } else if (item.status === 'aberto') {
            calculatedStatus = 'aberto';
          }
          
          return {
            id: item.id,
            descricao: item.descricao,
            valor: parseFloat(item.valor),
            data_vencimento: item.data_vencimento,
            status: calculatedStatus,
            numero_parcela: item.numero_parcela || 1,
            total_parcelas: item.total_parcelas || 1,
            fornecedor: item.fornecedor
          };
        });
        setSupplierBills(transformedBills);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!supplier) return;
    
    try {
      const { error } = await supabase
        .from('pessoas')
        .delete()
        .eq('id', supplier.id);

      if (error) {
        console.error('Error deleting supplier:', error);
        toast({
          title: "Erro",
          description: "Falha ao excluir fornecedor",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Fornecedor excluído definitivamente",
      });
      
      navigate('/suppliers');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir fornecedor",
        variant: "destructive",
      });
    }
  };

  // Calcular estatísticas corrigidas
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const total = supplierBills.reduce((sum, bill) => sum + bill.valor, 0);
    const overdue = supplierBills.filter(bill => {
      const dueDate = new Date(bill.data_vencimento + 'T23:59:59');
      return dueDate < today && (bill.status === 'aberto' || bill.status === 'pendente');
    }).length;
    const pending = supplierBills.filter(bill => 
      bill.status === 'aberto' || bill.status === 'pendente'
    ).length;
    const paid = supplierBills.filter(bill => bill.status === 'pago').length;

    return { total, overdue, pending, paid, totalBills: supplierBills.length };
  }, [supplierBills]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Carregando...</h1>
        </div>
      </div>
    );
  }

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

  const formatCNPJ = (cnpj: string | null) => {
    if (!cnpj) return '-';
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
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dueDateObj = new Date(dueDate + 'T23:59:59');
    
    const isOverdue = dueDateObj < today && (status === 'aberto' || status === 'pendente');
    const currentStatus = isOverdue ? 'vencido' : status;
    
    const statusLabels = {
      'aberto': 'Pendente',
      'pendente': 'Pendente',
      'pago': 'Pago', 
      'vencido': 'Vencido'
    };
    
    const variants = {
      'aberto': 'secondary' as const,
      'pendente': 'secondary' as const,
      'pago': 'default' as const,
      'vencido': 'destructive' as const,
    };
    
    return (
      <Badge variant={variants[currentStatus as keyof typeof variants] || 'secondary'} className="text-white">
        {statusLabels[currentStatus as keyof typeof statusLabels] || currentStatus}
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
                  <h1 className="text-2xl font-bold text-foreground">{supplier.nome}</h1>
                  <p className="text-muted-foreground">{formatCNPJ(supplier.cnpj_cpf)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(`/suppliers/${id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir definitivamente o fornecedor "{supplier.nome}"? 
                      Esta ação não pode ser desfeita e removerá todos os dados relacionados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir Definitivamente
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                        <label className="text-sm font-medium text-muted-foreground">Nome</label>
                        <p className="text-lg font-medium">{supplier.nome}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">CNPJ/CPF</label>
                        <p className="text-lg font-mono">{formatCNPJ(supplier.cnpj_cpf)}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="mt-1">
                          <Badge variant={supplier.ativo ? "default" : "destructive"}>
                            {supplier.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Data de Cadastro</label>
                        <p className="text-lg">{supplier.created_at ? formatDate(supplier.created_at) : '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Última Atualização</label>
                        <p className="text-lg">{supplier.updated_at ? formatDate(supplier.updated_at) : '-'}</p>
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
                              onClick={() => navigate(`/bills/${bill.id}`)}
                            >
                              <TableCell className="font-medium">{bill.descricao}</TableCell>
                              <TableCell>{bill.numero_parcela}/{bill.total_parcelas}</TableCell>
                              <TableCell className="font-mono">{formatCurrency(bill.valor)}</TableCell>
                              <TableCell>{formatDate(bill.data_vencimento)}</TableCell>
                              <TableCell>{getStatusBadge(bill.status, bill.data_vencimento)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/bills/${bill.id}`);
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