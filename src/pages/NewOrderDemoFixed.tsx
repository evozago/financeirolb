// Versão demo do formulário de novo pedido com dados locais
// Para testes e desenvolvimento quando há problemas de conectividade

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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

// Dados locais para demonstração
const localSuppliers: Supplier[] = [
  { id: '1', nome: 'Fornecedor ABC Ltda' },
  { id: '2', nome: 'Distribuidora XYZ' },
  { id: '3', nome: 'Comercial 123' },
  { id: '4', nome: 'Indústria Fashion' },
  { id: '5', nome: 'Atacado Premium' }
];

const localBrands: Brand[] = [
  { id: '1', nome: 'Nike', fornecedor_id: '1' },
  { id: '2', nome: 'Adidas', fornecedor_id: '1' },
  { id: '3', nome: 'Puma', fornecedor_id: '2' },
  { id: '4', nome: 'Reebok', fornecedor_id: '2' },
  { id: '5', nome: 'Vans', fornecedor_id: '3' },
  { id: '6', nome: 'Converse', fornecedor_id: '3' },
  { id: '7', nome: 'New Balance', fornecedor_id: '4' },
  { id: '8', nome: 'Asics', fornecedor_id: '4' },
  { id: '9', nome: 'Fila', fornecedor_id: '5' },
  { id: '10', nome: 'Mizuno', fornecedor_id: '5' }
];

export default function NewOrderDemoFixed() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [suppliers] = useState<Supplier[]>(localSuppliers);
  const [brands, setBrands] = useState<Brand[]>(localBrands);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [representativeDialogOpen, setRepresentativeDialogOpen] = useState(false);

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
  const selectedSupplier = watchedValues.fornecedor_id;
  const tipoDesconto = watchedValues.tipo_desconto;
  const valorTotalBruto = watchedValues.valor_total_bruto || 0;
  const descontoValor = watchedValues.desconto_valor || 0;
  const descontoPorcentagem = watchedValues.desconto_porcentagem || 0;
  const quantidade = watchedValues.quantidade || 1;

  // Filtrar marcas baseado no fornecedor selecionado
  useEffect(() => {
    if (selectedSupplier) {
      const filtered = brands.filter(brand => brand.fornecedor_id === selectedSupplier);
      setFilteredBrands(filtered);
      
      // Limpar marca selecionada se não pertencer ao fornecedor atual
      const currentBrand = form.getValues('marca_id');
      if (currentBrand && !filtered.find(b => b.id === currentBrand)) {
        form.setValue('marca_id', '');
      }
    } else {
      setFilteredBrands([]);
      form.setValue('marca_id', '');
    }
  }, [selectedSupplier, brands, form]);

  // Calcular valores
  const calcularDesconto = () => {
    if (tipoDesconto === 'valor') {
      return descontoValor;
    } else {
      return (valorTotalBruto * descontoPorcentagem) / 100;
    }
  };

  const valorDesconto = calcularDesconto();
  const valorTotalLiquido = Math.max(0, valorTotalBruto - valorDesconto);
  const valorMedioPorPeca = quantidade > 0 ? valorTotalLiquido / quantidade : 0;

  const onSubmit = async (data: OrderFormData) => {
    setLoading(true);
    
    try {
      // Simular delay de salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simular salvamento bem-sucedido
      const supplierName = suppliers.find(s => s.id === data.fornecedor_id)?.nome || 'Desconhecido';
      const brandName = brands.find(b => b.id === data.marca_id)?.nome || '';
      
      toast({
        title: "Pedido criado com sucesso!",
        description: `Pedido ${data.numero_pedido} para ${supplierName}${brandName ? ` - ${brandName}` : ''} foi salvo.`,
      });
      
      // Redirecionar para lista de pedidos
      navigate('/orders');
      
    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      toast({
        title: "Erro ao criar pedido",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `PED-${year}${month}${day}-${random}`;
  };

  const handleGenerateNumber = () => {
    const newNumber = generateOrderNumber();
    form.setValue('numero_pedido', newNumber);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <div>
                <h1 className="text-2xl font-bold text-foreground">Novo Pedido</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">DEMO</Badge>
                  <span className="text-sm text-muted-foreground">
                    Versão de demonstração com dados locais
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Informações do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Número do Pedido */}
                  <FormField
                    control={form.control}
                    name="numero_pedido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Pedido *</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="PED-001" {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleGenerateNumber}
                          >
                            Gerar
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Data do Pedido */}
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

                  {/* Fornecedor */}
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

                  {/* Marca */}
                  <FormField
                    control={form.control}
                    name="marca_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!selectedSupplier}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={
                                selectedSupplier 
                                  ? "Selecione a marca" 
                                  : "Selecione um fornecedor primeiro"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredBrands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantidade Total de Peças */}
                  <FormField
                    control={form.control}
                    name="quantidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Total de Peças *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quantidade de Referências */}
                  <FormField
                    control={form.control}
                    name="quantidade_referencias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade de Referências</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Valor Total Bruto */}
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
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Valor Total Bruto (Informado) */}
                  <div className="space-y-2">
                    <Label>Valor Total Bruto (Informado)</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <span className="text-lg font-semibold">
                        R$ {valorTotalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desconto */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Desconto</h3>
                  
                  <FormField
                    control={form.control}
                    name="tipo_desconto"
                    render={({ field }) => (
                      <FormItem>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Campo de desconto */}
                    {tipoDesconto === 'valor' ? (
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
                                min="0"
                                max={valorTotalBruto}
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Valor Total Líquido */}
                    <div className="space-y-2">
                      <Label>Valor Total Líquido</Label>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <span className="text-lg font-semibold text-green-700">
                          R$ {valorTotalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Valor Médio por Peça */}
                    <div className="space-y-2">
                      <Label>Valor Médio por Peça</Label>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <span className="text-lg font-semibold text-blue-700">
                          R$ {valorMedioPorPeca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados do Representante */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Dados do Representante
                  </CardTitle>
                  <Dialog open={representativeDialogOpen} onOpenChange={setRepresentativeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Representante
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Dados do Representante</DialogTitle>
                        <DialogDescription>
                          Informe os dados do representante responsável por este pedido.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="representante_nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Representante</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome completo" {...field} />
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
                                <Input placeholder="(11) 99999-9999" {...field} />
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
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="email@exemplo.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setRepresentativeDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setRepresentativeDialogOpen(false)}
                        >
                          Salvar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {watchedValues.representante_nome ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{watchedValues.representante_nome}</p>
                        {watchedValues.representante_telefone && (
                          <p className="text-sm text-muted-foreground">
                            Tel: {watchedValues.representante_telefone}
                          </p>
                        )}
                        {watchedValues.representante_email && (
                          <p className="text-sm text-muted-foreground">
                            E-mail: {watchedValues.representante_email}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          form.setValue('representante_nome', '');
                          form.setValue('representante_telefone', '');
                          form.setValue('representante_email', '');
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum representante adicionado
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Observações */}
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
                          placeholder="Observações adicionais sobre o pedido..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botões de Ação */}
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
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
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
