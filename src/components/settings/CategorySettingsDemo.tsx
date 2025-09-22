// Versão demo das configurações de categorias com dados locais
// Para testes e desenvolvimento quando há problemas de conectividade

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

interface Category {
  id: string;
  nome: string;
  status: 'ativo' | 'inativo';
  produtos_count: number;
  created_at: string;
}

// Dados locais para demonstração
const initialCategories: Category[] = [
  {
    id: '1',
    nome: 'Calçados Esportivos',
    status: 'ativo',
    produtos_count: 25,
    created_at: '2025-09-22'
  },
  {
    id: '2',
    nome: 'Vestuário Casual',
    status: 'ativo',
    produtos_count: 18,
    created_at: '2025-09-22'
  },
  {
    id: '3',
    nome: 'Acessórios',
    status: 'ativo',
    produtos_count: 12,
    created_at: '2025-09-22'
  },
  {
    id: '4',
    nome: 'Equipamentos',
    status: 'inativo',
    produtos_count: 0,
    created_at: '2025-09-21'
  }
];

export default function CategorySettingsDemo() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simular delay de criação
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newCategory: Category = {
        id: (categories.length + 1).toString(),
        nome: newCategoryName.trim(),
        status: 'ativo',
        produtos_count: 0,
        created_at: new Date().toISOString().split('T')[0]
      };
      
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Categoria criada!",
        description: `Categoria "${newCategory.nome}" foi criada com sucesso.`,
      });
      
    } catch (error) {
      toast({
        title: "Erro ao criar categoria",
        description: "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simular delay de edição
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, nome: newCategoryName.trim() }
          : cat
      ));
      
      setNewCategoryName('');
      setEditingCategory(null);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Categoria atualizada!",
        description: `Categoria foi atualizada com sucesso.`,
      });
      
    } catch (error) {
      toast({
        title: "Erro ao atualizar categoria",
        description: "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (category.produtos_count > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Esta categoria possui ${category.produtos_count} produtos associados.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simular delay de exclusão
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCategories(categories.filter(cat => cat.id !== category.id));
      
      toast({
        title: "Categoria excluída!",
        description: `Categoria "${category.nome}" foi excluída com sucesso.`,
      });
      
    } catch (error) {
      toast({
        title: "Erro ao excluir categoria",
        description: "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (category: Category) => {
    setLoading(true);
    
    try {
      // Simular delay de atualização
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newStatus = category.status === 'ativo' ? 'inativo' : 'ativo';
      
      setCategories(categories.map(cat => 
        cat.id === category.id 
          ? { ...cat, status: newStatus }
          : cat
      ));
      
      toast({
        title: "Status atualizado!",
        description: `Categoria "${category.nome}" está agora ${newStatus}.`,
      });
      
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.nome);
    setIsEditDialogOpen(true);
  };

  const activeCategories = categories.filter(cat => cat.status === 'ativo').length;
  const totalProducts = categories.reduce((sum, cat) => sum + cat.produtos_count, 0);

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Categorias de Produtos
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">DEMO</Badge>
            <span className="text-sm text-muted-foreground">
              Versão de demonstração com dados locais
            </span>
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Categoria</DialogTitle>
              <DialogDescription>
                Crie uma nova categoria para organizar seus produtos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category-name">Nome da Categoria</Label>
                <Input
                  id="category-name"
                  placeholder="Ex: Vestuário, Calçados, Acessórios"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setNewCategoryName('');
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateCategory} disabled={loading}>
                {loading ? 'Criando...' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Categorias</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias Ativas</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCategories}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalProducts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.nome}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={category.status === 'ativo' ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => handleToggleStatus(category)}
                    >
                      {category.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {category.produtos_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(category.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category)}
                        disabled={loading || category.produtos_count > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Altere o nome da categoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">Nome da Categoria</Label>
              <Input
                id="edit-category-name"
                placeholder="Ex: Vestuário, Calçados, Acessórios"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingCategory(null);
                setNewCategoryName('');
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditCategory} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Informações de uso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como usar categorias:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Categorias organizam produtos por tipo ou função
          </p>
          <p className="text-sm text-muted-foreground">
            • Use nomes descritivos e únicos para cada categoria
          </p>
          <p className="text-sm text-muted-foreground">
            • Categorias inativas não aparecem para seleção
          </p>
          <p className="text-sm text-muted-foreground">
            • Não é possível excluir categorias com produtos associados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
