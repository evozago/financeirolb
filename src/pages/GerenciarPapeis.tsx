import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Users, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Papel {
  id: string;
  nome: string;
  descricao: string;
  nome_norm: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  total_pessoas?: number;
}

export default function GerenciarPapeis() {
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPapel, setEditingPapel] = useState<Papel | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: ''
  });

  useEffect(() => {
    loadPapeis();
  }, []);

  const loadPapeis = async () => {
    try {
      setLoading(true);
      
      // Buscar papéis com contagem de pessoas
      const { data: papeisData, error: papeisError } = await supabase
        .from('papeis')
        .select('*')
        .order('nome');

      if (papeisError) throw papeisError;

      // Para cada papel, contar quantas pessoas têm esse papel
      const papeisComContagem = await Promise.all(
        (papeisData || []).map(async (papel) => {
          const { count } = await supabase
            .from('pessoa_papeis')
            .select('*', { count: 'exact', head: true })
            .eq('papel_id', papel.id)
            .eq('ativo', true);

          return {
            ...papel,
            total_pessoas: count || 0
          };
        })
      );

      setPapeis(papeisComContagem);
    } catch (error) {
      console.error('Erro ao carregar papéis:', error);
      toast.error('Erro ao carregar papéis');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome do papel é obrigatório');
      return;
    }

    try {
      const nomeNormalizado = formData.nome.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      if (editingPapel) {
        // Atualizar papel existente
        const { error } = await supabase
          .from('papeis')
          .update({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            nome_norm: nomeNormalizado,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPapel.id);

        if (error) throw error;
        toast.success('Papel atualizado com sucesso!');
      } else {
        // Criar novo papel
        const { error } = await supabase
          .from('papeis')
          .insert({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            nome_norm: nomeNormalizado,
            ativo: true
          });

        if (error) throw error;
        toast.success('Papel criado com sucesso!');
      }

      setFormData({ nome: '', descricao: '' });
      setEditingPapel(null);
      setIsDialogOpen(false);
      loadPapeis();
    } catch (error: any) {
      console.error('Erro ao salvar papel:', error);
      if (error.code === '23505') {
        toast.error('Já existe um papel com este nome');
      } else {
        toast.error('Erro ao salvar papel');
      }
    }
  };

  const handleEdit = (papel: Papel) => {
    setEditingPapel(papel);
    setFormData({
      nome: papel.nome,
      descricao: papel.descricao || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (papel: Papel) => {
    if (papel.total_pessoas && papel.total_pessoas > 0) {
      toast.error(`Não é possível excluir este papel pois ${papel.total_pessoas} pessoa(s) estão associadas a ele`);
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o papel "${papel.nome}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('papeis')
        .delete()
        .eq('id', papel.id);

      if (error) throw error;
      
      toast.success('Papel excluído com sucesso!');
      loadPapeis();
    } catch (error) {
      console.error('Erro ao excluir papel:', error);
      toast.error('Erro ao excluir papel');
    }
  };

  const handleToggleStatus = async (papel: Papel) => {
    try {
      const { error } = await supabase
        .from('papeis')
        .update({
          ativo: !papel.ativo,
          updated_at: new Date().toISOString()
        })
        .eq('id', papel.id);

      if (error) throw error;
      
      toast.success(`Papel ${!papel.ativo ? 'ativado' : 'desativado'} com sucesso!`);
      loadPapeis();
    } catch (error) {
      console.error('Erro ao alterar status do papel:', error);
      toast.error('Erro ao alterar status do papel');
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', descricao: '' });
    setEditingPapel(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Papéis/Categorias</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os papéis que as pessoas podem ter no sistema (ex: Cliente, Fornecedor, Funcionário)
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Papel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPapel ? 'Editar Papel' : 'Novo Papel'}
              </DialogTitle>
              <DialogDescription>
                {editingPapel 
                  ? 'Edite as informações do papel selecionado.'
                  : 'Crie um novo papel/categoria para as pessoas do sistema.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Papel *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Cliente, Fornecedor, Funcionário"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva o que este papel representa no sistema"
                  rows={3}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPapel ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Papéis Cadastrados
          </CardTitle>
          <CardDescription>
            Lista de todos os papéis/categorias disponíveis no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Carregando papéis...</p>
            </div>
          ) : papeis.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum papel cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando os papéis que as pessoas podem ter no seu sistema
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Papel
              </Button>
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
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papeis.map((papel) => (
                  <TableRow key={papel.id}>
                    <TableCell className="font-medium">{papel.nome}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {papel.descricao || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={papel.ativo ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => handleToggleStatus(papel)}
                      >
                        {papel.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {papel.total_pessoas || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(papel.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(papel)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(papel)}
                          disabled={papel.total_pessoas && papel.total_pessoas > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {papeis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dicas de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • <strong>Papéis ativos:</strong> Podem ser atribuídos a pessoas no cadastro
            </p>
            <p className="text-sm text-muted-foreground">
              • <strong>Papéis inativos:</strong> Não aparecem nas opções de cadastro, mas mantêm os relacionamentos existentes
            </p>
            <p className="text-sm text-muted-foreground">
              • <strong>Exclusão:</strong> Só é possível excluir papéis que não têm pessoas associadas
            </p>
            <p className="text-sm text-muted-foreground">
              • <strong>Múltiplos papéis:</strong> Uma pessoa pode ter vários papéis simultaneamente
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
