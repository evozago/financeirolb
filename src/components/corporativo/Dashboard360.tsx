import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Building2, 
  User, 
  MapPin, 
  CreditCard, 
  ShoppingCart, 
  Calendar,
  DollarSign,
  FileText,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardData {
  cadastral: {
    id: string;
    tipo_pessoa: string;
    nome_razao_social: string;
    nome_fantasia?: string;
    cpf_cnpj?: string;
    email?: string;
    telefone?: string;
    inscricao_estadual?: string;
    data_nascimento?: string;
    data_fundacao?: string;
    ativo: boolean;
  };
  papeis: Array<{
    papel: string;
    descricao: string;
    data_inicio: string;
    ativo: boolean;
  }>;
  enderecos: Array<{
    tipo: string;
    principal: boolean;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  }>;
  financeiro: {
    total_aberto: number;
    total_pago: number;
    total_vencido: number;
    contas_abertas: number;
  };
  vendas: {
    total_vendas: number;
    quantidade_vendas: number;
    ultima_venda?: string;
  };
}

interface Dashboard360Props {
  entidadeId: string;
  onClose?: () => void;
}

export function Dashboard360({ entidadeId, onClose }: Dashboard360Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cadastral');

  useEffect(() => {
    loadDashboardData();
  }, [entidadeId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: dashboardData, error } = await supabase
        .rpc('get_entidade_dashboard', { p_entidade_id: entidadeId });

      if (error) throw error;
      setData(dashboardData as unknown as DashboardData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados da entidade');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
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

  if (loading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando dados da entidade...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="text-center py-8">
          <p>Entidade não encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                {data.cadastral.tipo_pessoa === 'fisica' ? (
                  <User className="h-6 w-6 text-primary" />
                ) : (
                  <Building2 className="h-6 w-6 text-primary" />
                )}
              </div>
              
              <div>
                <CardTitle className="text-2xl">{data.cadastral.nome_razao_social}</CardTitle>
                {data.cadastral.nome_fantasia && (
                  <p className="text-muted-foreground">{data.cadastral.nome_fantasia}</p>
                )}
                
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant={data.cadastral.tipo_pessoa === 'fisica' ? 'default' : 'secondary'}>
                    {data.cadastral.tipo_pessoa === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  </Badge>
                  
                  {data.cadastral.cpf_cnpj && (
                    <span className="text-sm font-mono">{formatCpfCnpj(data.cadastral.cpf_cnpj)}</span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {data.papeis.map((papel, index) => (
                    <Badge key={index} variant="outline">
                      {papel.papel}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Aberto</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.financeiro.total_aberto)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.financeiro.contas_abertas} contas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.financeiro.total_pago)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vendas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.vendas.total_vendas)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.vendas.quantidade_vendas} vendas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Detalhes */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cadastral">Dados Cadastrais</TabsTrigger>
          <TabsTrigger value="enderecos">Endereços</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações Cadastrais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Nome/Razão Social</Label>
                    <p className="font-medium">{data.cadastral.nome_razao_social}</p>
                  </div>
                  
                  {data.cadastral.nome_fantasia && (
                    <div>
                      <Label>Nome Fantasia</Label>
                      <p>{data.cadastral.nome_fantasia}</p>
                    </div>
                  )}
                  
                  <div>
                    <Label>Tipo de Pessoa</Label>
                    <p>{data.cadastral.tipo_pessoa === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                  </div>
                  
                  {data.cadastral.cpf_cnpj && (
                    <div>
                      <Label>{data.cadastral.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}</Label>
                      <p className="font-mono">{formatCpfCnpj(data.cadastral.cpf_cnpj)}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {data.cadastral.email && (
                    <div>
                      <Label className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <p>{data.cadastral.email}</p>
                    </div>
                  )}
                  
                  {data.cadastral.telefone && (
                    <div>
                      <Label className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </Label>
                      <p>{data.cadastral.telefone}</p>
                    </div>
                  )}
                  
                  {data.cadastral.inscricao_estadual && (
                    <div>
                      <Label>Inscrição Estadual</Label>
                      <p>{data.cadastral.inscricao_estadual}</p>
                    </div>
                  )}
                  
                  {(data.cadastral.data_nascimento || data.cadastral.data_fundacao) && (
                    <div>
                      <Label>
                        {data.cadastral.tipo_pessoa === 'fisica' ? 'Data de Nascimento' : 'Data de Fundação'}
                      </Label>
                      <p>
                        {formatDate(data.cadastral.data_nascimento || data.cadastral.data_fundacao || '')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enderecos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereços Cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.enderecos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum endereço cadastrado
                </p>
              ) : (
                <div className="space-y-4">
                  {data.enderecos.map((endereco, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={endereco.principal ? 'default' : 'secondary'}>
                          {endereco.tipo} {endereco.principal && '(Principal)'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm space-y-1">
                        {endereco.logradouro && (
                          <p>
                            {endereco.logradouro}
                            {endereco.numero && `, ${endereco.numero}`}
                          </p>
                        )}
                        {endereco.bairro && <p>{endereco.bairro}</p>}
                        {(endereco.cidade || endereco.uf) && (
                          <p>
                            {endereco.cidade}
                            {endereco.uf && ` - ${endereco.uf}`}
                          </p>
                        )}
                        {endereco.cep && <p>CEP: {endereco.cep}</p>}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Resumo Financeiro - Contas a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(data.financeiro.total_aberto)}
                  </div>
                  <div className="text-sm text-muted-foreground">Em Aberto</div>
                  <div className="text-xs text-muted-foreground">
                    {data.financeiro.contas_abertas} contas
                  </div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(data.financeiro.total_vencido)}
                  </div>
                  <div className="text-sm text-muted-foreground">Vencido</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.financeiro.total_pago)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Pago</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {formatCurrency(data.financeiro.total_aberto + data.financeiro.total_pago)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Geral</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Histórico de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(data.vendas.total_vendas)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total em Vendas</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">
                    {data.vendas.quantidade_vendas}
                  </div>
                  <div className="text-sm text-muted-foreground">Quantidade de Vendas</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-lg font-bold">
                    {data.vendas.ultima_venda ? formatDate(data.vendas.ultima_venda) : 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">Última Venda</div>
                </div>
              </div>
              
              {data.vendas.quantidade_vendas === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma venda encontrada para esta entidade
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente auxiliar para labels
function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={`text-sm font-medium text-muted-foreground ${className}`}>
      {children}
    </label>
  );
}