/**
 * Painel financeiro com suporte multi-entidade
 * Exibe métricas separadas por CNPJ/entidade ou consolidadas
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EntitySelector } from '@/components/features/payables/EntitySelector';
import { FinancialPanel } from './FinancialPanel';
import { supabase } from '@/integrations/supabase/client';
import { Building2, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';

interface EntityStats {
  entityId: string;
  entityName: string;
  totalPending: number;
  totalOverdue: number;
  totalPaidToday: number;
  totalDueToday: number;
  totalDueThisMonth: number;
}

interface MultiEntityFinancialPanelProps {
  onCardClick?: (filter: string, entityId?: string) => void;
}

export function MultiEntityFinancialPanel({ onCardClick }: MultiEntityFinancialPanelProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [entityStats, setEntityStats] = useState<EntityStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntityStats();
  }, []);

  const loadEntityStats = async () => {
    try {
      const { data, error } = await supabase
        .from('ap_installments')
        .select(`
          entidade_id,
          valor,
          status,
          data_vencimento,
          data_pagamento
        `)
        .is('deleted_at', null);

      // Buscar entidades separadamente
      const { data: entidades, error: entidadesError } = await supabase
        .from('entidades')
        .select('id, nome')
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao carregar estatísticas por entidade:', error);
        return;
      }

      if (entidadesError) {
        console.error('Erro ao carregar entidades:', entidadesError);
        return;
      }

      // Criar mapa de entidades para lookup
      const entidadesMap = new Map<string, string>();
      (entidades || []).forEach(entidade => {
        entidadesMap.set(entidade.id, entidade.nome);
      });

      // Agrupar dados por entidade
      const statsMap = new Map<string, EntityStats>();
      const today = new Date().toISOString().split('T')[0];
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      const endOfMonthStr = endOfMonth.toISOString().split('T')[0];

      (data || []).forEach(item => {
        const entityId = item.entidade_id || 'no-entity';
        const entityName = entidadesMap.get(entityId) || 'Sem Empresa';
        
        if (!statsMap.has(entityId)) {
          statsMap.set(entityId, {
            entityId,
            entityName,
            totalPending: 0,
            totalOverdue: 0,
            totalPaidToday: 0,
            totalDueToday: 0,
            totalDueThisMonth: 0,
          });
        }

        const stats = statsMap.get(entityId)!;
        const itemValue = parseFloat(item.valor?.toString() || '0');

        // Contas pendentes
        if (item.status !== 'pago') {
          stats.totalPending += itemValue;
          
          // Vencidas
          if (item.data_vencimento < today) {
            stats.totalOverdue += itemValue;
          }
          
          // Vencendo hoje
          if (item.data_vencimento === today) {
            stats.totalDueToday += itemValue;
          }
          
          // Vencendo este mês
          if (item.data_vencimento >= today && item.data_vencimento <= endOfMonthStr) {
            stats.totalDueThisMonth += itemValue;
          }
        }

        // Pagas hoje
        if (item.status === 'pago' && item.data_pagamento === today) {
          stats.totalPaidToday += itemValue;
        }
      });

      setEntityStats(Array.from(statsMap.values()));
    } catch (error) {
      console.error('Erro ao carregar estatísticas por entidade:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const handleEntityCardClick = (filter: string, entityId: string) => {
    if (onCardClick) {
      onCardClick(filter, entityId);
    }
  };

  const getConsolidatedStats = () => {
    return entityStats.reduce(
      (acc, entity) => ({
        totalPending: acc.totalPending + entity.totalPending,
        totalOverdue: acc.totalOverdue + entity.totalOverdue,
        totalPaidToday: acc.totalPaidToday + entity.totalPaidToday,
        totalDueToday: acc.totalDueToday + entity.totalDueToday,
        totalDueThisMonth: acc.totalDueThisMonth + entity.totalDueThisMonth,
      }),
      {
        totalPending: 0,
        totalOverdue: 0,
        totalPaidToday: 0,
        totalDueToday: 0,
        totalDueThisMonth: 0,
      }
    );
  };

  const consolidatedStats = getConsolidatedStats();
  const selectedEntity = entityStats.find(e => e.entityId === selectedEntityId);

  return (
    <div className="space-y-6">
      {/* Seletor de Entidade */}
      <EntitySelector
        selectedEntityId={selectedEntityId}
        onEntityChange={setSelectedEntityId}
        showAll={true}
        className="max-w-md"
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="entities">Por Empresa</TabsTrigger>
          <TabsTrigger value="comparison">Comparativo</TabsTrigger>
        </TabsList>

        {/* Visão Geral - Painel original ou filtrado */}
        <TabsContent value="overview">
          {selectedEntityId ? (
            selectedEntity && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {selectedEntity.entityName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <div 
                      className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleEntityCardClick('due-today', selectedEntity.entityId)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            Vencendo Hoje
                          </p>
                          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                            {formatCurrency(selectedEntity.totalDueToday)}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    {/* Adicionar outros cards similares */}
                  </div>
                </CardContent>
              </Card>
            )
          ) : (
            <FinancialPanel onCardClick={onCardClick} />
          )}
        </TabsContent>

        {/* Por Empresa */}
        <TabsContent value="entities">
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <p>Carregando estatísticas por empresa...</p>
                </CardContent>
              </Card>
            ) : (
              entityStats.map(entity => (
                <Card key={entity.entityId}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {entity.entityName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                      <div 
                        className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleEntityCardClick('due-today', entity.entityId)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                              Vencendo Hoje
                            </p>
                            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                              {formatCurrency(entity.totalDueToday)}
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                        </div>
                      </div>

                      <div 
                        className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleEntityCardClick('paid-today', entity.entityId)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                              Pagas Hoje
                            </p>
                            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                              {formatCurrency(entity.totalPaidToday)}
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </div>

                      <div 
                        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleEntityCardClick('due-month', entity.entityId)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Vence Este Mês
                            </p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                              {formatCurrency(entity.totalDueThisMonth)}
                            </p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>

                      <div 
                        className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg border border-red-200 dark:border-red-800 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleEntityCardClick('overdue', entity.entityId)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-300">
                              Vencidas
                            </p>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                              {formatCurrency(entity.totalOverdue)}
                            </p>
                          </div>
                          <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Total Pendente
                            </p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                              {formatCurrency(entity.totalPending)}
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Comparativo */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo Consolidado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        Total Vencendo Hoje
                      </p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {formatCurrency(consolidatedStats.totalDueToday)}
                      </p>
                      <p className="text-xs text-purple-700/80 dark:text-purple-300/80">
                        {entityStats.length} empresa(s)
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        Total Pagas Hoje
                      </p>
                      <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                        {formatCurrency(consolidatedStats.totalPaidToday)}
                      </p>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                        Todas as empresas
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Total do Mês
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {formatCurrency(consolidatedStats.totalDueThisMonth)}
                      </p>
                      <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
                        Consolidado
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        Total Vencidas
                      </p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                        {formatCurrency(consolidatedStats.totalOverdue)}
                      </p>
                      <p className="text-xs text-red-700/80 dark:text-red-300/80">
                        Crítico
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Total Pendente
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(consolidatedStats.totalPending)}
                      </p>
                      <p className="text-xs text-slate-700/80 dark:text-slate-300/80">
                        Geral
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}