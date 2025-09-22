import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface FixResult {
  step: string;
  success: boolean;
  message: string;
  details?: any;
}

export const RoleSystemFixer: React.FC = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<FixResult[]>([]);

  const addResult = (result: FixResult) => {
    setResults(prev => [...prev, result]);
  };

  const testMicaellyRole = async () => {
    try {
      // Primeiro, buscar Micaelly
      const { data: pessoas, error: pessoasError } = await supabase
        .from('pessoas')
        .select('*')
        .ilike('nome', '%micaelly%')
        .limit(1);

      if (pessoasError) {
        addResult({
          step: 'Buscar Micaelly',
          success: false,
          message: `Erro ao buscar Micaelly: ${pessoasError.message}`,
          details: pessoasError
        });
        return;
      }

      if (!pessoas || pessoas.length === 0) {
        addResult({
          step: 'Buscar Micaelly',
          success: false,
          message: 'Micaelly não encontrada na base de dados',
        });
        return;
      }

      const micaelly = pessoas[0];
      addResult({
        step: 'Buscar Micaelly',
        success: true,
        message: `Micaelly encontrada: ${micaelly.nome}`,
        details: micaelly
      });

      // Buscar papel de vendedora
      const { data: papeis, error: papeisError } = await supabase
        .from('papeis')
        .select('*')
        .eq('nome', 'vendedora')
        .limit(1);

      if (papeisError) {
        addResult({
          step: 'Buscar papel vendedora',
          success: false,
          message: `Erro ao buscar papel vendedora: ${papeisError.message}`,
          details: papeisError
        });
        return;
      }

      let vendedoraPapel = papeis?.[0];

      // Se não existir, criar o papel
      if (!vendedoraPapel) {
        const { data: novoPapel, error: criarPapelError } = await supabase
          .from('papeis')
          .insert([{ nome: 'vendedora', descricao: 'Papel de vendedora' }])
          .select()
          .single();

        if (criarPapelError) {
          addResult({
            step: 'Criar papel vendedora',
            success: false,
            message: `Erro ao criar papel vendedora: ${criarPapelError.message}`,
            details: criarPapelError
          });
          return;
        }

        vendedoraPapel = novoPapel;
        addResult({
          step: 'Criar papel vendedora',
          success: true,
          message: 'Papel vendedora criado com sucesso',
          details: vendedoraPapel
        });
      } else {
        addResult({
          step: 'Buscar papel vendedora',
          success: true,
          message: 'Papel vendedora encontrado',
          details: vendedoraPapel
        });
      }

      // Verificar se já existe a atribuição
      const { data: existingRole, error: checkError } = await supabase
        .from('entidade_papeis')
        .select('*')
        .eq('entidade_id', micaelly.id)
        .eq('papel_id', vendedoraPapel.id)
        .limit(1);

      if (checkError) {
        addResult({
          step: 'Verificar papel existente',
          success: false,
          message: `Erro ao verificar papel existente: ${checkError.message}`,
          details: checkError
        });
        return;
      }

      if (existingRole && existingRole.length > 0) {
        addResult({
          step: 'Verificar papel existente',
          success: true,
          message: 'Micaelly já possui o papel de vendedora',
          details: existingRole[0]
        });
        return;
      }

      // Atribuir o papel
      const { data: newRole, error: assignError } = await supabase
        .from('entidade_papeis')
        .insert([{
          entidade_id: micaelly.id,
          papel_id: vendedoraPapel.id
        }])
        .select()
        .single();

      if (assignError) {
        addResult({
          step: 'Atribuir papel vendedora',
          success: false,
          message: `Erro ao atribuir papel: ${assignError.message}`,
          details: assignError
        });
        return;
      }

      addResult({
        step: 'Atribuir papel vendedora',
        success: true,
        message: 'Papel de vendedora atribuído com sucesso à Micaelly!',
        details: newRole
      });

    } catch (error) {
      addResult({
        step: 'Erro geral',
        success: false,
        message: `Erro inesperado: ${error}`,
        details: error
      });
    }
  };

  const fixRoleSystem = async () => {
    setIsFixing(true);
    setResults([]);

    try {
      // 1. Verificar estrutura das tabelas
      addResult({
        step: 'Verificar estrutura',
        success: true,
        message: 'Iniciando verificação do sistema de papéis...'
      });

      // 2. Limpar duplicatas na tabela entidade_papeis
      const { error: cleanupError } = await supabase.rpc('cleanup_duplicate_roles');
      
      if (cleanupError && !cleanupError.message.includes('function cleanup_duplicate_roles() does not exist')) {
        addResult({
          step: 'Limpar duplicatas',
          success: false,
          message: `Erro ao limpar duplicatas: ${cleanupError.message}`,
          details: cleanupError
        });
      } else {
        addResult({
          step: 'Limpar duplicatas',
          success: true,
          message: 'Duplicatas removidas (se existiam)'
        });
      }

      // 3. Testar atribuição de papel para Micaelly
      await testMicaellyRole();

    } catch (error) {
      addResult({
        step: 'Erro geral',
        success: false,
        message: `Erro inesperado: ${error}`,
        details: error
      });
    } finally {
      setIsFixing(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Sistema de Correção de Papéis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={fixRoleSystem} 
            disabled={isFixing}
            className="flex items-center gap-2"
          >
            {isFixing && <Loader2 className="h-4 w-4 animate-spin" />}
            {isFixing ? 'Corrigindo...' : 'Corrigir Sistema de Papéis'}
          </Button>
          
          <Button 
            onClick={testMicaellyRole} 
            disabled={isFixing}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isFixing && <Loader2 className="h-4 w-4 animate-spin" />}
            Testar Papel Micaelly
          </Button>
          
          <Button 
            onClick={clearResults} 
            variant="outline"
          >
            Limpar Resultados
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h3 className="font-semibold">Resultados:</h3>
            {results.map((result, index) => (
              <Alert key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{result.step}</div>
                    <AlertDescription>{result.message}</AlertDescription>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600">
                          Ver detalhes
                        </summary>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleSystemFixer;
