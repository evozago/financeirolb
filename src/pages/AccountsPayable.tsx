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
import { useUndoActions } from '@/hooks/useUndoActions';

/** 
 * 🔧 EXTENSÃO TEMPORÁRIA DO TIPO PARA ENVIAR CAMPOS EXTRAS À TABELA
 * (numero_nfe, aditor, invoice_number_norm). Isso evita erro de TS e permite que
 * a PayablesTable leia esses campos para a coluna "Nº NFe".
 */
type BillToPayInstallmentExt = BillToPayInstallment & {
  numero_nfe?: string | null;
  aditor?: any;
  invoice_number_norm?: string | null;
};

// Transform Supabase data to app format
const transformInstallmentData = (data: any[]): BillToPayInstallmentExt[] => {
  return data.map(item => {
    // Tentar deduzir o nNF a partir da chave, caso banco não tenha salvo ainda
    const nfeFromKey =
      typeof item.invoice_number_norm === 'string' && item.invoice_number_norm.length === 44
        ? item.invoice_number_norm.slice(25, 34) // posições 26..34 (0-based 25..33)
        : null;

    const numero_nfe: string | null =
      item.numero_nfe ?? item?.aditor?.numero_nfe ?? nfeFromKey ?? null;

    return {
      id: item.id,
      installmentNumber: item.numero_parcela || 1,
      amount: parseFloat(item.valor) || 0,
      dueDate: item.data_vencimento,
      status:
        item.status === 'aberto' ? 'Pendente' : item.status === 'pago' ? 'Pago' : 'Pendente',
      billId: item.id,
      numero_documento: item.numero_documento || '-',
      categoria: item.categoria || 'Geral',
      // 🔽 CAMPOS EXTRAS USADOS PELA PayablesTable PARA RENDERIZAR Nº NFe
      numero_nfe,
      aditor: item.aditor ?? null,
      invoice_number_norm: item.invoice_number_norm ?? null,
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
    };
  });
};

export default function AccountsPayable() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { addUndoAction } = useUndoActions();
  
  const [installments, setInstallments] = useState<BillToPayInstallmentExt[]>([]);
  const [selectedItems, setSelectedItems] = useState<BillToPayInstallmentExt[]>([]);
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
      
      // Construir query com filtros
      let query = supabase
        .from('ap_installments')
        // 🔽 Garanta que estes campos venham do banco (select('*') já traz, mas fica explícito)
        .select('*, aditor, numero_nfe, invoice_number_norm');

      // Aplicar filtros de categoria
      if (filters.category) {
        query = query.eq('categoria', filters.category);
      }

      // Aplicar filtros de status
      if (filters.status?.length) {
        if (filters.status.includes('aberto') || filters.status.includes('Pendente')) {
          query = query.eq('status', 'aberto');
        } else if (filters.status.includes('pago') || filters.status.includes('Pago')) {
          query = query.eq('status', 'pago');
        } else if (filters.status.includes('vencido') || filters.status.includes('Vencido')) {
          query = query.eq('status', 'vencido');
        }
      }

      // Aplicar filtros de data
      if (filters.dueDateFrom) {
        query = query.gte('data_vencimento', filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        query = query.lte('data_vencimento', filters.dueDateTo);
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
        query = query.or(
          `descricao.ilike.%${filters.search}%,fornecedor.ilike.%${filters.search}%,numero_documento.ilike.%${filters.search}%,numero_nfe.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query.order('data_vencimento', { ascending: true });
      
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
  }, [filters]); // Recarregar quando filtros mudarem
  

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
        (item.bill?.description || '').toLowerCase().includes(search) ||
        item.id.toLowerCase().includes(search) ||
        (item.numero_nfe || '').toLowerCase().includes(search)
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
        return !!filters.status && filters.status.includes(currentStatus as any);
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
      filtered = filtered.filter(item => item.amount >= (filters.amountFrom as number));
    }

    if (filters.amountTo && filters.amountTo > 0) {
      filtered = filtered.filter(item => item.amount <= (filters.amountTo as number));
    }

    return filtered;
  }, [installments, filters]);

  const handleRowClick = (item: BillToPayInstallmentExt) => {
    // Navegação drill-down para detalhes da conta (Nível 3)
    navigate(`/bills/${item.id}`);
  };

  const handleView = (item: BillToPayInstallmentExt) => {
    navigate(`/bills/${item.id}`);
  };

  const handleEdit = (item: BillToPayInstallmentExt) => {
    navigate(`/bills/${item.id}`);
  };

  const handleMarkAsPaid = async (items: BillToPayInstallmentExt[]) => {
    setLoading(true);
    try {
      const itemIds = items.map(item => item.id);
      
      // Armazenar dados originais para undo
      const originalData = items.map(item => ({
        id: item.id,
        status: item.status,
        data_pagamento: null,
        data_hora_pagamento: null,
      }));
      
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

  const handleDelete = async (items: BillToPayInstallmentExt[]) => {
    setLoading(true);
    try {
      const itemIds = items.map(item => item.id);
      
      // Armazenar dados originais para undo (dados completos do supabase)
      const { data: originalItems, error: fetchError } = await supabase
        .from('ap_installments')
        .select('*')
        .in('id', itemIds);
      
      if (fetchError) {
        throw fetchError;
      }
      
      const { error } = await supabase
        .from('ap_installments')
        .delete()
        .in('id', itemIds);
      
      if (error) {
        throw error;
      }
      
      setInstallments(prev => prev.filter(installment => !itemIds.includes(installment.id)));
      
      setSelectedItems([]);
      
      // Adicionar ação de undo
      addUndoAction({
        id: `delete-${Date.now()}`,
        type: 'delete',
        data: { itemIds, count: items.length },
        originalData: { items: originalItems || [] },
      }, () => {
        // Callback para atualizar UI quando desfazer
        loadInstallments();
      });
      
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

            // Extrair número da NFe usando múltiplos seletores
            let nfeNumber = '';
            
            // Tentar diferentes seletores para encontrar o número da NFe
            const possibleSelectors = [
              'ide nNF',
              'nNF', 
              'infNFe ide nNF',
              'NFe infNFe ide nNF',
              'protNFe infProt nNF' // Para NFe processada
            ];
            
            for (const selector of possibleSelectors) {
              const element = xmlDoc.querySelector(selector);
              if (element && element.textContent?.trim()) {
                // ⚠️ PRESERVAR ZEROS À ESQUERDA
                nfeNumber = element.textContent.trim();
                break;
              }
            }
            
            // Extrair chave de acesso
            let chaveAcesso = '';
            const chaveSelectors = ['infNFe[Id]', 'chNFe'];
            
            for (const selector of chaveSelectors) {
              if (selector === 'infNFe[Id]') {
                const element = xmlDoc.querySelector(selector);
                if (element) {
                  const id = element.getAttribute('Id');
                  if (id && id.startsWith('NFe')) {
                    chaveAcesso = id.replace('NFe', '');
                    break;
                  }
                }
              } else {
                const element = xmlDoc.querySelector(selector);
                if (element && element.textContent?.trim()) {
                  chaveAcesso = element.textContent.trim();
                  break;
                }
              }
            }
            
            // Se não encontrou número da NFe, extrair das posições 26..34 da chave
            if (!nfeNumber && chaveAcesso && chaveAcesso.length >= 44) {
              nfeNumber = chaveAcesso.substring(25, 34); // mantém zeros
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
            let entidadeId: string | null = null;
            
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
            } else {
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
              
              entidadeId = newEntidade?.id ?? null;
              
              // Compatibilidade com tabela fornecedores
              await supabase
                .from('fornecedores')
                .insert({
                  nome: supplierName,
                  cnpj_cpf: cnpj,
                  ativo: true
                });
            }

            // Extrair valor total e duplicatas
            const totalElement = xmlDoc.querySelector('vNF');
            const totalAmount = parseFloat(totalElement?.textContent || '0');
            const duplicatas = xmlDoc.querySelectorAll('dup');
            
            // Extrair data de emissão da NFe
            const dataEmissao =
              xmlDoc.querySelector('dhEmi')?.textContent?.split('T')[0] ||
              new Date().toISOString().split('T')[0];
            
            // Preparar campos comuns
            const numeroNfeFinal = nfeNumber || (chaveAcesso ? chaveAcesso.substring(25, 34) : '');
            const invoiceKey = chaveAcesso || null;

            if (duplicatas.length === 0) {
              // Parcela única
              const documentNumber = numeroNfeFinal && numeroNfeFinal.trim() !== '' ? numeroNfeFinal : null;
              
              const { error: insertError } = await supabase
                .from('ap_installments')
                .insert({
                  descricao: `NFe ${numeroNfeFinal || 'sem número'} - Parcela única`,
                  fornecedor: supplierName,
                  valor: totalAmount,
                  valor_total_titulo: totalAmount,
                  data_vencimento: dataEmissao,
                  data_pagamento: dataEmissao,
                  status: 'pago',
                  numero_documento: documentNumber,
                  // 🔽 CAMPOS IMPORTANTES PARA A COLUNA Nº NFe
                  numero_nfe: documentNumber,            // salva nNF
                  invoice_number_norm: invoiceKey,       // salva a chave de acesso
                  categoria: 'Mercadorias',
                  entidade_id: entidadeId,
                  numero_parcela: 1,
                  total_parcelas: 1,
                  observacoes: `Importado de ${file.name}${invoiceKey ? '. Chave de Acesso: ' + invoiceKey : ''}`,
                  data_hora_pagamento: new Date().toISOString()
                });
              
              if (insertError) {
                console.error('Erro ao inserir parcela única:', insertError);
                errors.push(`Erro ao importar ${file.name}: ${insertError.message}`);
                continue;
              }
              
              totalImported++;
            } else {
              // Múltiplas duplicatas
              const documentNumber = numeroNfeFinal && numeroNfeFinal.trim() !== '' ? numeroNfeFinal : null;
              
              for (let i = 0; i < duplicatas.length; i++) {
                const dup = duplicatas[i];
                const parcelaValue = parseFloat(dup.querySelector('vDup')?.textContent || '0');
                let vencimento = dup.querySelector('dVenc')?.textContent || undefined;
                let dataPagamento: string | null = null;
                let status = 'aberto';
                
                // Sem vencimento: usa emissão e marca como pago
                if (!vencimento) {
                  vencimento = dataEmissao;
                  dataPagamento = dataEmissao;
                  status = 'pago';
                }
                
                const { error: insertError } = await supabase
                  .from('ap_installments')
                  .insert({
                    descricao: `NFe ${numeroNfeFinal || 'sem número'} - Parcela ${i + 1}/${duplicatas.length}`,
                    fornecedor: supplierName,
                    valor: parcelaValue,
                    valor_total_titulo: totalAmount,
                    data_vencimento: vencimento,
                    data_pagamento: dataPagamento,
                    status: status,
                    numero_documento: documentNumber,
                    // 🔽 CAMPOS IMPORTANTES PARA A COLUNA Nº NFe
                    numero_nfe: documentNumber,
                    invoice_number_norm: invoiceKey,
                    categoria: 'Mercadorias',
                    entidade_id: entidadeId,
                    numero_parcela: i + 1,
                    total_parcelas: duplicatas.length,
                    observacoes: `Importado de ${file.name}${invoiceKey ? '. Chave de Acesso: ' + invoiceKey : ''}`,
                    data_hora_pagamento: status === 'pago' ? new Date().toISOString() : null
                  });
                
                if (insertError) {
                  console.error('Erro ao inserir parcela:', insertError);
                  errors.push(`Erro ao inserir parcela ${i + 1} de ${file.name}: ${insertError.message}`);
                  break;
                }
              }
              
              totalImported++;
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

  const handleBulkEdit = (items: BillToPayInstallmentExt[]) => {
    setBulkEditModalOpen(true);
  };

  const handleBulkEditSave = async (updates: BulkEditData) => {
    if (selectedItems.length === 0) return;

    setBulkEditLoading(true);
    try {
      const itemIds = selectedItems.map(item => item.id);
      
      // Armazenar dados originais para undo
      const originalItems = selectedItems.map(item => ({
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
    return (titles as any)[filter as keyof typeof titles] || 'Contas a Pagar';
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
            onSelectionChange={setSelectedItems as any}
            onRowClick={handleRowClick}
            onView={handleView}
            onEdit={handleEdit}
            onMarkAsPaid={handleMarkAsPaid}
            onDelete={handleDelete}
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
