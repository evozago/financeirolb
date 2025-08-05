/**
 * Página de Relatórios
 * Implementação básica para corrigir erro 404
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, BarChart3, Download, Calendar } from 'lucide-react';

export default function Reports() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Exportar dados e gerar relatórios financeiros</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Contas a Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Exportar todas as contas a pagar com filtros personalizados
            </p>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Dashboard Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Relatório consolidado das despesas mensais
            </p>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Gerar PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Por Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Relatório customizado por data de vencimento
            </p>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta seção de relatórios está sendo desenvolvida. Em breve você poderá gerar relatórios detalhados, 
            exportar dados em diferentes formatos e configurar relatórios automáticos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}