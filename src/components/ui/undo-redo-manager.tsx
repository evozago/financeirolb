import React, { useEffect, useState } from 'react';
import { Undo, Redo, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUndoActions } from '@/hooks/useUndoActions';
import { cn } from '@/lib/utils';

interface UndoRedoManagerProps {
  className?: string;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function UndoRedoManager({ className, onUndo, onRedo }: UndoRedoManagerProps) {
  const { pendingActions, redoStack, handleUndo, handleRedo } = useUndoActions();
  const [timeLeft, setTimeLeft] = useState<Record<string, number>>({});

  // Update countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newTimeLeft: Record<string, number> = {};
      
      pendingActions.forEach(action => {
        const elapsed = now - action.timestamp;
        const remaining = Math.max(0, 8000 - elapsed); // 8 second timeout
        newTimeLeft[action.id] = Math.ceil(remaining / 1000);
      });
      
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingActions]);

  if (pendingActions.length === 0 && redoStack.length === 0) {
    return null;
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 space-y-2", className)}>
      {/* Undo Actions */}
      {pendingActions.map((action) => (
        <div
          key={action.id}
          className="bg-card border rounded-lg shadow-lg p-3 flex items-center gap-3 min-w-[300px] animate-slide-in-right"
        >
          <div className="flex-1">
            <p className="text-sm font-medium">
              {getActionTitle(action.type)}
            </p>
            <p className="text-xs text-muted-foreground">
              {getActionDescription(action.type, action.data)} 
              {timeLeft[action.id] > 0 && ` - ${timeLeft[action.id]}s restantes`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                handleUndo(action.id, onUndo);
              }}
              className="text-xs"
            >
              <Undo className="h-3 w-3 mr-1" />
              Desfazer
            </Button>
          </div>
        </div>
      ))}

      {/* Redo Actions */}
      {redoStack.map((action) => (
        <div
          key={action.id}
          className="bg-secondary border rounded-lg shadow-lg p-3 flex items-center gap-3 min-w-[300px] animate-slide-in-right"
        >
          <div className="flex-1">
            <p className="text-sm font-medium">
              Ação disponível para refazer
            </p>
            <p className="text-xs text-muted-foreground">
              {getActionTitle(action.type)} - {getActionDescription(action.type, action.data)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                handleRedo(action.id, onRedo);
              }}
              className="text-xs"
            >
              <Redo className="h-3 w-3 mr-1" />
              Refazer
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function getActionTitle(type: string): string {
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
}

function getActionDescription(type: string, data: any): string {
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
}