/**
 * Card de resumo do dashboard com KPIs clicáveis
 * Cada card representa uma métrica importante que leva a uma listagem filtrada
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Calendar, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export function PayablesSummaryCard({
  title,
  value,
  description,
  trend,
  icon,
  onClick,
  variant = 'default',
  className,
}: SummaryCardProps) {
  const variantClasses = {
    default: 'border-border',
    success: 'border-success/20 bg-success/5',
    warning: 'border-warning/20 bg-warning/5',
    destructive: 'border-destructive/20 bg-destructive/5',
  };

  const iconVariants = {
    default: 'text-muted-foreground',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        variantClasses[variant],
        onClick && 'cursor-pointer hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className={cn('h-4 w-4', iconVariants[variant])}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2 text-xs">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-success mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-destructive mr-1" />
            )}
            <span className={trend.isPositive ? 'text-success' : 'text-destructive'}>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground ml-1">vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SummaryCardsGridProps {
  totalPending: number;
  totalOverdue: number;
  totalDueThisWeek: number;
  totalDueThisMonth: number;
  totalPaid: number;
  onCardClick: (filter: string) => void;
}

export function SummaryCardsGrid({
  totalPending,
  totalOverdue,
  totalDueThisWeek,
  totalDueThisMonth,
  totalPaid,
  onCardClick,
}: SummaryCardsGridProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <PayablesSummaryCard
        title="Total Vencido"
        value={formatCurrency(totalOverdue)}
        description={`Contas em atraso`}
        icon={<AlertTriangle />}
        variant="destructive"
        onClick={() => onCardClick('overdue')}
      />
      
      <PayablesSummaryCard
        title="Vence esta Semana"
        value={formatCurrency(totalDueThisWeek)}
        description="Próximos 7 dias"
        icon={<Calendar />}
        variant="warning"
        onClick={() => onCardClick('thisWeek')}
      />
      
      <PayablesSummaryCard
        title="Vence este Mês"
        value={formatCurrency(totalDueThisMonth)}
        description="Próximos 30 dias"
        icon={<Calendar />}
        onClick={() => onCardClick('thisMonth')}
      />
      
      <PayablesSummaryCard
        title="Total Pendente"
        value={formatCurrency(totalPending)}
        description="Todas as contas a pagar"
        icon={<DollarSign />}
        onClick={() => onCardClick('pending')}
      />
      
      <PayablesSummaryCard
        title="Pago este Mês"
        value={formatCurrency(totalPaid)}
        description="Valores já quitados"
        icon={<DollarSign />}
        variant="success"
        onClick={() => onCardClick('paid')}
      />
    </div>
  );
}