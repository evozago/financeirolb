import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, UserCheck, UserX, Building2, User, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EntityBulkEditData {
  ativo?: boolean;
  tipo_pessoa?: 'fisica' | 'juridica';
  papeis?: {
    add: string[];
    remove: string[];
  };
}

interface EntityBulkEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSave: (updates: EntityBulkEditData) => void;
  loading?: boolean;
  availableRoles?: Array<{ id: string; nome: string }>;
}

interface Papel {
  id: string;
  nome: string;
}

export function EntityBulkEditModal({
  open,
  onOpenChange,
  selectedCount,
  onSave,
  loading = false,
  availableRoles = [],
}: EntityBulkEditModalProps) {
  const [updates, setUpdates] = useState<EntityBulkEditData>({});
  const [enabledFields, setEnabledFields] = useState({
    ativo: false,
    tipo_pessoa: false,
    papeis: false,
  });
  const [roleActions, setRoleActions] = useState<{
    [key: string]: 'add' | 'remove' | 'none';
  }>({});
  const [papeis, setPapeis] = useState<Papel[]>([]);

  useEffect(() => {
    if (open) {
      loadPapeis();
    }
  }, [open]);

  const loadPapeis = async () => {
    try {
      const { data, error } = await supabase
        .from('papeis')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setPapeis(data || []);
    } catch (error) {
      console.error('Erro ao carregar papéis:', error);
    }
  };

  const handleSave = () => {
    // Filtrar apenas os campos habilitados
    const filteredUpdates: EntityBulkEditData = {};
    
    if (enabledFields.ativo) {
      filteredUpdates.ativo = updates.ativo;
    }

    if (enabledFields.tipo_pessoa) {
      filteredUpdates.tipo_pessoa = updates.tipo_pessoa;
    }

    if (enabledFields.papeis) {
      const addRoles: string[] = [];
      const removeRoles: string[] = [];
      
      Object.entries(roleActions).forEach(([roleId, action]) => {
        if (action === 'add') {
          const papel = papeis.find(p => p.id === roleId);
          if (papel) addRoles.push(papel.nome);
        } else if (action === 'remove') {
          const papel = papeis.find(p => p.id === roleId);
          if (papel) removeRoles.push(papel.nome);
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
      tipo_pessoa: false,
      papeis: false,
    });
    setRoleActions({});
  };

  const handleCancel = () => {
    setUpdates({});
    setEnabledFields({
      ativo: false,
      tipo_pessoa: false,
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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Editar Entidades em Massa
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building className="h-4 w-4" />
            <span>{selectedCount} entidade{selectedCount !== 1 ? 's' : ''} selecionada{selectedCount !== 1 ? 's' : ''}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Selecione os campos que deseja atualizar para todas as entidades selecionadas:
          </div>

          <Separator />

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enable-status">Status</Label>
                <p className="text-sm text-muted-foreground">
                  Alterar status ativo/inativo das entidades
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

          {/* Tipo de Pessoa */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enable-tipo">Tipo de Pessoa</Label>
                <p className="text-sm text-muted-foreground">
                  Alterar entre Pessoa Física (PF) ou Pessoa Jurídica (PJ)
                </p>
              </div>
              <Switch
                id="enable-tipo"
                checked={enabledFields.tipo_pessoa}
                onCheckedChange={(checked) =>
                  setEnabledFields(prev => ({ ...prev, tipo_pessoa: checked }))
                }
              />
            </div>

            {enabledFields.tipo_pessoa && (
              <div className="ml-4 space-y-2">
                <Label>Novo Tipo</Label>
                <Select 
                  value={updates.tipo_pessoa} 
                  onValueChange={(value: 'fisica' | 'juridica') => 
                    setUpdates(prev => ({ ...prev, tipo_pessoa: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo de pessoa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisica">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Pessoa Física (PF)
                      </div>
                    </SelectItem>
                    <SelectItem value="juridica">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Pessoa Jurídica (PJ)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                  Adicionar ou remover papéis das entidades
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
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {papeis.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
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
                
                {/* Resumo das ações selecionadas */}
                {Object.values(roleActions).some(action => action !== 'none') && (
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Resumo das Alterações:</Label>
                    <div className="mt-2 space-y-1">
                      {Object.entries(roleActions)
                        .filter(([_, action]) => action === 'add')
                        .map(([roleId, _]) => {
                          const papel = papeis.find(p => p.id === roleId);
                          return papel ? (
                            <div key={roleId} className="flex items-center gap-2 text-sm">
                              <Badge variant="default" className="bg-green-500">+</Badge>
                              Adicionar {papel.nome}
                            </div>
                          ) : null;
                        })}
                      {Object.entries(roleActions)
                        .filter(([_, action]) => action === 'remove')
                        .map(([roleId, _]) => {
                          const papel = papeis.find(p => p.id === roleId);
                          return papel ? (
                            <div key={roleId} className="flex items-center gap-2 text-sm">
                              <Badge variant="destructive">-</Badge>
                              Remover {papel.nome}
                            </div>
                          ) : null;
                        })}
                    </div>
                  </div>
                )}
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
            {loading ? 'Salvando...' : `Atualizar ${selectedCount} Entidade${selectedCount !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { EntityBulkEditData };
