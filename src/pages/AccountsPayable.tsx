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
import { PayablesTableWithTrash } from '@/components/features/payables/PayablesTableWithTrash';
import { PayableFilters } from '@/components/features/payables/PayableFilters';
import { TrashFilter } from '@/components/features/payables/TrashFilter';
import { UndoDeleteToast } from '@/components/features/payables/UndoDeleteToast';
import { ImportModal } from '@/components/features/payables/ImportModal';
import { BulkEditModal, BulkEditData } from '@/components/features/payables/BulkEditModal';
import { BillToPayInstallment, PayablesFilter } from '@/types/payables';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUndoActions } from '@/hooks/useUndoActions';
import { useTrashOperations } from '@/hooks/useTrashOperations';
import { BatchPaymentModal, BatchPaymentData } from '@/components/features/payables/BatchPaymentModal';
import { usePagePersistence } from '@/hooks/usePagePersistence';

interface UnifiedSupplier {
  id: string;
  name: string;
  tipo: 'fornecedor' | 'pessoa';
}

// Transform Supabase data to app format
const transformInstallmentData = (data: any[]): BillToPayInstallment[] => {
  return data
    .filter(item => {
      // Filter out items with invalid IDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const hasValidId = item.id && uuidRegex.test(item.id);
      if (!hasValidId) {
        console.warn(`Filtering out record with invalid ID: ${item.id}`, item);
      }
      return hasValidId;
    })
    .map(item => ({
      id: item.id,
      installmentNumber: item.numero_parcela || 1,
      amount: parseFloat(item.valor) || 0,
      dueDate: item.data_vencimento,
      status: item.status === 'aberto' ? 'Pendente' : item.status === 'pago' ? 'Pago' : 'Pendente',
      billId: item.id,
      numero_documento: item.numero_documento || '-',
      categoria: item.categoria || 'Geral',
      data_emissao: item.data_emissao,
      filial: item.filial?.nome || 'Não definida', // Add filial field with fallback
      filial_id: item.filial_id,
      filial_nome: item.filial?.nome,
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
  const { addUndoAction } = useUndoActions();
  
  // Usar persistência de estado para esta página
  const {
    pageState,
    updateFilters,
    updateSorting,
    updateSelection,
    updateCustomSetting,
  } = usePagePersistence('/accounts-payable');
  
  const [installments, setInstallments] = useState<BillToPayInstallment[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados persistidos
  const [filters, setFiltersState] = useState<PayablesFilter>(pageState.filters || {});
  const [selectedItems, setSelectedItems] = useState<BillToPayInstallment[]>([]);
  const [sortKey, setSortKey] = useState<string>(pageState.sorting?.column || 'dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(pageState.sorting?.direction || 'asc');
  
  // Função para atualizar filtros com persistência
  const setFilters = (newFilters: PayablesFilter) => {
    setFiltersState(newFilters);
    updateFilters(newFilters);
  };
  
  // Sincronizar estado local com estado persistido quando pageState muda
  useEffect(() => {
    if (pageState.filters) {
      setFiltersState(pageState.filters);
    }
    if (pageState.sorting) {
      setSortKey(pageState.sorting.column);
      setSortDirection(pageState.sorting.direction);
    }
  }, [pageState]);
  
  // Estados locais (não persistidos)
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'xml' | 'spreadsheet'>('xml');
  const [suppliers, setSuppliers] = useState<UnifiedSupplier[]>([]);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [batchPaymentModalOpen, setBatchPaymentModalOpen] = useState(false);
  
  // Estados para lixeira
  const [deletedCount, setDeletedCount] = useState(0);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [lastDeletedItems, setLastDeletedItems] = useState<BillToPayInstallment[]>([]);
  
  // Hook para operações da lixeira
  const {
    loading: trashLoading,
    restoreItems,
    permanentlyDeleteItems,
    softDeleteItems,
    getDeletedCount,
  } = useTrashOperations();

  // Mapear chaves da interface para colunas do banco
  const getOrderColumn = (key: string) => {
    const mapping: Record<string, string> = {
      'supplier': 'fornecedor',
      'description': 'descricao',
      'nfeNumber': 'numero_documento',
      'category': 'categoria',
      'amount': 'valor',
      'totalAmount': 'valor_total_titulo',
      'installment': 'numero_parcela',
      'issueDate': 'data_emissao',
      'dueDate': 'data_vencimento',
      'status': 'status',
    };
    return mapping[key] || null;
  };

  // Callback para mudança de ordenação
  const handleSortChange = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
    // Persistir ordenação
    updateSorting({ column: key, direction });
  };

  // Load installments from Supabase
  const loadInstallments = async () => {
    try {
      setLoading(true);
      
      // Construir query com filtros
      let query = supabase
        .from('ap_installments')
        .select(`
          *,
          filial:filiais(nome)
        `);

      // Aplicar filtro de itens deletados
      if (filters.showDeleted) {
        query = query.not('deleted_at', 'is', null);
      } else {
        query = query.is('deleted_at', null);
      }

      // Aplicar filtros de categoria
      if (filters.category) {
        query = query.eq('categoria', filters.category);
      }

      // Aplicar filtro de entidade/CNPJ
      if (filters.entityId) {
        query = query.eq('entidade_id', filters.entityId);
      }

      // Aplicar filtro de conta bancária
      if (filters.bankAccountId) {
        query = query.eq('conta_bancaria_id', filters.bankAccountId);
      }

      // Aplicar filtro de filial
      if (filters.filialId) {
        query = query.eq('filial_id', filters.filialId);
      }

      // Aplicar filtros de status
      if (filters.status?.length) {
        // Caso especial: "Vencido" não existe no banco, é derivado por data_vencimento < hoje e status != 'pago'
        if (filters.status.length === 1 && filters.status[0] === 'Vencido') {
          const todayStr = new Date().toISOString().split('T')[0];
          query = query.lte('data_vencimento', todayStr).neq('status', 'pago');
        } else {
          // Converter status da interface para valores do banco
          const dbStatus = filters.status.map(status => {
            switch (status) {
              case 'Pendente':
                return 'aberto';
              case 'Pago':
                return 'pago';
              default:
                return status.toLowerCase();
            }
          });

          if (dbStatus.length === 1) {
            query = query.eq('status', dbStatus[0]);
          } else {
            query = query.in('status', dbStatus);
          }
        }
      }

      // Aplicar filtros de data
      if (filters.dueDateFrom) {
        query = query.gte('data_vencimento', filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        query = query.lte('data_vencimento', filters.dueDateTo);
      }

      // Aplicar ordenação
      const orderColumn = getOrderColumn(sortKey);
      if (orderColumn) {
        query = query.order(orderColumn, { ascending: sortDirection === 'asc' });
      } else {
        // Ordenação padrão
        query = query.order('data_vencimento', { ascending: true });
      }

      // Aplicar filtros de valor
      if (filters.amountFrom) {
        query = query.gte('valor', filters.amountFrom);
      }
      if (filters.amountTo) {
        query = query.lte('valor', filters.amountTo);
      }

      // Aplicar busca textual
      if (filters.search) {
        query = query.or(`descricao.ilike.%${filters.search}%,fornecedor.ilike.%${filters.search}%,numero_documento.ilike.%${filters.search}%`);
      }

      // Filtros especiais baseados no parâmetro 'filter' da URL
      const urlFilter = searchParams.get('filter');
      const todayStr = new Date().toISOString().split('T')[0];
      if (urlFilter === 'paid-today') {
        query = query.eq('status', 'pago').eq('data_pagamento', todayStr);
      } else if (urlFilter === 'non-recurring') {
        query = query.or('eh_recorrente.is.null,eh_recorrente.eq.false').neq('status', 'pago');
      } else if (urlFilter === 'due-today') {
        query = query.eq('data_vencimento', todayStr).neq('status', 'pago');
      } else if (urlFilter === 'due-month') {
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        const endStr = endOfMonth.toISOString().split('T')[0];
        query = query.gte('data_vencimento', todayStr).lte('data_vencimento', endStr).neq('status', 'pago');
      }

      // Remover qualquer limite para garantir que todos os registros sejam carregados
      // Supabase por padrão limita a 1000 registros se não especificarmos
      query = query.range(0, 99999); // Usar range ao invés de limit para garantir todos os registros

      const { data, error } = await query;
      
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

  // Load suppliers from Supabase (PF + PJ)
  const loadSuppliers = async () => {
    try {
      // Buscar fornecedores (PJ)
      const { data: fornecedores, error: errorFornecedores } = await supabase
        .from('pessoas')
        .select('id, nome, cnpj_cpf').contains('categorias', ['fornecedor'])
        .eq('ativo', true)
        .order('nome');
      
      // Buscar pessoas (PF)
      const { data: pessoas, error: errorPessoas } = await supabase
        .from('pessoas')
        .select('id, nome, cpf').contains('categorias', ['fornecedor'])
        .eq('ativo', true)
        .order('nome');
      
      if (errorFornecedores) {
        console.error('Error loading fornecedores:', errorFornecedores);
      }
      if (errorPessoas) {
        console.error('Error loading pessoas:', errorPessoas);
      }
      
      // Unificar dados: PJ e PF juntos
      const allSuppliers: UnifiedSupplier[] = [
        ...(fornecedores || []).map(f => ({
          id: f.id,
          name: `${f.nome} (PJ)`,
          tipo: 'fornecedor' as const
        })),
        ...(pessoas || []).map(p => ({
          id: p.id,
          name: `${p.nome} (PF)`,
          tipo: 'pessoa' as const
        }))
      ].sort((a, b) => a.name.localeCompare(b.name));
      
      setSuppliers(allSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  // Load data on component mount e quando filtros ou ordenação mudarem
  useEffect(() => {
    loadInstallments();
    loadSuppliers();
    updateDeletedCount();
  }, [filters, sortKey, sortDirection]); // Recarregar quando filtros ou ordenação mudarem
  

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
          case 'due-today': {
            const todayStr = today.toISOString().split('T')[0];
            setFilters({ status: ['Pendente'], dueDateFrom: todayStr, dueDateTo: todayStr });
            break;
          }
          case 'paid-today':
            // Data de pagamento de hoje será aplicada diretamente na query
            setFilters({ status: ['Pago'] });
            break;
          case 'due-month': {
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            const todayStr = today.toISOString().split('T')[0];
            const endOfMonthStr = endOfMonth.toISOString().split('T')[0];
            setFilters({ status: ['Pendente'], dueDateFrom: todayStr, dueDateTo: endOfMonthStr });
            break;
          }
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
          case 'non-recurring':
            // Será aplicado na query (eh_recorrente false/null)
            setFilters({ status: ['Pendente'] });
            break;
        }
    }
  }, [searchParams]);

  // Filtrar dados baseado nos filtros ativos
  const filteredInstallments = useMemo(() => {
    if (!installments || !Array.isArray(installments)) {
      return [];
    }
    
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

  const handleMarkAsPaid = async (items: BillToPayInstallment[], paymentData?: BatchPaymentData[]) => {
    // Se não há dados de pagamento, abrir o modal para coletar os dados
    if (!paymentData || paymentData.length === 0) {
      setBatchPaymentModalOpen(true);
      return;
    }
    
    setLoading(true);
    try {
      console.log('handleMarkAsPaid called with items:', items.map(i => ({ id: i.id, supplier: i.bill?.supplier.name })));
      
      // Validate and filter only valid UUIDs
      const itemIds = items
        .map(item => {
          console.log(`Processing item: ${item.id} (type: ${typeof item.id})`);
          return item.id;
        })
        .filter(id => {
          // UUID validation regex
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          const isValid = uuidRegex.test(id);
          if (!isValid) {
            console.error(`Invalid UUID detected in mark as paid: ${id}`);
          }
          return isValid;
        });
      
      console.log('Valid item IDs:', itemIds);
      
      if (itemIds.length === 0) {
        throw new Error('Nenhum ID válido encontrado para marcação como pago');
      }
      
      if (itemIds.length !== items.length) {
        console.warn(`Filtered out ${items.length - itemIds.length} invalid IDs in mark as paid`);
      }
      
      const validItems = items.filter(item => itemIds.includes(item.id));
      
      // Armazenar dados originais para undo
      const originalData = validItems.map(item => ({
        id: item.id,
        status: item.status,
        data_pagamento: null,
        data_hora_pagamento: null,
      }));
      
      // Processar pagamentos com os dados detalhados fornecidos
      for (const payment of paymentData) {
        // Ensure bankAccountId is a valid UUID or null
        let bankAccountId = null;
        if (payment.bankAccountId) {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(payment.bankAccountId)) {
            bankAccountId = payment.bankAccountId;
          } else {
            console.warn(`Invalid bankAccountId UUID: ${payment.bankAccountId}, setting to null`);
          }
        }

        // Preparar dados de atualização com novos campos
        const updateData: any = {
          status: 'pago',
          data_pagamento: payment.dataPagamento,
          data_hora_pagamento: new Date().toISOString(),
          banco_pagador: payment.bancoPagador,
          dados_pagamento: payment.codigoIdentificador,
          conta_bancaria_id: bankAccountId,
          observacoes: payment.observacoes,
          valor_pago: payment.valorPago
        };
        
        const { error } = await supabase
          .from('ap_installments')
          .update(updateData)
          .eq('id', payment.installmentId);
        
        if (error) {
          throw error;
        }
      }
      
      setInstallments(prev => prev.map(installment => 
        validItems.find(item => item.id === installment.id)
          ? { ...installment, status: 'Pago' as const }
          : installment
      ));
      
      setSelectedItems([]);
      
      // Adicionar ação de undo
      addUndoAction({
        id: `markAsPaid-${Date.now()}`,
        type: 'markAsPaid',
        data: { itemIds },
        originalData: { status: originalData },
      }, () => {
        // Callback para atualizar UI quando desfazer
        loadInstallments();
      });
      
      const totalPago = paymentData.reduce((sum, p) => sum + p.valorPago, 0);
      const totalOriginal = paymentData.reduce((sum, p) => sum + p.valorOriginal, 0);
      const economia = totalOriginal - totalPago;
      
      let description = `${validItems.length} conta(s) marcada(s) como paga(s)`;
      if (economia > 0.01) {
        description += ` com economia de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(economia)}`;
      }
      
      toast({
        title: "Sucesso",
        description,
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
      setBatchPaymentModalOpen(false);
    }
  };

  // Handler para pagamento em lote com dados detalhados
  const handleBatchPayment = async (paymentData: BatchPaymentData[]) => {
    try {
      // Chamar handleMarkAsPaid com os dados de pagamento
      await handleMarkAsPaid(selectedItems, paymentData);
      setBatchPaymentModalOpen(false);
    } catch (error) {
      console.error('Error in batch payment:', error);
    }
  };

  const handleDelete = async (items: BillToPayInstallment[]) => {
    const success = await softDeleteItems(items);
    if (success) {
      setLastDeletedItems(items);
      setShowUndoToast(true);
      setSelectedItems([]);
      loadInstallments();
      updateDeletedCount();
    }
  };

  // Função para restaurar itens da lixeira
  const handleRestore = async (items: BillToPayInstallment[]) => {
    const success = await restoreItems(items);
    if (success) {
      setSelectedItems([]);
      loadInstallments();
      updateDeletedCount();
    }
  };

  // Função para deletar permanentemente
  const handlePermanentDelete = async (items: BillToPayInstallment[]) => {
    const success = await permanentlyDeleteItems(items);
    if (success) {
      setSelectedItems([]);
      loadInstallments();
      updateDeletedCount();
    }
  };

  // Função para desfazer deleção
  const handleUndoDelete = async () => {
    if (lastDeletedItems.length > 0) {
      const success = await restoreItems(lastDeletedItems);
      if (success) {
        setShowUndoToast(false);
        setLastDeletedItems([]);
        loadInstallments();
        updateDeletedCount();
      }
    }
  };

  // Função para atualizar contador de itens deletados
  const updateDeletedCount = async () => {
    const count = await getDeletedCount();
    setDeletedCount(count);
  };

  // Função para alternar visualização da lixeira
  const handleToggleDeleted = (show: boolean) => {
    setFilters({ ...filters, showDeleted: show });
    setSelectedItems([]);
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

            // Extrair número da NFe usando múltiplos seletores
            let nfeNumber = '';
            
            // Tentar diferentes seletores para encontrar o número da NFe
            const possibleSelectors = [
              'ide nNF',
              'nNF', 
              'infNFe ide nNF',
              'NFe infNFe ide nNF'
            ];
            
            for (const selector of possibleSelectors) {
              const element = xmlDoc.querySelector(selector);
              if (element && element.textContent?.trim()) {
                nfeNumber = element.textContent.trim();
                console.log(`Número NFe encontrado usando seletor "${selector}": ${nfeNumber}`);
                break;
              }
            }
            
            // Extrair chave de acesso
            let chaveAcesso = '';
            const chaveSelectors = [
              'infNFe[Id]',
              'chNFe'
            ];
            
            for (const selector of chaveSelectors) {
              if (selector === 'infNFe[Id]') {
                const element = xmlDoc.querySelector(selector);
                if (element) {
                  const id = element.getAttribute('Id');
                  if (id && id.startsWith('NFe')) {
                    chaveAcesso = id.replace('NFe', '');
                    console.log(`Chave de acesso encontrada no atributo Id: ${chaveAcesso}`);
                    break;
                  }
                }
              } else {
                const element = xmlDoc.querySelector(selector);
                if (element && element.textContent?.trim()) {
                  chaveAcesso = element.textContent.trim();
                  console.log(`Chave de acesso encontrada usando seletor "${selector}": ${chaveAcesso}`);
                  break;
                }
              }
            }
            
            // Se não encontrou número da NFe, tentar extrair dos últimos 9 dígitos da chave
            if (!nfeNumber && chaveAcesso && chaveAcesso.length >= 44) {
              // A chave de acesso tem 44 dígitos, o número da NFe são os dígitos 26-34 (9 dígitos)
              nfeNumber = chaveAcesso.substring(25, 34);
              console.log(`Número NFe extraído da chave de acesso: ${nfeNumber}`);
            }
            
            console.log(`NFe processando: ${file.name} - Número: "${nfeNumber}", Chave: "${chaveAcesso}"`);
            
            // Sistema robusto de verificação de duplicação
            let isDuplicate = false;
            let duplicateReason = '';
            
            // Critério 1: Verificar por número da NFe (mais confiável)
            if (nfeNumber) {
              const { data: existingByNumber, error: numberCheckError } = await supabase
                .from('ap_installments')
                .select('id, numero_documento, descricao, observacoes')
                .eq('numero_documento', nfeNumber)
                .limit(1);
              
              if (numberCheckError) {
                console.error('Erro ao verificar NFe por número:', numberCheckError);
              } else if (existingByNumber && existingByNumber.length > 0) {
                isDuplicate = true;
                duplicateReason = `número da NFe ${nfeNumber}`;
                console.log(`Duplicata encontrada por número da NFe: ${nfeNumber}`);
              }
            }
            
            // Critério 2: Verificar por chave de acesso completa (se não encontrou duplicata por número)
            if (!isDuplicate && chaveAcesso) {
              const { data: existingByKey, error: keyCheckError } = await supabase
                .from('ap_installments')
                .select('id, numero_documento, descricao, observacoes')
                .or(`observacoes.ilike.%${chaveAcesso}%`)
                .limit(1);
              
              if (keyCheckError) {
                console.error('Erro ao verificar NFe por chave:', keyCheckError);
              } else if (existingByKey && existingByKey.length > 0) {
                isDuplicate = true;
                duplicateReason = `chave de acesso ${chaveAcesso.substring(0, 10)}...`;
                console.log(`Duplicata encontrada por chave de acesso: ${chaveAcesso}`);
              }
            }
            
            // Se encontrou duplicata, informar e pular
            if (isDuplicate) {
              warnings.push(`⚠️ NFe ${nfeNumber || 'sem número'} já foi importada anteriormente (${duplicateReason}) - Arquivo: ${file.name}`);
              console.log(`Importação ignorada - duplicata detectada: ${file.name}`);
              continue;
            }
            
            // Validar se conseguiu extrair dados mínimos necessários
            if (!nfeNumber && !chaveAcesso) {
              errors.push(`❌ ${file.name}: Não foi possível extrair número da NFe nem chave de acesso. Verifique se o arquivo XML está no formato correto.`);
              continue;
            }
            
            // Se não tem número mas tem chave, usar número extraído da chave
            let finalNfeNumber = nfeNumber || (chaveAcesso ? chaveAcesso.substring(25, 34) : '');
            
            // Se ainda não tem número, tentar extrair da descrição como fallback
            if (!finalNfeNumber && file.name) {
              const fileNumberMatch = file.name.match(/(\d{8,9})/);
              if (fileNumberMatch) {
                finalNfeNumber = fileNumberMatch[1];
                console.log(`Número NFe extraído do nome do arquivo: ${finalNfeNumber}`);
              }
            }
            
            console.log(`Final NFe number: "${finalNfeNumber}" (original: "${nfeNumber}", from key: "${chaveAcesso ? chaveAcesso.substring(25, 34) : ''}")`);

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
              .eq('tipo', 'PJ')  // Usar 'PJ' em vez de 'fornecedor'
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
                  tipo: 'PJ',  // Usar 'PJ' em vez de 'fornecedor'
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
                .from('pessoas')
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
              const documentNumber = finalNfeNumber && finalNfeNumber.trim() !== '' 
                ? finalNfeNumber 
                : (chaveAcesso?.slice(-8) || file.name.replace('.xml', ''));
              
              console.log(`Document number for single parcel: "${documentNumber}" (finalNfeNumber: "${finalNfeNumber}", chave slice: "${chaveAcesso?.slice(-8)}")`);
              
              const { error: insertError } = await supabase
                .from('ap_installments')
                .insert({
                  descricao: `NFe ${finalNfeNumber || 'sem número'} - Parcela única`,
                  fornecedor: supplierName,
                  valor: totalAmount,
                  valor_total_titulo: totalAmount,
                  data_vencimento: dataEmissao,
                  data_pagamento: dataEmissao,
                  data_emissao: dataEmissao, // Adicionar data de emissão
                  status: 'pago',
                  numero_documento: documentNumber,
                  numero_nfe: finalNfeNumber || documentNumber,
                  categoria: 'Mercadorias',
                  entidade_id: entidadeId,
                  numero_parcela: 1,
                  total_parcelas: 1,
                  observacoes: `Importado de ${file.name}${chaveAcesso ? '. Chave de Acesso: ' + chaveAcesso : ''}`,
                  data_hora_pagamento: new Date().toISOString()
                });
              
              if (insertError) {
                console.error('Erro ao inserir parcela única:', insertError);
                errors.push(`Erro ao importar ${file.name}: ${insertError.message}`);
                continue;
              }
              
              totalImported++;
              console.log(`NFe ${finalNfeNumber || 'sem número'} importada com sucesso (parcela única)`);
            } else {
              // Processar duplicatas normalmente
              const documentNumber = finalNfeNumber && finalNfeNumber.trim() !== '' 
                ? finalNfeNumber 
                : (chaveAcesso?.slice(-8) || file.name.replace('.xml', ''));
              
              console.log(`Document number for multiple parcels: "${documentNumber}" (finalNfeNumber: "${finalNfeNumber}", chave slice: "${chaveAcesso?.slice(-8)}")`);
              
              for (let i = 0; i < duplicatas.length; i++) {
                const dup = duplicatas[i];
                const parcelaValue = parseFloat(dup.querySelector('vDup')?.textContent || '0');
                let vencimento = dup.querySelector('dVenc')?.textContent;
                let dataPagamento = null;
                let status = 'aberto';
                
                // Se não tem data de vencimento, usar data de emissão e marcar como pago
                if (!vencimento) {
                  vencimento = dataEmissao;
                  dataPagamento = dataEmissao;
                  status = 'pago';
                }
                
                const { error: insertError } = await supabase
                  .from('ap_installments')
                  .insert({
                    descricao: `NFe ${finalNfeNumber || 'sem número'} - Parcela ${i + 1}/${duplicatas.length}`,
                    fornecedor: supplierName,
                    valor: parcelaValue,
                    valor_total_titulo: totalAmount,
                    data_vencimento: vencimento,
                    data_pagamento: dataPagamento,
                    data_emissao: dataEmissao, // Adicionar data de emissão
                    status: status,
                    numero_documento: documentNumber,
                    numero_nfe: finalNfeNumber || documentNumber,
                    categoria: 'Mercadorias',
                    entidade_id: entidadeId,
                    numero_parcela: i + 1,
                    total_parcelas: duplicatas.length,
                    observacoes: `Importado de ${file.name}${chaveAcesso ? '. Chave de Acesso: ' + chaveAcesso : ''}`,
                    data_hora_pagamento: status === 'pago' ? new Date().toISOString() : null
                  });
                
                if (insertError) {
                  console.error('Erro ao inserir parcela:', insertError);
                  errors.push(`Erro ao inserir parcela ${i + 1} de ${file.name}: ${insertError.message}`);
                  break;
                }
              }
              
              totalImported++;
              console.log(`NFe ${finalNfeNumber || 'sem número'} importada com sucesso (${duplicatas.length} parcelas)`);
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
      // Validate and filter only valid UUIDs
      const itemIds = selectedItems
        .map(item => item.id)
        .filter(id => {
          // UUID validation regex
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          const isValid = uuidRegex.test(id);
          if (!isValid) {
            console.error(`Invalid UUID detected in bulk edit: ${id}`);
          }
          return isValid;
        });
      
      if (itemIds.length === 0) {
        throw new Error('Nenhum ID válido encontrado para atualização');
      }
      
      if (itemIds.length !== selectedItems.length) {
        console.warn(`Filtered out ${selectedItems.length - itemIds.length} invalid IDs`);
      }
      
      // Armazenar dados originais para undo
      const validSelectedItems = selectedItems.filter(item => itemIds.includes(item.id));
      const originalItems = validSelectedItems.map(item => ({
        id: item.id,
        categoria: item.categoria,
        status: item.status,
        // Usar propriedades corretas do tipo
        dueDate: item.dueDate,
        amount: item.amount,
      }));
      
      // Preparar dados para atualização
      const updateData: any = {};
      
      if (updates.categoria) updateData.categoria = updates.categoria;
      if (updates.status) updateData.status = updates.status;
      if (updates.data_vencimento) updateData.data_vencimento = updates.data_vencimento;
      if (updates.forma_pagamento) updateData.forma_pagamento = updates.forma_pagamento;
      if (updates.observacoes) updateData.observacoes = updates.observacoes;
      if (updates.banco) updateData.banco = updates.banco;
      
      // Handle filial_id with UUID validation
      if (updates.filial_id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(updates.filial_id)) {
          updateData.filial_id = updates.filial_id;
        } else {
          console.warn(`Invalid filial_id UUID: ${updates.filial_id}, skipping`);
        }
      }
      
      // Adicionar timestamp de atualização
      updateData.updated_at = new Date().toISOString();
      
      // Se status for 'pago', adicionar data de pagamento
      if (updates.status === 'pago') {
        updateData.data_pagamento = new Date().toISOString().split('T')[0];
        updateData.data_hora_pagamento = new Date().toISOString();
        // Explicitly set conta_bancaria_id to null to avoid UUID errors
        updateData.conta_bancaria_id = null;
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
      
      // Adicionar ação de undo
      addUndoAction({
        id: `bulkEdit-${Date.now()}`,
        type: 'bulkEdit',
        data: { itemIds, count: selectedItems.length },
        originalData: { items: originalItems },
      }, () => {
        // Callback para atualizar UI quando desfazer
        loadInstallments();
      });
      
      toast({
        title: "Sucesso",
        description: `${validSelectedItems.length} parcela(s) atualizada(s) com sucesso`,
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
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setImportMode('xml');
                setImportModalOpen(true);
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar XML
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setImportMode('spreadsheet');
                setImportModalOpen(true);
              }}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Importar Planilha
            </Button>
            <Button onClick={() => navigate('/accounts-payable/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Controles principais */}
          <Card>
            <CardHeader>
              <CardTitle>Controles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedItems.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedItems([])}
                    className="text-muted-foreground"
                  >
                    Limpar Seleção ({selectedItems.length})
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => setFilters({})}
                  disabled={!Object.keys(filters).some(key => filters[key as keyof PayablesFilter])}
                  className="text-muted-foreground"
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Filtros</span>
                <TrashFilter
                  showDeleted={filters.showDeleted || false}
                  onToggleDeleted={handleToggleDeleted}
                  deletedCount={deletedCount}
                />
              </CardTitle>
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
          <PayablesTableWithTrash
            data={filteredInstallments}
            loading={loading || trashLoading}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            onRowClick={handleRowClick}
            onMarkAsPaid={handleMarkAsPaid}
            onDelete={handleDelete}
            onView={handleView}
            onEdit={handleEdit}
            onBulkEdit={handleBulkEdit}
            // Props para lixeira
            showDeleted={filters.showDeleted || false}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDelete}
            // Props de ordenação
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
        </div>
      </div>

      {/* Toast de desfazer deleção */}
      <UndoDeleteToast
        show={showUndoToast}
        itemCount={lastDeletedItems.length}
        onUndo={handleUndoDelete}
        onDismiss={() => setShowUndoToast(false)}
      />

      {/* Import Modal */}
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        mode={importMode}
        onImport={handleImport}
        onDownloadTemplate={importMode === 'spreadsheet' ? handleDownloadTemplate : undefined}
      />

      {/* Batch Payment Modal */}
      <BatchPaymentModal
        open={batchPaymentModalOpen}
        onOpenChange={setBatchPaymentModalOpen}
        installments={selectedItems}
        onPaymentConfirm={handleBatchPayment}
        loading={loading}
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