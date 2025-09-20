import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Building2, Users } from 'lucide-react';

interface SupplierBulkEditData {
  ativo?: boolean;
}

interface SupplierBulkEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSave: (updates: SupplierBulkEditData) => void;
  loading?: boolean;
}

export function SupplierBulkEditModal({
  open,
  onOpenChange,
  selectedCount,
  onSave,
  loading = false,
}: SupplierBulkEditModalProps) {
  const [updates, setUpdates] = useState<SupplierBulkEditData>({});
  const [enabledFields, setEnabledFields] = useState({
    ativo: false,
  });

  const handleSave = () => {
    // Filtrar apenas os campos habilitados
    const filteredUpdates: SupplierBulkEditData = {};
    
    if (enabledFields.ativo) {
      filteredUpdates.ativo = updates.ativo;
    }

    onSave(filteredUpdates);
    
    // Reset form
    setUpdates({});
    setEnabledFields({
      ativo: false,
    });
  };

  const handleCancel = () => {
    setUpdates({});
    setEnabledFields({
      ativo: false,
    });
    onOpenChange(false);
  };

  const hasChanges = Object.values(enabledFields).some(enabled => enabled);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Editar Fornecedores em Massa
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{selectedCount} fornecedor{selectedCount !== 1 ? 'es' : ''} selecionado{selectedCount !== 1 ? 's' : ''}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Selecione os campos que deseja atualizar para todos os fornecedores selecionados:
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enable-status">Status</Label>
                <p className="text-sm text-muted-foreground">
                  Alterar status ativo/inativo dos fornecedores
                </p>
              </div>
              <Switch
                id="enable-status"
                checked={enabledFields.ativo}
                onCheckedChange={(checked) =>
                  setEnabledFields(prev => ({ ...prev, ativo: checked }))
                }
              />
            </div>

            {enabledFields.ativo && (
              <div className="ml-4 space-y-2">
                <Label>Novo Status</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={updates.ativo === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUpdates(prev => ({ ...prev, ativo: true }))}
                  >
                    <Badge variant="default" className="mr-2">Ativo</Badge>
                    Ativar
                  </Button>
                  <Button
                    type="button"
                    variant={updates.ativo === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUpdates(prev => ({ ...prev, ativo: false }))}
                  >
                    <Badge variant="secondary" className="mr-2">Inativo</Badge>
                    Desativar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || loading}
          >
            {loading ? 'Salvando...' : `Atualizar ${selectedCount} Fornecedor${selectedCount !== 1 ? 'es' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
