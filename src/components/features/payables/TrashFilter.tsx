/**
 * Componente de filtro para visualizar itens na lixeira
 * Permite alternar entre visualização normal e lixeira
 */

import React from 'react';
import { Trash2, RotateCcw, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TrashFilterProps {
  showDeleted: boolean;
  onToggleDeleted: (show: boolean) => void;
  deletedCount?: number;
  className?: string;
}

export function TrashFilter({
  showDeleted,
  onToggleDeleted,
  deletedCount = 0,
  className,
}: TrashFilterProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant={showDeleted ? 'default' : 'outline'}
        size="sm"
        onClick={() => onToggleDeleted(!showDeleted)}
        className={cn(
          'flex items-center gap-2',
          showDeleted && 'bg-orange-600 hover:bg-orange-700'
        )}
      >
        {showDeleted ? (
          <>
            <Archive className="h-4 w-4" />
            Lixeira
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            Ver Lixeira
          </>
        )}
        {deletedCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {deletedCount}
          </Badge>
        )}
      </Button>

      {showDeleted && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Archive className="h-4 w-4" />
          <span>Visualizando itens deletados</span>
        </div>
      )}
    </div>
  );
}
