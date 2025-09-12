// Hook para gerenciar parcelas na estrutura corporativa
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ParcelaContaPagar, FiltrosParcelasCorporativas, PagamentoParcela, FatoParcelas } from '@/types/corporativo';
import { useToast } from '@/hooks/use-toast';

export const useParcelas = () => {
  const [parcelas, setParcelas] = useState<FatoParcelas[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const { toast } = useToast();

  const carregarParcelas = useCallback(async (
    filtros: FiltrosParcelasCorporativas = {},
    limit = 50,
    offset = 0
  ) => {
    setLoading(true);
    try {
      // Usar consulta direta nas tabelas relacionadas
      let query = supabase
        .from('parcelas_conta_pagar')
        .select(`
          *,
          conta_pagar:contas_pagar_corporativas(
            id,
            descricao,
            numero_documento,
            credor:entidades_corporativas(nome_razao_social, cpf_cnpj),
            categoria:categorias_produtos(nome),
            filial:filiais(nome)
          ),
          conta_bancaria:contas_bancarias(nome_banco)
        `, { count: 'exact' });

      // Aplicar filtros
      if (filtros.status?.length) {
        query = query.in('status', filtros.status);
      }

      if (filtros.credor_id) {
        query = query.eq('conta_pagar.credor_id', filtros.credor_id);
      }

      if (filtros.filial_id) {
        query = query.eq('conta_pagar.filial_id', filtros.filial_id);
      }

      if (filtros.categoria_id) {
        query = query.eq('conta_pagar.categoria_id', filtros.categoria_id);
      }

      if (filtros.data_inicio) {
        query = query.gte('data_vencimento', filtros.data_inicio);
      }

      if (filtros.data_fim) {
        query = query.lte('data_vencimento', filtros.data_fim);
      }

      if (filtros.valor_min) {
        query = query.gte('valor_parcela', filtros.valor_min);
      }

      if (filtros.valor_max) {
        query = query.lte('valor_parcela', filtros.valor_max);
      }

      query = query
        .order('data_vencimento', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transformar dados para o formato esperado
      const parcelasFormatadas: FatoParcelas[] = (data || []).map((item: any) => ({
        id: item.id,
        conta_pagar_id: item.conta_pagar_id,
        credor_id: item.conta_pagar?.credor_id || '',
        credor_nome: item.conta_pagar?.credor?.nome_razao_social || '',
        credor_documento: item.conta_pagar?.credor?.cpf_cnpj || '',
        conta_descricao: item.conta_pagar?.descricao || '',
        numero_documento: item.conta_pagar?.numero_documento || '',
        categoria: item.conta_pagar?.categoria?.nome || '',
        filial: item.conta_pagar?.filial?.nome || '',
        numero_parcela: item.numero_parcela,
        total_parcelas: item.total_parcelas || 1,
        valor_parcela: item.valor_parcela,
        valor_pago: item.valor_pago || 0,
        data_vencimento: item.data_vencimento,
        data_pagamento: item.data_pagamento,
        status: item.status || 'a_vencer',
        forma_pagamento: item.forma_pagamento || item.meio_pagamento,
        banco_pagamento: item.conta_bancaria?.nome_banco || '',
        status_formatado: item.status === 'paga' ? 'Pago' as const : 
                         (item.data_vencimento < new Date().toISOString().split('T')[0] && item.status !== 'paga' ? 'Vencido' as const : 'A Vencer' as const),
        ano_vencimento: parseInt(item.data_vencimento.substring(0, 4)),
        mes_vencimento: parseInt(item.data_vencimento.substring(5, 7)),
        juros: item.juros || 0,
        multa: item.multa || 0,
        desconto: item.desconto || 0,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setParcelas(parcelasFormatadas);
      setTotalRecords(count || 0);
    } catch (error) {
      console.error('Erro ao carregar parcelas:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar parcelas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const pagarParcela = async (pagamento: PagamentoParcela) => {
    try {
      const { error } = await supabase
        .from('parcelas_conta_pagar')
        .update({
          valor_pago: pagamento.valor_pago,
          data_pagamento: pagamento.data_pagamento,
          meio_pagamento: pagamento.meio_pagamento,
          conta_bancaria_id: pagamento.conta_bancaria_id,
          juros: pagamento.juros || 0,
          multa: pagamento.multa || 0,
          desconto: pagamento.desconto || 0,
          observacoes: pagamento.observacoes,
          status: 'paga',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pagamento.parcela_id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Parcela paga com sucesso',
      });

      // Recarregar parcelas
      carregarParcelas();
    } catch (error) {
      console.error('Erro ao pagar parcela:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar pagamento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const cancelarParcela = async (parcelaId: string, motivo?: string) => {
    try {
      const { error } = await supabase
        .from('parcelas_conta_pagar')
        .update({
          status: 'cancelada',
          observacoes: motivo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parcelaId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Parcela cancelada com sucesso',
      });

      carregarParcelas();
    } catch (error) {
      console.error('Erro ao cancelar parcela:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao cancelar parcela',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Carregar parcelas ao montar o componente
  useEffect(() => {
    carregarParcelas();
  }, [carregarParcelas]);

  return {
    parcelas,
    loading,
    totalRecords,
    carregarParcelas,
    pagarParcela,
    cancelarParcela,
  };
};