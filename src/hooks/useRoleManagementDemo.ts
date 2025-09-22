// Hook demo para gerenciamento de papéis sem dependência do Supabase
// Para testes e desenvolvimento quando há problemas de conectividade

import { useState, useEffect, useCallback } from 'react';
import { RoleManagerDemo, EntityWithRoles } from '@/utils/roleManagerDemo';
import { toast } from '@/components/ui/use-toast';

export interface UseRoleManagementReturn {
  entities: EntityWithRoles[];
  availableRoles: { id: string; nome: string; descricao?: string; ativo: boolean }[];
  loading: boolean;
  refreshing: boolean;
  addRole: (entityId: string, roleName: string) => Promise<boolean>;
  removeRole: (entityId: string, roleName: string) => Promise<boolean>;
  syncRoles: (entityId: string, roles: string[]) => Promise<boolean>;
  refreshData: () => Promise<void>;
  getEntityRoles: (entityId: string) => string[];
  hasRole: (entityId: string, roleName: string) => boolean;
  createRole: (nome: string, descricao?: string) => Promise<boolean>;
  updateRole: (id: string, updates: { nome?: string; descricao?: string; ativo?: boolean }) => Promise<boolean>;
  deleteRole: (id: string) => Promise<boolean>;
  roleStats: { [roleName: string]: number };
}

export function useRoleManagementDemo(): UseRoleManagementReturn {
  const [entities, setEntities] = useState<EntityWithRoles[]>([]);
  const [availableRoles, setAvailableRoles] = useState<{ id: string; nome: string; descricao?: string; ativo: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleStats, setRoleStats] = useState<{ [roleName: string]: number }>({});

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
      // Buscar entidades, papéis e estatísticas em paralelo
      const [entitiesData, rolesData, statsData] = await Promise.all([
        RoleManagerDemo.getEntitiesWithRoles(),
        RoleManagerDemo.getAvailableRoles(),
        RoleManagerDemo.getRoleStats()
      ]);

      setEntities(entitiesData);
      setAvailableRoles(rolesData);
      setRoleStats(statsData);
      setLastFetch(now);

    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
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

  const refreshData = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const addRole = useCallback(async (entityId: string, roleName: string): Promise<boolean> => {
    try {
      const result = await RoleManagerDemo.addRoleToEntity(entityId, roleName);
      
      if (result.success) {
        toast({
          title: "Papel adicionado",
          description: `Papel "${roleName}" adicionado com sucesso`,
        });
        await refreshData();
        return true;
      } else {
        toast({
          title: "Erro ao adicionar papel",
          description: result.message || "Erro desconhecido",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao adicionar papel:', error);
      toast({
        title: "Erro ao adicionar papel",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    }
  }, [refreshData]);

  const removeRole = useCallback(async (entityId: string, roleName: string): Promise<boolean> => {
    try {
      const result = await RoleManagerDemo.removeRoleFromEntity(entityId, roleName);
      
      if (result.success) {
        toast({
          title: "Papel removido",
          description: `Papel "${roleName}" removido com sucesso`,
        });
        await refreshData();
        return true;
      } else {
        toast({
          title: "Erro ao remover papel",
          description: result.message || "Erro desconhecido",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao remover papel:', error);
      toast({
        title: "Erro ao remover papel",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    }
  }, [refreshData]);

  const syncRoles = useCallback(async (entityId: string, roles: string[]): Promise<boolean> => {
    try {
      const result = await RoleManagerDemo.syncEntityRoles(entityId, roles);
      
      if (result.success) {
        toast({
          title: "Papéis sincronizados",
          description: "Papéis da entidade atualizados com sucesso",
        });
        await refreshData();
        return true;
      } else {
        toast({
          title: "Erro ao sincronizar papéis",
          description: result.message || "Erro desconhecido",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao sincronizar papéis:', error);
      toast({
        title: "Erro ao sincronizar papéis",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    }
  }, [refreshData]);

  const createRole = useCallback(async (nome: string, descricao?: string): Promise<boolean> => {
    try {
      const result = await RoleManagerDemo.createRole(nome, descricao);
      
      if (result.success) {
        toast({
          title: "Papel criado",
          description: `Papel "${nome}" criado com sucesso`,
        });
        await refreshData();
        return true;
      } else {
        toast({
          title: "Erro ao criar papel",
          description: result.message || "Erro desconhecido",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao criar papel:', error);
      toast({
        title: "Erro ao criar papel",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    }
  }, [refreshData]);

  const updateRole = useCallback(async (id: string, updates: { nome?: string; descricao?: string; ativo?: boolean }): Promise<boolean> => {
    try {
      const result = await RoleManagerDemo.updateRole(id, updates);
      
      if (result.success) {
        toast({
          title: "Papel atualizado",
          description: "Papel atualizado com sucesso",
        });
        await refreshData();
        return true;
      } else {
        toast({
          title: "Erro ao atualizar papel",
          description: result.message || "Erro desconhecido",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao atualizar papel:', error);
      toast({
        title: "Erro ao atualizar papel",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    }
  }, [refreshData]);

  const deleteRole = useCallback(async (id: string): Promise<boolean> => {
    try {
      const result = await RoleManagerDemo.deleteRole(id);
      
      if (result.success) {
        toast({
          title: "Papel excluído",
          description: "Papel excluído com sucesso",
        });
        await refreshData();
        return true;
      } else {
        toast({
          title: "Erro ao excluir papel",
          description: result.message || "Erro desconhecido",
          variant: "destructive",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao excluir papel:', error);
      toast({
        title: "Erro ao excluir papel",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    }
  }, [refreshData]);

  const getEntityRoles = useCallback((entityId: string): string[] => {
    const entity = entities.find(e => e.id === entityId);
    return entity ? entity.roles : [];
  }, [entities]);

  const hasRole = useCallback((entityId: string, roleName: string): boolean => {
    const entity = entities.find(e => e.id === entityId);
    return entity ? entity.roles.includes(roleName) : false;
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
    hasRole,
    createRole,
    updateRole,
    deleteRole,
    roleStats
  };
}
