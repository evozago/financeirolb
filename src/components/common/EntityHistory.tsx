import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, Edit, Trash, Plus, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  changed_at: string;
  changed_by: string;
  old_data?: any;
  new_data?: any;
  record_id: string;
}

interface EntityHistoryProps {
  recordId: string;
  tableName: string;
  entityName: string;
  className?: string;
}

export function EntityHistory({ recordId, tableName, entityName, className }: EntityHistoryProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditHistory();
  }, [recordId, tableName]);

  const loadAuditHistory = async () => {
    try {
      setLoading(true);
      
      // Verificar se o usuário tem permissão
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        console.error('Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('ap_audit_log')
        .select('*')
        .eq('record_id', recordId)
        .eq('table_name', tableName)
        .order('changed_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar histórico:', error);
        // Se o erro for de permissão, mostrar uma mensagem mais amigável
        if (error.code === '42501' || error.message.includes('permission')) {
          setAuditLogs([]);
          return;
        }
        return;
      }

      setAuditLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setAuditLogs([]);
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
        return 'border-green-200 text-green-700 bg-green-50';
      case 'UPDATE':
        return 'border-blue-200 text-blue-700 bg-blue-50';
      case 'DELETE':
        return 'border-red-200 text-red-700 bg-red-50';
      default:
        return 'border-gray-200 text-gray-700 bg-gray-50';
    }
  };

  const formatChanges = (oldData: any, newData: any) => {
    if (!oldData && !newData) return null;

    // Para criação (INSERT)
    if (!oldData && newData) {
      return (
        <div className="text-sm">
          <p className="text-green-600 font-medium">
            {entityName} criado(a)
          </p>
          {newData.nome && (
            <p className="text-muted-foreground">
              Nome: {newData.nome}
            </p>
          )}
        </div>
      );
    }

    // Para exclusão (DELETE)
    if (oldData && !newData) {
      return (
        <div className="text-sm">
          <p className="text-red-600 font-medium">
            {entityName} excluído(a)
          </p>
          {oldData.nome && (
            <p className="text-muted-foreground">
              Nome: {oldData.nome}
            </p>
          )}
        </div>
      );
    }

    // Para atualização (UPDATE)
    if (oldData && newData) {
      const changes: string[] = [];
      
      // Comparar campos importantes
      const fieldsToCheck = ['nome', 'email', 'telefone', 'endereco', 'cnpj', 'cpf', 'ativo'];
      
      fieldsToCheck.forEach(field => {
        if (oldData[field] !== newData[field]) {
          const oldValue = oldData[field] || 'vazio';
          const newValue = newData[field] || 'vazio';
          changes.push(`${field}: "${oldValue}" → "${newValue}"`);
        }
      });

      if (changes.length === 0) {
        return (
          <div className="text-sm">
            <p className="text-blue-600 font-medium">
              {entityName} atualizado(a)
            </p>
            <p className="text-muted-foreground text-xs">
              Alterações internas detectadas
            </p>
          </div>
        );
      }

      return (
        <div className="text-sm">
          <p className="text-blue-600 font-medium mb-1">
            {entityName} atualizado(a)
          </p>
          <div className="space-y-1">
            {changes.slice(0, 3).map((change, index) => (
              <p key={index} className="text-muted-foreground text-xs">
                {change}
              </p>
            ))}
            {changes.length > 3 && (
              <p className="text-muted-foreground text-xs">
                ... e mais {changes.length - 3} alterações
              </p>
            )}
          </div>
        </div>
      );
    }

    return null;
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
          <Clock className="h-5 w-5" />
          Histórico de Alterações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 && !loading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Nenhuma alteração registrada ou sem permissão para visualizar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              O histórico de alterações está disponível apenas para administradores
            </p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex gap-3 p-3 border rounded-lg bg-muted/30">
                  <div className="flex-shrink-0 mt-1">
                    {getOperationIcon(log.operation)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getOperationColor(log.operation))}
                      >
                        {getOperationLabel(log.operation)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(log.changed_at)}
                      </span>
                    </div>
                    {formatChanges(log.old_data, log.new_data)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
