/**
 * Página de Cadastros do Sistema
 * Permite gerenciar categorias e marcas com relacionamentos visuais
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Tag, Award, Pencil, Trash2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { EnhancedSelect } from '@/components/ui/enhanced-select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Brand {
  id: string;
  nome: string;
  ativo: boolean;
  fornecedor_id: string;
  fornecedor_nome?: string;
}

interface Supplier {
  id: string;
  nome: string;
}

export default function Cadastros() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Category dialog state
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Brand dialog state
  const [brandDialog, setBrandDialog] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandSupplier, setBrandSupplier] = useState('');
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categorias_produtos')
        .select('*')
        .order('nome');
      
      if (categoriesError) throw categoriesError;
      
      // Load brands with supplier names
      const { data: brandsData, error: brandsError } = await supabase
        .from('marcas')
        .select(`
          *,
          fornecedores!marcas_fornecedor_id_fkey(nome)
        `)
        .order('nome');
      
      if (brandsError) throw brandsError;
      
      // Load suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('pessoas')
        .select('id, nome').contains('categorias', ['fornecedor'])
        .eq('ativo', true)
        .order('nome');
      
      if (suppliersError) throw suppliersError;
      
      setCategories(categoriesData || []);
      setBrands((brandsData || []).map(brand => ({
        ...brand,
        fornecedor_nome: brand.fornecedores?.nome
      })));
      setSuppliers(suppliersData || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (data: Record<string, string>) => {
    const { data: newSupplier, error } = await supabase
      .from('pessoas')
      .insert({ nome: data.name.trim() })
      .select('id, nome')
      .single();
    
    if (error) throw error;
    
    // Refresh suppliers list
    await loadData();
    
    return {
      id: newSupplier.id,
      label: newSupplier.nome,
    };
  };

  const handleCreateCategory = async (data: Record<string, string>) => {
    const { data: newCategory, error } = await supabase
      .from('categorias_produtos')
      .insert({ nome: data.name.trim() })
      .select('id, nome')
      .single();
    
    if (error) throw error;
    
    // Refresh categories list
    await loadData();
    
    return {
      id: newCategory.id,
      label: newCategory.nome,
    };
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categorias_produtos')
          .update({ nome: categoryName.trim() })
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('categorias_produtos')
          .insert({ nome: categoryName.trim() });
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Categoria criada com sucesso",
        });
      }
      
      setCategoryDialog(false);
      setCategoryName('');
      setEditingCategory(null);
      loadData();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar categoria",
        variant: "destructive",
      });
    }
  };

  const handleSaveBrand = async () => {
    if (!brandName.trim() || !brandSupplier) {
      toast({
        title: "Erro",
        description: "Nome da marca e fornecedor são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingBrand) {
        const { error } = await supabase
          .from('marcas')
          .update({ 
            nome: brandName.trim(),
            fornecedor_id: brandSupplier
          })
          .eq('id', editingBrand.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Marca atualizada com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('marcas')
          .insert({ 
            nome: brandName.trim(),
            fornecedor_id: brandSupplier
          });
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Marca criada com sucesso",
        });
      }
      
      setBrandDialog(false);
      setBrandName('');
      setBrandSupplier('');
      setEditingBrand(null);
      loadData();
    } catch (error) {
      console.error('Error saving brand:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar marca",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${category.nome}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categorias_produtos')
        .delete()
        .eq('id', category.id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso",
      });
      
      loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir categoria",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (!confirm(`Tem certeza que deseja excluir a marca "${brand.nome}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('marcas')
        .delete()
        .eq('id', brand.id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Marca excluída com sucesso",
      });
      
      loadData();
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir marca",
        variant: "destructive",
      });
    }
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.nome);
    setCategoryDialog(true);
  };

  const openEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandName(brand.nome);
    setBrandSupplier(brand.fornecedor_id);
    setBrandDialog(true);
  };

  const openNewCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDialog(true);
  };

  const openNewBrand = () => {
    setEditingBrand(null);
    setBrandName('');
    setBrandSupplier('');
    setBrandDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Cadastros</h1>
                <p className="text-muted-foreground">
                  Gerenciar categorias e marcas do sistema
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Relationship Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <LinkIcon className="h-5 w-5" />
            <p className="text-sm font-medium">
              <strong>Relacionamento Importante:</strong> Cada marca deve estar vinculada a um fornecedor específico. 
              Esta vinculação é essencial para o controle de produtos e pedidos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Categories Section */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Tag className="h-5 w-5" />
                  Categorias de Produtos
                </CardTitle>
                <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={openNewCategory} variant="outline" className="border-green-200">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryName">Nome da Categoria</Label>
                        <Input
                          id="categoryName"
                          value={categoryName}
                          onChange={(e) => setCategoryName(e.target.value)}
                          placeholder="Ex: Vestuário, Calçados, Acessórios"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCategoryDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveCategory}>
                          {editingCategory ? 'Atualizar' : 'Criar'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.nome}</TableCell>
                        <TableCell>
                          <Badge variant={category.ativo ? "default" : "secondary"}>
                            {category.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditCategory(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Brands Section */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Award className="h-5 w-5" />
                  Marcas
                </CardTitle>
                <Dialog open={brandDialog} onOpenChange={setBrandDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={openNewBrand} variant="outline" className="border-blue-200">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Marca
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingBrand ? 'Editar Marca' : 'Nova Marca'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="brandName">Nome da Marca</Label>
                        <Input
                          id="brandName"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          placeholder="Ex: Nike, Adidas, Puma"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="brandSupplier">
                          Fornecedor
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                            <LinkIcon className="h-4 w-4 inline mr-1" />
                            <strong>Vínculo obrigatório:</strong> Cada marca deve estar associada a um fornecedor específico.
                          </p>
                        </div>
                        <EnhancedSelect
                          value={brandSupplier}
                          onValueChange={setBrandSupplier}
                          options={suppliers.map(supplier => ({
                            value: supplier.id,
                            label: supplier.nome,
                          }))}
                          placeholder="Selecione um fornecedor"
                          createLabel="Novo fornecedor"
                          createTitle="Adicionar novo fornecedor"
                          createFields={[
                            { key: 'name', label: 'Nome do Fornecedor', required: true }
                          ]}
                          onCreateNew={handleCreateSupplier}
                          onRefresh={loadData}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setBrandDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveBrand}>
                          {editingBrand ? 'Atualizar' : 'Criar'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Marca</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell className="font-medium">{brand.nome}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <LinkIcon className="h-3 w-3 text-blue-500" />
                            <span className="text-blue-700 dark:text-blue-300">
                              {brand.fornecedor_nome || 'Não informado'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={brand.ativo ? "default" : "secondary"}>
                            {brand.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditBrand(brand)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBrand(brand)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}