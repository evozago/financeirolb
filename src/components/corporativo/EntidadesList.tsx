import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, Search, Plus, Eye, Edit2, Users, Phone, Mail } from 'lucide-react';

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

interface EntidadesListProps {
  onEntidadeSelect?: (entidade: Entidade) => void;
  onNovaEntidade?: () => void;
  onEditarEntidade?: (entidade: Entidade) => void;
}

export function EntidadesList({ onEntidadeSelect, onNovaEntidade, onEditarEntidade }: EntidadesListProps) {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [papelFilter, setPapelFilter] = useState('all');
  const [papeis, setPapeis] = useState<{ nome: string }[]>([]);

  useEffect(() => {
    loadPapeis();
    loadEntidades();
  }, [searchQuery, papelFilter]);

  const loadPapeis = async () => {
    try {
      const { data, error } = await supabase
        .from('papeis')
        .select('nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setPapeis(data || []);
    } catch (error) {
      console.error('Erro ao carregar papéis:', error);
    }
  };

  const loadEntidades = async () => {
    try {
      setLoading(true);
      
      // Usar a função RPC para buscar entidades com filtros
      const { data, error } = await supabase.rpc('search_entidades_corporativas', {
        p_query: searchQuery || null,
        p_papel: papelFilter === 'all' ? null : papelFilter,
        p_limite: 100,
        p_offset: 0
      });

      if (error) throw error;
      setEntidades(data || []);
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
      toast.error('Erro ao carregar entidades');
    } finally {
      setLoading(false);
    }
  };

  const formatCpfCnpj = (cpfCnpj: string) => {
    if (!cpfCnpj) return '';
    const digits = cpfCnpj.replace(/\D/g, '');
    
    if (digits.length === 11) {
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4');
    } else if (digits.length === 14) {
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.***.***/****-$5');
    }
    return cpfCnpj;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Entidades Corporativas
          </CardTitle>
          <Button onClick={onNovaEntidade}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Entidade
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={papelFilter} onValueChange={setPapelFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os papéis</SelectItem>
              {papeis.map((papel) => (
                <SelectItem key={papel.nome} value={papel.nome}>
                  {papel.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Papéis</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando entidades...
                  </TableCell>
                </TableRow>
              ) : entidades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhuma entidade encontrada
                  </TableCell>
                </TableRow>
              ) : (
                entidades.map((entidade) => (
                  <TableRow key={entidade.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{entidade.nome_razao_social}</div>
                        {entidade.nome_fantasia && (
                          <div className="text-sm text-muted-foreground">
                            {entidade.nome_fantasia}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={entidade.tipo_pessoa === 'fisica' ? 'default' : 'secondary'}>
                        {entidade.tipo_pessoa === 'fisica' ? 'PF' : 'PJ'}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-mono text-sm">
                        {formatCpfCnpj(entidade.cpf_cnpj)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {entidade.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {entidade.email}
                          </div>
                        )}
                        {entidade.telefone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" />
                            {entidade.telefone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {entidade.papeis?.map((papel) => (
                          <Badge key={papel} variant="outline" className="text-xs">
                            {papel}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEntidadeSelect?.(entidade)}
                          title="Visualizar ficha 360°"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditarEntidade?.(entidade)}
                          title="Editar entidade"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Estatísticas */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Total: {entidades.length} entidades
          </div>
          
          <div className="flex gap-4">
            <span>PF: {entidades.filter(e => e.tipo_pessoa === 'fisica').length}</span>
            <span>PJ: {entidades.filter(e => e.tipo_pessoa === 'juridica').length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}