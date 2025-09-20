import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Building2, User, MapPin, Briefcase, Phone, Mail } from 'lucide-react';

const entidadeSchema = z.object({
  tipo_pessoa: z.enum(['fisica', 'juridica']),
  nome_razao_social: z.string().min(2, 'Nome/Razão Social é obrigatório'),
  nome_fantasia: z.string().optional(),
  cpf_cnpj: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  rg: z.string().optional(),
  data_nascimento: z.string().optional(),
  data_fundacao: z.string().optional(),
  nacionalidade: z.string().default('Brasileira'),
  profissao: z.string().optional(),
  estado_civil: z.string().optional(),
  genero: z.string().optional(),
  observacoes: z.string().optional(),
});

const enderecoSchema = z.object({
  tipo: z.enum(['cobranca', 'entrega', 'fiscal', 'residencial', 'comercial']),
  principal: z.boolean().default(false),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2, 'UF deve ter 2 caracteres').optional(),
  cep: z.string().optional(),
});

type EntidadeFormData = z.infer<typeof entidadeSchema>;
type EnderecoFormData = z.infer<typeof enderecoSchema>;

interface EntidadeFormProps {
  entidadeId?: string;
  onSuccess?: (entidade: any) => void;
  onCancel?: () => void;
}

interface Papel {
  id: string;
  nome: string;
  descricao: string;
}

export function EntidadeForm({ entidadeId, onSuccess, onCancel }: EntidadeFormProps) {
  const [loading, setLoading] = useState(false);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [papeisSelected, setPapeisSelected] = useState<string[]>([]);
  const [enderecos, setEnderecos] = useState<EnderecoFormData[]>([]);
  const [currentTab, setCurrentTab] = useState('cadastral');

  const form = useForm<EntidadeFormData>({
    resolver: zodResolver(entidadeSchema),
    defaultValues: {
      tipo_pessoa: 'fisica',
      nacionalidade: 'Brasileira',
    },
  });

  useEffect(() => {
    loadPapeis();
    if (entidadeId) {
      loadEntidade();
    }
  }, [entidadeId]);

  const loadPapeis = async () => {
    try {
      const { data, error } = await supabase
        .from('papeis')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setPapeis(data || []);
    } catch (error) {
      console.error('Erro ao carregar papéis:', error);
      toast.error('Erro ao carregar papéis');
    }
  };

  const loadEntidade = async () => {
    if (!entidadeId) return;

    try {
      setLoading(true);
      
      // Carregar dados da entidade
      const { data: entidade, error: entidadeError } = await supabase
        .from('entidades_corporativas')
        .select('*')
        .eq('id', entidadeId)
        .single();

      if (entidadeError) throw entidadeError;
      
      // Mapear dados para o formulário
      form.reset({
        tipo_pessoa: entidade.tipo_pessoa as 'fisica' | 'juridica',
        nome_razao_social: entidade.nome_razao_social,
        nome_fantasia: entidade.nome_fantasia || '',
        cpf_cnpj: entidade.cpf_cnpj || '',
        email: entidade.email || '',
        telefone: entidade.telefone || '',
        inscricao_estadual: entidade.inscricao_estadual || '',
        rg: entidade.rg || '',
        data_nascimento: entidade.data_nascimento || '',
        data_fundacao: entidade.data_fundacao || '',
        nacionalidade: entidade.nacionalidade || 'Brasileira',
        profissao: entidade.profissao || '',
        estado_civil: entidade.estado_civil || '',
        genero: entidade.genero || '',
        observacoes: entidade.observacoes || '',
      });

      // Carregar papéis da entidade
      const { data: papeisEntidade, error: papeisError } = await supabase
        .from('entidade_papeis')
        .select('papel_id')
        .eq('entidade_id', entidadeId)
        .eq('ativo', true);

      if (papeisError) throw papeisError;
      
      setPapeisSelected(papeisEntidade?.map(p => p.papel_id) || []);

      // Carregar endereços
      const { data: enderecosData, error: enderecosError } = await supabase
        .from('entidade_enderecos')
        .select(`
          tipo,
          principal,
          endereco_detalhado (
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            uf,
            cep
          )
        `)
        .eq('entidade_id', entidadeId);

      if (enderecosError) throw enderecosError;

      const enderecosFormatted = enderecosData?.map(e => ({
        tipo: e.tipo as any,
        principal: e.principal,
        ...(e.endereco_detalhado as any)
      })) || [];

      setEnderecos(enderecosFormatted);

    } catch (error) {
      console.error('Erro ao carregar entidade:', error);
      toast.error('Erro ao carregar entidade');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EntidadeFormData) => {
    try {
      setLoading(true);

      // Preparar dados para envio, convertendo strings vazias em null para campos de data
      const processedData = {
        ...data,
        // Mapear valores do frontend para o esperado no banco
        tipo_pessoa: data.tipo_pessoa === 'fisica' ? 'pessoa_fisica' : 'pessoa_juridica',
        data_nascimento: data.data_nascimento && data.data_nascimento.trim() !== '' ? data.data_nascimento : null,
        data_fundacao: data.data_fundacao && data.data_fundacao.trim() !== '' ? data.data_fundacao : null,
      };

      // Salvar ou atualizar entidade
      let entidadeResult;
      if (entidadeId) {
        const { data: updated, error } = await supabase
          .from('entidades_corporativas')
          .update(processedData as any)
          .eq('id', entidadeId)
          .select()
          .single();
        
        if (error) throw error;
        entidadeResult = updated;
      } else {
        const { data: created, error } = await supabase
          .from('entidades_corporativas')
          .insert([processedData as any])
          .select()
          .single();
        
        if (error) throw error;
        entidadeResult = created;
      }

      // Atualizar papéis
      if (entidadeResult) {
        // Remover papéis existentes
        await supabase
          .from('entidade_papeis')
          .delete()
          .eq('entidade_id', entidadeResult.id);

        // Adicionar papéis selecionados
        if (papeisSelected.length > 0) {
          const papeisToInsert = papeisSelected.map(papelId => ({
            entidade_id: entidadeResult.id,
            papel_id: papelId,
          }));

          const { error: papeisError } = await supabase
            .from('entidade_papeis')
            .insert(papeisToInsert);

          if (papeisError) throw papeisError;
        }
      }

      toast.success(entidadeId ? 'Entidade atualizada com sucesso!' : 'Entidade criada com sucesso!');
      onSuccess?.(entidadeResult);
      
    } catch (error: any) {
      console.error('Erro ao salvar entidade:', error);
      
      if (error.code === '23505') {
        if (error.constraint?.includes('cpf_cnpj_normalizado')) {
          toast.error('CPF/CNPJ já existe no sistema');
        } else if (error.constraint?.includes('email_normalizado')) {
          toast.error('Email já existe no sistema');
        } else {
          toast.error('Dados duplicados encontrados');
        }
      } else {
        toast.error('Erro ao salvar entidade');
      }
    } finally {
      setLoading(false);
    }
  };

  const addEndereco = () => {
    setEnderecos([...enderecos, {
      tipo: 'comercial',
      principal: enderecos.length === 0,
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: '',
    }]);
  };

  const removeEndereco = (index: number) => {
    setEnderecos(enderecos.filter((_, i) => i !== index));
  };

  const updateEndereco = (index: number, field: keyof EnderecoFormData, value: any) => {
    const updated = [...enderecos];
    updated[index] = { ...updated[index], [field]: value };
    setEnderecos(updated);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {entidadeId ? 'Editar Entidade' : 'Nova Entidade'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cadastral">Dados Cadastrais</TabsTrigger>
            <TabsTrigger value="papeis">Papéis</TabsTrigger>
            <TabsTrigger value="enderecos">Endereços</TabsTrigger>
          </TabsList>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="cadastral" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo_pessoa">Tipo de Pessoa *</Label>
                  <Select
                    value={form.watch('tipo_pessoa')}
                    onValueChange={(value) => form.setValue('tipo_pessoa', value as any)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o tipo de pessoa" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md z-50">
                      <SelectItem value="fisica">Pessoa Física</SelectItem>
                      <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="nome_razao_social">
                    {form.watch('tipo_pessoa') === 'fisica' ? 'Nome Completo' : 'Razão Social'} *
                  </Label>
                  <Input
                    {...form.register('nome_razao_social')}
                    placeholder={form.watch('tipo_pessoa') === 'fisica' ? 'Nome completo' : 'Razão social da empresa'}
                  />
                  {form.formState.errors.nome_razao_social && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.nome_razao_social.message}
                    </p>
                  )}
                </div>

                {form.watch('tipo_pessoa') === 'juridica' && (
                  <div>
                    <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                    <Input
                      {...form.register('nome_fantasia')}
                      placeholder="Nome fantasia"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="cpf_cnpj">
                    {form.watch('tipo_pessoa') === 'fisica' ? 'CPF' : 'CNPJ'}
                  </Label>
                  <Input
                    {...form.register('cpf_cnpj')}
                    placeholder={form.watch('tipo_pessoa') === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                </div>

                <div>
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    {...form.register('email')}
                    placeholder="email@exemplo.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="telefone">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Telefone
                  </Label>
                  <Input
                    {...form.register('telefone')}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                {form.watch('tipo_pessoa') === 'fisica' ? (
                  <>
                    <div>
                      <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                      <Input
                        type="date"
                        {...form.register('data_nascimento')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rg">RG</Label>
                      <Input
                        {...form.register('rg')}
                        placeholder="00.000.000-0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="profissao">Profissão</Label>
                      <Input
                        {...form.register('profissao')}
                        placeholder="Profissão"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estado_civil">Estado Civil</Label>
                      <Select
                        value={form.watch('estado_civil') || ''}
                        onValueChange={(value) => form.setValue('estado_civil', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="data_fundacao">Data de Fundação</Label>
                      <Input
                        type="date"
                        {...form.register('data_fundacao')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                      <Input
                        {...form.register('inscricao_estadual')}
                        placeholder="000.000.000.000"
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  {...form.register('observacoes')}
                  placeholder="Observações adicionais"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="papeis" className="space-y-4">
              <div>
                <Label>Papéis da Entidade</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecione os papéis que esta entidade desempenha no sistema
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {papeis.map((papel) => (
                    <div key={papel.id} className="flex items-start space-x-2 p-3 border rounded-lg">
                      <Checkbox
                        id={papel.id}
                        checked={papeisSelected.includes(papel.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPapeisSelected([...papeisSelected, papel.id]);
                          } else {
                            setPapeisSelected(papeisSelected.filter(id => id !== papel.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <Label htmlFor={papel.id} className="font-medium">
                          {papel.nome}
                        </Label>
                        {papel.descricao && (
                          <p className="text-sm text-muted-foreground">
                            {papel.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="enderecos" className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Endereços</Label>
                <Button type="button" variant="outline" onClick={addEndereco}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Adicionar Endereço
                </Button>
              </div>

              {enderecos.map((endereco, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <Badge variant="secondary">{endereco.tipo}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEndereco(index)}
                    >
                      Remover
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={endereco.tipo}
                        onValueChange={(value) => updateEndereco(index, 'tipo', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cobranca">Cobrança</SelectItem>
                          <SelectItem value="entrega">Entrega</SelectItem>
                          <SelectItem value="fiscal">Fiscal</SelectItem>
                          <SelectItem value="residencial">Residencial</SelectItem>
                          <SelectItem value="comercial">Comercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Logradouro</Label>
                      <Input
                        value={endereco.logradouro || ''}
                        onChange={(e) => updateEndereco(index, 'logradouro', e.target.value)}
                        placeholder="Rua, Av, etc"
                      />
                    </div>

                    <div>
                      <Label>Número</Label>
                      <Input
                        value={endereco.numero || ''}
                        onChange={(e) => updateEndereco(index, 'numero', e.target.value)}
                        placeholder="123"
                      />
                    </div>

                    <div>
                      <Label>Bairro</Label>
                      <Input
                        value={endereco.bairro || ''}
                        onChange={(e) => updateEndereco(index, 'bairro', e.target.value)}
                        placeholder="Bairro"
                      />
                    </div>

                    <div>
                      <Label>Cidade</Label>
                      <Input
                        value={endereco.cidade || ''}
                        onChange={(e) => updateEndereco(index, 'cidade', e.target.value)}
                        placeholder="Cidade"
                      />
                    </div>

                    <div>
                      <Label>UF</Label>
                      <Input
                        value={endereco.uf || ''}
                        onChange={(e) => updateEndereco(index, 'uf', e.target.value.toUpperCase())}
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <Label>CEP</Label>
                      <Input
                        value={endereco.cep || ''}
                        onChange={(e) => updateEndereco(index, 'cep', e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`principal-${index}`}
                        checked={endereco.principal}
                        onCheckedChange={(checked) => updateEndereco(index, 'principal', checked)}
                      />
                      <Label htmlFor={`principal-${index}`}>Endereço Principal</Label>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : entidadeId ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}