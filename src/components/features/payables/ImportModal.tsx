/**
 * Modal para importação de arquivos XML e planilhas Excel
 * Permite upload múltiplo e exibe progresso da importação
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ImportResult } from '@/types/payables';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'xml' | 'spreadsheet';
  onImport: (files: File[]) => Promise<ImportResult>;
  onDownloadTemplate?: () => void;
}

export function ImportModal({
  open,
  onClose,
  mode,
  onImport,
  onDownloadTemplate,
}: ImportModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setResult(null);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const importResult = await onImport(acceptedFiles);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setResult(importResult);
    } catch (error) {
      setResult({
        success: false,
        processed: 0,
        errors: ['Erro ao processar arquivos: ' + (error as Error).message],
        warnings: [],
      });
    } finally {
      setUploading(false);
    }
  }, [onImport]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: mode === 'xml' 
      ? { 'application/xml': ['.xml'], 'text/xml': ['.xml'] }
      : { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: mode === 'xml',
    disabled: uploading,
  });

  const handleClose = () => {
    if (!uploading) {
      setResult(null);
      setUploadProgress(0);
      onClose();
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.xml')) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-green-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'xml' ? 'Importar Arquivos XML' : 'Importar Planilha Excel'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'xml' 
              ? 'Selecione um ou mais arquivos XML de notas fiscais para importar.'
              : 'Selecione uma planilha Excel com os dados das contas a pagar.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template download para planilhas */}
          {mode === 'spreadsheet' && onDownloadTemplate && (
            <Alert>
              <Download className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Precisa do modelo de planilha?</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownloadTemplate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Modelo
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Área de upload */}
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              uploading && 'pointer-events-none opacity-50'
            )}
          >
            <input {...getInputProps()} />
            
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            
            {isDragActive ? (
              <p className="text-primary font-medium">
                Solte os arquivos aqui...
              </p>
            ) : (
              <div className="space-y-2">
                <p className="font-medium">
                  Clique ou arraste arquivos aqui
                </p>
                <p className="text-sm text-muted-foreground">
                  {mode === 'xml' 
                    ? 'Suporte para múltiplos arquivos .xml'
                    : 'Apenas arquivos .xlsx'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Arquivos selecionados */}
          {acceptedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Arquivos Selecionados:</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {acceptedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                    {getFileIcon(file.name)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Badge variant="outline">
                      {file.name.split('.').pop()?.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progresso do upload */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processando...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Resultado da importação */}
          {result && (
            <div className="space-y-4">
              <Alert className={result.success ? 'border-success' : 'border-destructive'}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <AlertDescription>
                  {result.success 
                    ? `Importação concluída! ${result.processed} registros processados.`
                    : 'Falha na importação. Verifique os erros abaixo.'
                  }
                </AlertDescription>
              </Alert>

              {/* Erros */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-destructive">Erros:</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm text-destructive bg-destructive/5 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Avisos */}
              {result.warnings.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-warning">Avisos:</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-warning bg-warning/5 p-2 rounded">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              {result ? 'Fechar' : 'Cancelar'}
            </Button>
            {!result && acceptedFiles.length > 0 && !uploading && (
              <Button onClick={() => onDrop([...acceptedFiles])}>
                Importar {acceptedFiles.length} arquivo{acceptedFiles.length > 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}