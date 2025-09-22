// src/utils/roleManager.ts
// Utilitário para gerenciamento robusto de papéis com tratamento de conflitos

import { supabase } from '@/integrations/supabase/client';

export interface RoleAssignment {
  entityId: string;
  roleName: string;
  active?: boolean;
}

export interface EntityWithRoles {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  ativo: boolean;
  roles: string[];
  source: 'pessoas' | 'entidades' | 'fornecedores';
}

export class RoleManager {
  
  /**
   * Adiciona um papel a uma entidade com tratamento robusto de conflitos
   */
  static async addRoleToEntity(entityId: string, roleName: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Primeiro, tentar usar a função do banco que criamos
      const { data, error } = await supabase
        .rpc('add_papel_to_entidade', {
          p_entidade_id: entityId,
          p_papel_nome: roleName
        });

      if (!error && data === true) {
        return { success: true };
      }

      // Se a função não existir ou falhar, usar método direto
      if (error?.message?.includes('function') && error.message.includes('does not exist')) {
        return await this.addRoleDirectly(entityId, roleName);
      }

      // Se houve outro erro, tentar método direto como fallback
      if (error) {
        console.warn('Erro na função RPC, tentando método direto:', error);
        return await this.addRoleDirectly(entityId, roleName);
      }

      return { success: false, message: 'Resposta inesperada da função' };

    } catch (err: any) {
      console.error('Erro ao adicionar papel:', err);
      return await this.addRoleDirectly(entityId, roleName);
    }
  }

  /**
   * Método direto para adicionar papel com tratamento de conflitos
   */
  private static async addRoleDirectly(entityId: string, roleName: string): Promise<{ success: boolean; message?: string }> {
    try {
      // 1. Buscar ID do papel
      const { data: role, error: roleError } = await supabase
        .from('papeis')
        .select('id')
        .eq('nome', roleName)
        .eq('ativo', true)
        .maybeSingle();

      if (roleError) {
        return { success: false, message: `Erro ao buscar papel: ${roleError.message}` };
      }

      if (!role) {
        // Tentar criar o papel se não existir
        const { data: newRole, error: createError } = await supabase
          .from('papeis')
          .insert({ nome: roleName, ativo: true })
          .select('id')
          .single();

        if (createError) {
          return { success: false, message: `Papel '${roleName}' não encontrado e não foi possível criar: ${createError.message}` };
        }

        role.id = newRole.id;
      }

      // 2. Verificar se já existe relacionamento
      const { data: existing, error: existingError } = await supabase
        .from('entidade_papeis')
        .select('id, ativo')
        .eq('entidade_id', entityId)
        .eq('papel_id', role.id)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') {
        return { success: false, message: `Erro ao verificar relacionamento existente: ${existingError.message}` };
      }

      // 3. Se já existe e está ativo, não fazer nada
      if (existing?.ativo) {
        return { success: true, message: 'Papel já atribuído' };
      }

      // 4. Se existe mas está inativo, reativar
      if (existing && !existing.ativo) {
        const { error: updateError } = await supabase
          .from('entidade_papeis')
          .update({ 
            ativo: true, 
            updated_at: new Date().toISOString(),
            data_fim: null 
          })
          .eq('id', existing.id);

        if (updateError) {
          return { success: false, message: `Erro ao reativar papel: ${updateError.message}` };
        }

        return { success: true, message: 'Papel reativado' };
      }

      // 5. Inserir novo relacionamento
      const { error: insertError } = await supabase
        .from('entidade_papeis')
        .insert({
          entidade_id: entityId,
          papel_id: role.id,
          ativo: true
        });

      if (insertError) {
        // Se for violação de chave única, tentar reativar
        if (insertError.code === '23505') {
          const { error: reactivateError } = await supabase
            .from('entidade_papeis')
            .update({ 
              ativo: true, 
              updated_at: new Date().toISOString(),
              data_fim: null 
            })
            .eq('entidade_id', entityId)
            .eq('papel_id', role.id);

          if (reactivateError) {
            return { success: false, message: `Erro ao reativar após conflito: ${reactivateError.message}` };
          }

          return { success: true, message: 'Papel reativado após conflito' };
        }

        return { success: false, message: `Erro ao inserir papel: ${insertError.message}` };
      }

      return { success: true, message: 'Papel adicionado com sucesso' };

    } catch (err: any) {
      console.error('Erro no método direto:', err);
      return { success: false, message: `Erro inesperado: ${err.message}` };
    }
  }

  /**
   * Remove um papel de uma entidade
   */
  static async removeRoleFromEntity(entityId: string, roleName: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Tentar usar a função do banco primeiro
      const { data, error } = await supabase
        .rpc('remove_papel_from_entidade', {
          p_entidade_id: entityId,
          p_papel_nome: roleName
        });

      if (!error && data === true) {
        return { success: true };
      }

      // Fallback para método direto
      return await this.removeRoleDirectly(entityId, roleName);

    } catch (err: any) {
      console.error('Erro ao remover papel:', err);
      return await this.removeRoleDirectly(entityId, roleName);
    }
  }

  /**
   * Método direto para remover papel
   */
  private static async removeRoleDirectly(entityId: string, roleName: string): Promise<{ success: boolean; message?: string }> {
    try {
      // 1. Buscar ID do papel
      const { data: role, error: roleError } = await supabase
        .from('papeis')
        .select('id')
        .eq('nome', roleName)
        .eq('ativo', true)
        .single();

      if (roleError || !role) {
        return { success: false, message: `Papel '${roleName}' não encontrado` };
      }

      // 2. Desativar relacionamento
      const { error: updateError } = await supabase
        .from('entidade_papeis')
        .update({ 
          ativo: false, 
          updated_at: new Date().toISOString(),
          data_fim: new Date().toISOString()
        })
        .eq('entidade_id', entityId)
        .eq('papel_id', role.id)
        .eq('ativo', true);

      if (updateError) {
        return { success: false, message: `Erro ao remover papel: ${updateError.message}` };
      }

      return { success: true };

    } catch (err: any) {
      console.error('Erro no método direto de remoção:', err);
      return { success: false, message: `Erro inesperado: ${err.message}` };
    }
  }

  /**
   * Busca entidades com seus papéis de forma robusta
   */
  static async getEntitiesWithRoles(): Promise<EntityWithRoles[]> {
    const entities: EntityWithRoles[] = [];

    try {
      // Tentar função unificada primeiro
      const { data: entitiesData, error: entitiesError } = await supabase
        .rpc('get_entidades_with_papeis');

      if (!entitiesError && entitiesData) {
        entities.push(...entitiesData.map((e: any) => ({
          id: e.id,
          nome: e.nome_razao_social || e.nome,
          email: e.email,
          telefone: e.telefone,
          cpf_cnpj: e.cpf_cnpj,
          ativo: e.ativo,
          roles: e.papeis || [],
          source: 'entidades' as const
        })));
      }

      // Fallback para pessoas
      const { data: pessoasData, error: pessoasError } = await supabase
        .rpc('get_pessoas_with_papeis');

      if (!pessoasError && pessoasData) {
        pessoasData.forEach((p: any) => {
          // Evitar duplicatas
          const exists = entities.some(e => e.id === p.id);
          if (!exists) {
            entities.push({
              id: p.id,
              nome: p.nome,
              email: p.email,
              telefone: p.telefone,
              cpf_cnpj: p.cpf,
              ativo: p.ativo,
              roles: p.papeis || [],
              source: 'pessoas' as const
            });
          }
        });
      }

      // Fallback final para busca direta
      if (entities.length === 0) {
        await this.fallbackDirectQuery(entities);
      }

    } catch (err) {
      console.error('Erro ao buscar entidades com papéis:', err);
      await this.fallbackDirectQuery(entities);
    }

    return entities;
  }

  /**
   * Busca direta como último recurso
   */
  private static async fallbackDirectQuery(entities: EntityWithRoles[]): Promise<void> {
    try {
      // Buscar de entidades_corporativas
      const { data: entidadesCorp, error: entError } = await supabase
        .from('entidades_corporativas')
        .select(`
          id, nome_razao_social, email, telefone, cpf_cnpj, ativo,
          entidade_papeis!inner(
            papel_id,
            ativo,
            papeis(nome)
          )
        `)
        .eq('ativo', true)
        .eq('entidade_papeis.ativo', true);

      if (!entError && entidadesCorp) {
        const entitiesMap = new Map<string, EntityWithRoles>();
        
        entidadesCorp.forEach((e: any) => {
          const entityId = e.id;
          if (!entitiesMap.has(entityId)) {
            entitiesMap.set(entityId, {
              id: entityId,
              nome: e.nome_razao_social,
              email: e.email,
              telefone: e.telefone,
              cpf_cnpj: e.cpf_cnpj,
              ativo: e.ativo,
              roles: [],
              source: 'entidades' as const
            });
          }
          
          const entity = entitiesMap.get(entityId)!;
          e.entidade_papeis.forEach((ep: any) => {
            if (ep.papeis?.nome && !entity.roles.includes(ep.papeis.nome)) {
              entity.roles.push(ep.papeis.nome);
            }
          });
        });

        entities.push(...Array.from(entitiesMap.values()));
      }

    } catch (err) {
      console.error('Erro na busca direta:', err);
    }
  }

  /**
   * Busca todos os papéis disponíveis
   */
  static async getAvailableRoles(): Promise<{ id: string; nome: string }[]> {
    try {
      const { data, error } = await supabase
        .from('papeis')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar papéis:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Erro inesperado ao buscar papéis:', err);
      return [];
    }
  }

  /**
   * Sincroniza papéis de uma entidade
   */
  static async syncEntityRoles(entityId: string, desiredRoles: string[]): Promise<{ success: boolean; message?: string }> {
    try {
      // Buscar papéis atuais
      const { data: currentRoles, error: currentError } = await supabase
        .from('entidade_papeis')
        .select(`
          papel_id,
          ativo,
          papeis(nome)
        `)
        .eq('entidade_id', entityId);

      if (currentError) {
        return { success: false, message: `Erro ao buscar papéis atuais: ${currentError.message}` };
      }

      const activeRoles = (currentRoles || [])
        .filter(r => r.ativo && r.papeis?.nome)
        .map(r => r.papeis.nome);

      // Papéis para adicionar
      const toAdd = desiredRoles.filter(role => !activeRoles.includes(role));
      
      // Papéis para remover
      const toRemove = activeRoles.filter(role => !desiredRoles.includes(role));

      // Executar adições
      for (const role of toAdd) {
        const result = await this.addRoleToEntity(entityId, role);
        if (!result.success) {
          console.warn(`Falha ao adicionar papel ${role}:`, result.message);
        }
      }

      // Executar remoções
      for (const role of toRemove) {
        const result = await this.removeRoleFromEntity(entityId, role);
        if (!result.success) {
          console.warn(`Falha ao remover papel ${role}:`, result.message);
        }
      }

      return { success: true, message: `Sincronizados ${toAdd.length} adições e ${toRemove.length} remoções` };

    } catch (err: any) {
      console.error('Erro ao sincronizar papéis:', err);
      return { success: false, message: `Erro inesperado: ${err.message}` };
    }
  }
}
