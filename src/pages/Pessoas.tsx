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
import { DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useEntidadesCorporativas } from "@/hooks/useEntidadesCorporativas";
import { PeopleTable } from "@/components/features/people/PeopleTable";
import { PersonBulkEditModal, PersonBulkEditData } from "@/components/features/people/PersonBulkEditModal";
import { useUndoActions } from "@/hooks/useUndoActions";

interface PessoaData {
  id: string;
  nome: string;
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
  const [selectedItems, setSelectedItems] = useState<PessoaData[]>([]);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addUndoAction } = useUndoActions();
  
  const {
    papeis,
    carregarPapeis,
    loading: entidadeLoading
  } = useEntidadesCorporativas();

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
  });

  useEffect(() => {
    loadData();
    carregarPapeis();
  }, [carregarPapeis]);

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
        supabase.rpc('get_pessoas_with_papeis', {
          p_search: searchTerm || null,
          p_limit: 1000,
          p_offset: 0
        }),
        supabase.from('hr_cargos').select('*').eq('ativo', true).order('nome'),
        supabase.from('hr_setores').select('*').eq('ativo', true).order('nome'),
        supabase.from('filiais').select('*').eq('ativo', true).order('nome'),
      ]);

      if (pessoasRes.error) {
        console.error('Erro ao buscar pessoas:', pessoasRes.error);
        // Fallback para a função antiga se a nova não existir
        const fallbackRes = await supabase.rpc('search_entidades_pessoas', {
          p_search: searchTerm || null,
          p_limit: 1000,
          p_offset: 0
        });
        
        if (fallbackRes.error) throw fallbackRes.error;
        
        setPessoas(fallbackRes.data?.map((pessoa: any) => ({
          ...pessoa,
          nome: pessoa.nome_razao_social || pessoa.nome,
          cpf_cnpj: pessoa.cpf_cnpj
        })) || []);
      } else {
        setPessoas(pessoasRes.data || []);
      }

      if (cargosRes.error) throw cargosRes.error;
      if (setoresRes.error) throw setoresRes.error;
      if (filiaisRes.error) throw filiaisRes.error;

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
      const cpfCnpjValue = formData.tipo_pessoa === 'pessoa_fisica' ? formData.cpf : formData.cnpj;
      
      // Dados para a tabela pessoas
      const pessoaData = {
        nome: formData.nome,
        email: formData.email || null,
        telefone: formData.telefone || null,
        endereco: formData.endereco || null,
        tipo_pessoa: formData.tipo_pessoa,
        cpf: formData.tipo_pessoa === 'pessoa_fisica' ? cpfCnpjValue : null,
        cnpj: formData.tipo_pessoa === 'pessoa_juridica' ? cpfCnpjValue : null,
        razao_social: formData.tipo_pessoa === 'pessoa_juridica' ? formData.nome : null,
        nome_fantasia: formData.tipo_pessoa === 'pessoa_juridica' ? formData.nome : null,
        cargo_id: formData.cargo_id || null,
        setor_id: formData.setor_id || null,
        filial_id: formData.filial_id || null,
        ativo: true,
      };

      let pessoaId: string;

      if (editingPessoa) {
        // Atualizar pessoa existente
        const { error } = await supabase
          .from('pessoas')
          .update(pessoaData)
          .eq('id', editingPessoa.id);
        
        if (error) throw error;
        pessoaId = editingPessoa.id;
      } else {
        // Criar nova pessoa
        const { data, error } = await supabase
          .from('pessoas')
          .insert([pessoaData])
          .select()
          .single();
        
        if (error) throw error;
        pessoaId = data.id;
      }

      // Garantir que a pessoa existe em entidades_corporativas
      await supabase.rpc('ensure_pessoa_in_entidades_corporativas', {
        p_pessoa_id: pessoaId
      });

      // Gerenciar papéis
      if (formData.categorias.length > 0) {
        // Primeiro, desativar todos os papéis existentes
        await supabase
          .from('papeis_pessoa')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('pessoa_id', pessoaId);

        // Depois, ativar/inserir os papéis selecionados
        for (const categoriaNome of formData.categorias) {
          const papel = papeis.find(p => 
            p.nome.toLowerCase().trim() === categoriaNome.toLowerCase().trim()
          );
          
          if (!papel) {
            console.warn(`Papel não encontrado: ${categoriaNome}`);
            continue;
          }

          // Tentar inserir ou atualizar
          const { error: papelError } = await supabase
            .from('papeis_pessoa')
            .upsert({
              pessoa_id: pessoaId,
              papel_id: papel.id,
              ativo: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'pessoa_id,papel_id'
            });

          if (papelError) {
            console.error(`Erro ao associar papel ${categoriaNome}:`, papelError);
          }
        }
      } else {
        // Se nenhum papel foi selecionado, desativar todos
        await supabase
          .from('papeis_pessoa')
          .update({ ativo: false, updated_at: new Date().toISOString() })
          .eq('pessoa_id', pessoaId);
      }
      
      toast({
        title: 'Sucesso',
        description: editingPessoa ? 'Pessoa atualizada com sucesso.' : 'Pessoa criada com sucesso.',
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
    });
  };

  const handleDelete = async (pessoas: PessoaData[]) => {
    try {
      setLoading(true);
      const pessoaIds = pessoas.map(p => p.id);
      
      // Armazenar dados originais para undo
      const originalData = pessoas.map(pessoa => ({
        id: pessoa.id,
        nome: pessoa.nome,
        ativo: pessoa.ativo,
      }));

      // Desativar pessoas em vez de excluir
      const { error } = await supabase
        .from('pessoas')
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .in('id', pessoaIds);

      if (error) throw error;

      // Desativar papéis associados
      await supabase
        .from('papeis_pessoa')
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .in('pessoa_id', pessoaIds);

      setSelectedItems([]);
      
      // Adicionar ação de undo
      addUndoAction({
        id: `deletePeople-${Date.now()}`,
        type: 'delete',
        data: { pessoaIds, count: pessoas.length },
        originalData: { pessoas: originalData },
      }, () => {
        loadData();
      });
      
      toast({ 
        title: 'Pessoa(s) desativada(s)', 
        description: `${pessoas.length} pessoa${pessoas.length !== 1 ? 's' : ''} desativada${pessoas.length !== 1 ? 's' : ''} com sucesso.` 
      });
      
      setDeletingPessoa(null);
      loadData();
    } catch (error) {
      console.error('Error deleting pessoas:', error);
      toast({ 
        title: 'Erro ao desativar', 
        description: 'Não foi possível desativar as pessoas.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pessoa: PessoaData) => {
    setEditingPessoa(pessoa);
    setFormData({
      nome: pessoa.nome,
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

  const handleBulkEdit = (pessoas: PessoaData[]) => {
    setBulkEditModalOpen(true);
  };

  const handleBulkEditSave = async (updates: PersonBulkEditData) => {
    try {
      setBulkEditLoading(true);
      const pessoaIds = selectedItems.map(p => p.id);
      
      // Armazenar dados originais para undo
      const originalData = selectedItems.map(pessoa => ({
        id: pessoa.id,
        ativo: pessoa.ativo,
        papeis: pessoa.papeis,
      }));

      // Atualizar status se especificado
      if (updates.ativo !== undefined) {
        const { error } = await supabase
          .from('pessoas')
          .update({ ativo: updates.ativo, updated_at: new Date().toISOString() })
          .in('id', pessoaIds);

        if (error) throw error;
      }

      // Gerenciar papéis se especificado
      if (updates.papeis) {
        // Buscar IDs dos papéis pelos nomes
        let papelIdsToAdd: string[] = [];
        let papelIdsToRemove: string[] = [];

        if (updates.papeis.add.length > 0 || updates.papeis.remove.length > 0) {
          const allPapelNames = [...updates.papeis.add, ...updates.papeis.remove];
          const { data: papeisData, error: papeisError } = await supabase
            .from('papeis')
            .select('id, nome')
            .in('nome', allPapelNames);

          if (papeisError) throw papeisError;

          // Mapear nomes para IDs
          papelIdsToAdd = updates.papeis.add
            .map(nome => papeisData?.find(p => p.nome === nome)?.id)
            .filter(Boolean) as string[];
          
          papelIdsToRemove = updates.papeis.remove
            .map(nome => papeisData?.find(p => p.nome === nome)?.id)
            .filter(Boolean) as string[];
        }

        for (const pessoaId of pessoaIds) {
          // Adicionar papéis
          if (papelIdsToAdd.length > 0) {
            for (const papelId of papelIdsToAdd) {
              await supabase
                .from('papeis_pessoa')
                .upsert({
                  pessoa_id: pessoaId,
                  papel_id: papelId,
                  ativo: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'pessoa_id,papel_id'
                });
            }
          }

          // Remover papéis
          if (papelIdsToRemove.length > 0) {
            await supabase
              .from('papeis_pessoa')
              .update({ ativo: false, updated_at: new Date().toISOString() })
              .eq('pessoa_id', pessoaId)
              .in('papel_id', papelIdsToRemove);
          }
        }
      }

      setSelectedItems([]);
      setBulkEditModalOpen(false);
      
      // Adicionar ação de undo
      addUndoAction({
        id: `bulkEditPeople-${Date.now()}`,
        type: 'bulkEdit',
        data: { pessoaIds, count: selectedItems.length },
        originalData: { pessoas: originalData },
      }, () => {
        loadData();
      });

      toast({
        title: "Sucesso",
        description: `${selectedItems.length} pessoa${selectedItems.length !== 1 ? 's' : ''} atualizada${selectedItems.length !== 1 ? 's' : ''} com sucesso`,
      });
      
      loadData();
    } catch (error) {
      console.error('Error bulk editing pessoas:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar pessoas em massa",
        variant: "destructive",
      });
    } finally {
      setBulkEditLoading(false);
    }
  };

  const handleActivate = async (pessoas: PessoaData[]) => {
    await handleBulkEditSave({ ativo: true });
  };

  const handleDeactivate = async (pessoas: PessoaData[]) => {
    await handleBulkEditSave({ ativo: false });
  };

  const filteredPessoas = pessoas.filter(pessoa => {
    const matchesTipo = filterTipo === "all" || pessoa.tipo_pessoa === filterTipo;
    const matchesCategoria =
      filterCategoria === "all" ||
      pessoa.papeis?.some(papel => 
        papel.toLowerCase().includes(filterCategoria.toLowerCase()) ||
        (filterCategoria === "vendedor" && papel.toLowerCase().includes("vendedora"))
      );
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
      <Badge key={`${papel}-${index}`} className={colors[papel.toLowerCase()] || "bg-gray-100 text-gray-800"}>
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
              <DialogDescription>
                {editingPessoa ? "Altere os dados da pessoa e seus papéis." : "Preencha os dados para criar uma nova pessoa."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-6">
              <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="papeis">Papéis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="dados">
                  <Card>
                    <CardHeader>
                      <CardTitle>Informações Básicas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="tipo_pessoa">Tipo de Pessoa</Label>
                        <Select 
                          value={formData.tipo_pessoa} 
                          onValueChange={(value: 'pessoa_fisica' | 'pessoa_juridica') => 
                            setFormData(prev => ({ ...prev, tipo_pessoa: value }))
                          }
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
                        <Label htmlFor="nome">
                          {formData.tipo_pessoa === 'pessoa_fisica' ? 'Nome Completo' : 'Razão Social'}
                        </Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="telefone">Telefone</Label>
                          <Input
                            id="telefone"
                            value={formData.telefone}
                            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {formData.tipo_pessoa === 'pessoa_fisica' ? (
                          <div>
                            <Label htmlFor="cpf">CPF</Label>
                            <Input
                              id="cpf"
                              value={formData.cpf}
                              onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                              placeholder="000.000.000-00"
                            />
                          </div>
                        ) : (
                          <div>
                            <Label htmlFor="cnpj">CNPJ</Label>
                            <Input
                              id="cnpj"
                              value={formData.cnpj}
                              onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                              placeholder="00.000.000/0000-00"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="papeis">
                  <Card>
                    <CardHeader>
                      <CardTitle>Papéis e Categorias</CardTitle>
                      <CardDescription>
                        Selecione os papéis que esta pessoa desempenha na organização.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {papeis.map((papel) => (
                          <div key={papel.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={papel.id}
                              checked={formData.categorias.includes(papel.nome)}
                              onCheckedChange={(checked) => 
                                handleCategoriaChange(papel.nome, checked as boolean)
                              }
                            />
                            <Label htmlFor={papel.id}>{papel.nome}</Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : (editingPessoa ? 'Atualizar' : 'Criar')}
                </Button>
              </div>
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
          {selectedItems.length > 0 && (
            <div className="flex gap-2 mb-4 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selecionado{selectedItems.length !== 1 ? 's' : ''}
              </span>
              <Button size="sm" variant="outline" onClick={() => handleBulkEdit(selectedItems)}>
                Editar em Massa
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleActivate(selectedItems)}>
                Ativar
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDeactivate(selectedItems)}>
                Desativar
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => setDeletingPessoa(selectedItems[0])}
              >
                Excluir
              </Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.length === filteredPessoas.length && filteredPessoas.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedItems(filteredPessoas);
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Papéis</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPessoas.map((pessoa) => (
                <TableRow key={pessoa.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.some(item => item.id === pessoa.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedItems([...selectedItems, pessoa]);
                        } else {
                          setSelectedItems(selectedItems.filter(item => item.id !== pessoa.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{pessoa.nome}</TableCell>
                  <TableCell>
                    <Badge variant={pessoa.tipo_pessoa === 'pessoa_fisica' ? 'default' : 'secondary'}>
                      {pessoa.tipo_pessoa === 'pessoa_fisica' ? 'PF' : 'PJ'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCPF(pessoa.cpf_cnpj)}</TableCell>
                  <TableCell>{pessoa.email || '-'}</TableCell>
                  <TableCell>{pessoa.telefone || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getCategoriasBadges(pessoa.papeis)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={pessoa.ativo ? 'default' : 'secondary'}>
                      {pessoa.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(pessoa)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
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

          {filteredPessoas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma pessoa encontrada
            </div>
          )}
        </CardContent>
      </Card>

      <PersonBulkEditModal
        open={bulkEditModalOpen}
        onOpenChange={setBulkEditModalOpen}
        onSave={handleBulkEditSave}
        loading={bulkEditLoading}
        selectedCount={selectedItems.length}
        availableRoles={papeis.map(p => p.nome)}
      />

      <AlertDialog open={!!deletingPessoa} onOpenChange={() => setDeletingPessoa(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {deletingPessoa?.nome}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingPessoa && handleDelete([deletingPessoa])}
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
