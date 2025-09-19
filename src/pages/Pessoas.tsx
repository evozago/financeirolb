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

interface Pessoa {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  tipo_pessoa: string;
  categorias: any;
  cpf: string;
  cnpj: string;
  cargo_id: string;
  setor_id: string;
  filial_id: string;
  ativo: boolean;
  dados_funcionario: any;
  dados_vendedora: any;
  dados_fornecedor: any;
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
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPessoa, setEditingPessoa] = useState<Pessoa | null>(null);
  const [deletingPessoa, setDeletingPessoa] = useState<Pessoa | null>(null);
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

  const loadData = async () => {
    try {
      const [fornRes, cargosRes, setoresRes, filiaisRes] = await Promise.all([
        supabase
          .from('fornecedores')
          .select('id, nome, email, telefone, endereco, tipo_pessoa, cpf, cnpj_cpf, cargo_id, setor_id, filial_id, ativo, salario, data_admissao, meta_mensal, comissao_padrao, comissao_supermeta, categoria_id, eh_funcionario, eh_vendedora, eh_fornecedor')
          .order('nome'),
        supabase.from('hr_cargos').select('*').eq('ativo', true).order('nome'),
        supabase.from('hr_setores').select('*').eq('ativo', true).order('nome'),
        supabase.from('filiais').select('*').eq('ativo', true).order('nome'),
      ]);

      if (fornRes.error) throw fornRes.error;
      if (cargosRes.error) throw cargosRes.error;
      if (setoresRes.error) throw setoresRes.error;
      if (filiaisRes.error) throw filiaisRes.error;

      // Mapear fornecedores -> pessoas unificadas
      const mapped = (fornRes.data || []).map((f: any) => ({
        id: f.id,
        nome: f.nome,
        email: f.email,
        telefone: f.telefone,
        endereco: f.endereco,
        tipo_pessoa: f.tipo_pessoa,
        categorias: [
          ...(f.eh_funcionario ? ['funcionario'] : []),
          ...(f.eh_vendedora ? ['vendedora'] : []),
          ...(f.eh_fornecedor ? ['fornecedor'] : []),
        ],
        cpf: f.cpf,
        cnpj: f.cnpj_cpf,
        cargo_id: f.cargo_id,
        setor_id: f.setor_id,
        filial_id: f.filial_id,
        ativo: f.ativo,
        dados_funcionario: { salario: f.salario, data_admissao: f.data_admissao },
        dados_vendedora: { meta_mensal: f.meta_mensal, comissao_padrao: f.comissao_padrao, comissao_supermeta: f.comissao_supermeta },
        dados_fornecedor: { categoria_id: f.categoria_id },
      })) as Pessoa[];

      setPessoas(mapped);
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
      const pessoaData: any = {
        nome: formData.nome,
        email: formData.email || null,
        telefone: formData.telefone || null,
        endereco: formData.endereco || null,
        tipo_pessoa: formData.tipo_pessoa,
        cpf: formData.tipo_pessoa === 'pessoa_fisica' ? formData.cpf || null : null,
        cnpj_cpf: formData.tipo_pessoa === 'pessoa_juridica' ? formData.cnpj || null : null,
        cargo_id: formData.cargo_id || null,
        filial_id: formData.filial_id || null,
        // Flags de categoria
        eh_funcionario: formData.categorias.includes('funcionario'),
        eh_vendedora: formData.categorias.includes('vendedora'),
        eh_fornecedor: formData.categorias.includes('fornecedor'),
      };

      // Campos específicos
      if (formData.categorias.includes('funcionario')) {
        pessoaData.salario = parseFloat(formData.salario) || 0;
        pessoaData.data_admissao = formData.data_admissao || null;
      } else {
        pessoaData.salario = null;
        pessoaData.data_admissao = null;
      }

      if (formData.categorias.includes('vendedora')) {
        pessoaData.meta_mensal = parseFloat(formData.meta_mensal) || 0;
        pessoaData.comissao_padrao = parseFloat(formData.comissao_padrao) || 3.0;
        pessoaData.comissao_supermeta = parseFloat(formData.comissao_supermeta) || 5.0;
      } else {
        pessoaData.meta_mensal = null;
        pessoaData.comissao_padrao = null;
        pessoaData.comissao_supermeta = null;
      }

      if (formData.categorias.includes('fornecedor')) {
        pessoaData.categoria_id = formData.categoria_id || null;
      } else {
        pessoaData.categoria_id = null;
      }

      let result;
      if (editingPessoa) {
        result = await supabase
          .from('fornecedores')
          .update(pessoaData)
          .eq('id', editingPessoa.id);
      } else {
        result = await supabase
          .from('fornecedores')
          .insert([pessoaData]);
      }

      if (result.error) throw result.error;

      toast({
        title: editingPessoa ? 'Pessoa atualizada' : 'Pessoa criada',
        description: editingPessoa ? 'A pessoa foi atualizada com sucesso.' : 'A nova pessoa foi criada com sucesso.',
      });

      setDialogOpen(false);
      setEditingPessoa(null);
      resetForm();
      loadData();
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

  const handleDelete = async (pessoa: Pessoa) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', pessoa.id);
      if (error) throw error;
      toast({ title: 'Pessoa excluída', description: 'A pessoa foi removida com sucesso.' });
      setDeletingPessoa(null);
      loadData();
    } catch (error) {
      console.error('Error deleting pessoa:', error);
      toast({ title: 'Erro ao excluir', description: 'Não foi possível excluir a pessoa.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pessoa: Pessoa) => {
    setEditingPessoa(pessoa);
    setFormData({
      nome: pessoa.nome,
      email: pessoa.email || "",
      telefone: pessoa.telefone || "",
      endereco: pessoa.endereco || "",
      tipo_pessoa: pessoa.tipo_pessoa as 'pessoa_fisica' | 'pessoa_juridica',
      categorias: pessoa.categorias || [],
      cpf: pessoa.cpf || "",
      cnpj: pessoa.cnpj || "",
      cargo_id: pessoa.cargo_id || "",
      setor_id: pessoa.setor_id || "",
      filial_id: pessoa.filial_id || "",
      salario: pessoa.dados_funcionario?.salario?.toString() || "",
      data_admissao: pessoa.dados_funcionario?.data_admissao || "",
      meta_mensal: pessoa.dados_vendedora?.meta_mensal?.toString() || "",
      comissao_padrao: pessoa.dados_vendedora?.comissao_padrao?.toString() || "3.0",
      comissao_supermeta: pessoa.dados_vendedora?.comissao_supermeta?.toString() || "5.0",
      categoria_id: pessoa.dados_fornecedor?.categoria_id || "",
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
    const matchesCategoria = filterCategoria === "all" || pessoa.categorias?.includes(filterCategoria);
    const matchesSearch = pessoa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (pessoa.email && pessoa.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTipo && matchesCategoria && matchesSearch;
  });

  const getCategoriasBadges = (categorias: string[]) => {
    const colors: Record<string, string> = {
      funcionario: "bg-blue-100 text-blue-800",
      vendedora: "bg-green-100 text-green-800",
      fornecedor: "bg-purple-100 text-purple-800"
    };

    return categorias?.map(cat => (
      <Badge key={cat} className={colors[cat] || "bg-gray-100 text-gray-800"}>
        {cat}
      </Badge>
    ));
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
            <SelectItem value="vendedora">Vendedora</SelectItem>
            <SelectItem value="fornecedor">Fornecedor</SelectItem>
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
              {/* Basic Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Dados Básicos</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({...prev, nome: e.target.value}))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({...prev, telefone: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData(prev => ({...prev, endereco: e.target.value}))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Classification */}
              <Card>
                <CardHeader>
                  <CardTitle>Classificação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tipo de Pessoa</Label>
                    <Select
                      value={formData.tipo_pessoa}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev, 
                        tipo_pessoa: value as 'pessoa_fisica' | 'pessoa_juridica'
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                        <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Categorias</Label>
                    <div className="flex gap-4 mt-2">
                      {['funcionario', 'vendedora', 'fornecedor'].map(categoria => (
                        <div key={categoria} className="flex items-center space-x-2">
                          <Checkbox
                            id={categoria}
                            checked={formData.categorias.includes(categoria)}
                            onCheckedChange={(checked) => handleCategoriaChange(categoria, checked as boolean)}
                          />
                          <Label htmlFor={categoria} className="capitalize">{categoria}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {formData.tipo_pessoa === 'pessoa_fisica' && (
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => setFormData(prev => ({...prev, cpf: e.target.value}))}
                      />
                    </div>
                  )}

                  {formData.tipo_pessoa === 'pessoa_juridica' && (
                    <div>
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => setFormData(prev => ({...prev, cnpj: e.target.value}))}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuração</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {formData.categorias.includes('funcionario') && (
                    <>
                      <div>
                        <Label htmlFor="cargo_id">Cargo</Label>
                        <Select
                          value={formData.cargo_id}
                          onValueChange={(value) => setFormData(prev => ({...prev, cargo_id: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cargo" />
                          </SelectTrigger>
                          <SelectContent>
                            {cargos.map(cargo => (
                              <SelectItem key={cargo.id} value={cargo.id}>
                                {cargo.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="salario">Salário</Label>
                        <Input
                          id="salario"
                          type="number"
                          step="0.01"
                          value={formData.salario}
                          onChange={(e) => setFormData(prev => ({...prev, salario: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="data_admissao">Data de Admissão</Label>
                        <Input
                          id="data_admissao"
                          type="date"
                          value={formData.data_admissao}
                          onChange={(e) => setFormData(prev => ({...prev, data_admissao: e.target.value}))}
                        />
                      </div>
                    </>
                  )}

                  {formData.categorias.includes('vendedora') && (
                    <>
                      <div>
                        <Label htmlFor="meta_mensal">Meta Mensal</Label>
                        <Input
                          id="meta_mensal"
                          type="number"
                          step="0.01"
                          value={formData.meta_mensal}
                          onChange={(e) => setFormData(prev => ({...prev, meta_mensal: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="comissao_padrao">Comissão Padrão (%)</Label>
                        <Input
                          id="comissao_padrao"
                          type="number"
                          step="0.1"
                          value={formData.comissao_padrao}
                          onChange={(e) => setFormData(prev => ({...prev, comissao_padrao: e.target.value}))}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="filial_id">Filial</Label>
                    <Select
                      value={formData.filial_id}
                      onValueChange={(value) => setFormData(prev => ({...prev, filial_id: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma filial" />
                      </SelectTrigger>
                      <SelectContent>
                        {filiais.map(filial => (
                          <SelectItem key={filial.id} value={filial.id}>
                            {filial.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingPessoa ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pessoas Cadastradas ({filteredPessoas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categorias</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPessoas.map((pessoa) => (
                <TableRow key={pessoa.id}>
                  <TableCell className="font-medium">{pessoa.nome}</TableCell>
                  <TableCell>
                    <Badge variant={pessoa.tipo_pessoa === 'pessoa_fisica' ? 'default' : 'secondary'}>
                      {pessoa.tipo_pessoa === 'pessoa_fisica' ? 'PF' : 'PJ'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {getCategoriasBadges(pessoa.categorias)}
                    </div>
                  </TableCell>
                  <TableCell>{pessoa.email}</TableCell>
                  <TableCell>{pessoa.telefone}</TableCell>
                  <TableCell>{pessoa.cpf || pessoa.cnpj}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(pessoa)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingPessoa(pessoa)}
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

      <AlertDialog open={!!deletingPessoa} onOpenChange={() => setDeletingPessoa(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a pessoa <strong>{deletingPessoa?.nome}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPessoa && handleDelete(deletingPessoa)}
              disabled={loading}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}