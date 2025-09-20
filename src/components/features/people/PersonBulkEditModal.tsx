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
import { Checkbox } from '@/components/ui/checkbox';
import { Users, UserCheck, UserX } from 'lucide-react';

interface PersonBulkEditData {
  ativo?: boolean;
  papeis?: {
    add: string[];
    remove: string[];
  };
}

interface PersonBulkEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSave: (updates: PersonBulkEditData) => void;
  loading?: boolean;
  availableRoles?: Array<{ id: string; nome: string }>;
}

export function PersonBulkEditModal({
  open,
  onOpenChange,
  selectedCount,
  onSave,
  loading = false,
  availableRoles = [],
}: PersonBulkEditModalProps) {
  const [updates, setUpdates] = useState<PersonBulkEditData>({});
  const [enabledFields, setEnabledFields] = useState({
    ativo: false,
    papeis: false,
  });
  const [roleActions, setRoleActions] = useState<{
    [key: string]: 'add' | 'remove' | 'none';
  }>({});

  const handleSave = () => {
    // Filtrar apenas os campos habilitados
    const filteredUpdates: PersonBulkEditData = {};
    
    if (enabledFields.ativo) {
      filteredUpdates.ativo = updates.ativo;
    }

    if (enabledFields.papeis) {
      const addRoles: string[] = [];
      const removeRoles: string[] = [];
      
      Object.entries(roleActions).forEach(([roleId, action]) => {
        if (action === 'add') {
          addRoles.push(roleId);
        } else if (action === 'remove') {
          removeRoles.push(roleId);
        }
      });

      if (addRoles.length > 0 || removeRoles.length > 0) {
        filteredUpdates.papeis = {
          add: addRoles,
          remove: removeRoles,
        };
      }
    }

    onSave(filteredUpdates);
    
    // Reset form
    setUpdates({});
    setEnabledFields({
      ativo: false,
      papeis: false,
    });
    setRoleActions({});
  };

  const handleCancel = () => {
    setUpdates({});
    setEnabledFields({
      ativo: false,
      papeis: false,
    });
    setRoleActions({});
    onOpenChange(false);
  };

  const handleRoleActionChange = (roleId: string, action: 'add' | 'remove' | 'none') => {
    setRoleActions(prev => ({
      ...prev,
      [roleId]: action,
    }));
  };

  const hasChanges = Object.values(enabledFields).some(enabled => enabled);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Editar Pessoas em Massa
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{selectedCount} pessoa{selectedCount !== 1 ? 's' : ''} selecionada{selectedCount !== 1 ? 's' : ''}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Selecione os campos que deseja atualizar para todas as pessoas selecionadas:
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enable-status">Status</Label>
                <p className="text-sm text-muted-foreground">
                  Alterar status ativo/inativo das pessoas
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
                    <UserCheck className="h-4 w-4 mr-2" />
                    Ativar
                  </Button>
                  <Button
                    type="button"
                    variant={updates.ativo === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUpdates(prev => ({ ...prev, ativo: false }))}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Desativar
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Papéis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enable-roles">Papéis</Label>
                <p className="text-sm text-muted-foreground">
                  Adicionar ou remover papéis das pessoas
                </p>
              </div>
              <Switch
                id="enable-roles"
                checked={enabledFields.papeis}
                onCheckedChange={(checked) =>
                  setEnabledFields(prev => ({ ...prev, papeis: checked }))
                }
              />
            </div>

            {enabledFields.papeis && (
              <div className="ml-4 space-y-4">
                <Label>Ações nos Papéis</Label>
                <div className="space-y-3">
                  {availableRoles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{role.nome}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={roleActions[role.id] === 'add' ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleRoleActionChange(role.id, 
                            roleActions[role.id] === 'add' ? 'none' : 'add'
                          )}
                        >
                          Adicionar
                        </Button>
                        <Button
                          type="button"
                          variant={roleActions[role.id] === 'remove' ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => handleRoleActionChange(role.id, 
                            roleActions[role.id] === 'remove' ? 'none' : 'remove'
                          )}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
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
            {loading ? 'Salvando...' : `Atualizar ${selectedCount} Pessoa${selectedCount !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
