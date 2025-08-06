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
import { BulkEditModal, BulkEditData } from '@/components/features/payables/BulkEditModal';
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
    numero_documento: item.numero_documento,
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
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);

  // Load installments from Supabase
  const loadInstallments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ap_installments')
        .select('*')
        .order('data_vencimento', { ascending: true });
      
      console.log('Dados brutos do Supabase:', data);
      console.log('Primeiros 3 registros:', data?.slice(0, 3).map(item => ({
        id: item.id,
        descricao: item.descricao,
        numero_documento: item.numero_documento
      })));
      
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
      console.log('Dados transformados:', transformedData.slice(0, 3).map(item => ({
        id: item.id,
        numero_documento: item.numero_documento,
        bill_description: item.bill?.description
      })));
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
  
  // Forçar recarregamento a cada 30 segundos para debug
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Recarregando dados automaticamente...');
      loadInstallments();
    }, 30000);
    
    return () => clearInterval(interval);
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
        // Verificar se está vencido baseado na data de vencimento
        const dueDate = new Date(item.dueDate + 'T23:59:59');
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        const isOverdue = dueDate < today && item.status === 'Pendente';
        const currentStatus = isOverdue ? 'Vencido' : item.status;
        return filters.status!.includes(currentStatus);
      });
    }

    if (filters.supplierId) {
      filtered = filtered.filter(item => item.bill?.supplierId === filters.supplierId);
    }

    // Filtro por data de vencimento - corrigido para funcionar adequadamente
    if (filters.dueDateFrom) {
      const fromDate = new Date(filters.dueDateFrom + 'T00:00:00');
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.dueDate + 'T00:00:00');
        return itemDate >= fromDate;
      });
    }

    if (filters.dueDateTo) {
      const toDate = new Date(filters.dueDateTo + 'T23:59:59');
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.dueDate + 'T00:00:00');
        return itemDate <= toDate;
      });
    }

    if (filters.amountFrom && filters.amountFrom > 0) {
      filtered = filtered.filter(item => item.amount >= filters.amountFrom!);
    }

    if (filters.amountTo && filters.amountTo > 0) {
      filtered = filtered.filter(item => item.amount <= filters.amountTo!);
    }

    return filtered;
  }, [installments, filters]);

  const handleRowClick = (item: BillToPayInstallment) => {
    // Navegação drill-down para detalhes da conta (Nível 3)
    navigate(`/bills/${item.id}`);
  };

  const handleView = (item: BillToPayInstallment) => {
    navigate(`/bills/${item.id}`);
  };

  const handleEdit = (item: BillToPayInstallment) => {
    navigate(`/bills/${item.id}`);
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

            // Extrair número da NFe para verificar duplicação
            const nfeNumber = xmlDoc.querySelector('nNF')?.textContent?.trim() || '';
            const chaveAcesso = nfeElement.getAttribute('Id') || '';
            
            console.log(`NFe processando: ${file.name} - Número extraído: "${nfeNumber}"`);
            
            if (!nfeNumber) {
              errors.push(`${file.name}: Número da NFe não encontrado no XML`);
              continue;
            }
            
            // Verificar se NFe já foi importada (duplicação)
            if (nfeNumber) {
              const { data: existingNfe, error: nfeCheckError } = await supabase
                .from('ap_installments')
                .select('id, numero_documento')
                .eq('numero_documento', nfeNumber)
                .limit(1);
              
              if (nfeCheckError) {
                console.error('Erro ao verificar NFe existente:', nfeCheckError);
              } else if (existingNfe && existingNfe.length > 0) {
                warnings.push(`NFe ${nfeNumber} já importada anteriormente (arquivo: ${file.name})`);
                continue;
              }
            }

            // Extrair dados do fornecedor
            const emit = xmlDoc.querySelector('emit');
            if (!emit) {
              errors.push(`${file.name}: Dados do fornecedor não encontrados`);
              continue;
            }

            const cnpj = emit.querySelector('CNPJ')?.textContent || '';
            const supplierName = emit.querySelector('xNome')?.textContent || 'Fornecedor não identificado';
            
            // Criar entidade se não existir
            let entidadeId = null;
            
            // Primeiro tentar encontrar entidade existente
            const { data: existingEntidade, error: selectError } = await supabase
              .from('entidades')
              .select('id')
              .eq('cnpj_cpf', cnpj)
              .eq('tipo', 'fornecedor')
              .maybeSingle();
            
            if (selectError) {
              console.error('Erro ao buscar entidade:', selectError);
              errors.push(`Erro ao buscar entidade ${supplierName}: ${selectError.message}`);
              continue;
            }
            
            if (existingEntidade) {
              entidadeId = existingEntidade.id;
              console.log(`Entidade existente encontrada: ${entidadeId}`);
            } else {
              // Criar entidade
              console.log(`Criando nova entidade para: ${supplierName}`);
              const { data: newEntidade, error: entidadeError } = await supabase
                .from('entidades')
                .insert({
                  nome: supplierName,
                  cnpj_cpf: cnpj,
                  tipo: 'fornecedor',
                  ativo: true
                })
                .select('id')
                .single();
              
              if (entidadeError) {
                console.error('Erro ao criar entidade:', entidadeError);
                errors.push(`Erro ao criar entidade ${supplierName}: ${entidadeError.message}`);
                continue;
              }
              
              if (!newEntidade || !newEntidade.id) {
                errors.push(`Erro: ID da entidade não retornado para ${supplierName}`);
                continue;
              }
              
              entidadeId = newEntidade.id;
              console.log(`Nova entidade criada: ${entidadeId}`);
              
              // Também criar na tabela fornecedores para compatibilidade
              await supabase
                .from('fornecedores')
                .insert({
                  nome: supplierName,
                  cnpj_cpf: cnpj,
                  ativo: true
                });
            }
            
            // Se não conseguiu criar a entidade, usar null (agora permitido)
            if (!entidadeId) {
              console.warn(`Aviso: entidade_id não definido para ${supplierName}, prosseguindo sem entidade`);
              warnings.push(`Aviso: Não foi possível criar entidade para ${supplierName}`);
            }

            // Extrair valor total e duplicatas
            const totalElement = xmlDoc.querySelector('vNF');
            const totalAmount = parseFloat(totalElement?.textContent || '0');
            const duplicatas = xmlDoc.querySelectorAll('dup');
            
            // Extrair data de emissão da NFe
            const dataEmissao = xmlDoc.querySelector('dhEmi')?.textContent?.split('T')[0] || 
                               new Date().toISOString().split('T')[0];
            
            if (duplicatas.length === 0) {
              // Criar parcela única - sem vencimento = usar data emissão e marcar como pago
              const { error: insertError } = await supabase
                .from('ap_installments')
                .insert({
                  descricao: `NFe ${nfeNumber || file.name.replace('.xml', '')} - Parcela única`,
                  fornecedor: supplierName,
                  valor: totalAmount,
                  valor_total_titulo: totalAmount,
                  data_vencimento: dataEmissao,
                  data_pagamento: dataEmissao,
                  status: 'pago',
                  numero_parcela: 1,
                  total_parcelas: 1,
                  entidade_id: entidadeId,
                  numero_documento: nfeNumber || null
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
                let vencimento = dup.querySelector('dVenc')?.textContent;
                let dataPagamento = null;
                let status = 'aberto';
                
                // Se não tem data de vencimento, usar data de emissão e marcar como pago
                if (!vencimento) {
                  vencimento = dataEmissao;
                  dataPagamento = dataEmissao;
                  status = 'pago';
                }
                
                installmentsToInsert.push({
                  descricao: `NFe ${nfeNumber || file.name.replace('.xml', '')} - Parcela ${index + 1}`,
                  fornecedor: supplierName,
                  valor: valor,
                  valor_total_titulo: totalAmount,
                  data_vencimento: vencimento,
                  data_pagamento: dataPagamento,
                  status: status,
                  numero_parcela: index + 1,
                  total_parcelas: duplicatas.length,
                  entidade_id: entidadeId,
                  numero_documento: nfeNumber || null
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

  const handleBulkEdit = (items: BillToPayInstallment[]) => {
    setBulkEditModalOpen(true);
  };

  const handleBulkEditSave = async (updates: BulkEditData) => {
    if (selectedItems.length === 0) return;

    setBulkEditLoading(true);
    try {
      const itemIds = selectedItems.map(item => item.id);
      
      // Preparar dados para atualização
      const updateData: any = {};
      
      if (updates.categoria) updateData.categoria = updates.categoria;
      if (updates.status) updateData.status = updates.status;
      if (updates.data_vencimento) updateData.data_vencimento = updates.data_vencimento;
      if (updates.forma_pagamento) updateData.forma_pagamento = updates.forma_pagamento;
      if (updates.observacoes) updateData.observacoes = updates.observacoes;
      if (updates.banco) updateData.banco = updates.banco;
      
      // Adicionar timestamp de atualização
      updateData.updated_at = new Date().toISOString();
      
      // Se status for 'pago', adicionar data de pagamento
      if (updates.status === 'pago') {
        updateData.data_pagamento = new Date().toISOString().split('T')[0];
        updateData.data_hora_pagamento = new Date().toISOString();
      }

      const { error } = await supabase
        .from('ap_installments')
        .update(updateData)
        .in('id', itemIds);

      if (error) {
        throw error;
      }

      // Atualizar dados locais
      setInstallments(prev => prev.map(installment => {
        if (itemIds.includes(installment.id)) {
          const updatedInstallment = { ...installment };
          
          // Aplicar atualizações status específicas
          if (updates.status) {
            updatedInstallment.status = updates.status === 'pago' ? 'Pago' : 
                                      updates.status === 'aberto' ? 'Pendente' : 
                                      'Pendente';
          }
          
          return updatedInstallment;
        }
        return installment;
      }));

      setSelectedItems([]);
      setBulkEditModalOpen(false);
      
      toast({
        title: "Sucesso",
        description: `${selectedItems.length} parcela(s) atualizada(s) com sucesso`,
      });
    } catch (error) {
      console.error('Error bulk editing:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar contas em massa",
        variant: "destructive",
      });
    } finally {
      setBulkEditLoading(false);
    }
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
    <div className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{getPageTitle()}</h1>
            <p className="text-muted-foreground">
              {filteredInstallments.length} registro{filteredInstallments.length !== 1 ? 's' : ''} encontrado{filteredInstallments.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadInstallments}>
              🔄 Recarregar
            </Button>
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
            onView={handleView}
            onEdit={handleEdit}
            onBulkEdit={handleBulkEdit}
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

      {/* Bulk Edit Modal */}
      <BulkEditModal
        open={bulkEditModalOpen}
        onOpenChange={setBulkEditModalOpen}
        selectedCount={selectedItems.length}
        onSave={handleBulkEditSave}
        loading={bulkEditLoading}
      />
    </div>
  );
}