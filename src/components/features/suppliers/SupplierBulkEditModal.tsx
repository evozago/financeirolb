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
import { Checkbox } from '@/components/ui/checkbox';
import { Truck, UserCheck, UserX, Building2, User, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SupplierBulkEditData {
  ativo?: boolean;
  tipo_pessoa?: 'pessoa_fisica' | 'pessoa_juridica';
  marcas?: {
    add: string[];
    remove: string[];
  };
}

interface SupplierBulkEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSave: (updates: SupplierBulkEditData) => void;
  loading?: boolean;
}

interface Marca {
  id: string;
  nome: string;
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
    tipo_pessoa: false,
    marcas: false,
  });
  const [marcaActions, setMarcaActions] = useState<{
    [key: string]: 'add' | 'remove' | 'none';
  }>({});
  const [marcas, setMarcas] = useState<Marca[]>([]);

  useEffect(() => {
    if (open) {
      loadMarcas();
    }
  }, [open]);

  const loadMarcas = async () => {
    try {
      // Buscar marcas existentes no sistema
      // Como não temos uma tabela específica de marcas, vamos criar algumas padrões
      // ou buscar de uma tabela de configuração
      const marcasPadrao: Marca[] = [
        { id: '1', nome: 'Grendene' },
        { id: '2', nome: 'Melissa' },
        { id: '3', nome: 'Ipanema' },
        { id: '4', nome: 'Rider' },
        { id: '5', nome: 'Zaxy' },
        { id: '6', nome: 'Cartago' },
        { id: '7', nome: 'Pampili' },
        { id: '8', nome: 'Infantil' },
        { id: '9', nome: 'Masculino' },
        { id: '10', nome: 'Feminino' },
      ];
      
      setMarcas(marcasPadrao);
    } catch (error) {
      console.error('Erro ao carregar marcas:', error);
    }
  };

  const handleSave = () => {
    // Filtrar apenas os campos habilitados
    const filteredUpdates: SupplierBulkEditData = {};
    
    if (enabledFields.ativo) {
      filteredUpdates.ativo = updates.ativo;
    }

    if (enabledFields.tipo_pessoa) {
      filteredUpdates.tipo_pessoa = updates.tipo_pessoa;
    }

    if (enabledFields.marcas) {
      const addMarcas: string[] = [];
      const removeMarcas: string[] = [];
      
      Object.entries(marcaActions).forEach(([marcaId, action]) => {
        if (action === 'add') {
          const marca = marcas.find(m => m.id === marcaId);
          if (marca) addMarcas.push(marca.nome);
        } else if (action === 'remove') {
          const marca = marcas.find(m => m.id === marcaId);
          if (marca) removeMarcas.push(marca.nome);
        }
      });

      if (addMarcas.length > 0 || removeMarcas.length > 0) {
        filteredUpdates.marcas = {
          add: addMarcas,
          remove: removeMarcas,
        };
      }
    }

    onSave(filteredUpdates);
    
    // Reset form
    setUpdates({});
    setEnabledFields({
      ativo: false,
      tipo_pessoa: false,
      marcas: false,
    });
    setMarcaActions({});
  };

  const handleCancel = () => {
    setUpdates({});
    setEnabledFields({
      ativo: false,
      tipo_pessoa: false,
      marcas: false,
    });
    setMarcaActions({});
    onOpenChange(false);
  };

  const handleMarcaActionChange = (marcaId: string, action: 'add' | 'remove' | 'none') => {
    setMarcaActions(prev => ({
      ...prev,
      [marcaId]: action,
    }));
  };

  const hasChanges = Object.values(enabledFields).some(enabled => enabled);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Editar Fornecedores em Massa
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
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
                  onValueChange={(value: 'pessoa_fisica' | 'pessoa_juridica') => 
                    setUpdates(prev => ({ ...prev, tipo_pessoa: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo de pessoa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pessoa_fisica">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Pessoa Física (PF)
                      </div>
                    </SelectItem>
                    <SelectItem value="pessoa_juridica">
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

          {/* Marcas Associadas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="enable-marcas">Marcas Associadas</Label>
                <p className="text-sm text-muted-foreground">
                  Adicionar ou remover marcas dos fornecedores
                </p>
              </div>
              <Switch
                id="enable-marcas"
                checked={enabledFields.marcas}
                onCheckedChange={(checked) =>
                  setEnabledFields(prev => ({ ...prev, marcas: checked }))
                }
              />
            </div>

            {enabledFields.marcas && (
              <div className="ml-4 space-y-4">
                <Label>Ações nas Marcas</Label>
                <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                  {marcas.map((marca) => (
                    <div key={marca.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        <Badge variant="outline">{marca.nome}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={marcaActions[marca.id] === 'add' ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleMarcaActionChange(marca.id, 
                            marcaActions[marca.id] === 'add' ? 'none' : 'add'
                          )}
                        >
                          Adicionar
                        </Button>
                        <Button
                          type="button"
                          variant={marcaActions[marca.id] === 'remove' ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => handleMarcaActionChange(marca.id, 
                            marcaActions[marca.id] === 'remove' ? 'none' : 'remove'
                          )}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Resumo das ações selecionadas */}
                {Object.values(marcaActions).some(action => action !== 'none') && (
                  <div className="p-3 bg-muted rounded-lg">
                    <Label className="text-sm font-medium">Resumo das Alterações:</Label>
                    <div className="mt-2 space-y-1">
                      {Object.entries(marcaActions)
                        .filter(([_, action]) => action === 'add')
                        .map(([marcaId, _]) => {
                          const marca = marcas.find(m => m.id === marcaId);
                          return marca ? (
                            <div key={marcaId} className="flex items-center gap-2 text-sm">
                              <Badge variant="default" className="bg-green-500">+</Badge>
                              Adicionar {marca.nome}
                            </div>
                          ) : null;
                        })}
                      {Object.entries(marcaActions)
                        .filter(([_, action]) => action === 'remove')
                        .map(([marcaId, _]) => {
                          const marca = marcas.find(m => m.id === marcaId);
                          return marca ? (
                            <div key={marcaId} className="flex items-center gap-2 text-sm">
                              <Badge variant="destructive">-</Badge>
                              Remover {marca.nome}
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
            {loading ? 'Salvando...' : `Atualizar ${selectedCount} Fornecedor${selectedCount !== 1 ? 'es' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { SupplierBulkEditData };
