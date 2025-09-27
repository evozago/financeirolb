// Hook para gerenciar entidades corporativas
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EntidadeCorporativa, Papel, EntidadePapel, DimEntidade } from '@/types/corporativo';
import { useToast } from '@/hooks/use-toast';

export const useEntidadesCorporativas = () => {
  const [entidades, setEntidades] = useState<DimEntidade[]>([]);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const carregarPapeis = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('papeis')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setPapeis(data || []);
    } catch (error) {
      console.error('Erro ao carregar papéis:', error);
    }
  }, []);

  const carregarEntidades = useCallback(async (
    filtros: { 
      search?: string; 
      papel?: string; 
      tipo_pessoa?: string; 
      ativo?: boolean;
    } = {}
  ) => {
    setLoading(true);
    try {
      // Consulta base na tabela entidades_corporativas
      let query = supabase
        .from('entidades_corporativas')
        .select(`
          *,
          entidade_papeis!inner(
            papel_id,
            papeis(nome)
          )
        `);

      if (filtros.ativo !== undefined) {
        query = query.eq('ativo', filtros.ativo);
      }

      if (filtros.tipo_pessoa) {
        query = query.eq('tipo_pessoa', filtros.tipo_pessoa);
      }

      if (filtros.papel) {
        query = query.eq('entidade_papeis.papeis.nome', filtros.papel);
      }

      if (filtros.search) {
        query = query.or(
          `nome_razao_social.ilike.%${filtros.search}%,nome_fantasia.ilike.%${filtros.search}%,cpf_cnpj.ilike.%${filtros.search}%,email.ilike.%${filtros.search}%`
        );
      }

      query = query.order('nome_razao_social');

      const { data, error } = await query;

      if (error) throw error;
      
      // Transformar dados para o formato esperado
      const entidadesFormatadas: DimEntidade[] = (data || []).map((item: any) => ({
        id: item.id,
        tipo_pessoa: item.tipo_pessoa,
        nome_razao_social: item.nome_razao_social,
        nome_fantasia: item.nome_fantasia,
        cpf_cnpj: item.cpf_cnpj,
        email: item.email,
        telefone: item.telefone,
        papeis: Array.from(new Set(item.entidade_papeis?.map((ep: any) => ep.papeis?.nome).filter(Boolean) || [])),
        ativo: item.ativo,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      
      setEntidades(entidadesFormatadas);
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar entidades',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const criarEntidade = async (entidade: Omit<EntidadeCorporativa, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('entidades_corporativas')
        .insert([entidade])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Entidade criada com sucesso',
      });

      carregarEntidades();
      return data;
    } catch (error) {
      console.error('Erro ao criar entidade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar entidade',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const atualizarEntidade = async (
    id: string, 
    updates: Partial<EntidadeCorporativa>
  ) => {
    try {
      const { error } = await supabase
        .from('entidades_corporativas')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Entidade atualizada com sucesso',
      });

      carregarEntidades();
    } catch (error) {
      console.error('Erro ao atualizar entidade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar entidade',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const adicionarPapel = async (entidadeId: string, papelId: string) => {
    try {
      // Verificar se já existe relação (ativa ou inativa)
      const { data: existing } = await supabase
        .from('entidade_papeis')
        .select('id, ativo')
        .eq('entidade_id', entidadeId)
        .eq('papel_id', papelId)
        .maybeSingle();

      if (existing) {
        // Reativar se necessário (evita violar a unique constraint)
        const { error: updError } = await supabase
          .from('entidade_papeis')
          .update({
            ativo: true,
            data_inicio: new Date().toISOString().split('T')[0],
            data_fim: null,
          })
          .eq('id', existing.id);
        if (updError) throw updError;
      } else {
        const { error: insError } = await supabase
          .from('entidade_papeis')
          .insert({
            entidade_id: entidadeId,
            papel_id: papelId,
            data_inicio: new Date().toISOString().split('T')[0],
            ativo: true,
          });
        if (insError) throw insError;
      }

      toast({
        title: 'Sucesso',
        description: 'Papel adicionado à entidade',
      });

      carregarEntidades();
    } catch (error) {
      console.error('Erro ao adicionar papel:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar papel',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const removerPapel = async (entidadeId: string, papelId: string) => {
    try {
      const { error } = await supabase
        .from('entidade_papeis')
        .update({ ativo: false, data_fim: new Date().toISOString().split('T')[0] })
        .eq('entidade_id', entidadeId)
        .eq('papel_id', papelId)
        .eq('ativo', true);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Papel removido da entidade',
      });

      carregarEntidades();
    } catch (error) {
      console.error('Erro ao remover papel:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao remover papel',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const buscarFornecedores = useCallback(async () => {
    return carregarEntidades({ papel: 'fornecedor', ativo: true });
  }, [carregarEntidades]);

  const buscarClientes = useCallback(async () => {
    return carregarEntidades({ papel: 'cliente', ativo: true });
  }, [carregarEntidades]);

  return {
    entidades,
    papeis,
    loading,
    carregarPapeis,
    carregarEntidades,
    criarEntidade,
    atualizarEntidade,
    adicionarPapel,
    removerPapel,
    buscarFornecedores,
    buscarClientes,
  };
};