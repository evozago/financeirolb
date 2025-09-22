// Versão demo das configurações de marcas com dados locais
// Para testes e desenvolvimento quando há problemas de conectividade

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';

interface Brand {
  id: string;
  nome: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  status: 'ativo' | 'inativo';
  produtos_count: number;
  created_at: string;
}

interface Supplier {
  id: string;
  nome: string;
}

// Dados locais para demonstração
const suppliers: Supplier[] = [
  { id: '1', nome: 'Fornecedor ABC Ltda' },
  { id: '2', nome: 'Distribuidora XYZ' },
  { id: '3', nome: 'Comercial 123' },
  { id: '4', nome: 'Indústria Fashion' },
  { id: '5', nome: 'Atacado Premium' }
];

const initialBrands: Brand[] = [
  {
    id: '1',
    nome: 'Nike',
    fornecedor_id: '1',
    fornecedor_nome: 'Fornecedor ABC Ltda',
    status: 'ativo',
    produtos_count: 15,
    created_at: '2025-09-22'
  },
  {
    id: '2',
    nome: 'Adidas',
    fornecedor_id: '1',
    fornecedor_nome: 'Fornecedor ABC Ltda',
    status: 'ativo',
    produtos_count: 12,
    created_at: '2025-09-22'
  },
  {
    id: '3',
    nome: 'Puma',
    fornecedor_id: '2',
    fornecedor_nome: 'Distribuidora XYZ',
    status: 'ativo',
    produtos_count: 8,
    created_at: '2025-09-22'
  },
  {
    id: '4',
    nome: 'Reebok',
    fornecedor_id: '2',
    fornecedor_nome: 'Distribuidora XYZ',
    status: 'inativo',
    produtos_count: 0,
    created_at: '2025-09-21'
  },
  {
    id: '5',
    nome: 'Vans',
    fornecedor_id: '3',
    fornecedor_nome: 'Comercial 123',
    status: 'ativo',
    produtos_count: 6,
    created_at: '2025-09-21'
  }
];

export default function BrandSettingsDemo() {
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da marca é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSupplierId) {
      toast({
        title: "Erro",
        description: "Fornecedor é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simular delay de criação
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      
      const newBrand: Brand = {
        id: (brands.length + 1).toString(),
        nome: newBrandName.trim(),
        fornecedor_id: selectedSupplierId,
        fornecedor_nome: supplier?.nome || 'Desconhecido',
        status: 'ativo',
        produtos_count: 0,
        created_at: new Date().toISOString().split('T')[0]
      };
      
      setBrands([...brands, newBrand]);
      setNewBrandName('');
      setSelectedSupplierId('');
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Marca criada!",
        description: `Marca "${newBrand.nome}" foi criada com sucesso.`,
      });
      
    } catch (error) {
      toast({
        title: "Erro ao criar marca",
        description: "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditBrand = async () => {
    if (!editingBrand || !newBrandName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da marca é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSupplierId) {
      toast({
        title: "Erro",
        description: "Fornecedor é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simular delay de edição
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const supplier = suppliers.find(s => s.id === selectedSupplierId);
      
      setBrands(brands.map(brand => 
        brand.id === editingBrand.id 
          ? { 
              ...brand, 
              nome: newBrandName.trim(),
              fornecedor_id: selectedSupplierId,
              fornecedor_nome: supplier?.nome || 'Desconhecido'
            }
          : brand
      ));
      
      setNewBrandName('');
      setSelectedSupplierId('');
      setEditingBrand(null);
      setIsEditDialogOpen(false);
      
      toast({
        title: "Marca atualizada!",
        description: `Marca foi atualizada com sucesso.`,
      });
      
    } catch (error) {
      toast({
        title: "Erro ao atualizar marca",
        description: "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (brand.produtos_count > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Esta marca possui ${brand.produtos_count} produtos associados.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simular delay de exclusão
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setBrands(brands.filter(b => b.id !== brand.id));
      
      toast({
        title: "Marca excluída!",
        description: `Marca "${brand.nome}" foi excluída com sucesso.`,
      });
      
    } catch (error) {
      toast({
        title: "Erro ao excluir marca",
        description: "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    setLoading(true);
    
    try {
      // Simular delay de atualização
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newStatus = brand.status === 'ativo' ? 'inativo' : 'ativo';
      
      setBrands(brands.map(b => 
        b.id === brand.id 
          ? { ...b, status: newStatus }
          : b
      ));
      
      toast({
        title: "Status atualizado!",
        description: `Marca "${brand.nome}" está agora ${newStatus}.`,
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

  const openEditDialog = (brand: Brand) => {
    setEditingBrand(brand);
    setNewBrandName(brand.nome);
    setSelectedSupplierId(brand.fornecedor_id);
    setIsEditDialogOpen(true);
  };

  const activeBrands = brands.filter(brand => brand.status === 'ativo').length;
  const totalProducts = brands.reduce((sum, brand) => sum + brand.produtos_count, 0);

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-6 w-6" />
            Marcas
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
              Nova Marca
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Marca</DialogTitle>
              <DialogDescription>
                Crie uma nova marca associada a um fornecedor.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="brand-name">Nome da Marca</Label>
                <Input
                  id="brand-name"
                  placeholder="Ex: Nike, Adidas, Puma"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="supplier">Fornecedor</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
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
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setNewBrandName('');
                  setSelectedSupplierId('');
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateBrand} disabled={loading}>
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
            <CardTitle className="text-sm font-medium">Total de Marcas</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marcas Ativas</CardTitle>
            <Tag className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeBrands}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Tag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalProducts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de marcas */}
      <Card>
        <CardHeader>
          <CardTitle>Marcas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.nome}</TableCell>
                  <TableCell>{brand.fornecedor_nome}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={brand.status === 'ativo' ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => handleToggleStatus(brand)}
                    >
                      {brand.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      {brand.produtos_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(brand.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(brand)}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBrand(brand)}
                        disabled={loading || brand.produtos_count > 0}
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
            <DialogTitle>Editar Marca</DialogTitle>
            <DialogDescription>
              Altere o nome da marca e seu fornecedor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-brand-name">Nome da Marca</Label>
              <Input
                id="edit-brand-name"
                placeholder="Ex: Nike, Adidas, Puma"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-supplier">Fornecedor</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingBrand(null);
                setNewBrandName('');
                setSelectedSupplierId('');
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditBrand} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Informações de uso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como usar marcas:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Marcas são associadas a fornecedores específicos
          </p>
          <p className="text-sm text-muted-foreground">
            • Use nomes descritivos e únicos para cada marca
          </p>
          <p className="text-sm text-muted-foreground">
            • Marcas inativas não aparecem para seleção
          </p>
          <p className="text-sm text-muted-foreground">
            • Não é possível excluir marcas com produtos associados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
