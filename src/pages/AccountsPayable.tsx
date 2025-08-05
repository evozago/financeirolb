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
import { supabase } from '@/integrations/supabase/client';

// Transform Supabase data to app format
const transformInstallmentData = (data: any[]): BillToPayInstallment[] => {
  return data.map(item => ({
    id: item.id,
    installmentNumber: item.numero_parcela || 1,
    amount: parseFloat(item.valor) || 0,
    dueDate: item.data_vencimento,
    status: item.status === 'aberto' ? 'Pendente' : item.status === 'pago' ? 'Pago' : 'Pendente',
    billId: item.id,
    bill: {
      id: item.id,
      description: item.descricao || `Parcela ${item.numero_parcela}`,
      totalAmount: parseFloat(item.valor_total_titulo) || parseFloat(item.valor) || 0,
      totalInstallments: item.total_parcelas || 1,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      supplierId: item.entidade_id,
      userId: 'user1',
      supplier: {
        id: item.entidade_id || 'unknown',
        name: item.fornecedor || 'Fornecedor não identificado',
        legalName: item.fornecedor || 'Fornecedor não identificado',
        cnpj: '',
      },
      installments: [],
    },
  }));
};

export default function AccountsPayable() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [installments, setInstallments] = useState<BillToPayInstallment[]>([]);
  const [selectedItems, setSelectedItems] = useState<BillToPayInstallment[]>([]);
  const [filters, setFilters] = useState<PayablesFilter>({});
  const [loading, setLoading] = useState(true);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'xml' | 'spreadsheet'>('xml');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Load installments from Supabase
  const loadInstallments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ap_installments')
        .select('*')
        .order('data_vencimento', { ascending: true });
      
      if (error) {
        console.error('Error loading installments:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar contas a pagar",
          variant: "destructive",
        });
        return;
      }
      
      const transformedData = transformInstallmentData(data || []);
      setInstallments(transformedData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load suppliers from Supabase
  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('id, nome, cnpj_cpf')
        .eq('ativo', true)
        .order('nome');
      
      if (error) {
        console.error('Error loading suppliers:', error);
        return;
      }
      
      const transformedSuppliers: Supplier[] = (data || []).map(supplier => ({
        id: supplier.id,
        name: supplier.nome,
        legalName: supplier.nome,
        cnpj: supplier.cnpj_cpf || '',
      }));
      
      setSuppliers(transformedSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadInstallments();
    loadSuppliers();
  }, []);

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
      const itemIds = items.map(item => item.id);
      
      const { error } = await supabase
        .from('ap_installments')
        .update({ 
          status: 'pago',
          data_pagamento: new Date().toISOString().split('T')[0],
          data_hora_pagamento: new Date().toISOString()
        })
        .in('id', itemIds);
      
      if (error) {
        throw error;
      }
      
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
      console.error('Error marking as paid:', error);
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
      const itemIds = items.map(item => item.id);
      
      const { error } = await supabase
        .from('ap_installments')
        .delete()
        .in('id', itemIds);
      
      if (error) {
        throw error;
      }
      
      setInstallments(prev => prev.filter(installment => !itemIds.includes(installment.id)));
      
      setSelectedItems([]);
      toast({
        title: "Sucesso",
        description: `${items.length} conta(s) excluída(s)`,
      });
    } catch (error) {
      console.error('Error deleting:', error);
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
      const errors: string[] = [];
      const warnings: string[] = [];
      let totalImported = 0;

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

            // Extrair dados da nota fiscal
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
            
            // Criar fornecedor se não existir
            let entidadeId = null;
            const { data: existingFornecedor } = await supabase
              .from('fornecedores')
              .select('id')
              .eq('cnpj_cpf', cnpj)
              .single();
            
            if (existingFornecedor) {
              entidadeId = existingFornecedor.id;
            } else {
              const { data: newFornecedor, error: fornecedorError } = await supabase
                .from('fornecedores')
                .insert({
                  nome: supplierName,
                  cnpj_cpf: cnpj,
                  ativo: true
                })
                .select('id')
                .single();
              
              if (fornecedorError) {
                errors.push(`Erro ao criar fornecedor ${supplierName}: ${fornecedorError.message}`);
                continue;
              }
              entidadeId = newFornecedor.id;
            }

            // Extrair valor total e duplicatas
            const totalElement = xmlDoc.querySelector('vNF');
            const totalAmount = parseFloat(totalElement?.textContent || '0');
            const duplicatas = xmlDoc.querySelectorAll('dup');
            
            if (duplicatas.length === 0) {
              // Criar parcela única
              const { error: insertError } = await supabase
                .from('ap_installments')
                .insert({
                  descricao: `NFe ${file.name.replace('.xml', '')} - Parcela única`,
                  fornecedor: supplierName,
                  valor: totalAmount,
                  valor_total_titulo: totalAmount,
                  data_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  status: 'aberto',
                  numero_parcela: 1,
                  total_parcelas: 1,
                  entidade_id: entidadeId
                });
              
              if (insertError) {
                errors.push(`Erro ao inserir parcela de ${file.name}: ${insertError.message}`);
              } else {
                totalImported++;
              }
            } else {
              // Inserir múltiplas parcelas
              const installmentsToInsert = [];
              duplicatas.forEach((dup, index) => {
                const valor = parseFloat(dup.querySelector('vDup')?.textContent || '0');
                const vencimento = dup.querySelector('dVenc')?.textContent || 
                  new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                
                installmentsToInsert.push({
                  descricao: `NFe ${file.name.replace('.xml', '')} - Parcela ${index + 1}`,
                  fornecedor: supplierName,
                  valor: valor,
                  valor_total_titulo: totalAmount,
                  data_vencimento: vencimento,
                  status: 'aberto',
                  numero_parcela: index + 1,
                  total_parcelas: duplicatas.length,
                  entidade_id: entidadeId
                });
              });
              
              const { error: insertError } = await supabase
                .from('ap_installments')
                .insert(installmentsToInsert);
              
              if (insertError) {
                errors.push(`Erro ao inserir parcelas de ${file.name}: ${insertError.message}`);
              } else {
                totalImported += installmentsToInsert.length;
              }
            }
          } else {
            warnings.push(`Planilha ${file.name}: Implementação pendente`);
          }
        } catch (fileError) {
          errors.push(`Erro ao processar ${file.name}: ${(fileError as Error).message}`);
        }
      }

      // Recarregar dados
      if (totalImported > 0) {
        await loadInstallments();
        toast({
          title: "Importação concluída",
          description: `${totalImported} parcelas importadas com sucesso`,
        });
      }

      return {
        success: totalImported > 0,
        processed: totalImported,
        errors,
        warnings: warnings.length > 0 ? warnings : [`${totalImported} parcela(s) processada(s) com sucesso`],
      };
    } catch (error) {
      console.error('Import error:', error);
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
              <Button onClick={() => navigate('/accounts-payable/new')}>
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
                suppliers={suppliers}
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