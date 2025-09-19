import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
}

export default function DepartmentsManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('hr_setores')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os setores.",
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
      const departmentData = {
        nome: formData.nome,
        descricao: formData.descricao,
      };

      let result;
      if (editingDepartment) {
        result = await supabase
          .from('hr_setores')
          .update(departmentData)
          .eq('id', editingDepartment.id);
      } else {
        result = await supabase
          .from('hr_setores')
          .insert([departmentData]);
      }

      if (result.error) throw result.error;

      toast({
        title: editingDepartment ? "Setor atualizado" : "Setor criado",
        description: editingDepartment ? 
          "O setor foi atualizado com sucesso." : 
          "O novo setor foi criado com sucesso.",
      });

      setDialogOpen(false);
      setEditingDepartment(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o setor.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (department: Department) => {
    try {
      const { error } = await supabase
        .from('hr_setores')
        .update({ ativo: false })
        .eq('id', department.id);

      if (error) throw error;

      toast({
        title: "Setor removido",
        description: "O setor foi removido com sucesso.",
      });

      loadData();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o setor.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
    });
  };

  const openEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      nome: department.nome,
      descricao: department.descricao || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingDepartment(null);
    resetForm();
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Setores
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Setor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDepartment ? "Editar Setor" : "Novo Setor"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Setor *</Label>
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
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {editingDepartment ? "Atualizar" : "Criar"}
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
              <TableHead>Descrição</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell className="font-medium">{department.nome}</TableCell>
                <TableCell>{department.descricao || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(department)}
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
                          <AlertDialogTitle>Excluir Setor</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir definitivamente o setor "{department.nome}"?
                            Esta ação não pode ser desfeita e removerá todos os dados relacionados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(department)}
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