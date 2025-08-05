/**
 * Página de listagem de contas a pagar (Nível 2 - Drill Down)
 * Exibe tabela filtrada baseada no KPI clicado no dashboard
 * Permite navegação para detalhes de cada conta (Nível 3)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, FileSpreadsheet, Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PayablesTable } from '@/components/features/payables/PayablesTable';
import { PayableFilters } from '@/components/features/payables/PayableFilters';
import { ImportModal } from '@/components/features/payables/ImportModal';
import { BillToPayInstallment, PayablesFilter, Supplier } from '@/types/payables';
import { useToast } from '@/hooks/use-toast';

// Mock data - substituir por dados reais da API
const mockInstallments: BillToPayInstallment[] = [
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
      supplier: {
        id: 'sup1',
        name: 'KYLY INDUSTRIA TEXTIL LTDA',
        legalName: 'KYLY INDUSTRIA TEXTIL LTDA',
        cnpj: '12.345.678/0001-90',
      },
      installments: [],
    },
  },
  {
    id: '2',
    installmentNumber: 1,
    amount: 2846.96,
    dueDate: '2024-08-04',
    status: 'Pendente',
    billId: 'bill2',
    bill: {
      id: 'bill2',
      description: 'NFe 82946 - Parcela 001',
      totalAmount: 5693.92,
      totalInstallments: 2,
      createdAt: '2024-07-04',
      updatedAt: '2024-07-04',
      supplierId: 'sup2',
      userId: 'user1',
      supplier: {
        id: 'sup2',
        name: 'CONFECCOES ACUCENA LTDA',
        legalName: 'CONFECCOES ACUCENA LTDA',
        cnpj: '98.765.432/0001-10',
      },
      installments: [],
    },
  },
  {
    id: '3',
    installmentNumber: 1,
    amount: 923.00,
    dueDate: '2024-08-04',
    status: 'Pendente',
    billId: 'bill3',
    bill: {
      id: 'bill3',
      description: 'NFe 91912 - Parcela 001',
      totalAmount: 3692.00,
      totalInstallments: 4,
      createdAt: '2024-07-04',
      updatedAt: '2024-07-04',
      supplierId: 'sup3',
      userId: 'user1',
      supplier: {
        id: 'sup3',
        name: 'PIMPOLHO PRODUTOS INFANTIS LTDA',
        legalName: 'PIMPOLHO PRODUTOS INFANTIS LTDA',
        cnpj: '11.222.333/0001-44',
      },
      installments: [],
    },
  },
  {
    id: '4',
    installmentNumber: 1,
    amount: 415.70,
    dueDate: '2024-08-04',
    status: 'Pendente',
    billId: 'bill4',
    bill: {
      id: 'bill4',
      description: 'NFe 319290 - Parcela 001',
      totalAmount: 2078.46,
      totalInstallments: 5,
      createdAt: '2024-07-04',
      updatedAt: '2024-07-04',
      supplierId: 'sup4',
      userId: 'user1',
      supplier: {
        id: 'sup4',
        name: 'ABRANGE IND E COM CONF LTDA',
        legalName: 'ABRANGE IND E COM CONF LTDA',
        cnpj: '55.666.777/0001-88',
      },
      installments: [],
    },
  },
];

const mockSuppliers: Supplier[] = [
  { id: 'sup1', name: 'KYLY INDUSTRIA TEXTIL LTDA', legalName: 'KYLY INDUSTRIA TEXTIL LTDA', cnpj: '12.345.678/0001-90' },
  { id: 'sup2', name: 'CONFECCOES ACUCENA LTDA', legalName: 'CONFECCOES ACUCENA LTDA', cnpj: '98.765.432/0001-10' },
  { id: 'sup3', name: 'PIMPOLHO PRODUTOS INFANTIS LTDA', legalName: 'PIMPOLHO PRODUTOS INFANTIS LTDA', cnpj: '11.222.333/0001-44' },
  { id: 'sup4', name: 'ABRANGE IND E COM CONF LTDA', legalName: 'ABRANGE IND E COM CONF LTDA', cnpj: '55.666.777/0001-88' },
];

export default function AccountsPayable() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [installments, setInstallments] = useState<BillToPayInstallment[]>(mockInstallments);
  const [selectedItems, setSelectedItems] = useState<BillToPayInstallment[]>([]);
  const [filters, setFilters] = useState<PayablesFilter>({});
  const [loading, setLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'xml' | 'spreadsheet'>('xml');

  // Aplicar filtro baseado na URL (navegação drill-down)
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter) {
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      switch (filter) {
        case 'overdue':
          setFilters({ status: ['Vencido'] });
          break;
        case 'thisWeek':
          setFilters({ 
            dueDateFrom: today.toISOString().split('T')[0],
            dueDateTo: weekFromNow.toISOString().split('T')[0]
          });
          break;
        case 'thisMonth':
          setFilters({ 
            dueDateFrom: today.toISOString().split('T')[0],
            dueDateTo: monthFromNow.toISOString().split('T')[0]
          });
          break;
        case 'pending':
          setFilters({ status: ['Pendente'] });
          break;
        case 'paid':
          setFilters({ status: ['Pago'] });
          break;
      }
    }
  }, [searchParams]);

  // Filtrar dados baseado nos filtros ativos
  const filteredInstallments = useMemo(() => {
    let filtered = [...installments];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.bill?.supplier.name.toLowerCase().includes(search) ||
        item.bill?.description.toLowerCase().includes(search) ||
        item.bill?.id.toLowerCase().includes(search)
      );
    }

    if (filters.status?.length) {
      filtered = filtered.filter(item => {
        const isOverdue = new Date(item.dueDate) < new Date() && item.status === 'Pendente';
        const currentStatus = isOverdue ? 'Vencido' : item.status;
        return filters.status!.includes(currentStatus);
      });
    }

    if (filters.supplierId) {
      filtered = filtered.filter(item => item.bill?.supplierId === filters.supplierId);
    }

    if (filters.dueDateFrom) {
      filtered = filtered.filter(item => item.dueDate >= filters.dueDateFrom!);
    }

    if (filters.dueDateTo) {
      filtered = filtered.filter(item => item.dueDate <= filters.dueDateTo!);
    }

    if (filters.amountFrom) {
      filtered = filtered.filter(item => item.amount >= filters.amountFrom!);
    }

    if (filters.amountTo) {
      filtered = filtered.filter(item => item.amount <= filters.amountTo!);
    }

    return filtered;
  }, [installments, filters]);

  const handleRowClick = (item: BillToPayInstallment) => {
    // Navegação drill-down para detalhes da conta (Nível 3)
    navigate(`/bills/${item.billId}`);
  };

  const handleMarkAsPaid = async (items: BillToPayInstallment[]) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInstallments(prev => prev.map(installment => 
        items.find(item => item.id === installment.id)
          ? { ...installment, status: 'Pago' as const }
          : installment
      ));
      
      setSelectedItems([]);
      toast({
        title: "Sucesso",
        description: `${items.length} conta(s) marcada(s) como paga(s)`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao marcar contas como pagas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (items: BillToPayInstallment[]) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const itemIds = items.map(item => item.id);
      setInstallments(prev => prev.filter(installment => !itemIds.includes(installment.id)));
      
      setSelectedItems([]);
      toast({
        title: "Sucesso",
        description: `${items.length} conta(s) excluída(s)`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir contas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (files: File[]) => {
    try {
      const newInstallments: BillToPayInstallment[] = [];
      let processed = 0;
      const errors: string[] = [];
      const warnings: string[] = [];

      for (const file of files) {
        try {
          if (importMode === 'xml') {
            // Processar arquivo XML
            const xmlContent = await file.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
            
            // Verificar se há erros de parsing
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
              errors.push(`Erro ao processar ${file.name}: XML inválido`);
              continue;
            }

            // Extrair dados da nota fiscal (exemplo de estrutura NFe)
            const nfeElement = xmlDoc.querySelector('infNFe') || xmlDoc.querySelector('NFe');
            if (!nfeElement) {
              errors.push(`${file.name}: Estrutura de NFe não encontrada`);
              continue;
            }

            // Extrair dados do fornecedor
            const emit = xmlDoc.querySelector('emit');
            if (!emit) {
              errors.push(`${file.name}: Dados do fornecedor não encontrados`);
              continue;
            }

            const cnpj = emit.querySelector('CNPJ')?.textContent || '';
            const supplierName = emit.querySelector('xNome')?.textContent || 'Fornecedor não identificado';
            
            // Verificar se fornecedor já existe ou criar novo
            let supplier = mockSuppliers.find(s => s.cnpj === cnpj);
            if (!supplier) {
              supplier = {
                id: `sup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: supplierName,
                legalName: supplierName,
                cnpj: cnpj
              };
              mockSuppliers.push(supplier);
            }

            // Extrair valor total e dados das duplicatas
            const totalElement = xmlDoc.querySelector('vNF');
            const totalAmount = parseFloat(totalElement?.textContent || '0');
            
            const duplicatas = xmlDoc.querySelectorAll('dup');
            
            if (duplicatas.length === 0) {
              // Se não há duplicatas, criar uma única parcela
              const billId = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const installmentId = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              
              const newBill = {
                id: billId,
                description: `NFe ${file.name.replace('.xml', '')} - Parcela única`,
                totalAmount: totalAmount,
                totalInstallments: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                supplierId: supplier.id,
                userId: 'user1',
                supplier: supplier,
                installments: [],
              };

              newInstallments.push({
                id: installmentId,
                installmentNumber: 1,
                amount: totalAmount,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
                status: 'Pendente',
                billId: billId,
                bill: newBill,
              });
            } else {
              // Processar múltiplas parcelas
              const billId = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              
              const newBill = {
                id: billId,
                description: `NFe ${file.name.replace('.xml', '')}`,
                totalAmount: totalAmount,
                totalInstallments: duplicatas.length,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                supplierId: supplier.id,
                userId: 'user1',
                supplier: supplier,
                installments: [],
              };

              duplicatas.forEach((dup, index) => {
                const parcela = dup.querySelector('nDup')?.textContent || (index + 1).toString();
                const valor = parseFloat(dup.querySelector('vDup')?.textContent || '0');
                const vencimento = dup.querySelector('dVenc')?.textContent || new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                
                const installmentId = `inst_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
                
                newInstallments.push({
                  id: installmentId,
                  installmentNumber: index + 1,
                  amount: valor,
                  dueDate: vencimento,
                  status: 'Pendente',
                  billId: billId,
                  bill: newBill,
                });
              });
            }
            
            processed++;
          } else {
            // Processar planilha (implementação futura)
            warnings.push(`Planilha ${file.name}: Implementação pendente`);
          }
        } catch (fileError) {
          errors.push(`Erro ao processar ${file.name}: ${(fileError as Error).message}`);
        }
      }

      // Adicionar novos registros ao estado
      if (newInstallments.length > 0) {
        setInstallments(prev => [...prev, ...newInstallments]);
        
        toast({
          title: "Importação concluída",
          description: `${newInstallments.length} parcelas importadas com sucesso`,
        });
      }

      return {
        success: processed > 0,
        processed: newInstallments.length,
        errors,
        warnings: warnings.length > 0 ? warnings : [`${processed} arquivo(s) processado(s) com sucesso`],
      };
    } catch (error) {
      return {
        success: false,
        processed: 0,
        errors: [`Erro geral na importação: ${(error as Error).message}`],
        warnings: [],
      };
    }
  };

  const handleDownloadTemplate = () => {
    // Mock - implementar download real
    console.log('Download template');
  };

  const handleExport = () => {
    // Mock - implementar exportação real
    toast({
      title: "Exportação iniciada",
      description: "O arquivo será baixado em instantes",
    });
  };

  const getPageTitle = () => {
    const filter = searchParams.get('filter');
    const titles = {
      overdue: 'Contas Vencidas',
      thisWeek: 'Vence esta Semana', 
      thisMonth: 'Vence este Mês',
      pending: 'Contas Pendentes',
      paid: 'Contas Pagas',
    };
    return titles[filter as keyof typeof titles] || 'Contas a Pagar';
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
                <h1 className="text-2xl font-bold text-foreground">{getPageTitle()}</h1>
                <p className="text-muted-foreground">
                  {filteredInstallments.length} registro{filteredInstallments.length !== 1 ? 's' : ''} encontrado{filteredInstallments.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setImportMode('spreadsheet');
                  setImportModalOpen(true);
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button onClick={() => navigate('/bills/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <PayableFilters
                filters={filters}
                onFiltersChange={setFilters}
                suppliers={mockSuppliers}
              />
            </CardContent>
          </Card>

          {/* Tabela */}
          <PayablesTable
            data={filteredInstallments}
            loading={loading}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            onRowClick={handleRowClick}
            onMarkAsPaid={handleMarkAsPaid}
            onDelete={handleDelete}
            onView={(item) => navigate(`/bills/${item.billId}`)}
          />
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        mode={importMode}
        onImport={handleImport}
        onDownloadTemplate={importMode === 'spreadsheet' ? handleDownloadTemplate : undefined}
      />
    </div>
  );
}