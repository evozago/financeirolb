import { useState, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface UndoAction {
  id: string;
  type: 'markAsPaid' | 'delete' | 'bulkEdit';
  data: any;
  originalData: any;
  timestamp: number;
}

export function useUndoActions() {
  const [pendingActions, setPendingActions] = useState<UndoAction[]>([]);
  const timeoutRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const addUndoAction = (action: Omit<UndoAction, 'timestamp'>, onUndo?: () => void) => {
    const actionWithTimestamp: UndoAction = {
      ...action,
      timestamp: Date.now(),
    };

    setPendingActions(prev => [...prev, actionWithTimestamp]);

    // Mostrar toast com opção de desfazer
    toast({
      title: getActionTitle(action.type),
      description: `${getActionDescription(action.type, action.data)} - Clique na notificação para desfazer`,
      duration: 8000,
      onClick: () => handleUndo(actionWithTimestamp.id, onUndo),
    });

    // Auto-remover após 8 segundos
    timeoutRefs.current[actionWithTimestamp.id] = setTimeout(() => {
      removePendingAction(actionWithTimestamp.id);
    }, 8000);

    return actionWithTimestamp.id;
  };

  const handleUndo = async (actionId: string, onUndo?: () => void) => {
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;

    try {
      await executeUndo(action);
      
      // Executar callback de undo se fornecido
      if (onUndo) {
        onUndo();
      }
      
      toast({
        title: "Ação desfeita",
        description: "A ação anterior foi desfeita com sucesso",
      });
    } catch (error) {
      console.error('Erro ao desfazer ação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desfazer a ação",
        variant: "destructive",
      });
    } finally {
      removePendingAction(actionId);
    }
  };

  const executeUndo = async (action: UndoAction) => {
    switch (action.type) {
      case 'markAsPaid':
        // Reverter status para o estado original
        const { error: markAsOpenError } = await supabase
          .from('ap_installments')
          .update({
            status: action.originalData.status,
            data_pagamento: action.originalData.data_pagamento,
            data_hora_pagamento: action.originalData.data_hora_pagamento,
            updated_at: new Date().toISOString(),
          })
          .in('id', action.data.itemIds);
        
        if (markAsOpenError) throw markAsOpenError;
        break;

      case 'delete':
        // Restaurar registros marcando como não deletados (soft delete)
        const { error: restoreError } = await supabase
          .from('ap_installments')
          .update({ deleted_at: null })
          .in('id', action.data.itemIds);
        
        if (restoreError) throw restoreError;
        break;

      case 'bulkEdit':
        // Reverter para os dados originais
        for (const item of action.originalData.items) {
          const { error } = await supabase
            .from('ap_installments')
            .update({
              categoria: item.categoria,
              status: item.status,
              data_vencimento: item.data_vencimento,
              forma_pagamento: item.forma_pagamento,
              observacoes: item.observacoes,
              banco: item.banco,
              data_pagamento: item.data_pagamento,
              data_hora_pagamento: item.data_hora_pagamento,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id);
          
          if (error) throw error;
        }
        break;
    }
  };

  const removePendingAction = (actionId: string) => {
    setPendingActions(prev => prev.filter(a => a.id !== actionId));
    
    if (timeoutRefs.current[actionId]) {
      clearTimeout(timeoutRefs.current[actionId]);
      delete timeoutRefs.current[actionId];
    }
  };

  const getActionTitle = (type: UndoAction['type']): string => {
    switch (type) {
      case 'markAsPaid':
        return 'Marcado como pago';
      case 'delete':
        return 'Registros excluídos';
      case 'bulkEdit':
        return 'Edição em massa realizada';
      default:
        return 'Ação realizada';
    }
  };

  const getActionDescription = (type: UndoAction['type'], data: any): string => {
    const count = Array.isArray(data.itemIds) ? data.itemIds.length : data.count || 1;
    
    switch (type) {
      case 'markAsPaid':
        return `${count} parcela(s) marcada(s) como paga(s)`;
      case 'delete':
        return `${count} registro(s) excluído(s)`;
      case 'bulkEdit':
        return `${count} parcela(s) atualizada(s)`;
      default:
        return 'Ação realizada';
    }
  };

  return {
    addUndoAction,
    handleUndo,
    pendingActions,
  };
}