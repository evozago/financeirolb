/**
 * Página para gerenciar filiais
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable, Column } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface Filial {
  id: string;
  nome: string;
  cnpj: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export default function ManageFiliais() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    ativo: true
  });

  useEffect(() => {
    loadFiliais();
  }, []);

  const loadFiliais = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('filiais')
        .select('*')
        .order('nome');

      if (error) throw error;
      setFiliais(data || []);
    } catch (error) {
      console.error('Error loading filiais:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar filiais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.cnpj) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingFilial) {
        // Editar filial existente
        const { error } = await supabase
          .from('filiais')
          .update(formData)
          .eq('id', editingFilial.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Filial atualizada com sucesso",
        });
      } else {
        // Criar nova filial
        const { error } = await supabase
          .from('filiais')
          .insert(formData);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Filial criada com sucesso",
        });
      }

      setModalOpen(false);
      setEditingFilial(null);
      setFormData({ nome: '', cnpj: '', ativo: true });
      loadFiliais();
    } catch (error) {
      console.error('Error saving filial:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar filial",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (filial: Filial) => {
    setEditingFilial(filial);
    setFormData({
      nome: filial.nome,
      cnpj: filial.cnpj,
      ativo: filial.ativo
    });
    setModalOpen(true);
  };

  const handleDelete = async (filial: Filial) => {
    if (!confirm('Tem certeza que deseja excluir esta filial?')) return;

    try {
      const { error } = await supabase
        .from('filiais')
        .update({ ativo: false })
        .eq('id', filial.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Filial desativada com sucesso",
      });

      loadFiliais();
    } catch (error) {
      console.error('Error deleting filial:', error);
      toast({
        title: "Erro",
        description: "Falha ao desativar filial",
        variant: "destructive",
      });
    }
  };

  const openNewModal = () => {
    setEditingFilial(null);
    setFormData({ nome: '', cnpj: '', ativo: true });
    setModalOpen(true);
  };

  const columns: Column<Filial>[] = [
    {
      key: 'nome',
      header: 'Nome',
      cell: (item) => (
        <div className="font-medium">{item.nome}</div>
      ),
    },
    {
      key: 'cnpj',
      header: 'CNPJ',
      cell: (item) => (
        <div className="font-mono">{item.cnpj}</div>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      cell: (item) => (
        <Badge variant={item.ativo ? "default" : "secondary"}>
          {item.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (item) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(item)}
            disabled={!item.ativo}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: 'w-24',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Building className="h-6 w-6" />
                  Gerenciar Filiais
                </h1>
                <p className="text-muted-foreground">
                  Adicione e edite as filiais da empresa
                </p>
              </div>
            </div>
            <Button onClick={openNewModal}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Filial
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Filiais Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filiais}
              columns={columns}
              getItemId={(item) => item.id}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Modal de Adicionar/Editar */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFilial ? 'Editar Filial' : 'Nova Filial'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome da filial"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingFilial ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}