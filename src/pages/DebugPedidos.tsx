import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function DebugPedidos() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runDebug = async () => {
    setLoading(true);
    const info: any = {};

    try {
      // 1. Verificar se a tabela existe
      console.log('🔍 Verificando tabela pedidos_produtos...');
      
      // 2. Tentar contar registros
      const { count, error: countError } = await supabase
        .from('pedidos_produtos')
        .select('*', { count: 'exact', head: true });

      info.count = count;
      info.countError = countError;
      
      console.log('📊 Count result:', { count, countError });

      // 3. Tentar buscar alguns registros
      const { data: sampleData, error: sampleError } = await supabase
        .from('pedidos_produtos')
        .select('*')
        .limit(5);

      info.sampleData = sampleData;
      info.sampleError = sampleError;
      
      console.log('📋 Sample data:', { sampleData, sampleError });

      // 4. Verificar estrutura da tabela (tentar buscar apenas as colunas)
      const { data: structureData, error: structureError } = await supabase
        .from('pedidos_produtos')
        .select('id')
        .limit(1);

      info.structureData = structureData;
      info.structureError = structureError;
      
      console.log('🏗️ Structure test:', { structureData, structureError });

      // 5. Tentar outras consultas possíveis
      const queries = [
        'SELECT COUNT(*) FROM pedidos_produtos',
        'SELECT * FROM pedidos_produtos LIMIT 3',
        'SELECT column_name FROM information_schema.columns WHERE table_name = \'pedidos_produtos\''
      ];

      for (const query of queries) {
        try {
          const { data, error } = await supabase.rpc('execute_sql', { query });
          info[`query_${query.split(' ')[1]}`] = { data, error };
          console.log(`🔧 Query "${query}":`, { data, error });
        } catch (err) {
          info[`query_${query.split(' ')[1]}_error`] = err;
          console.log(`❌ Query "${query}" failed:`, err);
        }
      }

      // 6. Verificar outras tabelas relacionadas
      const relatedTables = ['pedidos', 'orders', 'produtos', 'fornecedores', 'marcas'];
      
      for (const table of relatedTables) {
        try {
          const { count: tableCount, error: tableError } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          info[`table_${table}`] = { count: tableCount, error: tableError };
          console.log(`📊 Table ${table}:`, { count: tableCount, error: tableError });
        } catch (err) {
          info[`table_${table}_error`] = err;
          console.log(`❌ Table ${table} failed:`, err);
        }
      }

    } catch (error) {
      console.error('❌ Debug error:', error);
      info.generalError = error;
    }

    setDebugInfo(info);
    setLoading(false);
  };

  const exportData = async () => {
    try {
      const { data, error } = await supabase
        .from('pedidos_produtos')
        .select('*');

      if (error) {
        toast({
          title: "Erro ao exportar",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Criar arquivo JSON para download
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `pedidos_produtos_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Exportado com sucesso",
        description: `${data?.length || 0} registros exportados`,
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro ao exportar",
        description: "Falha na exportação",
        variant: "destructive",
      });
    }
  };

  const createTestData = async () => {
    try {
      const testData = [
        {
          referencia: 'PED-TEST-001',
          numero_pedido: 'TEST-001',
          descricao: 'Produto de Teste 1',
          quantidade: 10,
          custo_unitario: 50.00,
          valor_total_bruto: 500.00,
          valor_total_liquido: 500.00,
          valor_medio_peca: 50.00,
          data_pedido: new Date().toISOString().split('T')[0],
          status: 'pendente',
          observacoes: 'Pedido de teste criado pelo debug',
          arquivo_origem: 'debug'
        },
        {
          referencia: 'PED-TEST-002',
          numero_pedido: 'TEST-002',
          descricao: 'Produto de Teste 2',
          quantidade: 20,
          custo_unitario: 75.00,
          valor_total_bruto: 1500.00,
          valor_total_liquido: 1500.00,
          valor_medio_peca: 75.00,
          data_pedido: new Date().toISOString().split('T')[0],
          status: 'processando',
          observacoes: 'Segundo pedido de teste',
          arquivo_origem: 'debug'
        }
      ];

      const { data, error } = await supabase
        .from('pedidos_produtos')
        .insert(testData)
        .select();

      if (error) {
        toast({
          title: "Erro ao criar dados de teste",
          description: error.message,
          variant: "destructive",
        });
        console.error('Erro ao inserir:', error);
      } else {
        toast({
          title: "Dados de teste criados",
          description: `${data?.length || 0} registros inseridos`,
        });
        console.log('Dados inseridos:', data);
        runDebug(); // Atualizar debug
      }
    } catch (error) {
      console.error('Erro ao criar dados de teste:', error);
      toast({
        title: "Erro ao criar dados de teste",
        description: "Falha na criação",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    runDebug();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug - Tabela pedidos_produtos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runDebug} disabled={loading}>
              {loading ? 'Verificando...' : '🔄 Verificar Novamente'}
            </Button>
            <Button onClick={exportData} variant="outline">
              📥 Exportar Dados
            </Button>
            <Button onClick={createTestData} variant="secondary">
              ➕ Criar Dados de Teste
            </Button>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold mb-2">📊 Informações de Debug:</h3>
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold">📋 Resumo:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Total de registros:</strong> {debugInfo.count ?? 'Verificando...'}
                {debugInfo.countError && <span className="text-red-500"> (Erro: {debugInfo.countError.message})</span>}
              </li>
              <li>
                <strong>Dados de exemplo:</strong> {debugInfo.sampleData?.length ?? 0} registros encontrados
                {debugInfo.sampleError && <span className="text-red-500"> (Erro: {debugInfo.sampleError.message})</span>}
              </li>
              <li>
                <strong>Estrutura da tabela:</strong> {debugInfo.structureError ? '❌ Erro' : '✅ OK'}
              </li>
            </ul>
          </div>

          {debugInfo.sampleData && debugInfo.sampleData.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold">📋 Primeiros Registros:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      {Object.keys(debugInfo.sampleData[0]).map(key => (
                        <th key={key} className="border border-gray-300 px-2 py-1 text-left text-xs">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {debugInfo.sampleData.slice(0, 3).map((row: any, index: number) => (
                      <tr key={index}>
                        {Object.values(row).map((value: any, cellIndex) => (
                          <td key={cellIndex} className="border border-gray-300 px-2 py-1 text-xs">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
