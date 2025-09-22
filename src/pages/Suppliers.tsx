/**
 * Página de listagem de fornecedores (Nível 2 - Drill Down)
 * Exibe tabela de fornecedores com navegação para detalhes
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Building2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SuppliersTable } from '@/components/features/suppliers/SuppliersTable';
import { SupplierBulkEditModal, SupplierBulkEditData } from '@/components/features/suppliers/SupplierBulkEditModal';
import { useUndoActions } from '@/hooks/useUndoActions';

interface SupplierData {
  id: string;
  nome_razao_social: string;
  nome_fantasia?: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  tipo_pessoa: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export default function Suppliers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addUndoAction } = useUndoActions();
  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<SupplierData[]>([]);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);

  // Load suppliers from database using unified search
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('search_entidades_fornecedores', {
          p_search: search || null,
          p_limit: 1000,
          p_offset: 0
        });

      if (error) {
        console.error('Error loading suppliers:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar fornecedores",
          variant: "destructive",
        });
        return;
      }

      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [search]);

  // Search is already handled by RPC function
  const filteredSuppliers = useMemo(() => {
    return suppliers;
  }, [suppliers]);

  const handleRowClick = (supplier: SupplierData) => {
    // Navegação drill-down para detalhes do fornecedor (Nível 3)
    navigate(`/suppliers/${supplier.id}`);
  };

  const handleDelete = async (suppliers: SupplierData[]) => {
    try {
      setLoading(true);
      const supplierIds = suppliers.map(s => s.id);
      
      // Armazenar dados originais para undo
      const originalData = suppliers.map(supplier => ({
        id: supplier.id,
        nome_razao_social: supplier.nome_razao_social,
        ativo: supplier.ativo,
      }));

      for (const supplier of suppliers) {
        const normDoc = supplier.cpf_cnpj ? supplier.cpf_cnpj.replace(/\D/g, '') : null;

        // 1) Excluir na entidades_corporativas por id e por documento normalizado (se houver)
        await supabase
          .from('entidades_corporativas')
          .delete()
          .eq('id', supplier.id);

        if (normDoc) {
          await supabase
            .from('entidades_corporativas')
            .delete()
            .eq('cpf_cnpj_normalizado', normDoc);
        }

        // 2) Excluir na fornecedores (legado) por id e por documento normalizado (se houver)
        await supabase
          .from('fornecedores')
          .delete()
          .eq('id', supplier.id);

        if (normDoc) {
          await supabase
            .from('fornecedores')
            .delete()
            .eq('cpf_cnpj_normalizado', normDoc);
        }
      }

      setSelectedItems([]);
      
      // Adicionar ação de undo
      addUndoAction({
        id: `deleteSuppliers-${Date.now()}`,
        type: 'delete',
        data: { supplierIds, count: suppliers.length },
        originalData: { suppliers: originalData },
      }, () => {
        loadSuppliers();
      });

      toast({
        title: "Sucesso",
        description: `${suppliers.length} fornecedor${suppliers.length !== 1 ? 'es' : ''} excluído${suppliers.length !== 1 ? 's' : ''} definitivamente`,
      });
      
      loadSuppliers();
    } catch (error) {
      console.error('Error deleting suppliers:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir fornecedores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEdit = (suppliers: SupplierData[]) => {
    setBulkEditModalOpen(true);
  };

  const handleBulkEditSave = async (updates: SupplierBulkEditData) => {
    try {
      setBulkEditLoading(true);
      const supplierIds = selectedItems.map(s => s.id);
      
      // Armazenar dados originais para undo
      const originalData = selectedItems.map(supplier => ({
        id: supplier.id,
        ativo: supplier.ativo,
      }));

      // Preparar dados de atualização
      const updateData: any = {};
      if (updates.ativo !== undefined) {
        updateData.ativo = updates.ativo;
      }

      // Atualizar na entidades_corporativas
      const { error: errorEntidades } = await supabase
        .from('entidades_corporativas')
        .update(updateData)
        .in('id', supplierIds);

      if (errorEntidades) {
        throw errorEntidades;
      }

      // Atualizar na fornecedores (legado)
      const { error: errorFornecedores } = await supabase
        .from('fornecedores')
        .update(updateData)
        .in('id', supplierIds);

      if (errorFornecedores) {
        console.warn('Error updating fornecedores table:', errorFornecedores);
      }

      setSelectedItems([]);
      setBulkEditModalOpen(false);
      
      // Adicionar ação de undo
      addUndoAction({
        id: `bulkEditSuppliers-${Date.now()}`,
        type: 'bulkEdit',
        data: { supplierIds, count: selectedItems.length },
        originalData: { suppliers: originalData },
      }, () => {
        loadSuppliers();
      });

      toast({
        title: "Sucesso",
        description: `${selectedItems.length} fornecedor${selectedItems.length !== 1 ? 'es' : ''} atualizado${selectedItems.length !== 1 ? 's' : ''} com sucesso`,
      });
      
      loadSuppliers();
    } catch (error) {
      console.error('Error bulk editing suppliers:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar fornecedores em massa",
        variant: "destructive",
      });
    } finally {
      setBulkEditLoading(false);
    }
  };

  const handleActivate = async (suppliers: SupplierData[]) => {
    await handleBulkEditSave({ ativo: true });
  };

  const handleDeactivate = async (suppliers: SupplierData[]) => {
    await handleBulkEditSave({ ativo: false });
  };

  const formatCNPJ = (cnpj: string | undefined) => {
    // Formatar CNPJ: 00.000.000/0000-00
    if (!cnpj) return '-';
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length === 14) {
      return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } else if (clean.length === 11) {
      return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return cnpj;
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
                <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
                <p className="text-muted-foreground">
                  {filteredSuppliers.length} fornecedor{filteredSuppliers.length !== 1 ? 'es' : ''} encontrado{filteredSuppliers.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate('/suppliers/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Fornecedor
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Busca */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, razão social ou CNPJ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Fornecedores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Lista de Fornecedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SuppliersTable
                data={filteredSuppliers}
                loading={loading}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
                onRowClick={handleRowClick}
                onEdit={(supplier) => navigate(`/suppliers/${supplier.id}/edit`)}
                onDelete={handleDelete}
                onView={handleRowClick}
                onBulkEdit={handleBulkEdit}
                onActivate={handleActivate}
                onDeactivate={handleDeactivate}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bulk Edit Modal */}
      <SupplierBulkEditModal
        open={bulkEditModalOpen}
        onOpenChange={setBulkEditModalOpen}
        selectedCount={selectedItems.length}
        onSave={handleBulkEditSave}
        loading={bulkEditLoading}
      />
    </div>
  );
}