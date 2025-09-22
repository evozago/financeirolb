// Versão demo do RoleManager que funciona sem autenticação/RLS
// Para testes e desenvolvimento quando Supabase não está acessível

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

export interface Role {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Dados locais para demonstração
let localRoles: Role[] = [
  {
    id: '1',
    nome: 'cliente',
    descricao: 'Cliente da empresa',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    nome: 'fornecedor',
    descricao: 'Fornecedor de produtos ou serviços',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    nome: 'funcionario',
    descricao: 'Funcionário da empresa',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    nome: 'vendedor',
    descricao: 'Responsável por vendas',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let localEntities: EntityWithRoles[] = [
  {
    id: '1',
    nome: 'Maria Silva',
    email: 'maria@exemplo.com',
    telefone: '11999999999',
    ativo: true,
    roles: ['vendedor', 'funcionario'],
    source: 'pessoas'
  },
  {
    id: '2',
    nome: 'João Santos',
    email: 'joao@exemplo.com',
    telefone: '11888888888',
    ativo: true,
    roles: ['cliente'],
    source: 'pessoas'
  }
];

export class RoleManagerDemo {
  
  /**
   * Busca todos os papéis disponíveis
   */
  static async getAvailableRoles(): Promise<{ id: string; nome: string; descricao?: string; ativo: boolean }[]> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return localRoles.filter(role => role.ativo).map(role => ({
      id: role.id,
      nome: role.nome,
      descricao: role.descricao,
      ativo: role.ativo
    }));
  }

  /**
   * Busca todas as entidades com seus papéis
   */
  static async getEntitiesWithRoles(): Promise<EntityWithRoles[]> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [...localEntities];
  }

  /**
   * Cria um novo papel
   */
  static async createRole(nome: string, descricao?: string): Promise<{ success: boolean; data?: Role; message?: string }> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Verificar se já existe
    const existingRole = localRoles.find(role => role.nome.toLowerCase() === nome.toLowerCase());
    if (existingRole) {
      return { success: false, message: 'Papel já existe com este nome' };
    }

    const newRole: Role = {
      id: (localRoles.length + 1).toString(),
      nome: nome.toLowerCase(),
      descricao: descricao || '',
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    localRoles.push(newRole);
    
    return { success: true, data: newRole };
  }

  /**
   * Atualiza um papel existente
   */
  static async updateRole(id: string, updates: Partial<Role>): Promise<{ success: boolean; data?: Role; message?: string }> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const roleIndex = localRoles.findIndex(role => role.id === id);
    if (roleIndex === -1) {
      return { success: false, message: 'Papel não encontrado' };
    }

    // Verificar nome único se estiver sendo alterado
    if (updates.nome && updates.nome !== localRoles[roleIndex].nome) {
      const existingRole = localRoles.find(role => 
        role.nome.toLowerCase() === updates.nome!.toLowerCase() && role.id !== id
      );
      if (existingRole) {
        return { success: false, message: 'Já existe um papel com este nome' };
      }
    }

    localRoles[roleIndex] = {
      ...localRoles[roleIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return { success: true, data: localRoles[roleIndex] };
  }

  /**
   * Remove um papel
   */
  static async deleteRole(id: string): Promise<{ success: boolean; message?: string }> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const roleIndex = localRoles.findIndex(role => role.id === id);
    if (roleIndex === -1) {
      return { success: false, message: 'Papel não encontrado' };
    }

    const roleName = localRoles[roleIndex].nome;
    
    // Verificar se há entidades usando este papel
    const entitiesUsingRole = localEntities.filter(entity => 
      entity.roles.includes(roleName)
    );

    if (entitiesUsingRole.length > 0) {
      return { 
        success: false, 
        message: `Não é possível excluir. ${entitiesUsingRole.length} entidade(s) ainda usa(m) este papel.` 
      };
    }

    localRoles.splice(roleIndex, 1);
    
    return { success: true };
  }

  /**
   * Adiciona papel a uma entidade
   */
  static async addRoleToEntity(entityId: string, roleName: string): Promise<{ success: boolean; message?: string }> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const entity = localEntities.find(e => e.id === entityId);
    if (!entity) {
      return { success: false, message: 'Entidade não encontrada' };
    }

    const role = localRoles.find(r => r.nome === roleName && r.ativo);
    if (!role) {
      return { success: false, message: 'Papel não encontrado ou inativo' };
    }

    if (entity.roles.includes(roleName)) {
      return { success: false, message: 'Entidade já possui este papel' };
    }

    entity.roles.push(roleName);
    
    return { success: true };
  }

  /**
   * Remove papel de uma entidade
   */
  static async removeRoleFromEntity(entityId: string, roleName: string): Promise<{ success: boolean; message?: string }> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const entity = localEntities.find(e => e.id === entityId);
    if (!entity) {
      return { success: false, message: 'Entidade não encontrada' };
    }

    const roleIndex = entity.roles.indexOf(roleName);
    if (roleIndex === -1) {
      return { success: false, message: 'Entidade não possui este papel' };
    }

    entity.roles.splice(roleIndex, 1);
    
    return { success: true };
  }

  /**
   * Sincroniza papéis de uma entidade
   */
  static async syncEntityRoles(entityId: string, roles: string[]): Promise<{ success: boolean; message?: string }> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const entity = localEntities.find(e => e.id === entityId);
    if (!entity) {
      return { success: false, message: 'Entidade não encontrada' };
    }

    // Verificar se todos os papéis existem
    const invalidRoles = roles.filter(roleName => 
      !localRoles.find(r => r.nome === roleName && r.ativo)
    );

    if (invalidRoles.length > 0) {
      return { 
        success: false, 
        message: `Papéis inválidos: ${invalidRoles.join(', ')}` 
      };
    }

    entity.roles = [...roles];
    
    return { success: true };
  }

  /**
   * Busca papéis de uma entidade específica
   */
  static async getEntityRoles(entityId: string): Promise<string[]> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const entity = localEntities.find(e => e.id === entityId);
    return entity ? [...entity.roles] : [];
  }

  /**
   * Verifica se uma entidade tem um papel específico
   */
  static async hasRole(entityId: string, roleName: string): Promise<boolean> {
    const entity = localEntities.find(e => e.id === entityId);
    return entity ? entity.roles.includes(roleName) : false;
  }

  /**
   * Busca estatísticas dos papéis
   */
  static async getRoleStats(): Promise<{ [roleName: string]: number }> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const stats: { [roleName: string]: number } = {};
    
    localRoles.forEach(role => {
      stats[role.nome] = localEntities.filter(entity => 
        entity.roles.includes(role.nome)
      ).length;
    });

    return stats;
  }

  /**
   * Redefine dados para estado inicial (útil para testes)
   */
  static resetData(): void {
    localRoles = [
      {
        id: '1',
        nome: 'cliente',
        descricao: 'Cliente da empresa',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        nome: 'fornecedor',
        descricao: 'Fornecedor de produtos ou serviços',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        nome: 'funcionario',
        descricao: 'Funcionário da empresa',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
        nome: 'vendedor',
        descricao: 'Responsável por vendas',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    localEntities = [
      {
        id: '1',
        nome: 'Maria Silva',
        email: 'maria@exemplo.com',
        telefone: '11999999999',
        ativo: true,
        roles: ['vendedor', 'funcionario'],
        source: 'pessoas'
      },
      {
        id: '2',
        nome: 'João Santos',
        email: 'joao@exemplo.com',
        telefone: '11888888888',
        ativo: true,
        roles: ['cliente'],
        source: 'pessoas'
      }
    ];
  }
}
