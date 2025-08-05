/**
 * Página de listagem de fornecedores (Nível 2 - Drill Down)
 * Exibe tabela de fornecedores com navegação para detalhes
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Building2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Supplier } from '@/types/payables';

// Mock data - substituir por dados reais da API
const mockSuppliers: Supplier[] = [
  { 
    id: 'sup1', 
    name: 'KYLY INDUSTRIA TEXTIL LTDA', 
    legalName: 'KYLY INDUSTRIA TEXTIL LTDA', 
    cnpj: '12.345.678/0001-90',
    brandId: 'brand1'
  },
  { 
    id: 'sup2', 
    name: 'CONFECCOES ACUCENA LTDA', 
    legalName: 'CONFECCOES ACUCENA LTDA', 
    cnpj: '98.765.432/0001-10',
    brandId: 'brand2'
  },
  { 
    id: 'sup3', 
    name: 'PIMPOLHO PRODUTOS INFANTIS LTDA', 
    legalName: 'PIMPOLHO PRODUTOS INFANTIS LTDA', 
    cnpj: '11.222.333/0001-44',
    brandId: 'brand3'
  },
  { 
    id: 'sup4', 
    name: 'ABRANGE IND E COM CONF LTDA', 
    legalName: 'ABRANGE IND E COM CONF LTDA', 
    cnpj: '55.666.777/0001-88',
    brandId: 'brand4'
  },
];

export default function Suppliers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // Filtrar fornecedores baseado na busca
  const filteredSuppliers = useMemo(() => {
    if (!search) return mockSuppliers;
    
    const searchLower = search.toLowerCase();
    return mockSuppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchLower) ||
      supplier.legalName.toLowerCase().includes(searchLower) ||
      supplier.cnpj.includes(search)
    );
  }, [search]);

  const handleRowClick = (supplier: Supplier) => {
    // Navegação drill-down para detalhes do fornecedor (Nível 3)
    navigate(`/suppliers/${supplier.id}`);
  };

  const formatCNPJ = (cnpj: string) => {
    // Formatar CNPJ: 00.000.000/0000-00
    const clean = cnpj.replace(/\D/g, '');
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
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
                      <TableHead>Nome Fantasia</TableHead>
                      <TableHead>Razão Social</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.legalName}</TableCell>
                          <TableCell className="font-mono text-sm">{formatCNPJ(supplier.cnpj)}</TableCell>
                          <TableCell>
                            <Badge variant="default">Ativo</Badge>
                          </TableCell>
                          <TableCell className="text-right">
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