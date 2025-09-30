/**
 * Componente de ações para itens na lixeira
 * Permite restaurar e deletar permanentemente
 */

import React, { useState } from 'react';
import { RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BillToPayInstallment } from '@/types/payables';

interface TrashActionsProps {
  selectedItems: BillToPayInstallment[];
  onRestore: (items: BillToPayInstallment[]) => void;
  onPermanentDelete: (items: BillToPayInstallment[]) => void;
  loading?: boolean;
}

export function TrashActions({
  selectedItems,
  onRestore,
  onPermanentDelete,
  loading = false,
}: TrashActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleRestore = () => {
    onRestore(selectedItems);
  };

  const handlePermanentDelete = () => {
    onPermanentDelete(selectedItems);
    setShowDeleteDialog(false);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const totalValue = selectedItems.reduce((sum, item) => sum + item.amount, 0);

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <div>
            <div className="font-medium text-orange-900">
              {selectedItems.length} item(s) selecionado(s) na lixeira
            </div>
            <div className="text-sm text-orange-700">
              Valor total: {formatCurrency(totalValue)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRestore}
            disabled={loading}
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar Permanentemente
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Deletar Permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a deletar permanentemente{' '}
                <strong>{selectedItems.length} conta(s) a pagar</strong>.
              </p>
              <p>
                <strong>Esta ação não pode ser desfeita!</strong> Os dados serão
                removidos definitivamente do sistema.
              </p>
              <div className="bg-destructive/10 p-3 rounded-lg mt-3">
                <div className="font-medium text-destructive">
                  Valor total: {formatCurrency(totalValue)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Fornecedores afetados:{' '}
                  {[...new Set(selectedItems.map(item => item.bill?.supplier.name))]
                    .filter(Boolean)
                    .slice(0, 3)
                    .join(', ')}
                  {selectedItems.length > 3 && '...'}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Deletar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
