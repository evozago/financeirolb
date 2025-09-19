/**
 * Página de listagem de fornecedores (Nível 2 - Drill Down)
 * Exibe tabela de fornecedores com navegação para detalhes
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Building2, FileText, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

interface SupplierData {
  id: string;
  nome_razao_social: string;
  nome_fantasia?: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  tipo_pessoa: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export default function Suppliers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load suppliers from database using unified search
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('search_entidades_fornecedores', {
          p_search: search || null,
          p_limit: 1000,
          p_offset: 0
        });

      if (error) {
        console.error('Error loading suppliers:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar fornecedores",
          variant: "destructive",
        });
        return;
      }

      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [search]);

  // Search is already handled by RPC function
  const filteredSuppliers = useMemo(() => {
    return suppliers;
  }, [suppliers]);

  const handleRowClick = (supplier: SupplierData) => {
    // Navegação drill-down para detalhes do fornecedor (Nível 3)
    navigate(`/suppliers/${supplier.id}`);
  };

  const handleDelete = async (supplier: SupplierData) => {
    try {
      const { error } = await supabase
        .from('entidades_corporativas')
        .delete()
        .eq('id', supplier.id);

      if (error) {
        console.error('Error deleting supplier:', error);
        toast({
          title: "Erro",
          description: "Falha ao excluir fornecedor",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Fornecedor excluído definitivamente",
      });
      
      loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir fornecedor",
        variant: "destructive",
      });
    }
  };

  const formatCNPJ = (cnpj: string | undefined) => {
    // Formatar CNPJ: 00.000.000/0000-00
    if (!cnpj) return '-';
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length === 14) {
      return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } else if (clean.length === 11) {
      return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
    return cnpj;
  };

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
                <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
                <p className="text-muted-foreground">
                  {filteredSuppliers.length} fornecedor{filteredSuppliers.length !== 1 ? 'es' : ''} encontrado{filteredSuppliers.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate('/suppliers/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Fornecedor
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Busca */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, razão social ou CNPJ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Fornecedores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Lista de Fornecedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Razão Social</TableHead>
                      <TableHead>Nome Fantasia</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="h-12 w-12 text-muted-foreground/50" />
                            <p>Nenhum fornecedor encontrado</p>
                            {search && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSearch('')}
                              >
                                Limpar busca
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSuppliers.map((supplier) => (
                        <TableRow
                          key={supplier.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(supplier)}
                        >
                          <TableCell className="font-medium">{supplier.nome_razao_social}</TableCell>
                          <TableCell>{supplier.nome_fantasia || '-'}</TableCell>
                          <TableCell className="font-mono text-sm">{formatCNPJ(supplier.cpf_cnpj)}</TableCell>
                          <TableCell>
                            <Badge variant={supplier.tipo_pessoa === 'pessoa_fisica' ? 'default' : 'secondary'}>
                              {supplier.tipo_pessoa === 'pessoa_fisica' ? 'PF' : 'PJ'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={supplier.ativo ? "default" : "secondary"}>
                              {supplier.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(supplier);
                                }}
                              >
                                Ver Detalhes
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/suppliers/${supplier.id}/edit`);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir definitivamente o fornecedor "{supplier.nome_razao_social}"? 
                                      Esta ação não pode ser desfeita e removerá todos os dados relacionados.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDelete(supplier)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir Definitivamente
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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