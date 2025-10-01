/**
 * Componente de notificação com botão de desfazer deleção
 * Aparece após deletar itens, permitindo restauração rápida
 */

import React, { useEffect, useState } from 'react';
import { RotateCcw, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UndoDeleteToastProps {
  show: boolean;
  itemCount: number;
  onUndo: () => void;
  onDismiss: () => void;
  autoHideDelay?: number; // em segundos
}

export function UndoDeleteToast({
  show,
  itemCount,
  onUndo,
  onDismiss,
  autoHideDelay = 10,
}: UndoDeleteToastProps) {
  const [timeLeft, setTimeLeft] = useState(autoHideDelay);

  useEffect(() => {
    if (!show) {
      setTimeLeft(autoHideDelay);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [show, autoHideDelay, onDismiss]);

  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-md',
        'bg-white border border-gray-200 rounded-lg shadow-lg',
        'transform transition-all duration-300 ease-in-out',
        show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-medium text-gray-900">
              {itemCount} item(s) movido(s) para a lixeira
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Os itens podem ser restaurados a qualquer momento
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
              <Clock className="h-3 w-3" />
              <span>Auto-ocultar em {timeLeft}s</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={onUndo}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Desfazer
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-blue-600 h-1 rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${(timeLeft / autoHideDelay) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
