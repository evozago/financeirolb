import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FinancialPanelStats {
  contas_vencendo_hoje: number;
  contas_vencendo_hoje_count?: number;
  contas_pagas_hoje: number;
  contas_pagas_hoje_count?: number;
  contas_vencendo_ate_fim_mes: number;
  contas_vencendo_ate_fim_mes_count?: number;
  contas_vencidas: number;
  contas_vencidas_count?: number;
  contas_pendentes_nao_recorrentes: number;
  contas_pendentes_nao_recorrentes_count?: number;
}

interface FinancialPanelProps {
  onCardClick?: (filter: string) => void;
}

export function FinancialPanel({ onCardClick }: FinancialPanelProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState<FinancialPanelStats>({
    contas_vencendo_hoje: 0,
    contas_vencendo_hoje_count: 0,
    contas_pagas_hoje: 0,
    contas_pagas_hoje_count: 0,
    contas_vencendo_ate_fim_mes: 0,
    contas_vencendo_ate_fim_mes_count: 0,
    contas_vencidas: 0,
    contas_vencidas_count: 0,
    contas_pendentes_nao_recorrentes: 0,
    contas_pendentes_nao_recorrentes_count: 0
  });
  const [loading, setLoading] = useState(true);

  const loadFinancialStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_financial_panel_stats_extended');
      
      if (error) {
        console.error('Error loading financial panel stats:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar dados do painel financeiro",
          variant: "destructive"
        });
        return;
      }

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error loading financial panel stats:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do painel financeiro",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadFinancialStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);

  const handleCardClick = (filter: string) => {
    if (onCardClick) {
      onCardClick(filter);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Painel Financeiro - Situação Atual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Contas a vencer hoje */}
          <div 
            className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('due-today')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Vencendo Hoje
                </p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {loading ? '...' : formatCurrency(stats.contas_vencendo_hoje)}
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                  {loading ? '...' : `${stats.contas_vencendo_hoje_count ?? 0} títulos`}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          {/* Contas pagas hoje */}
          <div 
            className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('paid-today')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Pagas Hoje
                </p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {loading ? '...' : formatCurrency(stats.contas_pagas_hoje)}
                </p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                  {loading ? '...' : `${stats.contas_pagas_hoje_count ?? 0} títulos`}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          {/* Contas a vencer até fim do mês */}
          <div 
            className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('due-month')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Vence até Fim do Mês
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {loading ? '...' : formatCurrency(stats.contas_vencendo_ate_fim_mes)}
                </p>
                <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
                  {loading ? '...' : `${stats.contas_vencendo_ate_fim_mes_count ?? 0} títulos`}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Contas vencidas */}
          <div 
            className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg border border-red-200 dark:border-red-800 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('overdue')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Vencidas
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {loading ? '...' : formatCurrency(stats.contas_vencidas)}
                </p>
                <p className="text-xs text-red-700/80 dark:text-red-300/80">
                  {loading ? '...' : `${stats.contas_vencidas_count ?? 0} títulos`}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Contas pendentes não recorrentes */}
          <div 
            className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick('non-recurring')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Pendentes Não Recorrentes
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {loading ? '...' : formatCurrency(stats.contas_pendentes_nao_recorrentes)}
                </p>
                <p className="text-xs text-purple-700/80 dark:text-purple-300/80">
                  {loading ? '...' : `${stats.contas_pendentes_nao_recorrentes_count ?? 0} títulos`}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}