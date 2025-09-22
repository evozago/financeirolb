/**
 * Página de detalhes da pessoa (Nível 3 - Drill Down)
 * Exibe informações completas da pessoa e seu histórico
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, FileText, Calendar, DollarSign, MapPin, Phone, Mail, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EntityHistory } from '@/components/common/EntityHistory';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PersonData {
  id: string;
  nome_razao_social: string;
  nome_fantasia?: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  tipo_pessoa: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

interface PersonRole {
  id: string;
  nome: string;
  descricao?: string;
}

export default function PersonDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [person, setPerson] = useState<PersonData | null>(null);
  const [roles, setRoles] = useState<PersonRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPersonData();
      loadPersonRoles();
    }
  }, [id]);

  const loadPersonData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('pessoas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao carregar pessoa:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da pessoa",
          variant: "destructive",
        });
        navigate('/pessoas');
        return;
      }

      setPerson(data);
    } catch (error) {
      console.error('Erro ao carregar pessoa:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPersonRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('papeis_pessoa')
        .select(`
          papeis (
            id,
            nome,
            descricao
          )
        `)
        .eq('pessoa_id', id);

      if (error) {
        console.error('Erro ao carregar papéis:', error);
        return;
      }

      const personRoles = data?.map(item => item.papeis).filter(Boolean) || [];
      setRoles(personRoles as PersonRole[]);
    } catch (error) {
      console.error('Erro ao carregar papéis:', error);
    }
  };

  const handleDelete = async () => {
    if (!person) return;

    try {
      const { error } = await supabase
        .from('pessoas')
        .delete()
        .eq('id', person.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Pessoa excluída",
        description: `${person.nome_razao_social} foi excluída com sucesso`,
      });

      navigate('/pessoas');
    } catch (error: any) {
      console.error('Erro ao excluir pessoa:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCPFCNPJ = (cpfCnpj: string | null) => {
    if (!cpfCnpj) return '-';
    
    // Remove caracteres não numéricos
    const numbers = cpfCnpj.replace(/\D/g, '');
    
    if (numbers.length === 11) {
      // CPF: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numbers.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return cpfCnpj;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-foreground">Pessoa não encontrada</h2>
            <p className="text-muted-foreground mt-2">A pessoa que você está procurando não existe ou foi removida.</p>
            <Button onClick={() => navigate('/pessoas')} className="mt-4">
              Voltar para Pessoas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/pessoas')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{person.nome_razao_social}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={person.ativo ? "default" : "destructive"}>
                      {person.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">
                      {person.tipo_pessoa === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </Badge>
                    {roles.length > 0 && (
                      <Badge variant="secondary">
                        {roles.length} papel{roles.length !== 1 ? 'éis' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/pessoas/${person.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir "{person.nome_razao_social}"? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Excluir Definitivamente
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Cards de Informações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                    <p className="text-2xl font-bold text-foreground">
                      {person.tipo_pessoa === 'fisica' ? 'PF' : 'PJ'}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Papéis</p>
                    <p className="text-2xl font-bold text-foreground">{roles.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="text-2xl font-bold text-foreground">
                      {person.ativo ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cadastro</p>
                    <p className="text-lg font-bold text-foreground">
                      {person.created_at ? formatDate(person.created_at) : '-'}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs de Conteúdo */}
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList>
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="roles">Papéis ({roles.length})</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Pessoa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nome/Razão Social</label>
                        <p className="text-lg font-medium">{person.nome_razao_social}</p>
                      </div>
                      {person.nome_fantasia && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Nome Fantasia</label>
                          <p className="text-lg">{person.nome_fantasia}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">CPF/CNPJ</label>
                        <p className="text-lg font-mono">{formatCPFCNPJ(person.cpf_cnpj)}</p>
                      </div>
                      {person.email && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Email</label>
                          <p className="text-lg">{person.email}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {person.telefone && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                          <p className="text-lg">{person.telefone}</p>
                        </div>
                      )}
                      {person.endereco && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                          <p className="text-lg">{person.endereco}</p>
                        </div>
                      )}
                      {(person.cidade || person.estado) && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Cidade/Estado</label>
                          <p className="text-lg">
                            {person.cidade}{person.cidade && person.estado ? ', ' : ''}{person.estado}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Data de Cadastro</label>
                        <p className="text-lg">{person.created_at ? formatDate(person.created_at) : '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Última Atualização</label>
                        <p className="text-lg">{person.updated_at ? formatDate(person.updated_at) : '-'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Papéis Atribuídos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {roles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-muted-foreground/50" />
                        <p>Nenhum papel atribuído a esta pessoa</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roles.map((role) => (
                        <Card key={role.id} className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{role.nome}</h4>
                              {role.descricao && (
                                <p className="text-sm text-muted-foreground">{role.descricao}</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <EntityHistory 
                recordId={id!}
                tableName="pessoas"
                entityName="Pessoa"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
