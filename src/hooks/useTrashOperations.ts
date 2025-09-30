/**
 * Hook personalizado para gerenciar operações da lixeira
 * Inclui restaurar e deletar permanentemente
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BillToPayInstallment } from '@/types/payables';
import { toast } from 'sonner';

export function useTrashOperations() {
  const [loading, setLoading] = useState(false);

  const restoreItems = async (items: BillToPayInstallment[]) => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      const itemIds = items.map(item => item.id);
      
      const { error } = await supabase
        .from('ap_installments')
        .update({ 
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .in('id', itemIds);

      if (error) {
        console.error('Erro ao restaurar itens:', error);
        toast.error('Erro ao restaurar itens da lixeira');
        return false;
      }

      toast.success(
        `${items.length} item(s) restaurado(s) com sucesso`,
        {
          description: 'Os itens foram movidos de volta para a lista principal'
        }
      );

      return true;
    } catch (error) {
      console.error('Erro ao restaurar itens:', error);
      toast.error('Erro inesperado ao restaurar itens');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const permanentlyDeleteItems = async (items: BillToPayInstallment[]) => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      const itemIds = items.map(item => item.id);
      
      const { error } = await supabase
        .from('ap_installments')
        .delete()
        .in('id', itemIds);

      if (error) {
        console.error('Erro ao deletar permanentemente:', error);
        toast.error('Erro ao deletar itens permanentemente');
        return false;
      }

      toast.success(
        `${items.length} item(s) deletado(s) permanentemente`,
        {
          description: 'Os itens foram removidos definitivamente do sistema'
        }
      );

      return true;
    } catch (error) {
      console.error('Erro ao deletar permanentemente:', error);
      toast.error('Erro inesperado ao deletar itens');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const softDeleteItems = async (items: BillToPayInstallment[]) => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      const itemIds = items.map(item => item.id);
      
      const { error } = await supabase
        .from('ap_installments')
        .update({ 
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .in('id', itemIds);

      if (error) {
        console.error('Erro ao mover para lixeira:', error);
        toast.error('Erro ao mover itens para a lixeira');
        return false;
      }

      toast.success(
        `${items.length} item(s) movido(s) para a lixeira`,
        {
          description: 'Os itens podem ser restaurados a qualquer momento',
          action: {
            label: 'Desfazer',
            onClick: () => restoreItems(items)
          }
        }
      );

      return true;
    } catch (error) {
      console.error('Erro ao mover para lixeira:', error);
      toast.error('Erro inesperado ao mover itens');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getDeletedCount = async (): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('ap_installments')
        .select('*', { count: 'exact', head: true })
        .not('deleted_at', 'is', null);

      if (error) {
        console.error('Erro ao contar itens deletados:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Erro ao contar itens deletados:', error);
      return 0;
    }
  };

  return {
    loading,
    restoreItems,
    permanentlyDeleteItems,
    softDeleteItems,
    getDeletedCount,
  };
}
