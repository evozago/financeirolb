import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Papel {
  id: string;
  nome: string;
  descricao: string;
  nome_norm: string;
  ativo: boolean;
}

interface PapelPessoa {
  papel_id: string;
  papel_nome: string;
  data_inicio: string;
  configuracao?: any;
  observacoes?: string;
}

interface PapelSelectorProps {
  pessoaId?: string;
  papeisAtivos: PapelPessoa[];
  onPapeisChange: (papeis: PapelPessoa[]) => void;
  disabled?: boolean;
}

export function PapelSelector({ pessoaId, papeisAtivos, onPapeisChange, disabled = false }: PapelSelectorProps) {
  const [papeisDisponiveis, setPapeisDisponiveis] = useState<Papel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPapeis, setSelectedPapeis] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    loadPapeisDisponiveis();
  }, []);

  const loadPapeisDisponiveis = async () => {
    try {
      const { data, error } = await supabase
        .from('papeis')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setPapeisDisponiveis(data || []);
    } catch (error) {
      console.error('Erro ao carregar papéis:', error);
      toast.error('Erro ao carregar papéis disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPapeis = async () => {
    if (selectedPapeis.length === 0) {
      toast.error('Selecione pelo menos um papel');
      return;
    }

    try {
      const novosPapeis: PapelPessoa[] = selectedPapeis.map(papelId => {
        const papel = papeisDisponiveis.find(p => p.id === papelId);
        return {
          papel_id: papelId,
          papel_nome: papel?.nome || '',
          data_inicio: new Date().toISOString().split('T')[0],
          observacoes: observacoes.trim() || undefined
        };
      });

      // Se já tem pessoaId, salvar no banco
      if (pessoaId) {
        const { error } = await supabase
          .from('pessoa_papeis')
          .insert(
            novosPapeis.map(papel => ({
              pessoa_id: pessoaId,
              papel_id: papel.papel_id,
              data_inicio: papel.data_inicio,
              observacoes: papel.observacoes,
              ativo: true
            }))
          );

        if (error) throw error;
        toast.success('Papéis adicionados com sucesso!');
      }

      // Atualizar estado local
      const papeisAtualizados = [...papeisAtivos, ...novosPapeis];
      onPapeisChange(papeisAtualizados);

      // Reset form
      setSelectedPapeis([]);
      setObservacoes('');
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao adicionar papéis:', error);
      if (error.code === '23505') {
        toast.error('Esta pessoa já possui um ou mais dos papéis selecionados');
      } else {
        toast.error('Erro ao adicionar papéis');
      }
    }
  };

  const handleRemovePapel = async (papelId: string) => {
    try {
      // Se já tem pessoaId, remover do banco
      if (pessoaId) {
        const { error } = await supabase
          .from('pessoa_papeis')
          .update({ ativo: false })
          .eq('pessoa_id', pessoaId)
          .eq('papel_id', papelId);

        if (error) throw error;
        toast.success('Papel removido com sucesso!');
      }

      // Atualizar estado local
      const papeisAtualizados = papeisAtivos.filter(p => p.papel_id !== papelId);
      onPapeisChange(papeisAtualizados);
    } catch (error) {
      console.error('Erro ao remover papel:', error);
      toast.error('Erro ao remover papel');
    }
  };

  const papeisJaAtivos = papeisAtivos.map(p => p.papel_id);
  const papeisParaSelecionar = papeisDisponiveis.filter(p => !papeisJaAtivos.includes(p.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Papéis/Categorias</span>
          {!disabled && papeisParaSelecionar.length > 0 && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Papel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Papéis</DialogTitle>
                  <DialogDescription>
                    Selecione os papéis que esta pessoa deve ter no sistema
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Papéis Disponíveis</Label>
                    <div className="space-y-2 mt-2">
                      {papeisParaSelecionar.map((papel) => (
                        <div key={papel.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={papel.id}
                            checked={selectedPapeis.includes(papel.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPapeis(prev => [...prev, papel.id]);
                              } else {
                                setSelectedPapeis(prev => prev.filter(id => id !== papel.id));
                              }
                            }}
                          />
                          <Label htmlFor={papel.id} className="flex-1 cursor-pointer">
                            <div>
                              <div className="font-medium">{papel.nome}</div>
                              {papel.descricao && (
                                <div className="text-sm text-muted-foreground">{papel.descricao}</div>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações sobre os papéis (opcional)"
                      rows={3}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddPapeis} disabled={selectedPapeis.length === 0}>
                    Adicionar {selectedPapeis.length > 0 && `(${selectedPapeis.length})`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
        <CardDescription>
          Defina os papéis que esta pessoa tem no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando papéis...</p>
        ) : papeisAtivos.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-2">Nenhum papel atribuído</p>
            {!disabled && papeisParaSelecionar.length > 0 ? (
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Papel
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                {papeisDisponiveis.length === 0 
                  ? 'Nenhum papel cadastrado no sistema'
                  : 'Todos os papéis já foram atribuídos'
                }
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {papeisAtivos.map((papel) => (
              <div key={papel.papel_id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="default">{papel.papel_nome}</Badge>
                  <span className="text-sm text-muted-foreground">
                    desde {new Date(papel.data_inicio).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePapel(papel.papel_id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {papeisDisponiveis.length === 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Nenhum papel cadastrado no sistema. 
              <Button variant="link" className="p-0 h-auto ml-1" asChild>
                <a href="/papeis">Clique aqui para criar papéis</a>
              </Button>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
