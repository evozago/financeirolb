import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EntidadesList } from '@/components/corporativo/EntidadesList';
import { EntidadeForm } from '@/components/corporativo/EntidadeForm';
import { Dashboard360 } from '@/components/corporativo/Dashboard360';
import { Building2, ArrowLeft } from 'lucide-react';

interface Entidade {
  id: string;
  tipo_pessoa: string;
  nome_razao_social: string;
  nome_fantasia: string;
  cpf_cnpj: string;
  email: string;
  telefone: string;
  papeis: string[];
  ativo: boolean;
}

type ViewMode = 'list' | 'form' | 'dashboard';

export default function EntidadesCorporativas() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEntidade, setSelectedEntidade] = useState<Entidade | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  const handleNovaEntidade = () => {
    setSelectedEntidade(null);
    setFormDialogOpen(true);
  };

  const handleEditarEntidade = (entidade: Entidade) => {
    setSelectedEntidade(entidade);
    setFormDialogOpen(true);
  };

  const handleEntidadeSelect = (entidade: Entidade) => {
    setSelectedEntidade(entidade);
    setViewMode('dashboard');
  };

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setSelectedEntidade(null);
    // Recarregar lista será feito automaticamente pelo useEffect do EntidadesList
  };

  const handleFormCancel = () => {
    setFormDialogOpen(false);
    setSelectedEntidade(null);
  };

  const handleCloseDashboard = () => {
    setViewMode('list');
    setSelectedEntidade(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {viewMode !== 'list' && (
          <Button
            variant="outline"
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        )}
        
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Entidades Corporativas
          </h1>
          <p className="text-muted-foreground">
            Sistema unificado de gestão de pessoas físicas e jurídicas
          </p>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' && (
        <EntidadesList
          onEntidadeSelect={handleEntidadeSelect}
          onNovaEntidade={handleNovaEntidade}
          onEditarEntidade={handleEditarEntidade}
        />
      )}

      {viewMode === 'dashboard' && selectedEntidade && (
        <Dashboard360
          entidadeId={selectedEntidade.id}
          onClose={handleCloseDashboard}
        />
      )}

      {/* Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEntidade ? 'Editar Entidade' : 'Nova Entidade'}
            </DialogTitle>
          </DialogHeader>
          
          <EntidadeForm
            entidadeId={selectedEntidade?.id}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Info Cards */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sistema Unificado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cadastro único para pessoas físicas e jurídicas, evitando duplicações
                e mantendo consistência nos dados.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Múltiplos Papéis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Uma entidade pode desempenhar diferentes papéis: cliente, fornecedor,
                funcionário, vendedor, etc.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visão 360°</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Dashboard completo com histórico financeiro, vendas, compras
                e relacionamentos da entidade.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}