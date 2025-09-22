// Componente demo para configurações de papéis sem dependência do Supabase
// Para testes e desenvolvimento quando há problemas de conectividade

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Settings, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useRoleManagementDemo } from '@/hooks/useRoleManagementDemo';
import { toast } from '@/components/ui/use-toast';

interface CreateRoleFormData {
  nome: string;
  descricao: string;
}

interface EditRoleFormData {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
}

export function RoleSettingsDemo() {
  const {
    availableRoles,
    loading,
    refreshing,
    createRole,
    updateRole,
    deleteRole,
    roleStats,
    refreshData
  } = useRoleManagementDemo();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateRoleFormData>({
    nome: '',
    descricao: ''
  });
  const [editForm, setEditForm] = useState<EditRoleFormData>({
    id: '',
    nome: '',
    descricao: '',
    ativo: true
  });
  const [submitting, setSubmitting] = useState(false);

  const handleCreateRole = async () => {
    if (!createForm.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do papel",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const success = await createRole(createForm.nome.trim(), createForm.descricao.trim() || undefined);
      
      if (success) {
        setCreateForm({ nome: '', descricao: '' });
        setCreateDialogOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = async () => {
    if (!editForm.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do papel",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const success = await updateRole(editForm.id, {
        nome: editForm.nome.trim(),
        descricao: editForm.descricao.trim() || undefined,
        ativo: editForm.ativo
      });
      
      if (success) {
        setEditDialogOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    setSubmitting(true);
    try {
      await deleteRole(id);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (role: any) => {
    setEditForm({
      id: role.id,
      nome: role.nome,
      descricao: role.descricao || '',
      ativo: role.ativo
    });
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Papéis
          </CardTitle>
          <CardDescription>
            Carregando configurações...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Papéis
              <Badge variant="secondary" className="ml-2">DEMO</Badge>
            </CardTitle>
            <CardDescription>
              Gerencie os papéis disponíveis no sistema. Papéis são usados para classificar pessoas e definir suas funções.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Atualizar"
              )}
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Papel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Papel</DialogTitle>
                  <DialogDescription>
                    Crie um novo papel para classificar pessoas no sistema.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome do Papel *</Label>
                    <Input
                      id="nome"
                      placeholder="Ex: vendedora, funcionario, cliente..."
                      value={createForm.nome}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, nome: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      placeholder="Descreva a função ou responsabilidade deste papel..."
                      value={createForm.descricao}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, descricao: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateRole}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar Papel"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Total de papéis</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {availableRoles.length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Papéis ativos</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {availableRoles.filter(r => r.ativo).length}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span className="font-medium">Em uso</span>
              </div>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {Object.values(roleStats).reduce((sum, count) => sum + count, 0)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Tabela de papéis */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Papéis Cadastrados</h3>
            {availableRoles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum papel cadastrado</p>
                <p className="text-sm">Clique em "Novo Papel" para criar o primeiro papel.</p>
              </div>
            ) : (
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
                  {availableRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        {role.nome}
                      </TableCell>
                      <TableCell>
                        {role.descricao || (
                          <span className="text-muted-foreground italic">
                            Sem descrição
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={role.ativo ? "default" : "secondary"}>
                          {role.ativo ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inativo
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {roleStats[role.nome] || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          Hoje
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(role)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={roleStats[role.nome] > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir papel</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o papel "{role.nome}"? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRole(role.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <Separator />

          {/* Informações sobre papéis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Como usar papéis:
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Papéis classificam pessoas por função</li>
                <li>• Uma pessoa pode ter múltiplos papéis</li>
                <li>• Use nomes descritivos e únicos</li>
                <li>• Papéis inativos não aparecem para seleção</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Exemplos de papéis:
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>vendedora</strong> - Responsável por vendas</li>
                <li>• <strong>funcionario</strong> - Funcionário da empresa</li>
                <li>• <strong>fornecedor</strong> - Fornece produtos/serviços</li>
                <li>• <strong>cliente</strong> - Cliente da empresa</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dialog de edição */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Papel</DialogTitle>
              <DialogDescription>
                Altere as informações do papel selecionado.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-nome">Nome do Papel *</Label>
                <Input
                  id="edit-nome"
                  value={editForm.nome}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={editForm.descricao}
                  onChange={(e) => setEditForm(prev => ({ ...prev, descricao: e.target.value }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-ativo"
                  checked={editForm.ativo}
                  onChange={(e) => setEditForm(prev => ({ ...prev, ativo: e.target.checked }))}
                />
                <Label htmlFor="edit-ativo">Papel ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditRole}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
