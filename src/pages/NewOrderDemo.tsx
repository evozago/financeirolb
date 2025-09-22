import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  data_pedido: z.string().min(1, 'Data do pedido é obrigatória'),
  representante_nome: z.string().optional(),
  representante_telefone: z.string().optional(),
  representante_email: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

// Dados de exemplo baseados nas suas tabelas reais
const FORNECEDORES_EXEMPLO = [
  { id: 'e8f34b85-793f-45f8-a8ac-5cd21aa378a1', nome: 'XUA XUA PRODUTOS INFANTIS EIRELI' },
  { id: '4e5c39c8-fe66-4e3d-9b7b-8edf2c96d62', nome: 'XUA KIDS PRODUTOS INFANTIS EIRELI' },
  { id: 'a2a3d54b-ae09-4077-9ffc-a9b3f1d6ab23', nome: 'XUA BABY PRODUTOS INFANTIS EIRELI' },
  { id: '39737cde-f7ef-4799-a170-fa93a62e4d87', nome: 'WE STORE COMMERCE LTDA' },
  { id: '5f4f706c-e06d-4162-9fbc-5cc28c0cc38c', nome: 'VIDA BABY COMERCIO DE ROUPAS E ACESSORIOS LTDA' },
  { id: 'f593df91-f0c2-4146-89d0-f027994a08d0', nome: 'V2 INDUSTRIA E COMERCIO TEXTIL LTDA' },
  { id: 'a4010417-b24e-440b-95d7-b7a04e3f109f', nome: 'V F GONCALVES COMERCIO LTDA' },
  { id: '295c0281-64d9-40f5-a71c-2516a0865097', nome: 'USE CREP INDUSTRIA E COMERCIO LTDA' },
];

const MARCAS_EXEMPLO = [
  { id: '0cf0d44a-b89f-4144-b5d6-3f15b139d7f5', nome: 'PULLA BULLA', fornecedor_id: 'e0360bd8-b6a5-4f47-ab19-d02e8...' },
  { id: '0d11676f-d805-4e4e-97c8-f7e6c86ceae2', nome: 'KETO', fornecedor_id: '9fd7cbe9-0d55-4ac0-9354-5af32...' },
  { id: '1a6d2941-a326-4034-b001-6d022bff83ae', nome: 'RESERVA', fornecedor_id: '019ff4d4-a508-4991-98d1-462a64...' },
  { id: '20c2f333-d438-4320-9a96-5cc233645cb', nome: 'ELIAN', fornecedor_id: '44e6b104-1dcb-4188-9ea2-bdaec...' },
  { id: '2ee38f41-b724-4a79-a2f2-4085c3620f4a', nome: 'ONDA MARINHA', fornecedor_id: '9e8d055f-5e38-4f85-87a3-91b51c...' },
  { id: '34631e9d-99aa-4413-b417-e0ef1297f610', nome: 'PAKITA', fornecedor_id: '9495e29c-a4b3-43ee-ac2c-561da...' },
  { id: '3525f808-6c67-4e0a-af42-03243326a6bf', nome: 'Mini Baby', fornecedor_id: 'bb73dbe5-122c-4cd7-b346-30532...' },
  { id: '3d5a014b-a286-43ba-a828-749b5eab2f7e', nome: 'HAVE FUN', fornecedor_id: '2f54c675-0ef0-4566-9835-b7add...' },
];

export default function NewOrderDemo() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState(FORNECEDORES_EXEMPLO);
  const [brands, setBrands] = useState(MARCAS_EXEMPLO);
  const [loading, setLoading] = useState(false);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      numero_pedido: `PED-${Date.now().toString().slice(-6)}`,
      fornecedor_id: '',
      marca_id: '',
      quantidade: 1,
      quantidade_referencias: 0,
      valor_total_bruto: 1,
      tipo_desconto: 'valor',
      desconto_valor: 0,
      data_pedido: new Date().toISOString().split('T')[0],
      representante_nome: '',
      representante_telefone: '',
      representante_email: '',
    },
  });

  const watchedValues = form.watch();

  // Filtrar marcas baseado no fornecedor selecionado
  const filteredBrands = brands.filter(brand => 
    !watchedValues.fornecedor_id || brand.fornecedor_id === watchedValues.fornecedor_id
  );

  // Calcular valores
  const valorTotalBruto = watchedValues.valor_total_bruto || 0;
  const descontoValor = watchedValues.tipo_desconto === 'valor' 
    ? (watchedValues.desconto_valor || 0)
    : (valorTotalBruto * ((watchedValues.desconto_valor || 0) / 100));
  
  const valorTotalLiquido = valorTotalBruto - descontoValor;
  const valorMedioPorPeca = watchedValues.quantidade > 0 
    ? valorTotalLiquido / watchedValues.quantidade 
    : 0;

  const onSubmit = async (data: OrderFormData) => {
    setLoading(true);
    
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Sucesso!",
        description: "Pedido criado com sucesso (DEMO)",
      });
      
      console.log('Dados do pedido:', {
        ...data,
        valor_total_liquido: valorTotalLiquido,
        valor_medio_por_peca: valorMedioPorPeca,
        fornecedor_nome: suppliers.find(s => s.id === data.fornecedor_id)?.nome,
        marca_nome: brands.find(b => b.id === data.marca_id)?.nome,
      });
      
      navigate('/orders-demo');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/orders-demo')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Novo Pedido (Demo Funcional)</h1>
            <p className="text-muted-foreground">
              Demonstração com fornecedores e marcas funcionando
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/orders/new')}>
          Ver Versão Real
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero_pedido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Pedido *</FormLabel>
                    <FormControl>
                      <Input placeholder="PED-001" {...field} />
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

              <FormField
                control={form.control}
                name="fornecedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor * 🟢</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormLabel>Marca 🟢</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a marca" />
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

              <div>
                <Label>Valor Total Bruto (Informado)</Label>
                <div className="p-2 bg-gray-50 rounded-md">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(valorTotalBruto)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desconto */}
          <Card>
            <CardHeader>
              <CardTitle>Desconto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="tipo_desconto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Desconto</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                <FormField
                  control={form.control}
                  name="desconto_valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchedValues.tipo_desconto === 'valor' ? 'Desconto (R$)' : 'Desconto (%)'}
                      </FormLabel>
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

                <div>
                  <Label>Valor Total Líquido</Label>
                  <div className="p-2 bg-blue-50 rounded-md font-semibold text-blue-800">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(valorTotalLiquido)}
                  </div>
                </div>

                <div>
                  <Label>Valor Médio por Peça</Label>
                  <div className="p-2 bg-purple-50 rounded-md font-semibold text-purple-800">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(valorMedioPorPeca)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Representante */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Representante</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/orders-demo')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Pedido'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
