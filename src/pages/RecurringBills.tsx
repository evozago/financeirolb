import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar, Edit, Archive, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { RecurringBill } from '@/types/payables'
import { RecurringBillForm } from '@/components/features/recurring-bills/RecurringBillForm'
import { EnhancedDataTable } from '@/components/ui/enhanced-data-table'

interface Column {
  key: string
  header: string
  sortable: boolean
  cell: (item: RecurringBill) => React.ReactNode
}

const RecurringBills = () => {
  const [bills, setBills] = useState<RecurringBill[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null)
  const [launchingId, setLaunchingId] = useState<string | null>(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    loadBills()
  }, [])

  const loadBills = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('recurring_bills' as any)
        .select(`
          *,
          supplier:fornecedores(id, nome),
          category:categorias_produtos(id, nome)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBills((data as any) || [])
    } catch (error) {
      console.error('Error loading recurring bills:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar contas recorrentes',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingBill(null)
    setShowForm(true)
  }

  const handleEdit = (bill: RecurringBill) => {
    setEditingBill(bill)
    setShowForm(true)
  }

  const handleToggleActive = async (bill: RecurringBill) => {
    try {
      const { error } = await supabase
        .from('recurring_bills' as any)
        .update({ active: !bill.active })
        .eq('id', bill.id)

      if (error) throw error

      toast({
        title: 'Sucesso',
        description: `Conta ${bill.active ? 'arquivada' : 'reativada'} com sucesso`,
      })

      loadBills()
    } catch (error) {
      console.error('Error toggling bill status:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status da conta',
        variant: 'destructive',
      })
    }
  }

  // 🔹 Lança a conta recorrente do mês vigente em "Contas a Pagar" (ap_installments)
  const handleLaunchCurrentMonth = async (bill: RecurringBill) => {
    try {
      setLaunchingId(bill.id)

      // p_year_month deve ser o 1º dia do mês (YYYY-MM-01)
      const yearMonth = new Date().toISOString().slice(0, 7) + '-01'

      const { data, error } = await supabase.rpc('create_payable_from_recurring', {
        p_recurring_bill_id: bill.id,
        p_year_month: yearMonth,
        // p_amount: null // se quiser sobrescrever valor, passe um número aqui
      })

      if (error) throw error

      toast({
        title: 'Lançado!',
        description: 'Título criado em Contas a Pagar para o mês vigente.',
      })

      // opcional: levar usuário para a página de Contas a Pagar
      // navigate('/contas-a-pagar')
    } catch (err: any) {
      console.error('Error launching payable from recurring:', err)
      toast({
        title: 'Erro ao lançar',
        description: err?.message || 'Não foi possível lançar a conta deste mês.',
        variant: 'destructive',
      })
    } finally {
      setLaunchingId(null)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingBill(null)
    loadBills()
    toast({
      title: 'Sucesso',
      description: editingBill ? 'Conta atualizada com sucesso' : 'Conta criada com sucesso',
    })
  }

  const columns: Column[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      cell: (bill) => <div className="font-medium">{bill.name}</div>,
    },
    {
      key: 'supplier',
      header: 'Fornecedor',
      sortable: false,
      cell: (bill) => (
        <div className="text-sm text-muted-foreground">{bill.supplier?.nome || '-'}</div>
      ),
    },
    {
      key: 'category',
      header: 'Categoria',
      sortable: false,
      cell: (bill) => (
        <div className="text-sm text-muted-foreground">{bill.category?.nome || '-'}</div>
      ),
    },
    {
      key: 'dates',
      header: 'Fechamento/Vencimento',
      sortable: false,
      cell: (bill) => (
        <div className="text-sm">
          <div>Fechamento: {bill.closing_day ? `Dia ${bill.closing_day}` : '-'}</div>
          <div>Vencimento: Dia {bill.due_day}</div>
        </div>
      ),
    },
    {
      key: 'expected_amount',
      header: 'Valor Esperado',
      sortable: true,
      cell: (bill) => (
        <div className="font-medium">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(bill.expected_amount || 0)}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: false,
      cell: (bill) => (
        <Badge variant={bill.active ? 'default' : 'secondary'}>
          {bill.active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      sortable: false,
      cell: (bill) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(bill)} title="Editar">
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleActive(bill)}
            title={bill.active ? 'Arquivar' : 'Reativar'}
          >
            <Archive className="h-4 w-4" />
          </Button>

          {/* 🔹 Botão novo: Lançar no Contas a Pagar (mês vigente) */}
          <Button
            size="sm"
            onClick={() => handleLaunchCurrentMonth(bill)}
            disabled={launchingId === bill.id}
            className="gap-2"
            title="Lançar título do mês vigente em Contas a Pagar"
          >
            {launchingId === bill.id ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Lançando...
              </>
            ) : (
              <>⚡ Lançar mês vigente</>
            )}
          </Button>
        </div>
      ),
    },
  ]

  if (showForm) {
    return (
      <RecurringBillForm
        bill={editingBill}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false)
          setEditingBill(null)
        }}
      />
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas Recorrentes</h1>
          <p className="text-muted-foreground">Gerencie suas contas mensais recorrentes</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta Recorrente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Contas Recorrentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedDataTable
            data={bills}
            columns={columns}
            loading={loading}
            emptyMessage="Nenhuma conta recorrente encontrada"
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default RecurringBills
