import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Salesperson {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  papeis: string[];
  is_vendedora: boolean;
}

export interface SalesData {
  vendedor_id: string;
  vendedor_nome: string;
  total_vendas: number;
  meta_mensal: number;
  percentual_meta: number;
  vendas_mes_atual: number;
  vendas_mes_anterior: number;
  crescimento: number;
}

export const useSalesData = () => {
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Função para buscar pessoas com papéis usando a nova função do banco
  const fetchSalespersons = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar a função do banco que criamos
      const { data: pessoasComPapeis, error: pessoasError } = await supabase
        .rpc('get_pessoas_with_papeis');
      
      if (pessoasError) {
        throw pessoasError;
      }

      // Mapear dados para o formato esperado
      const pessoas: Salesperson[] = (pessoasComPapeis || []).map(pessoa => ({
        id: pessoa.id,
        nome: pessoa.nome,
        email: pessoa.email,
        telefone: pessoa.telefone,
        cpf: pessoa.cpf,
        papeis: pessoa.papeis || [],
        is_vendedora: pessoa.papeis?.includes('vendedora') || false
      }));

      setSalespersons(pessoas);
      console.log('Pessoas carregadas:', pessoas.length);
      console.log('Vendedoras encontradas:', pessoas.filter(p => p.is_vendedora).length);

    } catch (err) {
      console.error('Erro ao buscar pessoas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast({
        title: "Erro ao carregar pessoas",
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para atribuir papel de vendedora
  const assignSalespersonRole = async (personId: string): Promise<boolean> => {
    try {
      // Usar a função do banco para adicionar papel
      const { data, error } = await supabase
        .rpc('add_papel_to_pessoa', {
          p_pessoa_id: personId,
          p_papel_nome: 'vendedora'
        });

      if (error) {
        throw error;
      }

      if (data === true) {
        toast({
          title: "Papel atribuído",
          description: "Papel de vendedora atribuído com sucesso",
        });

        // Atualizar lista local
        setSalespersons(prev => prev.map(person => 
          person.id === personId 
            ? { 
                ...person, 
                is_vendedora: true,
                papeis: [...person.papeis.filter(p => p !== 'vendedora'), 'vendedora']
              }
            : person
        ));

        return true;
      }

      return false;

    } catch (err) {
      console.error('Erro ao atribuir papel:', err);
      toast({
        title: "Erro ao atribuir papel",
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: "destructive",
      });
      return false;
    }
  };

  // Função para remover papel de vendedora
  const removeSalespersonRole = async (personId: string): Promise<boolean> => {
    try {
      // Usar a função do banco para remover papel
      const { data, error } = await supabase
        .rpc('remove_papel_from_pessoa', {
          p_pessoa_id: personId,
          p_papel_nome: 'vendedora'
        });

      if (error) {
        throw error;
      }

      if (data === true) {
        toast({
          title: "Papel removido",
          description: "Papel de vendedora removido com sucesso",
        });

        // Atualizar lista local
        setSalespersons(prev => prev.map(person => 
          person.id === personId 
            ? { 
                ...person, 
                is_vendedora: false,
                papeis: person.papeis.filter(p => p !== 'vendedora')
              }
            : person
        ));

        return true;
      }

      return false;

    } catch (err) {
      console.error('Erro ao remover papel:', err);
      toast({
        title: "Erro ao remover papel",
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: "destructive",
      });
      return false;
    }
  };

  // Função para buscar dados de vendas
  const fetchSalesData = async () => {
    try {
      // Implementar busca de dados de vendas aqui
      // Por enquanto, retornar dados mock baseados nas vendedoras reais
      const vendedoras = salespersons.filter(sp => sp.is_vendedora);
      
      const mockSalesData: SalesData[] = vendedoras.map(sp => ({
        vendedor_id: sp.id,
        vendedor_nome: sp.nome,
        total_vendas: Math.random() * 100000,
        meta_mensal: 50000,
        percentual_meta: Math.random() * 150,
        vendas_mes_atual: Math.random() * 30000,
        vendas_mes_anterior: Math.random() * 25000,
        crescimento: Math.random() * 50 - 25,
      }));

      setSalesData(mockSalesData);
    } catch (err) {
      console.error('Erro ao buscar dados de vendas:', err);
    }
  };

  // Função para adicionar outros papéis
  const assignRole = async (personId: string, roleName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('add_papel_to_pessoa', {
          p_pessoa_id: personId,
          p_papel_nome: roleName
        });

      if (error) {
        throw error;
      }

      if (data === true) {
        toast({
          title: "Papel atribuído",
          description: `Papel de ${roleName} atribuído com sucesso`,
        });

        // Atualizar lista local
        setSalespersons(prev => prev.map(person => 
          person.id === personId 
            ? { 
                ...person, 
                papeis: [...person.papeis.filter(p => p !== roleName), roleName],
                is_vendedora: roleName === 'vendedora' ? true : person.is_vendedora
              }
            : person
        ));

        return true;
      }

      return false;

    } catch (err) {
      console.error('Erro ao atribuir papel:', err);
      toast({
        title: "Erro ao atribuir papel",
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: "destructive",
      });
      return false;
    }
  };

  // Função para remover outros papéis
  const removeRole = async (personId: string, roleName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('remove_papel_from_pessoa', {
          p_pessoa_id: personId,
          p_papel_nome: roleName
        });

      if (error) {
        throw error;
      }

      if (data === true) {
        toast({
          title: "Papel removido",
          description: `Papel de ${roleName} removido com sucesso`,
        });

        // Atualizar lista local
        setSalespersons(prev => prev.map(person => 
          person.id === personId 
            ? { 
                ...person, 
                papeis: person.papeis.filter(p => p !== roleName),
                is_vendedora: roleName === 'vendedora' ? false : person.is_vendedora
              }
            : person
        ));

        return true;
      }

      return false;

    } catch (err) {
      console.error('Erro ao remover papel:', err);
      toast({
        title: "Erro ao remover papel",
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSalespersons();
  }, []);

  useEffect(() => {
    if (salespersons.length > 0) {
      fetchSalesData();
    }
  }, [salespersons]);

  return {
    salespersons,
    salesData,
    loading,
    error,
    assignSalespersonRole,
    removeSalespersonRole,
    assignRole,
    removeRole,
    refetch: fetchSalespersons,
  };
};
