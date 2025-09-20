import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Search, Plus, Users } from 'lucide-react';
import { EntitiesTable } from '@/components/features/entities/EntitiesTable';
import { EntityBulkEditModal, EntityBulkEditData } from '@/components/features/entities/EntityBulkEditModal';
import { useUndoActions } from '@/hooks/useUndoActions';

interface Entidade {
  id: string;
  tipo_pessoa: string;
  nome_razao_social: string;
  nome_fantasia: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  papeis: string[];
  ativo: boolean;
}

interface EntidadesListProps {
  onEntidadeSelect?: (entidade: Entidade) => void;
  onNovaEntidade?: () => void;
  onEditarEntidade?: (entidade: Entidade) => void;
}

export function EntidadesList({ onEntidadeSelect, onNovaEntidade, onEditarEntidade }: EntidadesListProps) {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [papelFilter, setPapelFilter] = useState('all');
  const [papeis, setPapeis] = useState<{ nome: string; id: string }[]>([]);
  const [selectedItems, setSelectedItems] = useState<Entidade[]>([]);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const { addUndoAction } = useUndoActions();

  useEffect(() => {
    loadPapeis();
    loadEntidades();
  }, [searchQuery, papelFilter]);

  const loadPapeis = async () => {
    try {
      const { data, error } = await supabase
        .from('papeis')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setPapeis(data || []);
    } catch (error) {
      console.error('Erro ao carregar papéis:', error);
    }
  };

  const loadEntidades = async () => {
    try {
      setLoading(true);
      
      // Buscar entidades corporativas com papéis (com foco em funcionários e empresas)
      let query = supabase
        .from('entidades_corporativas')
        .select(`
          *,
          entidade_papeis!inner(
            papel_id,
            ativo,
            papeis(nome)
          )
        `)
        .eq('ativo', true)
        .eq('entidade_papeis.ativo', true);

      // Filtrar por papel específico ou mostrar pelo menos funcionários
      if (papelFilter !== 'all') {
        query = query.eq('entidade_papeis.papeis.nome', papelFilter);
      } else {
        // Por padrão, mostrar pessoas com papel de funcionário, empresa ou empresa do grupo
        query = query.in('entidade_papeis.papeis.nome', ['funcionario', 'empresa', 'empresa do grupo']);
      }

      // Filtrar por busca
      if (searchQuery) {
        query = query.or(
          `nome_razao_social.ilike.%${searchQuery}%,nome_fantasia.ilike.%${searchQuery}%,cpf_cnpj.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
        );
      }

      query = query.order('nome_razao_social');

      const { data, error } = await query;

      if (error) throw error;

      // Transformar dados para o formato esperado, agrupando por entidade
      const entidadesMap = new Map();
      
      (data || []).forEach((item: any) => {
        if (!entidadesMap.has(item.id)) {
          entidadesMap.set(item.id, {
            id: item.id,
            tipo_pessoa: item.tipo_pessoa,
            nome_razao_social: item.nome_razao_social,
            nome_fantasia: item.nome_fantasia,
            cpf_cnpj: item.cpf_cnpj,
            email: item.email,
            telefone: item.telefone,
            papeis: [],
            ativo: item.ativo,
          });
        }
        
        const entidade = entidadesMap.get(item.id);
        const papel = item.entidade_papeis?.[0]?.papeis?.nome;
        if (papel && !entidade.papeis.includes(papel)) {
          entidade.papeis.push(papel);
        }
      });

      setEntidades(Array.from(entidadesMap.values()));
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
      toast.error('Erro ao carregar entidades');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entidades: Entidade[]) => {
    try {
      const entidadeIds = entidades.map(e => e.id);
      
      // Armazenar dados originais para undo
      const originalData = entidades.map(entidade => ({
        id: entidade.id,
        nome_razao_social: entidade.nome_razao_social,
        ativo: entidade.ativo,
      }));

      for (const entidade of entidades) {
        const { error } = await supabase
          .from('entidades_corporativas')
          .delete()
          .eq('id', entidade.id);

        if (error) {
          console.error('Erro ao excluir entidade:', error);
          toast.error(`Erro ao excluir entidade ${entidade.nome_razao_social}`);
          continue;
        }
      }

      setSelectedItems([]);
      
      // Adicionar ação de undo
      addUndoAction({
        id: `deleteEntities-${Date.now()}`,
        type: 'deleteEntities',
        data: { entidadeIds, count: entidades.length },
        originalData: { entidades: originalData },
      }, () => {
        loadEntidades();
      });

      toast.success(`${entidades.length} entidade${entidades.length !== 1 ? 's' : ''} excluída${entidades.length !== 1 ? 's' : ''} definitivamente`);
      loadEntidades();
    } catch (error) {
      console.error('Erro ao excluir entidades:', error);
      toast.error('Erro ao excluir entidades');
    }
  };

  const handleBulkEdit = (entidades: Entidade[]) => {
    setBulkEditModalOpen(true);
  };

  const handleBulkEditSave = async (updates: EntityBulkEditData) => {
    try {
      setBulkEditLoading(true);
      const entidadeIds = selectedItems.map(e => e.id);
      
      // Armazenar dados originais para undo
      const originalData = selectedItems.map(entidade => ({
        id: entidade.id,
        ativo: entidade.ativo,
        papeis: entidade.papeis,
      }));

      // Atualizar status se especificado
      if (updates.ativo !== undefined) {
        const updateData = { ativo: updates.ativo };

        const { error } = await supabase
          .from('entidades_corporativas')
          .update(updateData)
          .in('id', entidadeIds);

        if (error) {
          throw error;
        }
      }

      // Gerenciar papéis se especificado
      if (updates.papeis) {
        for (const entidadeId of entidadeIds) {
          // Adicionar papéis
          if (updates.papeis.add.length > 0) {
            for (const papelId of updates.papeis.add) {
              try {
                const { error: insertError } = await supabase
                  .from('entidade_papeis')
                  .upsert({
                    entidade_id: entidadeId,
                    papel_id: papelId,
                    data_inicio: new Date().toISOString().split('T')[0],
                    ativo: true,
                  });

                if (insertError) {
                  console.warn(`Erro ao adicionar papel ${papelId} para ${entidadeId}:`, insertError);
                }
              } catch (error) {
                console.warn(`Erro ao adicionar papel ${papelId}:`, error);
              }
            }
          }

          // Remover papéis
          if (updates.papeis.remove.length > 0) {
            const { error: removeError } = await supabase
              .from('entidade_papeis')
              .update({ 
                ativo: false, 
                data_fim: new Date().toISOString().split('T')[0] 
              })
              .eq('entidade_id', entidadeId)
              .in('papel_id', updates.papeis.remove)
              .eq('ativo', true);

            if (removeError) {
              console.warn(`Erro ao remover papéis para ${entidadeId}:`, removeError);
            }
          }
        }
      }

      setSelectedItems([]);
      setBulkEditModalOpen(false);
      
      // Adicionar ação de undo
      addUndoAction({
        id: `bulkEditEntities-${Date.now()}`,
        type: 'bulkEditEntities',
        data: { entidadeIds, count: selectedItems.length },
        originalData: { entidades: originalData },
      }, () => {
        loadEntidades();
      });

      toast.success(`${selectedItems.length} entidade${selectedItems.length !== 1 ? 's' : ''} atualizada${selectedItems.length !== 1 ? 's' : ''} com sucesso`);
      
      loadEntidades();
    } catch (error) {
      console.error('Error bulk editing entidades:', error);
      toast.error('Falha ao atualizar entidades em massa');
    } finally {
      setBulkEditLoading(false);
    }
  };

  const handleActivate = async (entidades: Entidade[]) => {
    await handleBulkEditSave({ ativo: true });
  };

  const handleDeactivate = async (entidades: Entidade[]) => {
    await handleBulkEditSave({ ativo: false });
  };

  const formatCpfCnpj = (cpfCnpj: string) => {
    if (!cpfCnpj) return '';
    const digits = cpfCnpj.replace(/\D/g, '');
    
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
    } else if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.***.***/****-$5');
    }
    return cpfCnpj;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Entidades Corporativas
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Funcionários e empresas • Para editar papéis, use a aba "Papéis" ao editar a pessoa
            </p>
          </div>
          <Button onClick={onNovaEntidade}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Entidade
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={papelFilter} onValueChange={setPapelFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os papéis</SelectItem>
              {papeis.map((papel) => (
                <SelectItem key={papel.nome} value={papel.nome}>
                  {papel.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <EntitiesTable
          data={entidades}
          loading={loading}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          onRowClick={(entidade) => {}} // Pode implementar navegação para detalhes
          onEdit={onEditarEntidade}
          onDelete={handleDelete}
          onView={onEntidadeSelect}
          onBulkEdit={handleBulkEdit}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
        />

        {/* Estatísticas */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Total: {entidades.length} entidades
          </div>
          
          <div className="flex gap-4">
            <span>PF: {entidades.filter(e => e.tipo_pessoa === 'fisica').length}</span>
            <span>PJ: {entidades.filter(e => e.tipo_pessoa === 'juridica').length}</span>
          </div>
        </div>
      </CardContent>

      {/* Bulk Edit Modal */}
      <EntityBulkEditModal
        open={bulkEditModalOpen}
        onOpenChange={setBulkEditModalOpen}
        selectedCount={selectedItems.length}
        onSave={handleBulkEditSave}
        loading={bulkEditLoading}
        availableRoles={papeis}
      />
    </Card>
  );
}