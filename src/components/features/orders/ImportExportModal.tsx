import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download, FileSpreadsheet, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImportExportModalProps {
  onImportSuccess?: () => void;
}

export function ImportExportModal({ onImportSuccess }: ImportExportModalProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const { data, error } = await supabase
        .from('pedidos_produtos')
        .select(`
          referencia,
          descricao,
          cor,
          tamanho,
          quantidade,
          custo_unitario,
          desconto_porcentagem,
          desconto_valor,
          tipo_desconto,
          data_pedido,
          status,
          observacoes,
          numero_pedido,
          fornecedores:fornecedor_id(nome),
          marcas:marca_id(nome)
        `)
        .order('data_pedido', { ascending: false });

      if (error) throw error;

      // Preparar dados para CSV
      const csvData = data?.map(item => ({
        'Referência': item.referencia,
        'Descrição': item.descricao || '',
        'Cor': item.cor || '',
        'Tamanho': item.tamanho || '',
        'Quantidade': item.quantidade,
        'Custo Unitário': item.custo_unitario,
        'Desconto (%)': item.desconto_porcentagem || 0,
        'Desconto (Valor)': item.desconto_valor || 0,
        'Tipo Desconto': item.tipo_desconto || 'valor',
        'Data Pedido': item.data_pedido ? new Date(item.data_pedido).toLocaleDateString('pt-BR') : '',
        'Status': item.status,
        'Observações': item.observacoes || '',
        'Número Pedido': item.numero_pedido || '',
        'Fornecedor': (item.fornecedores as any)?.nome || '',
        'Marca': (item.marcas as any)?.nome || ''
      })) || [];

      // Converter para CSV
      const headers = Object.keys(csvData[0] || {});
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast({
        title: "Sucesso",
        description: "Planilha exportada com sucesso!",
      });

    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: "Erro",
        description: "Falha ao exportar planilha",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const importedData = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const rowData: any = {};
        
        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });
        
        // Mapear campos da planilha para a estrutura do banco
        const orderData = {
          referencia: rowData['Referência'],
          descricao: rowData['Descrição'],
          cor: rowData['Cor'],
          tamanho: rowData['Tamanho'],
          quantidade: parseInt(rowData['Quantidade']) || 0,
          custo_unitario: parseFloat(rowData['Custo Unitário']) || 0,
          desconto_porcentagem: parseFloat(rowData['Desconto (%)']) || 0,
          desconto_valor: parseFloat(rowData['Desconto (Valor)']) || 0,
          tipo_desconto: rowData['Tipo Desconto'] || 'valor',
          data_pedido: rowData['Data Pedido'] ? new Date(rowData['Data Pedido'].split('/').reverse().join('-')).toISOString().split('T')[0] : null,
          status: rowData['Status'] || 'pendente',
          observacoes: rowData['Observações'],
          numero_pedido: rowData['Número Pedido'],
          arquivo_origem: 'importacao_planilha'
        };
        
        if (orderData.referencia) {
          importedData.push(orderData);
        }
      }
      
      if (importedData.length === 0) {
        throw new Error('Nenhum dado válido encontrado na planilha');
      }
      
      const { error } = await supabase
        .from('pedidos_produtos')
        .insert(importedData);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `${importedData.length} pedidos importados com sucesso!`,
      });
      
      onImportSuccess?.();
      setOpen(false);
      
    } catch (error) {
      console.error('Error importing:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao importar planilha",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const templateHeaders = [
      'Referência',
      'Descrição',
      'Cor',
      'Tamanho',
      'Quantidade',
      'Custo Unitário',
      'Desconto (%)',
      'Desconto (Valor)',
      'Tipo Desconto',
      'Data Pedido',
      'Status',
      'Observações',
      'Número Pedido',
      'Fornecedor',
      'Marca'
    ];

    const templateData = [
      'REF001',
      'Camiseta Básica',
      'Azul',
      'M',
      '10',
      '25.50',
      '5',
      '0',
      'porcentagem',
      '15/01/2024',
      'pendente',
      'Pedido de exemplo',
      'PED001',
      'Fornecedor ABC',
      'Marca XYZ'
    ];

    const csvContent = [
      templateHeaders.join(','),
      templateData.map(item => `"${item}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_pedidos.csv';
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Importar/Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importar/Exportar Pedidos</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Exportar</TabsTrigger>
            <TabsTrigger value="import">Importar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Exportar Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Baixe todos os pedidos em formato CSV para análise externa ou backup.
                </p>
                
                <Button 
                  onClick={handleExport} 
                  disabled={exporting}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exportando...' : 'Baixar Planilha'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Importar Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Baixe o modelo da planilha primeiro para garantir que os dados estejam no formato correto.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={downloadTemplate}
                    className="w-full"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Baixar Modelo da Planilha
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="csv-upload" className="block text-sm font-medium mb-2">
                      Selecionar arquivo CSV
                    </label>
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleImport}
                      disabled={importing}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                  
                  {importing && (
                    <p className="text-sm text-muted-foreground">
                      Importando dados...
                    </p>
                  )}
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Formato da Planilha:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Referência:</strong> Código único do produto (obrigatório)</li>
                    <li>• <strong>Quantidade:</strong> Número inteiro (obrigatório)</li>
                    <li>• <strong>Custo Unitário:</strong> Valor decimal (ex: 25.50)</li>
                    <li>• <strong>Data Pedido:</strong> Formato DD/MM/AAAA (ex: 15/01/2024)</li>
                    <li>• <strong>Status:</strong> pendente, enviado ou recebido</li>
                    <li>• <strong>Tipo Desconto:</strong> "valor" ou "porcentagem"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}