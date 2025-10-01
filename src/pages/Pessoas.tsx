import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface PessoaData {
  id: string;
  nome: string;
  tipo_pessoa: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  cnpj?: string;
  ativo: boolean;
  categorias: string[];
  dados_fornecedor?: {
    tipo?: string;
    marcas?: string[];
  };
}

export default function Pessoas() {
  const [pessoas, setPessoas] = useState<PessoaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome, tipo_pessoa, email, telefone, cpf, cnpj, ativo, categorias, dados_fornecedor")
        .order("nome");

      if (error) throw error;

      const pessoasData = (data ?? []).map((pessoa: any) => ({
        ...pessoa,
        categorias: Array.isArray(pessoa.categorias) ? pessoa.categorias : [],
        dados_fornecedor: pessoa.dados_fornecedor || { tipo: null, marcas: [] }
      }));

      setPessoas(pessoasData);
    } catch (error) {
      console.error("Erro ao carregar pessoas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as pessoas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPessoas = pessoas.filter((pessoa) => {
    const matchesSearch =
      searchTerm === "" ||
      pessoa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pessoa.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pessoa.cpf?.includes(searchTerm) ||
      pessoa.cnpj?.includes(searchTerm);

    const matchesTipo = filterTipo === "all" || pessoa.tipo_pessoa === filterTipo;
    const matchesCategoria =
      filterCategoria === "all" || pessoa.categorias.includes(filterCategoria);

    return matchesSearch && matchesTipo && matchesCategoria;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gestão de Pessoas</h1>
          <p className="text-muted-foreground">
            Funcionários, clientes e fornecedores unificados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome, CPF, CNPJ ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
            <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="funcionario">Funcionário</SelectItem>
            <SelectItem value="vendedor">Vendedor</SelectItem>
            <SelectItem value="fornecedor">Fornecedor</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pessoas</CardTitle>
          <CardDescription>
            {filteredPessoas.length} pessoa{filteredPessoas.length !== 1 ? "s" : ""} encontrada{filteredPessoas.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Categorias</TableHead>
                <TableHead>Tipo Fornecedor</TableHead>
                <TableHead>Marcas</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPessoas.map((pessoa) => (
                <TableRow key={pessoa.id}>
                  <TableCell>{pessoa.nome}</TableCell>
                  <TableCell>{pessoa.tipo_pessoa}</TableCell>
                  <TableCell>{pessoa.email || "-"}</TableCell>
                  <TableCell>{pessoa.telefone || "-"}</TableCell>
                  <TableCell>
                    {pessoa.categorias.length > 0
                      ? pessoa.categorias.join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell>{pessoa.dados_fornecedor?.tipo || "-"}</TableCell>
                  <TableCell>
                    {pessoa.dados_fornecedor?.marcas?.length
                      ? pessoa.dados_fornecedor.marcas.join(", ")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {pessoa.ativo ? "Ativo" : "Inativo"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
