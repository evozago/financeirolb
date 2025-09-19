import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface PessoaData {
  id: string;
  nome_razao_social: string;
  nome_fantasia?: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  tipo_pessoa: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  papeis?: string[];
}

interface Cargo {
  id: string;
  nome: string;
  setor_id: string;
}

interface Setor {
  id: string;
  nome: string;
}

interface Filial {
  id: string;
  nome: string;
}

export default function Pessoas() {
  const [pessoas, setPessoas] = useState<PessoaData[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPessoa, setEditingPessoa] = useState<PessoaData | null>(null);
  const [deletingPessoa, setDeletingPessoa] = useState<PessoaData | null>(null);
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    tipo_pessoa: "pessoa_fisica" as 'pessoa_fisica' | 'pessoa_juridica',
    categorias: [] as string[],
    cpf: "",
    cnpj: "",
    cargo_id: "",
    setor_id: "",
    filial_id: "",
    // Dados específicos
    salario: "",
    data_admissao: "",
    meta_mensal: "",
    comissao_padrao: "3.0",
    comissao_supermeta: "5.0",
    categoria_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadData();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [pessoasRes, cargosRes, setoresRes, filiaisRes] = await Promise.all([
        supabase.rpc('search_entidades_pessoas', {
          p_search: searchTerm || null,
          p_limit: 1000,
          p_offset: 0
        }),
        supabase.from('hr_cargos').select('*').eq('ativo', true).order('nome'),
        supabase.from('hr_setores').select('*').eq('ativo', true).order('nome'),
        supabase.from('filiais').select('*').eq('ativo', true).order('nome'),
      ]);

      if (pessoasRes.error) throw pessoasRes.error;
      if (cargosRes.error) throw cargosRes.error;
      if (setoresRes.error) throw setoresRes.error;
      if (filiaisRes.error) throw filiaisRes.error;

      setPessoas(pessoasRes.data || []);
      setCargos(cargosRes.data || []);
      setSetores(setoresRes.data || []);
      setFiliais(filiaisRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // This would need to be adapted for entidades_corporativas
      // For now, keeping the existing logic but with a toast message
      toast({
        title: 'Funcionalidade em desenvolvimento',
        description: 'A criação/edição de pessoas será migrada para o novo sistema em breve.',
        variant: 'default',
      });
      
      setDialogOpen(false);
      setEditingPessoa(null);
      resetForm();
    } catch (error) {
      console.error('Error saving pessoa:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a pessoa.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      endereco: "",
      tipo_pessoa: "pessoa_fisica",
      categorias: [],
      cpf: "",
      cnpj: "",
      cargo_id: "",
      setor_id: "",
      filial_id: "",
      salario: "",
      data_admissao: "",
      meta_mensal: "",
      comissao_padrao: "3.0",
      comissao_supermeta: "5.0",
      categoria_id: "",
    });
  };

  const handleDelete = async (pessoa: PessoaData) => {
    try {
      setLoading(true);

      const normDoc = pessoa.cpf_cnpj ? pessoa.cpf_cnpj.replace(/\D/g, '') : null;
      
      // 1) Excluir na entidades_corporativas por id e por documento normalizado (se houver)
      await supabase
        .from('entidades_corporativas')
        .delete()
        .eq('id', pessoa.id);

      if (normDoc) {
        await supabase
          .from('entidades_corporativas')
          .delete()
          .eq('cpf_cnpj_normalizado', normDoc);
      }

      // 2) Excluir na fornecedores (legado) por id e por documento normalizado (se houver)
      await supabase
        .from('fornecedores')
        .delete()
        .eq('id', pessoa.id);

      if (normDoc) {
        await supabase
          .from('fornecedores')
          .delete()
          .eq('cpf_cnpj_normalizado', normDoc);
      }
      
      toast({ 
        title: 'Pessoa excluída definitivamente', 
        description: 'A pessoa foi removida com sucesso.' 
      });
      
      setDeletingPessoa(null);
      loadData();
    } catch (error) {
      console.error('Error deleting pessoa:', error);
      toast({ 
        title: 'Erro ao excluir', 
        description: 'Não foi possível excluir a pessoa.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pessoa: PessoaData) => {
    setEditingPessoa(pessoa);
    setFormData({
      nome: pessoa.nome_razao_social,
      email: pessoa.email || "",
      telefone: pessoa.telefone || "",
      endereco: "",
      tipo_pessoa: pessoa.tipo_pessoa as 'pessoa_fisica' | 'pessoa_juridica',
      categorias: pessoa.papeis || [],
      cpf: pessoa.tipo_pessoa === 'pessoa_fisica' ? pessoa.cpf_cnpj || "" : "",
      cnpj: pessoa.tipo_pessoa === 'pessoa_juridica' ? pessoa.cpf_cnpj || "" : "",
      cargo_id: "",
      setor_id: "",
      filial_id: "",
      salario: "",
      data_admissao: "",
      meta_mensal: "",
      comissao_padrao: "3.0",
      comissao_supermeta: "5.0",
      categoria_id: "",
    });
    setDialogOpen(true);
  };

  const handleCategoriaChange = (categoria: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categorias: checked 
        ? [...prev.categorias, categoria]
        : prev.categorias.filter(c => c !== categoria)
    }));
  };

  const filteredPessoas = pessoas.filter(pessoa => {
    const matchesTipo = filterTipo === "all" || pessoa.tipo_pessoa === filterTipo;
    const matchesCategoria = filterCategoria === "all" || (pessoa.papeis && pessoa.papeis.includes(filterCategoria));
    // Search is already handled by RPC function
    return matchesTipo && matchesCategoria;
  });

  const getCategoriasBadges = (papeis: string[] | undefined) => {
    const colors: Record<string, string> = {
      funcionario: "bg-blue-100 text-blue-800",
      vendedor: "bg-green-100 text-green-800", 
      vendedora: "bg-green-100 text-green-800",
      fornecedor: "bg-purple-100 text-purple-800",
      cliente: "bg-orange-100 text-orange-800"
    };

    return papeis?.filter(papel => papel).map((papel, index) => (
      <Badge key={`${papel}-${index}`} className={colors[papel] || "bg-gray-100 text-gray-800"}>
        {papel}
      </Badge>
    ));
  };

  const formatCPF = (cpfCnpj: string | undefined) => {
    if (!cpfCnpj) return '-';
    const clean = cpfCnpj.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    } else if (clean.length === 14) {
      return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return cpfCnpj;
  };

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
            Funcionários, vendedoras e fornecedores unificados
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome ou email..."
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <UserPlus className="h-4 w-4 mr-2" />
              Nova Pessoa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPessoa ? "Editar Pessoa" : "Nova Pessoa"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Funcionalidade em Desenvolvimento</CardTitle>
                  <CardDescription>
                    A criação e edição de pessoas será migrada para o novo sistema unificado em breve.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" onClick={() => setDialogOpen(false)}>
                    Fechar
                  </Button>
                </CardContent>
              </Card>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pessoas</CardTitle>
          <CardDescription>
            {filteredPessoas.length} pessoa{filteredPessoas.length !== 1 ? 's' : ''} encontrada{filteredPessoas.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papéis</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPessoas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        Nenhuma pessoa encontrada
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPessoas.map((pessoa) => (
                    <TableRow key={pessoa.id}>
                      <TableCell className="font-medium">{pessoa.nome_razao_social}</TableCell>
                      <TableCell>
                        <Badge variant={pessoa.tipo_pessoa === 'pessoa_fisica' ? 'default' : 'secondary'}>
                          {pessoa.tipo_pessoa === 'pessoa_fisica' ? 'PF' : 'PJ'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{formatCPF(pessoa.cpf_cnpj)}</TableCell>
                      <TableCell>{pessoa.email || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pessoa.papeis && pessoa.papeis.length > 0 ? (
                            getCategoriasBadges(pessoa.papeis)
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(pessoa)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog
                            open={deletingPessoa?.id === pessoa.id}
                            onOpenChange={(open) => !open && setDeletingPessoa(null)}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingPessoa(pessoa)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir definitivamente "{pessoa.nome_razao_social}"? 
                                  Esta ação não pode ser desfeita e removerá todos os dados relacionados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeletingPessoa(null)}>
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletingPessoa && handleDelete(deletingPessoa)}
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
  );
}
