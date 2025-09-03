/**
 * Página de Configurações do Sistema
 * Permite gerenciar categorias e marcas
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Tag, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import PositionsManagement from "@/components/settings/PositionsManagement";
import DepartmentsManagement from "@/components/settings/DepartmentsManagement";

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

export default function Settings() {
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
        .from('fornecedores')
        .select('id, nome')
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
        // Update existing category
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
        // Create new category
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
        // Update existing brand
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
        // Create new brand
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
                <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
                <p className="text-muted-foreground">
                  Gerenciar categorias e marcas do sistema
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div>
      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="brands">Marcas</TabsTrigger>
          <TabsTrigger value="positions">Cargos</TabsTrigger>
          <TabsTrigger value="departments">Setores</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Categories Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Categorias de Produtos
                </CardTitle>
                <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={openNewCategory}>
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
                        <TableCell>{category.nome}</TableCell>
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
        </div>
        </TabsContent>

        <TabsContent value="brands">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Marcas de Produtos
                </CardTitle>
                <Dialog open={brandDialog} onOpenChange={setBrandDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={openNewBrand}>
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
                        <Label htmlFor="brandSupplier">Fornecedor</Label>
                        <Select value={brandSupplier} onValueChange={setBrandSupplier}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um fornecedor" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <TableHead>Nome</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell>{brand.nome}</TableCell>
                        <TableCell>{brand.fornecedor_nome || 'N/A'}</TableCell>
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
        </TabsContent>

        <TabsContent value="positions">
          <PositionsManagement />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsManagement />
        </TabsContent>

      </Tabs>
    </div>
      </div>
    </div>
  );
}