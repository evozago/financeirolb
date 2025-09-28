import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Users, Tag, AlertTriangle } from 'lucide-react';
import { usePapeisManagement, PapelFormData, PapelHierarquico } from '@/hooks/usePapeisManagement';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PapelFormDialogProps {
  papel?: PapelHierarquico;
  papeisPais: PapelHierarquico[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (dados: PapelFormData) => Promise<void>;
  loading: boolean;
}

function PapelFormDialog({ papel, papeisPais, open, onOpenChange, onSubmit, loading }: PapelFormDialogProps) {
  const [formData, setFormData] = useState<PapelFormData>({
    nome: papel?.nome || '',
    descricao: papel?.descricao || '',
    papel_pai_id: papel?.papel_pai_id || '',
    ativo: papel?.ativo ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    
    try {
      await onSubmit({
        ...formData,
        papel_pai_id: formData.papel_pai_id || undefined,
      });
      onOpenChange(false);
      setFormData({ nome: '', descricao: '', papel_pai_id: '', ativo: true });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {papel ? 'Editar Papel/Categoria' : 'Novo Papel/Categoria'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Fornecedor de Produtos Para Revenda"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o papel/categoria..."
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="papel_pai">Categoria Pai (opcional)</Label>
            <Select
              value={formData.papel_pai_id}
              onValueChange={(value) => setFormData({ ...formData, papel_pai_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar categoria pai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhuma (categoria raiz)</SelectItem>
                {papeisPais
                  .filter(p => p.id !== papel?.id) // Evitar auto-referência
                  .map((papelPai) => (
                    <SelectItem key={papelPai.id} value={papelPai.id}>
                      {papelPai.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
            />
            <Label htmlFor="ativo">Ativo</Label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {papel ? 'Atualizar' : 'Criar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PapelCardProps {
  papel: PapelHierarquico;
  papeisFilhos: PapelHierarquico[];
  onEdit: (papel: PapelHierarquico) => void;
  onDelete: (papel: PapelHierarquico) => void;
}

function PapelCard({ papel, papeisFilhos, onEdit, onDelete }: PapelCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {papel.nome}
            </CardTitle>
            {papel.papel_pai_nome && (
              <Badge variant="secondary" className="mt-2">
                Filho de: {papel.papel_pai_nome}
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(papel)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(papel)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {papel.descricao && (
          <p className="text-sm text-muted-foreground mb-3">
            {papel.descricao}
          </p>
        )}
        
        {papeisFilhos.length > 0 && (
          <>
            <Separator className="mb-3" />
            <div>
              <p className="text-sm font-medium flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                Sub-categorias ({papeisFilhos.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {papeisFilhos.map((filho) => (
                  <Badge key={filho.id} variant="outline" className="text-xs">
                    {filho.nome}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function PapeisManagement() {
  const {
    papeis,
    loading,
    criarPapel,
    atualizarPapel,
    excluirPapel,
    getPapeisRaiz,
    getPapeisFilhos,
  } = usePapeisManagement();

  const [formDialog, setFormDialog] = useState({ open: false, papel: undefined as PapelHierarquico | undefined });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, papel: undefined as PapelHierarquico | undefined });
  const [clearMappingsDialog, setClearMappingsDialog] = useState(false);
  const [clearingMappings, setClearingMappings] = useState(false);

  const handleCreatePapel = () => {
    setFormDialog({ open: true, papel: undefined });
  };

  const handleEditPapel = (papel: PapelHierarquico) => {
    setFormDialog({ open: true, papel });
  };

  const handleDeletePapel = (papel: PapelHierarquico) => {
    setDeleteDialog({ open: true, papel });
  };

  const confirmDelete = async () => {
    if (deleteDialog.papel) {
      try {
        await excluirPapel(deleteDialog.papel.id);
        setDeleteDialog({ open: false, papel: undefined });
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const handleFormSubmit = async (dados: PapelFormData) => {
    if (formDialog.papel) {
      await atualizarPapel(formDialog.papel.id, dados);
    } else {
      await criarPapel(dados);
    }
  };

  const handleClearAllMappings = async () => {
    setClearingMappings(true);
    
    try {
      const { data, error } = await supabase.rpc('clear_all_papel_mappings');
      
      if (error) throw error;
      
      toast.success(data.message, {
        description: `Total de relacionamentos removidos: ${data.cleared_counts.total}`,
      });
      
      setClearMappingsDialog(false);
    } catch (error) {
      console.error('Erro ao limpar mapeamentos:', error);
      toast.error('Erro ao limpar mapeamentos de papéis');
    } finally {
      setClearingMappings(false);
    }
  };

  const papeisRaiz = getPapeisRaiz();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Papéis/Categorias</h2>
          <p className="text-muted-foreground">
            Gerencie os papéis e categorias das entidades do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setClearMappingsDialog(true)}
            disabled={loading}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Zerar Mapeamentos
          </Button>
          <Button onClick={handleCreatePapel} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Papel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {papeisRaiz.map((papel) => {
          const filhos = getPapeisFilhos(papel.id);
          return (
            <PapelCard
              key={papel.id}
              papel={papel}
              papeisFilhos={filhos}
              onEdit={handleEditPapel}
              onDelete={handleDeletePapel}
            />
          );
        })}
      </div>

      {papeisRaiz.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum papel cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie o primeiro papel/categoria para organizar suas entidades
            </p>
            <Button onClick={handleCreatePapel}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Papel
            </Button>
          </CardContent>
        </Card>
      )}

      <PapelFormDialog
        papel={formDialog.papel}
        papeisPais={papeis.filter(p => !p.papel_pai_id)}
        open={formDialog.open}
        onOpenChange={(open) => setFormDialog({ open, papel: undefined })}
        onSubmit={handleFormSubmit}
        loading={loading}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, papel: undefined })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o papel "{deleteDialog.papel?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={loading}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearMappingsDialog} onOpenChange={setClearMappingsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Zerar Todos os Mapeamentos de Papéis
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>ATENÇÃO:</strong> Esta ação irá remover TODOS os relacionamentos existentes entre pessoas/entidades e papéis.
              </p>
              <p>
                Isso significa que todas as pessoas e entidades perderão seus papéis atribuídos (cliente, fornecedor, funcionário, etc.).
              </p>
              <p className="text-destructive font-medium">
                Esta ação não pode ser desfeita!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearingMappings}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearAllMappings} 
              disabled={clearingMappings}
              className="bg-destructive hover:bg-destructive/90"
            >
              {clearingMappings ? 'Limpando...' : 'Confirmar Limpeza'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}