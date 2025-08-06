import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, Edit, Trash, Plus, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  operation: string;
  changed_at: string;
  changed_by: string;
  old_data?: any;
  new_data?: any;
  record_id: string;
}

interface AuditHistoryProps {
  recordId: string;
  className?: string;
}

export function AuditHistory({ recordId, className }: AuditHistoryProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditHistory();
  }, [recordId]);

  const loadAuditHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ap_audit_log')
        .select('*')
        .eq('record_id', recordId)
        .order('changed_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar histórico:', error);
        return;
      }

      setAuditLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'DELETE':
        return <Trash className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'Criação';
      case 'UPDATE':
        return 'Atualização';
      case 'DELETE':
        return 'Exclusão';
      default:
        return operation;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatChanges = (oldData: any, newData: any) => {
    if (!oldData && !newData) return null;
    
    if (oldData && !newData) {
      // DELETE operation
      return (
        <div className="text-sm text-muted-foreground">
          <p>Registro excluído</p>
        </div>
      );
    }
    
    if (!oldData && newData) {
      // INSERT operation
      return (
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-green-700">Novo registro criado</p>
          {newData.descricao && <p className="mt-1"><strong>Descrição:</strong> {newData.descricao}</p>}
          {newData.valor && <p><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newData.valor)}</p>}
          {newData.status && <p><strong>Status:</strong> {newData.status}</p>}
        </div>
      );
    }
    
    // UPDATE operation - show only changed fields
    const changes: string[] = [];
    const fieldsToCheck = ['status', 'valor', 'data_vencimento', 'data_pagamento', 'categoria', 'forma_pagamento', 'banco', 'observacoes', 'data_hora_pagamento'];
    
    fieldsToCheck.forEach(field => {
      if (oldData[field] !== newData[field]) {
        const oldValue = oldData[field] || 'Vazio';
        const newValue = newData[field] || 'Vazio';
        
        if (field === 'valor') {
          changes.push(`${getFieldLabel(field)}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(oldValue)} → ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newValue)}`);
        } else if (field === 'data_vencimento' || field === 'data_pagamento') {
          const oldFormatted = oldValue !== 'Vazio' ? new Date(oldValue).toLocaleDateString('pt-BR') : 'Vazio';
          const newFormatted = newValue !== 'Vazio' ? new Date(newValue).toLocaleDateString('pt-BR') : 'Vazio';
          changes.push(`${getFieldLabel(field)}: ${oldFormatted} → ${newFormatted}`);
        } else if (field === 'data_hora_pagamento') {
          const oldFormatted = oldValue !== 'Vazio' ? formatDateTime(oldValue) : 'Vazio';
          const newFormatted = newValue !== 'Vazio' ? formatDateTime(newValue) : 'Vazio';
          changes.push(`${getFieldLabel(field)}: ${oldFormatted} → ${newFormatted}`);
        } else {
          changes.push(`${getFieldLabel(field)}: ${oldValue} → ${newValue}`);
        }
      }
    });
    
    return changes.length > 0 ? (
      <div className="text-sm text-muted-foreground space-y-1">
        {changes.map((change, index) => (
          <p key={index} className="bg-blue-50 p-2 rounded text-blue-800">{change}</p>
        ))}
      </div>
    ) : (
      <div className="text-sm text-muted-foreground">
        <p>Alteração detectada</p>
      </div>
    );
  };

  const getFieldLabel = (field: string) => {
    const labels: { [key: string]: string } = {
      status: 'Status',
      valor: 'Valor',
      data_vencimento: 'Data de Vencimento',
      data_pagamento: 'Data de Pagamento',
      data_hora_pagamento: 'Data/Hora do Pagamento',
      categoria: 'Categoria',
      forma_pagamento: 'Forma de Pagamento',
      banco: 'Banco',
      observacoes: 'Observações'
    };
    return labels[field] || field;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Carregando histórico...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Alterações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Nenhuma alteração registrada</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-8 bottom-0 w-px bg-border"></div>
              
              <div className="space-y-6">
                {auditLogs.map((log, index) => (
                  <div key={log.id} className="relative flex gap-4">
                    {/* Timeline icon */}
                    <div className="flex-shrink-0 relative z-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-card shadow-sm">
                        {getOperationIcon(log.operation)}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-6">
                      <div className="rounded-lg border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs font-medium", getOperationColor(log.operation))}
                          >
                            {getOperationLabel(log.operation)}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-medium">
                            {formatDateTime(log.changed_at)}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {formatChanges(log.old_data, log.new_data)}
                        </div>
                        
                        {log.changed_by && (
                          <div className="mt-3 pt-2 border-t border-border/50">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>Por: {log.changed_by}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}