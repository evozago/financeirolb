/**
 * Seletor de entidade/empresa ativa para o sistema multi-CNPJ
 */

import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Entity {
  id: string;
  nome: string;
  cnpj_cpf?: string;
  tipo: string;
}

interface EntitySelectorProps {
  selectedEntityId?: string;
  onEntityChange: (entityId: string | null) => void;
  showAll?: boolean;
  className?: string;
}

export function EntitySelector({ 
  selectedEntityId, 
  onEntityChange, 
  showAll = true,
  className 
}: EntitySelectorProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    try {
      // Buscar fornecedores (PJ)
      const { data: fornecedores, error: errorFornecedores } = await supabase
        .from('fornecedores')
        .select('id, nome, cnpj_cpf, tipo_pessoa')
        .eq('ativo', true)
        .order('nome');

      // Buscar pessoas (PF)
      const { data: pessoas, error: errorPessoas } = await supabase
        .from('pessoas')
        .select('id, nome, cpf, tipo_pessoa')
        .eq('ativo', true)
        .order('nome');

      if (errorFornecedores) {
        console.error('Erro ao carregar fornecedores:', errorFornecedores);
      }
      if (errorPessoas) {
        console.error('Erro ao carregar pessoas:', errorPessoas);
      }

      // Unificar dados: PJ e PF juntos
      const allEntities = [
        ...(fornecedores || []).map(f => ({
          id: f.id,
          nome: `${f.nome} (PJ)`,
          cnpj_cpf: f.cnpj_cpf,
          tipo: 'PJ'
        })),
        ...(pessoas || []).map(p => ({
          id: p.id,
          nome: `${p.nome} (PF)`,
          cnpj_cpf: p.cpf,
          tipo: 'PF'
        }))
      ].sort((a, b) => a.nome.localeCompare(b.nome));

      setEntities(allEntities);
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCNPJ = (cnpj?: string) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const selectedEntity = entities.find(e => e.id === selectedEntityId);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Empresa Ativa:</span>
      </div>
      
      <Select 
        value={selectedEntityId || 'all'} 
        onValueChange={(value) => onEntityChange(value === 'all' ? null : value)}
        disabled={loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {loading ? (
              'Carregando...'
            ) : selectedEntity ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col items-start">
                  <span className="font-medium">{selectedEntity.nome}</span>
                  {selectedEntity.cnpj_cpf && (
                    <span className="text-xs text-muted-foreground">
                      CNPJ: {formatCNPJ(selectedEntity.cnpj_cpf)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              'Todas as empresas'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {showAll && (
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <span>Todas as empresas</span>
                <Badge variant="secondary" className="text-xs">
                  Consolidado
                </Badge>
              </div>
            </SelectItem>
          )}
          
          {entities.map((entity) => (
            <SelectItem key={entity.id} value={entity.id}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{entity.nome}</span>
                {entity.cnpj_cpf && (
                  <span className="text-xs text-muted-foreground">
                    CNPJ: {formatCNPJ(entity.cnpj_cpf)}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedEntity && (
        <div className="mt-2 text-xs text-muted-foreground">
          Visualizando dados de: <strong>{selectedEntity.nome}</strong>
        </div>
      )}
    </div>
  );
}