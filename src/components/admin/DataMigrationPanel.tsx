import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Users, 
  Building2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Trash2
} from "lucide-react";

interface DuplicateRecord {
  nome: string;
  quantidade: number;
  ids: string;
}

export function DataMigrationPanel() {
  const [loading, setLoading] = useState(false);
  const [migrationResults, setMigrationResults] = useState<{
    fornecedores?: number;
    funcionarios?: number;
    relacionamentos?: number;
  }>({});
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([]);
  const { toast } = useToast();

  const checkDuplicates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('check_pessoa_duplicates');
      
      if (error) throw error;
      
      setDuplicates(data || []);
      
      toast({
        title: "Verificação concluída",
        description: `${data?.length || 0} grupos de duplicatas encontrados.`,
      });
    } catch (error) {
      console.error('Error checking duplicates:', error);
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar duplicatas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const migrateFornecedores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('migrate_fornecedores_to_pessoas');
      
      if (error) throw error;
      
      setMigrationResults(prev => ({ ...prev, fornecedores: data }));
      
      toast({
        title: "Migração de fornecedores concluída",
        description: `${data} fornecedores migrados para a estrutura unificada.`,
      });
    } catch (error) {
      console.error('Error migrating fornecedores:', error);
      toast({
        title: "Erro na migração",
        description: "Não foi possível migrar os fornecedores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const migrateFuncionarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('migrate_funcionarios_to_pessoas');
      
      if (error) throw error;
      
      setMigrationResults(prev => ({ ...prev, funcionarios: data }));
      
      toast({
        title: "Migração de funcionários concluída",
        description: `${data} funcionários migrados para a estrutura unificada.`,
      });
    } catch (error) {
      console.error('Error migrating funcionarios:', error);
      toast({
        title: "Erro na migração",
        description: "Não foi possível migrar os funcionários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRelationships = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('update_ap_installments_relationships');
      
      if (error) throw error;
      
      setMigrationResults(prev => ({ ...prev, relacionamentos: data }));
      
      toast({
        title: "Relacionamentos atualizados",
        description: `${data} registros de contas a pagar vinculados aos fornecedores unificados.`,
      });
    } catch (error) {
      console.error('Error updating relationships:', error);
      toast({
        title: "Erro na atualização",
        description: "Não foi possível atualizar os relacionamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeDuplicate = async (nome: string, keepId: string, removeIds: string[]) => {
    try {
      setLoading(true);
      
      // Remove os duplicados mantendo apenas um registro
      const { error } = await supabase
        .from('pessoas')
        .delete()
        .in('id', removeIds);
      
      if (error) throw error;
      
      toast({
        title: "Duplicatas removidas",
        description: `Registros duplicados de ${nome} foram removidos.`,
      });
      
      // Atualizar lista de duplicatas
      await checkDuplicates();
    } catch (error) {
      console.error('Error removing duplicates:', error);
      toast({
        title: "Erro ao remover duplicatas",
        description: "Não foi possível remover os registros duplicados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Migração para Estrutura Unificada de Pessoas
          </CardTitle>
          <CardDescription>
            Consolide dados de pessoas físicas e jurídicas em uma estrutura centralizada,
            eliminando duplicações e melhorando a normalização dos dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status da Migração */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">Fornecedores</span>
                {migrationResults.fornecedores !== undefined && (
                  <Badge variant={migrationResults.fornecedores > 0 ? "default" : "secondary"}>
                    {migrationResults.fornecedores} migrados
                  </Badge>
                )}
              </div>
              <Button 
                onClick={migrateFornecedores} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Migrar Fornecedores
              </Button>
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Funcionários</span>
                {migrationResults.funcionarios !== undefined && (
                  <Badge variant={migrationResults.funcionarios > 0 ? "default" : "secondary"}>
                    {migrationResults.funcionarios} migrados
                  </Badge>
                )}
              </div>
              <Button 
                onClick={migrateFuncionarios} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Migrar Funcionários
              </Button>
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Relacionamentos</span>
                {migrationResults.relacionamentos !== undefined && (
                  <Badge variant={migrationResults.relacionamentos > 0 ? "default" : "secondary"}>
                    {migrationResults.relacionamentos} atualizados
                  </Badge>
                )}
              </div>
              <Button 
                onClick={updateRelationships} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Atualizar Vínculos
              </Button>
            </div>
          </div>

          <Separator />

          {/* Verificação de Duplicatas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Gerenciar Duplicatas</span>
                {duplicates.length > 0 && (
                  <Badge variant="destructive">
                    {duplicates.length} grupos duplicados
                  </Badge>
                )}
              </div>
              <Button onClick={checkDuplicates} disabled={loading} variant="outline" size="sm">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                Verificar Duplicatas
              </Button>
            </div>

            {duplicates.length > 0 && (
              <div className="space-y-3">
                {duplicates.map((duplicate, index) => {
                  const ids = duplicate.ids.split(', ');
                  const keepId = ids[0];
                  const removeIds = ids.slice(1);

                  return (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <div>
                          <strong>{duplicate.nome}</strong> possui {duplicate.quantidade} registros duplicados
                          <div className="text-xs text-muted-foreground mt-1">
                            IDs: {duplicate.ids}
                          </div>
                        </div>
                        <Button
                          onClick={() => removeDuplicate(duplicate.nome, keepId, removeIds)}
                          disabled={loading}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover Duplicatas
                        </Button>
                      </AlertDescription>
                    </Alert>
                  );
                })}
              </div>
            )}
          </div>

          {/* Informações importantes */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Esta migração é segura e mantém todos os dados históricos.
              As tabelas antigas permanecerão intactas para backup. Execute as etapas na ordem:
              1. Migrar dados, 2. Atualizar relacionamentos, 3. Remover duplicatas.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}