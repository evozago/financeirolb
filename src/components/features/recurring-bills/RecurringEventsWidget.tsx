import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Building2, CheckCircle, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RecurringEvent } from '@/types/payables';

interface RecurringEventsWidgetProps {
  className?: string;
}

const RecurringEventsWidget: React.FC<RecurringEventsWidgetProps> = ({
  className
}) => {
  const [events, setEvents] = useState<RecurringEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<RecurringEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'closing' | 'due'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [events, filter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recurring_events_next7' as any)
        .select('*')
        .order('next_event_date', { ascending: true });

      if (error) throw error;
      setEvents(data as any || []);
    } catch (error) {
      console.error('Error loading recurring events:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar eventos recorrentes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(event => event.next_event_type === filter));
    }
  };

  const markAsDone = async (event: RecurringEvent) => {
    try {
      const { error } = await supabase.rpc('mark_recurring_bill_done' as any, {
        p_recurring_bill_id: event.recurring_bill_id,
        p_year_month: event.year_month
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Conta marcada como concluída para este mês'
      });

      loadEvents();
    } catch (error) {
      console.error('Error marking as done:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao marcar conta como concluída',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getEventTypeLabel = (type: string) => {
    return type === 'closing' ? 'Fechamento' : 'Vencimento';
  };

  const getEventIcon = (type: string) => {
    return type === 'closing' ? Clock : Calendar;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximos 7 Dias
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'closing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('closing')}
          >
            Fechamentos
          </Button>
          <Button
            variant={filter === 'due' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('due')}
          >
            Vencimentos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum evento nos próximos 7 dias
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const EventIcon = getEventIcon(event.next_event_type || 'due');
              return (
                <div
                  key={event.occurrence_id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <EventIcon className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-medium">{event.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.supplier_id && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Fornecedor
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getEventTypeLabel(event.next_event_type || 'due')}
                        </Badge>
                        <span className="text-sm">
                          {formatDate(event.next_event_date || '')}
                        </span>
                      </div>
                      <div className="font-medium text-primary">
                        {formatCurrency(event.expected_amount)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsDone(event)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Concluir
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecurringEventsWidget;