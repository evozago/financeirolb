import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PapelHierarquico {
  id: string;
  nome: string;
  descricao?: string;
  papel_pai_id?: string;
  papel_pai_nome?: string;
  nivel: number;
  ativo: boolean;
}

export interface PapelFormData {
  nome: string;
  descricao?: string;
  papel_pai_id?: string;
  ativo: boolean;
}

export function usePapeisManagement() {
  const [papeis, setPapeis] = useState<PapelHierarquico[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarPapeis();
  }, []);

  const carregarPapeis = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_papeis_hierarquicos');
      
      if (error) throw error;
      
      setPapeis(data || []);
    } catch (error) {
      console.error('Erro ao carregar papéis:', error);
      toast.error('Erro ao carregar papéis');
    } finally {
      setLoading(false);
    }
  };

  const criarPapel = async (dados: PapelFormData) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('papeis')
        .insert([dados]);
      
      if (error) throw error;
      
      toast.success('Papel criado com sucesso');
      await carregarPapeis();
    } catch (error: any) {
      console.error('Erro ao criar papel:', error);
      if (error.code === '23505') {
        toast.error('Já existe um papel com esse nome');
      } else {
        toast.error('Erro ao criar papel');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const atualizarPapel = async (id: string, dados: Partial<PapelFormData>) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('papeis')
        .update(dados)
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Papel atualizado com sucesso');
      await carregarPapeis();
    } catch (error: any) {
      console.error('Erro ao atualizar papel:', error);
      if (error.code === '23505') {
        toast.error('Já existe um papel com esse nome');
      } else {
        toast.error('Erro ao atualizar papel');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const excluirPapel = async (id: string) => {
    try {
      setLoading(true);
      
      // Verificar se existem pessoas com esse papel na tabela papeis_pessoa
      const { data: pessoasComPapel, error: checkPessoasError } = await supabase
        .from('papeis_pessoa')
        .select('id')
        .eq('papel_id', id)
        .eq('ativo', true);
      
      if (checkPessoasError) throw checkPessoasError;
      
      // Verificar se existem entidades com esse papel na tabela entidade_papeis
      const { data: entidadesComPapel, error: checkEntidadesError } = await supabase
        .from('entidade_papeis')
        .select('id')
        .eq('papel_id', id)
        .eq('ativo', true);
      
      if (checkEntidadesError) throw checkEntidadesError;
      
      // Se há pessoas ou entidades usando este papel, não permitir exclusão
      if ((pessoasComPapel && pessoasComPapel.length > 0) || 
          (entidadesComPapel && entidadesComPapel.length > 0)) {
        toast.error('Não é possível excluir um papel que está sendo usado por pessoas ou entidades');
        return;
      }
      
      // Verificar se existem papéis filhos
      const { data: papeisFilhos, error: childError } = await supabase
        .from('papeis')
        .select('id')
        .eq('papel_pai_id', id)
        .eq('ativo', true);
      
      if (childError) throw childError;
      
      if (papeisFilhos && papeisFilhos.length > 0) {
        toast.error('Não é possível excluir um papel que possui sub-papéis');
        return;
      }
      
      // Desativar o papel em vez de excluir
      const { error } = await supabase
        .from('papeis')
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Papel excluído com sucesso');
      await carregarPapeis();
    } catch (error) {
      console.error('Erro ao excluir papel:', error);
      toast.error('Erro ao excluir papel');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getPapeisRaiz = () => papeis.filter(p => !p.papel_pai_id);
  
  const getPapeisFilhos = (papelPaiId: string) => 
    papeis.filter(p => p.papel_pai_id === papelPaiId);

  return {
    papeis,
    loading,
    carregarPapeis,
    criarPapel,
    atualizarPapel,
    excluirPapel,
    getPapeisRaiz,
    getPapeisFilhos,
  };
}
