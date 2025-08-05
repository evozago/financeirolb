/**
 * Página de detalhes de uma conta a pagar (Nível 3 - Drill Down)
 * Exibe informações completas da conta, parcelas e fornecedor
 * Permite edição e navegação para detalhes do fornecedor (Nível 4)
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Building2, 
  Calendar, 
  DollarSign,
  FileText,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, Column } from '@/components/ui/data-table';
import { BillToPay, BillToPayInstallment } from '@/types/payables';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Mock data - substituir por dados reais da API
const mockBill: BillToPay = {
  id: 'bill1',
  description: 'NFe 3095349 - Material Têxtil',
  totalAmount: 12721.32,
  totalInstallments: 6,
  createdAt: '2024-07-01T10:00:00Z',
  updatedAt: '2024-07-15T14:30:00Z',
  supplierId: 'sup1',
  userId: 'user1',
  supplier: {
    id: 'sup1',
    name: 'KYLY INDUSTRIA TEXTIL LTDA',
    legalName: 'KYLY INDUSTRIA TEXTIL LTDA',
    cnpj: '12.345.678/0001-90',
    brand: {
      id: 'brand1',
      name: 'KYLY'
    }
  },
  installments: [
    {
      id: 'inst1',
      installmentNumber: 1,
      amount: 2120.22,
      dueDate: '2024-08-01',
      status: 'Vencido',
      billId: 'bill1'
    },
    {
      id: 'inst2',
      installmentNumber: 2,
      amount: 2120.22,
      dueDate: '2024-09-01',
      status: 'Pendente',
      billId: 'bill1'
    },
    {
      id: 'inst3',
      installmentNumber: 3,
      amount: 2120.22,
      dueDate: '2024-10-01',
      status: 'Pendente',
      billId: 'bill1'
    },
    {
      id: 'inst4',
      installmentNumber: 4,
      amount: 2120.22,
      dueDate: '2024-11-01',
      status: 'Pendente',
      billId: 'bill1'
    },
    {
      id: 'inst5',
      installmentNumber: 5,
      amount: 2120.22,
      dueDate: '2024-12-01',
      status: 'Pendente',
      billId: 'bill1'
    },
    {
      id: 'inst6',
      installmentNumber: 6,
      amount: 2120.22,
      dueDate: '2025-01-01',
      status: 'Pendente',
      billId: 'bill1'
    }
  ]
};

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bill, setBill] = useState<BillToPay>(mockBill);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('pt-BR');

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString('pt-BR');

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'Pendente';
    const currentStatus = isOverdue ? 'Vencido' : status;

    const colors = {
      'Pendente': 'bg-status-pending text-status-pending',
      'Pago': 'bg-status-paid text-status-paid',
      'Vencido': 'bg-status-overdue text-status-overdue',
    };

    return (
      <Badge className={cn('text-xs', colors[currentStatus as keyof typeof colors])}>
        {currentStatus}
      </Badge>
    );
  };

  const calculateProgress = () => {
    const paidInstallments = bill.installments.filter(inst => inst.status === 'Pago').length;
    return (paidInstallments / bill.totalInstallments) * 100;
  };

  const getTotalPaid = () => {
    return bill.installments
      .filter(inst => inst.status === 'Pago')
      .reduce((sum, inst) => sum + inst.amount, 0);
  };

  const getTotalPending = () => {
    return bill.installments
      .filter(inst => inst.status !== 'Pago')
      .reduce((sum, inst) => sum + inst.amount, 0);
  };

  const getOverdueCount = () => {
    return bill.installments.filter(inst => {
      const isOverdue = new Date(inst.dueDate) < new Date() && inst.status === 'Pendente';
      return isOverdue;
    }).length;
  };

  const handleMarkInstallmentAsPaid = async (installment: BillToPayInstallment) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBill(prev => ({
        ...prev,
        installments: prev.installments.map(inst =>
          inst.id === installment.id ? { ...inst, status: 'Pago' as const } : inst
        )
      }));
      
      toast({
        title: "Sucesso",
        description: "Parcela marcada como paga",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao marcar parcela como paga",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const installmentColumns: Column<BillToPayInstallment>[] = [
    {
      key: 'installmentNumber',
      header: 'Parcela',
      cell: (item) => (
        <div className="font-medium text-center">
          {item.installmentNumber}/{bill.totalInstallments}
        </div>
      ),
      className: 'text-center w-20',
    },
    {
      key: 'amount',
      header: 'Valor',
      cell: (item) => (
        <div className="font-mono">{formatCurrency(item.amount)}</div>
      ),
      className: 'text-right',
    },
    {
      key: 'dueDate',
      header: 'Vencimento',
      cell: (item) => {
        const isOverdue = new Date(item.dueDate) < new Date() && item.status === 'Pendente';
        return (
          <div className={cn('font-mono', isOverdue && 'text-destructive font-medium')}>
            {formatDate(item.dueDate)}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (item) => getStatusBadge(item.status, item.dueDate),
    },
    {
      key: 'actions',
      header: '',
      cell: (item) => (
        item.status !== 'Pago' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleMarkInstallmentAsPaid(item)}
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Pagar
          </Button>
        )
      ),
      className: 'w-24',
    },
  ];

  const overdueCount = getOverdueCount();

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
                <h1 className="text-2xl font-bold text-foreground">Detalhes da Conta</h1>
                <p className="text-muted-foreground">
                  ID: {bill.id} • {bill.totalInstallments} parcelas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => navigate(`/bills/${id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.')) {
                    // Mock exclusão - substituir por chamada real da API
                    toast({
                      title: "Conta excluída",
                      description: "A conta foi excluída com sucesso.",
                    });
                    navigate('/accounts-payable');
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{bill.description}</h3>
                  <p className="text-muted-foreground">
                    Criada em {formatDateTime(bill.createdAt)}
                  </p>
                  {bill.createdAt !== bill.updatedAt && (
                    <p className="text-xs text-muted-foreground">
                      Atualizada em {formatDateTime(bill.updatedAt)}
                    </p>
                  )}
                </div>
                
                <Separator />
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Valor Total</p>
                      <p className="text-2xl font-bold">{formatCurrency(bill.totalAmount)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Parcelas</p>
                      <p className="text-2xl font-bold">{bill.totalInstallments}x</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alertas */}
            {overdueCount > 0 && (
              <Alert className="border-destructive">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription>
                  <strong>Atenção:</strong> {overdueCount} parcela{overdueCount > 1 ? 's' : ''} vencida{overdueCount > 1 ? 's' : ''}. 
                  É necessário regularizar o pagamento.
                </AlertDescription>
              </Alert>
            )}

            {/* Tabela de Parcelas */}
            <Card>
              <CardHeader>
                <CardTitle>Parcelas</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={bill.installments}
                  columns={installmentColumns}
                  getItemId={(item) => item.id}
                  emptyMessage="Nenhuma parcela encontrada"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progresso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Progresso de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Concluído</span>
                    <span>{calculateProgress().toFixed(0)}%</span>
                  </div>
                  <Progress value={calculateProgress()} />
                </div>
                
                <div className="grid gap-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pago:</span>
                    <span className="font-medium text-success">
                      {formatCurrency(getTotalPaid())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pendente:</span>
                    <span className="font-medium text-warning">
                      {formatCurrency(getTotalPending())}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{formatCurrency(bill.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fornecedor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-semibold text-base"
                    onClick={() => navigate(`/suppliers/${bill.supplier.id}`)}
                  >
                    {bill.supplier.name}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    {bill.supplier.legalName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    CNPJ: {bill.supplier.cnpj}
                  </p>
                </div>
                
                {bill.supplier.brand && (
                  <div>
                    <Separator />
                    <div className="pt-3">
                      <p className="text-sm text-muted-foreground">Marca:</p>
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => navigate(`/brands/${bill.supplier.brand?.id}`)}
                      >
                        {bill.supplier.brand.name}
                      </Button>
                    </div>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/suppliers/${bill.supplier.id}`)}
                >
                  Ver Detalhes do Fornecedor
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}