import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, Edit, Settings, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Role {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  pessoas_count?: number;
}

export const RoleSettings: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: ''
  });
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  // Buscar papéis do banco
  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError('');

      // Buscar papéis
      const { data: rolesData, error: rolesError } = await supabase
        .from('papeis')
        .select('*')
        .order('nome');

      if (rolesError) {
        throw rolesError;
      }

      // Para cada papel, contar quantas pessoas o possuem
      const rolesWithCount = await Promise.all(
        (rolesData || []).map(async (role) => {
          const { count, error: countError } = await supabase
            .from('papeis_pessoa')
            .select('*', { count: 'exact', head: true })
            .eq('papel_id', role.id)
            .eq('ativo', true);

          if (countError) {
            console.warn(`Erro ao contar pessoas para papel ${role.nome}:`, countError);
          }

          return {
            ...role,
            pessoas_count: count || 0
          };
        })
      );

      setRoles(rolesWithCount);

    } catch (err) {
      console.error('Erro ao buscar papéis:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast({
        title: "Erro ao carregar papéis",
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar papel (criar ou editar)
  const saveRole = async () => {
    if (!formData.nome.trim()) {
      setError('Nome do papel é obrigatório');
      return;
    }

    try {
      setError('');

      if (editingRole) {
        // Editar papel existente
        const { error: updateError } = await supabase
          .from('papeis')
          .update({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRole.id);

        if (updateError) {
          throw updateError;
        }

        toast({
          title: "Papel atualizado",
          description: `Papel "${formData.nome}" foi atualizado com sucesso`,
        });
      } else {
        // Criar novo papel
        const { error: insertError } = await supabase
          .from('papeis')
          .insert([{
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim(),
            ativo: true
          }]);

        if (insertError) {
          throw insertError;
        }

        toast({
          title: "Papel criado",
          description: `Papel "${formData.nome}" foi criado com sucesso`,
        });
      }

      // Fechar dialog e recarregar dados
      setIsDialogOpen(false);
      setEditingRole(null);
      setFormData({ nome: '', descricao: '' });
      fetchRoles();

    } catch (err: any) {
      console.error('Erro ao salvar papel:', err);
      
      // Tratar erro de nome duplicado
      if (err.code === '23505') {
        setError('Já existe um papel com este nome');
      } else {
        setError(err.message || 'Erro ao salvar papel');
      }
      
      toast({
        title: "Erro ao salvar papel",
        description: err.message || 'Erro desconhecido',
        variant: "destructive",
      });
    }
  };

  // Excluir papel
  const deleteRole = async (role: Role) => {
    if (role.pessoas_count && role.pessoas_count > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Este papel está sendo usado por ${role.pessoas_count} pessoa(s). Remova o papel de todas as pessoas primeiro.`,
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o papel "${role.nome}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('papeis')
        .delete()
        .eq('id', role.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Papel excluído",
        description: `Papel "${role.nome}" foi excluído com sucesso`,
      });

      fetchRoles();

    } catch (err: any) {
      console.error('Erro ao excluir papel:', err);
      toast({
        title: "Erro ao excluir papel",
        description: err.message || 'Erro desconhecido',
        variant: "destructive",
      });
    }
  };

  // Ativar/Desativar papel
  const toggleRoleStatus = async (role: Role) => {
    try {
      const { error } = await supabase
        .from('papeis')
        .update({
          ativo: !role.ativo,
          updated_at: new Date().toISOString()
        })
        .eq('id', role.id);

      if (error) {
        throw error;
      }

      toast({
        title: role.ativo ? "Papel desativado" : "Papel ativado",
        description: `Papel "${role.nome}" foi ${role.ativo ? 'desativado' : 'ativado'} com sucesso`,
      });

      fetchRoles();

    } catch (err: any) {
      console.error('Erro ao alterar status do papel:', err);
      toast({
        title: "Erro ao alterar status",
        description: err.message || 'Erro desconhecido',
        variant: "destructive",
      });
    }
  };

  // Abrir dialog para edição
  const openEditDialog = (role: Role) => {
    setEditingRole(role);
    setFormData({
      nome: role.nome,
      descricao: role.descricao || ''
    });
    setError('');
    setIsDialogOpen(true);
  };

  // Abrir dialog para criação
  const openCreateDialog = () => {
    setEditingRole(null);
    setFormData({ nome: '', descricao: '' });
    setError('');
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Papéis
          </CardTitle>
          <CardDescription>Carregando papéis...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Papéis
          </CardTitle>
          <CardDescription>
            Gerencie os papéis disponíveis no sistema. Papéis são usados para classificar pessoas e definir suas funções.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-600">
                Total de papéis: <strong>{roles.length}</strong>
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Papel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingRole ? 'Editar Papel' : 'Criar Novo Papel'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRole 
                      ? 'Edite as informações do papel selecionado.'
                      : 'Crie um novo papel para classificar pessoas no sistema.'
                    }
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome do Papel *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: vendedora, funcionario, cliente..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descreva a função ou responsabilidade deste papel..."
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={saveRole}>
                    {editingRole ? 'Salvar Alterações' : 'Criar Papel'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pessoas</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map(role => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.nome}</TableCell>
                  <TableCell>{role.descricao || '-'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={role.ativo ? "default" : "secondary"}
                      className={role.ativo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {role.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{role.pessoas_count || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(role.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(role)}
                        className="h-8 w-8 p-0"
                        title="Editar papel"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRoleStatus(role)}
                        className="h-8 w-8 p-0"
                        title={role.ativo ? "Desativar papel" : "Ativar papel"}
                      >
                        {role.ativo ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-orange-600" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRole(role)}
                        className="h-8 w-8 p-0"
                        title="Excluir papel"
                        disabled={role.pessoas_count && role.pessoas_count > 0}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {roles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum papel cadastrado.</p>
              <p className="text-sm">Clique em "Novo Papel" para criar o primeiro papel.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações sobre Papéis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Como usar papéis:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Papéis classificam pessoas por função</li>
                <li>• Uma pessoa pode ter múltiplos papéis</li>
                <li>• Use nomes descritivos e únicos</li>
                <li>• Papéis inativos não aparecem para seleção</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Exemplos de papéis:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>vendedora</strong> - Responsável por vendas</li>
                <li>• <strong>funcionario</strong> - Funcionário da empresa</li>
                <li>• <strong>fornecedor</strong> - Fornece produtos/serviços</li>
                <li>• <strong>cliente</strong> - Cliente da empresa</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
