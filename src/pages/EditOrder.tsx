import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Upload, Link as LinkIcon, Trash2, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const orderSchema = z.object({
  numero_pedido: z.string().min(1, 'Número do pedido é obrigatório'),
  fornecedor_id: z.string().min(1, 'Fornecedor é obrigatório'),
  marca_id: z.string().optional(),
  quantidade: z.number().min(1, 'Quantidade deve ser maior que 0'),
  quantidade_referencias: z.number().min(0, 'Quantidade de referências deve ser maior ou igual a 0'),
  valor_total_bruto: z.number().min(0, 'Valor total bruto deve ser maior ou igual a 0'),
  tipo_desconto: z.enum(['valor', 'porcentagem']),
  desconto_valor: z.number().min(0, 'Desconto deve ser maior ou igual a 0').optional(),
  desconto_porcentagem: z.number().min(0).max(100, 'Porcentagem deve estar entre 0 e 100').optional(),
  data_pedido: z.string().min(1, 'Data do pedido é obrigatória'),
  representante_nome: z.string().optional(),
  representante_telefone: z.string().optional(),
  representante_email: z.string().optional(),
  observacoes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface Supplier {
  id: string;
  nome: string;
}

interface Brand {
  id: string;
  nome: string;
  fornecedor_id?: string;
}

export default function EditOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [links, setLinks] = useState<string[]>(['']);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [showNewBrandDialog, setShowNewBrandDialog] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      numero_pedido: '',
      fornecedor_id: '',
      marca_id: '',
      quantidade: 1,
      quantidade_referencias: 0,
      valor_total_bruto: 0,
      tipo_desconto: 'valor',
      desconto_valor: 0,
      desconto_porcentagem: 0,
      data_pedido: new Date().toISOString().split('T')[0],
      representante_nome: '',
      representante_telefone: '',
      representante_email: '',
      observacoes: '',
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    loadSuppliers();
    loadBrands();
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;

    try {
      setLoadingOrder(true);
      const { data: order, error } = await supabase
        .from('pedidos_produtos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading order:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar pedido",
          variant: "destructive",
        });
        navigate('/orders');
        return;
      }

      if (order) {
        // Parse links from observacoes
        const observacoes = order.observacoes || '';
        const linksMatch = observacoes.match(/Links:\n(.*?)$/s);
        const orderLinks = linksMatch ? linksMatch[1].split('\n').filter(link => link.trim()) : [];
        const cleanObservacoes = observacoes.replace(/\n\nLinks:\n.*$/s, '');

        setLinks(orderLinks.length > 0 ? orderLinks : ['']);

        form.reset({
          numero_pedido: order.numero_pedido || '',
          fornecedor_id: order.fornecedor_id || '',
          marca_id: order.marca_id || '',
          quantidade: order.quantidade || 1,
          quantidade_referencias: order.quantidade_referencias || 0,
          valor_total_bruto: order.valor_total_bruto || 0,
          tipo_desconto: (order.tipo_desconto as 'valor' | 'porcentagem') || 'valor',
          desconto_valor: order.desconto_valor || 0,
          desconto_porcentagem: order.desconto_porcentagem || 0,
          data_pedido: order.data_pedido || new Date().toISOString().split('T')[0],
          representante_nome: order.representante_nome || '',
          representante_telefone: order.representante_telefone || '',
          representante_email: order.representante_email || '',
          observacoes: cleanObservacoes,
        });
      }
    } catch (error) {
      console.error('Error loading order:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar pedido",
        variant: "destructive",
      });
      navigate('/orders');
    } finally {
      setLoadingOrder(false);
    }
  };

  const loadSuppliers = async () => {
    const { data, error } = await supabase
      .from('fornecedores')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Error loading suppliers:', error);
      return;
    }

    setSuppliers(data || []);
  };

  const loadBrands = async () => {
    const { data, error } = await supabase
      .from('marcas')
      .select('id, nome, fornecedor_id')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Error loading brands:', error);
      return;
    }

    setBrands(data || []);
  };

  const createNewBrand = async () => {
    if (!newBrandName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da marca é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const selectedSupplierId = form.getValues('fornecedor_id');
    if (!selectedSupplierId) {
      toast({
        title: "Erro",
        description: "Selecione um fornecedor primeiro",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from('marcas')
      .insert({
        nome: newBrandName.trim(),
        fornecedor_id: selectedSupplierId,
        ativo: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating brand:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar marca",
        variant: "destructive",
      });
      return;
    }

    // Atualizar lista de marcas e selecionar a nova marca
    await loadBrands();
    form.setValue('marca_id', data.id);
    setNewBrandName('');
    setShowNewBrandDialog(false);

    toast({
      title: "Sucesso",
      description: "Marca criada com sucesso",
    });
  };

  const calculateValues = () => {
    const quantidade = watchedValues.quantidade || 0;
    const valorTotalBruto = watchedValues.valor_total_bruto || 0;
    
    let descontoValor = 0;
    if (watchedValues.tipo_desconto === 'porcentagem') {
      descontoValor = valorTotalBruto * ((watchedValues.desconto_porcentagem || 0) / 100);
    } else {
      descontoValor = watchedValues.desconto_valor || 0;
    }
    
    const valorTotalLiquido = valorTotalBruto - descontoValor;
    const valorMedioPeca = quantidade > 0 ? valorTotalLiquido / quantidade : 0;

    return {
      valorTotalBruto,
      descontoValor,
      valorTotalLiquido,
      valorMedioPeca,
    };
  };

  const uploadAttachments = async (orderId: string) => {
    const uploadPromises = attachments.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('order-attachments')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading file:', error);
        throw error;
      }

      return fileName;
    });

    return Promise.all(uploadPromises);
  };

  const onSubmit = async (data: OrderFormData) => {
    if (!id) return;

    try {
      setLoading(true);

      // Prepare links data
      const validLinks = links.filter(link => link.trim() !== '');
      const observacoesWithLinks = [
        data.observacoes || '',
        validLinks.length > 0 ? `\n\nLinks:\n${validLinks.join('\n')}` : ''
      ].filter(Boolean).join('');

      // Calcular custo unitário baseado no valor total bruto
      const custoUnitario = data.quantidade > 0 ? data.valor_total_bruto / data.quantidade : 0;
      
      const { error } = await supabase
        .from('pedidos_produtos')
        .update({
          numero_pedido: data.numero_pedido,
          referencia: data.numero_pedido, // Manter compatibilidade
          fornecedor_id: data.fornecedor_id,
          marca_id: data.marca_id || null,
          quantidade: data.quantidade,
          quantidade_referencias: data.quantidade_referencias,
          custo_unitario: custoUnitario,
          valor_total_bruto: data.valor_total_bruto,
          tipo_desconto: data.tipo_desconto,
          desconto_valor: data.tipo_desconto === 'valor' ? data.desconto_valor : null,
          desconto_porcentagem: data.tipo_desconto === 'porcentagem' ? data.desconto_porcentagem : null,
          data_pedido: data.data_pedido,
          representante_nome: data.representante_nome,
          representante_telefone: data.representante_telefone,
          representante_email: data.representante_email,
          observacoes: observacoesWithLinks,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating order:', error);
        toast({
          title: "Erro",
          description: "Falha ao atualizar pedido",
          variant: "destructive",
        });
        return;
      }

      // Upload attachments if any
      if (attachments.length > 0) {
        try {
          await uploadAttachments(id);
        } catch (uploadError) {
          console.error('Error uploading attachments:', uploadError);
          toast({
            title: "Aviso",
            description: "Pedido atualizado, mas houve erro no upload dos anexos",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Sucesso",
        description: "Pedido atualizado com sucesso",
      });

      navigate('/orders');
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addLink = () => {
    setLinks([...links, '']);
  };

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const removeLink = (index: number) => {
    if (links.length > 1) {
      setLinks(links.filter((_, i) => i !== index));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const calculatedValues = calculateValues();

  if (loadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/orders')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Editar Pedido</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="numero_pedido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Pedido *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="PED-001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_pedido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Pedido *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fornecedor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o fornecedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marca_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <div className="flex gap-2">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Selecione a marca" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {brands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                  {brand.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Dialog open={showNewBrandDialog} onOpenChange={setShowNewBrandDialog}>
                            <DialogTrigger asChild>
                              <Button type="button" variant="outline" size="icon">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adicionar Nova Marca</DialogTitle>
                                <DialogDescription>
                                  Crie uma nova marca para o fornecedor selecionado.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label htmlFor="brand-name">Nome da Marca</Label>
                                  <Input
                                    id="brand-name"
                                    value={newBrandName}
                                    onChange={(e) => setNewBrandName(e.target.value)}
                                    placeholder="Nome da nova marca"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowNewBrandDialog(false)}>
                                  Cancelar
                                </Button>
                                <Button type="button" onClick={createNewBrand}>
                                  Criar Marca
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Total de Peças *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantidade_referencias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de Referências</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valor_total_bruto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Total Bruto *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Valor Total Bruto (Informado)</Label>
                    <div className="px-3 py-2 bg-muted rounded-md text-sm">
                      R$ {calculatedValues.valorTotalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desconto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="tipo_desconto"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Desconto</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-row space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="valor" id="valor" />
                            <Label htmlFor="valor">Valor em R$</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="porcentagem" id="porcentagem" />
                            <Label htmlFor="porcentagem">Porcentagem %</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {watchedValues.tipo_desconto === 'valor' ? (
                    <FormField
                      control={form.control}
                      name="desconto_valor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desconto (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="desconto_porcentagem"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Desconto (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="space-y-2">
                    <Label>Valor Total Líquido</Label>
                    <div className="px-3 py-2 bg-primary/10 text-primary rounded-md text-sm font-medium">
                      R$ {calculatedValues.valorTotalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Médio por Peça</Label>
                    <div className="px-3 py-2 bg-primary/10 text-primary rounded-md text-sm font-medium">
                      R$ {calculatedValues.valorMedioPeca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Representante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="representante_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Representante</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="João Silva" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="representante_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(11) 99999-9999" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="representante_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="joao@exemplo.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Links Relacionados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="https://exemplo.com"
                      value={link}
                      onChange={(e) => updateLink(index, e.target.value)}
                      className="flex-1"
                    />
                    {links.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeLink(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addLink}
                  className="w-full"
                >
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Adicionar Link
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Anexos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="attachments">Arquivos (PDF, XLSX, etc.)</Label>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="mt-1"
                    accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
                  />
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Arquivos Selecionados:</Label>
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Observações adicionais sobre o pedido..."
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/orders')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Pedido
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}