import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Papel {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  total_pessoas?: number;
}

export function GerenciarPapeisSection() {
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPapel, setEditingPapel] = useState<Papel | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadPapeis();
  }, []);

  const loadPapeis = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('papeis')
        .select(`
          *,
          pessoa_papeis!inner(count)
        `)
        .order('nome');

      if (error) throw error;

      // Contar pessoas por papel
      const papeisComContagem = await Promise.all(
        (data || []).map(async (papel) => {
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
    } catch (error: any) {
      console.error('Erro ao carregar papéis:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar papéis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openNewPapel = () => {
    setEditingPapel(null);
    setNome('');
    setDescricao('');
    setIsDialogOpen(true);
  };

  const openEditPapel = (papel: Papel) => {
    setEditingPapel(papel);
    setNome(papel.nome);
    setDescricao(papel.descricao);
    setIsDialogOpen(true);
  };

  const handleSavePapel = async () => {
    if (!nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome do papel é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      const papelData = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        nome_norm: nome.trim().toLowerCase().replace(/\s+/g, '_'),
        ativo: true
      };

      if (editingPapel) {
        const { error } = await supabase
          .from('papeis')
          .update(papelData)
          .eq('id', editingPapel.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Papel atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('papeis')
          .insert([papelData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Papel criado com sucesso!",
        });
      }

      setIsDialogOpen(false);
      loadPapeis();
    } catch (error: any) {
      console.error('Erro ao salvar papel:', error);
      if (error.code === '23505') {
        toast({
          title: "Erro",
          description: "Já existe um papel com este nome",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao salvar papel",
          variant: "destructive",
        });
      }
    }
  };

  const handleToggleAtivo = async (papel: Papel) => {
    try {
      const { error } = await supabase
        .from('papeis')
        .update({ ativo: !papel.ativo })
        .eq('id', papel.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Papel ${!papel.ativo ? 'ativado' : 'desativado'} com sucesso!`,
      });

      loadPapeis();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do papel",
        variant: "destructive",
      });
    }
  };

  const handleDeletePapel = async (papel: Papel) => {
    if (papel.total_pessoas && papel.total_pessoas > 0) {
      toast({
        title: "Erro",
        description: `Não é possível excluir este papel pois há ${papel.total_pessoas} pessoa(s) associada(s)`,
        variant: "destructive",
      });
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

      toast({
        title: "Sucesso",
        description: "Papel excluído com sucesso!",
      });

      loadPapeis();
    } catch (error: any) {
      console.error('Erro ao excluir papel:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir papel",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <UserCheck className="h-5 w-5" />
            Papéis de Pessoas
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewPapel} variant="outline" className="border-blue-200">
                <Plus className="h-4 w-4 mr-2" />
                Novo Papel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPapel ? 'Editar Papel' : 'Novo Papel'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="papelNome">Nome do Papel</Label>
                  <Input
                    id="papelNome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Cliente, Fornecedor, Funcionário"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="papelDescricao">Descrição</Label>
                  <Textarea
                    id="papelDescricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva as responsabilidades deste papel"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSavePapel}>
                    {editingPapel ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Carregando papéis...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Pessoas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papeis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum papel cadastrado. Clique em "Novo Papel" para começar.
                    </TableCell>
                  </TableRow>
                ) : (
                  papeis.map((papel) => (
                    <TableRow key={papel.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{papel.nome}</div>
                          {papel.descricao && (
                            <div className="text-sm text-muted-foreground">{papel.descricao}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{papel.total_pessoas || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={papel.ativo ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleToggleAtivo(papel)}
                        >
                          {papel.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditPapel(papel)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePapel(papel)}
                            disabled={papel.total_pessoas && papel.total_pessoas > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
