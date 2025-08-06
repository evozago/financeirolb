/**
 * Componente para personalização de colunas da tabela
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface ColumnConfig {
  key: string;
  header: string;
  visible: boolean;
  order: number;
}

interface ColumnCustomizerProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

interface SortableColumnItemProps {
  column: ColumnConfig;
  onVisibilityChange: (key: string, visible: boolean) => void;
}

function SortableColumnItem({ column, onVisibilityChange }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-background border rounded-lg"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <Checkbox
        id={column.key}
        checked={column.visible}
        onCheckedChange={(checked) => onVisibilityChange(column.key, !!checked)}
      />
      
      <label
        htmlFor={column.key}
        className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
      >
        {column.header}
      </label>
    </div>
  );
}

export function ColumnCustomizer({ columns, onColumnsChange }: ColumnCustomizerProps) {
  const [localColumns, setLocalColumns] = useState(columns);
  const [isOpen, setIsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = localColumns.findIndex(col => col.key === active.id);
      const newIndex = localColumns.findIndex(col => col.key === over.id);
      
      const newColumns = arrayMove(localColumns, oldIndex, newIndex).map((col, index) => ({
        ...col,
        order: index
      }));
      
      setLocalColumns(newColumns);
    }
  };

  const handleVisibilityChange = (key: string, visible: boolean) => {
    const newColumns = localColumns.map(col =>
      col.key === key ? { ...col, visible } : col
    );
    setLocalColumns(newColumns);
  };

  const handleApply = () => {
    onColumnsChange(localColumns);
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetColumns = columns.map(col => ({ ...col, visible: true }));
    setLocalColumns(resetColumns);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Personalizar Colunas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-background border border-border z-50">
        <DialogHeader>
          <DialogTitle>Personalizar Colunas</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Arraste para reordenar e marque/desmarque para mostrar/ocultar colunas.
          </p>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localColumns.map(col => col.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {localColumns.map((column) => (
                  <SortableColumnItem
                    key={column.key}
                    column={column}
                    onVisibilityChange={handleVisibilityChange}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Restaurar Padrão
            </Button>
            <Button onClick={handleApply}>
              Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}