// src/hooks/useRoleManagement.ts
// Hook personalizado para gerenciamento de papéis com estado e cache

import { useState, useEffect, useCallback } from 'react';
import { RoleManager, EntityWithRoles } from '@/utils/roleManager';
import { toast } from '@/components/ui/use-toast';

export interface UseRoleManagementReturn {
  entities: EntityWithRoles[];
  availableRoles: { id: string; nome: string }[];
  loading: boolean;
  refreshing: boolean;
  addRole: (entityId: string, roleName: string) => Promise<boolean>;
  removeRole: (entityId: string, roleName: string) => Promise<boolean>;
  syncRoles: (entityId: string, roles: string[]) => Promise<boolean>;
  refreshData: () => Promise<void>;
  getEntityRoles: (entityId: string) => string[];
  hasRole: (entityId: string, roleName: string) => boolean;
}

export function useRoleManagement(): UseRoleManagementReturn {
  const [entities, setEntities] = useState<EntityWithRoles[]>([]);
  const [availableRoles, setAvailableRoles] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cache para evitar múltiplas requisições
  const [lastFetch, setLastFetch] = useState<number>(0);
  const CACHE_DURATION = 30000; // 30 segundos

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetch < CACHE_DURATION) {
      return; // Usar cache
    }

    const isRefresh = entities.length > 0;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Buscar entidades e papéis em paralelo
      const [entitiesData, rolesData] = await Promise.all([
        RoleManager.getEntitiesWithRoles(),
        RoleManager.getAvailableRoles()
      ]);

      setEntities(entitiesData);
      setAvailableRoles(rolesData);
      setLastFetch(now);

    } catch (err: any) {
      console.error('Erro ao buscar dados de papéis:', err);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Falha ao buscar entidades e papéis. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [entities.length, lastFetch]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Adicionar papel com atualização otimista
  const addRole = useCallback(async (entityId: string, roleName: string): Promise<boolean> => {
    try {
      // Atualização otimista
      setEntities(prev => prev.map(entity => 
        entity.id === entityId 
          ? { ...entity, roles: [...new Set([...entity.roles, roleName])] }
          : entity
      ));

      const result = await RoleManager.addRoleToEntity(entityId, roleName);
      
      if (result.success) {
        toast({
          title: 'Papel adicionado',
          description: result.message || `Papel "${roleName}" adicionado com sucesso.`
        });
        return true;
      } else {
        // Reverter atualização otimista
        setEntities(prev => prev.map(entity => 
          entity.id === entityId 
            ? { ...entity, roles: entity.roles.filter(r => r !== roleName) }
            : entity
        ));

        toast({
          title: 'Erro ao adicionar papel',
          description: result.message || 'Falha ao adicionar papel.',
          variant: 'destructive'
        });
        return false;
      }

    } catch (err: any) {
      // Reverter atualização otimista
      setEntities(prev => prev.map(entity => 
        entity.id === entityId 
          ? { ...entity, roles: entity.roles.filter(r => r !== roleName) }
          : entity
      ));

      console.error('Erro ao adicionar papel:', err);
      toast({
        title: 'Erro inesperado',
        description: 'Falha ao adicionar papel. Tente novamente.',
        variant: 'destructive'
      });
      return false;
    }
  }, []);

  // Remover papel com atualização otimista
  const removeRole = useCallback(async (entityId: string, roleName: string): Promise<boolean> => {
    try {
      // Atualização otimista
      setEntities(prev => prev.map(entity => 
        entity.id === entityId 
          ? { ...entity, roles: entity.roles.filter(r => r !== roleName) }
          : entity
      ));

      const result = await RoleManager.removeRoleFromEntity(entityId, roleName);
      
      if (result.success) {
        toast({
          title: 'Papel removido',
          description: result.message || `Papel "${roleName}" removido com sucesso.`
        });
        return true;
      } else {
        // Reverter atualização otimista
        setEntities(prev => prev.map(entity => 
          entity.id === entityId 
            ? { ...entity, roles: [...new Set([...entity.roles, roleName])] }
            : entity
        ));

        toast({
          title: 'Erro ao remover papel',
          description: result.message || 'Falha ao remover papel.',
          variant: 'destructive'
        });
        return false;
      }

    } catch (err: any) {
      // Reverter atualização otimista
      setEntities(prev => prev.map(entity => 
        entity.id === entityId 
          ? { ...entity, roles: [...new Set([...entity.roles, roleName])] }
          : entity
      ));

      console.error('Erro ao remover papel:', err);
      toast({
        title: 'Erro inesperado',
        description: 'Falha ao remover papel. Tente novamente.',
        variant: 'destructive'
      });
      return false;
    }
  }, []);

  // Sincronizar papéis
  const syncRoles = useCallback(async (entityId: string, roles: string[]): Promise<boolean> => {
    try {
      const originalEntity = entities.find(e => e.id === entityId);
      
      // Atualização otimista
      setEntities(prev => prev.map(entity => 
        entity.id === entityId 
          ? { ...entity, roles: [...roles] }
          : entity
      ));

      const result = await RoleManager.syncEntityRoles(entityId, roles);
      
      if (result.success) {
        toast({
          title: 'Papéis sincronizados',
          description: result.message || 'Papéis atualizados com sucesso.'
        });
        return true;
      } else {
        // Reverter atualização otimista
        if (originalEntity) {
          setEntities(prev => prev.map(entity => 
            entity.id === entityId 
              ? { ...entity, roles: originalEntity.roles }
              : entity
          ));
        }

        toast({
          title: 'Erro ao sincronizar papéis',
          description: result.message || 'Falha ao sincronizar papéis.',
          variant: 'destructive'
        });
        return false;
      }

    } catch (err: any) {
      console.error('Erro ao sincronizar papéis:', err);
      toast({
        title: 'Erro inesperado',
        description: 'Falha ao sincronizar papéis. Tente novamente.',
        variant: 'destructive'
      });
      return false;
    }
  }, [entities]);

  // Refresh manual
  const refreshData = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Utilitários
  const getEntityRoles = useCallback((entityId: string): string[] => {
    const entity = entities.find(e => e.id === entityId);
    return entity?.roles || [];
  }, [entities]);

  const hasRole = useCallback((entityId: string, roleName: string): boolean => {
    const entity = entities.find(e => e.id === entityId);
    return entity?.roles.includes(roleName) || false;
  }, [entities]);

  return {
    entities,
    availableRoles,
    loading,
    refreshing,
    addRole,
    removeRole,
    syncRoles,
    refreshData,
    getEntityRoles,
    hasRole
  };
}
