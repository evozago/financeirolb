/**
 * Formulário para criar/editar contas bancárias
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  nome_banco: z.string().min(1, 'Nome do banco é obrigatório'),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  tipo_conta: z.string().optional(),
  saldo_atual: z.number().default(0),
  ativo: z.boolean().default(true),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BankAccountFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

const accountTypes = [
  'Conta Corrente',
  'Conta Poupança',
  'Conta Investimento',
  'Conta Salário',
  'Cartão de Crédito',
  'Outro'
];

export function BankAccountForm({ 
  initialData, 
  onSubmit, 
  loading = false, 
  submitLabel = 'Salvar' 
}: BankAccountFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_banco: initialData?.nome_banco || '',
      agencia: initialData?.agencia || '',
      conta: initialData?.conta || '',
      tipo_conta: initialData?.tipo_conta || '',
      saldo_atual: initialData?.saldo_atual || 0,
      ativo: initialData?.ativo ?? true,
      observacoes: initialData?.observacoes || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="nome_banco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Banco *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Banco do Brasil, Itaú, Nubank..." 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo_conta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Conta</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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
            name="agencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agência</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 1234-5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="conta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número da Conta</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 12345-6" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="saldo_atual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo Atual</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0,00" 
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Informe o saldo atual da conta em R$
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ativo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Conta Ativa</FormLabel>
                  <FormDescription>
                    Desative para ocultar a conta dos relatórios
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Informações adicionais sobre a conta..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}