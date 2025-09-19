import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Position {
  id: string;
  nome: string;
  descricao: string;
  salario_base_sugerido: number;
  setor_id: string;
  setor?: { nome: string };
  ativo: boolean;
}

interface Department {
  id: string;
  nome: string;
}

export default function PositionsManagement() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    salario_base_sugerido: "",
    setor_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [positionsRes, departmentsRes] = await Promise.all([
        supabase.from('hr_cargos')
          .select(`
            *,
            hr_setores!hr_cargos_setor_id_fkey (nome)
          `)
          .eq('ativo', true)
          .order('nome'),
        supabase.from('hr_setores')
          .select('*')
          .eq('ativo', true)
          .order('nome')
      ]);

      if (positionsRes.error) throw positionsRes.error;
      if (departmentsRes.error) throw departmentsRes.error;

      setPositions(positionsRes.data || []);
      setDepartments(departmentsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os cargos e setores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const positionData = {
        nome: formData.nome,
        descricao: formData.descricao,
        salario_base_sugerido: formData.salario_base_sugerido ? 
          parseFloat(formData.salario_base_sugerido) : null,
        setor_id: formData.setor_id || null,
      };

      let result;
      if (editingPosition) {
        result = await supabase
          .from('hr_cargos')
          .update(positionData)
          .eq('id', editingPosition.id);
      } else {
        result = await supabase
          .from('hr_cargos')
          .insert([positionData]);
      }

      if (result.error) throw result.error;

      toast({
        title: editingPosition ? "Cargo atualizado" : "Cargo criado",
        description: editingPosition ? 
          "O cargo foi atualizado com sucesso." : 
          "O novo cargo foi criado com sucesso.",
      });

      setDialogOpen(false);
      setEditingPosition(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving position:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o cargo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (position: Position) => {
    try {
      const { error } = await supabase
        .from('hr_cargos')
        .update({ ativo: false })
        .eq('id', position.id);

      if (error) throw error;

      toast({
        title: "Cargo removido",
        description: "O cargo foi removido com sucesso.",
      });

      loadData();
    } catch (error) {
      console.error('Error deleting position:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o cargo.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      salario_base_sugerido: "",
      setor_id: "",
    });
  };

  const openEdit = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      nome: position.nome,
      descricao: position.descricao || "",
      salario_base_sugerido: position.salario_base_sugerido?.toString() || "",
      setor_id: position.setor_id || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingPosition(null);
    resetForm();
    setDialogOpen(true);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Cargos
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cargo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPosition ? "Editar Cargo" : "Novo Cargo"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Cargo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({...prev, nome: e.target.value}))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({...prev, descricao: e.target.value}))}
                  />
                </div>
                <div>
                  <Label htmlFor="setor_id">Setor</Label>
                  <Select
                    value={formData.setor_id}
                    onValueChange={(value) => setFormData(prev => ({...prev, setor_id: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="salario_base_sugerido">Salário Base Sugerido</Label>
                  <Input
                    id="salario_base_sugerido"
                    type="number"
                    step="0.01"
                    value={formData.salario_base_sugerido}
                    onChange={(e) => setFormData(prev => ({...prev, salario_base_sugerido: e.target.value}))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {editingPosition ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Salário Base</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position) => (
              <TableRow key={position.id}>
                <TableCell className="font-medium">{position.nome}</TableCell>
                <TableCell>{position.setor?.nome || "-"}</TableCell>
                <TableCell>{formatCurrency(position.salario_base_sugerido)}</TableCell>
                <TableCell>{position.descricao || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(position)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Cargo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir definitivamente o cargo "{position.nome}"?
                            Esta ação não pode ser desfeita e removerá todos os dados relacionados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(position)}
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}