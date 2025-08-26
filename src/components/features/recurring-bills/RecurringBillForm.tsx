import React, { useEffect, useState } from "react"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { RecurringBill } from "@/types/payables"

interface RecurringBillFormProps {
  bill?: RecurringBill | null
  onSuccess: () => void
  onCancel: () => void
}

type OptionBasic = { id: string; nome: string }

export const RecurringBillForm: React.FC<RecurringBillFormProps> = ({
  bill,
  onSuccess,
  onCancel,
}) => {
  const { toast } = useToast()

  const [suppliers, setSuppliers] = useState<OptionBasic[]>([])
  const [categories, setCategories] = useState<OptionBasic[]>([])
  const [filiais, setFiliais] = useState<OptionBasic[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    supplier_id: "" as string | "",
    category_id: "" as string | "",
    filial_id: "" as string | "",
    closing_day: "" as string | "",
    due_day: "" as string | "",
    expected_amount: "" as string | "",
    open_ended: true,
    end_date: "" as string | "",
    notes: "" as string | "",
  })

  // ---------- Load options & hydrate on edit ----------
  useEffect(() => {
    ;(async () => {
      await Promise.all([loadSuppliers(), loadCategories(), loadFiliais()])
    })()
  }, [])

  useEffect(() => {
    if (!bill) return
    setFormData({
      name: bill.name ?? "",
      supplier_id: bill.supplier_id ?? "",
      category_id: bill.category_id ?? "",
      filial_id: (bill as any).filial_id ?? "", // coluna nova
      closing_day: bill.closing_day ? String(bill.closing_day) : "",
      due_day: bill.due_day ? String(bill.due_day) : "",
      expected_amount: bill.expected_amount ? String(bill.expected_amount) : "",
      open_ended: bill.open_ended ?? true,
      end_date: bill.end_date ?? "",
      notes: bill.notes ?? "",
    })
  }, [bill])

  // ---------- Loaders ----------
  async function loadSuppliers() {
    const { data, error } = await supabase
      .from("fornecedores")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome")

    if (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar fornecedores.",
        variant: "destructive",
      })
      return
    }
    setSuppliers(data ?? [])
  }

  async function loadCategories() {
    const { data, error } = await supabase
      .from("categorias_produtos")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome")

    if (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar categorias.",
        variant: "destructive",
      })
      return
    }
    setCategories(data ?? [])
  }

  async function loadFiliais() {
    const { data, error } = await supabase
      .from("filiais")
      .select("id, nome")
      .eq("ativo", true)
      .order("nome")

    if (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar filiais.",
        variant: "destructive",
      })
      return
    }
    setFiliais(data ?? [])
  }

  // ---------- Helpers ----------
  function setField<K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function parseIntOrNull(v: string) {
    if (v === "" || v === undefined || v === null) return null
    const n = parseInt(v, 10)
    return Number.isNaN(n) ? null : n
  }

  function parseFloatOrNull(v: string) {
    if (v === "" || v === undefined || v === null) return null
    const n = parseFloat(v)
    return Number.isNaN(n) ? null : n
  }

  // ---------- Submit ----------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.name || !formData.due_day || !formData.expected_amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha Nome, Dia do Vencimento e Valor Esperado.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const payload = {
        name: formData.name,
        supplier_id: formData.supplier_id || null,
        category_id: formData.category_id || null,
        filial_id: formData.filial_id || null, // <- NOVO (garante persistência)
        closing_day: parseIntOrNull(formData.closing_day),
        due_day: parseIntOrNull(formData.due_day),
        expected_amount: parseFloatOrNull(formData.expected_amount),
        open_ended: Boolean(formData.open_ended),
        end_date: formData.open_ended ? null : formData.end_date || null,
        notes: formData.notes || null,
      }

      let error
      if (bill?.id) {
        ;({ error } = await supabase.from("recurring_bills" as any).update(payload).eq("id", bill.id))
      } else {
        ;({ error } = await supabase.from("recurring_bills" as any).insert([payload]))
      }

      if (error) throw error

      toast({
        title: "Sucesso",
        description: bill ? "Conta recorrente atualizada." : "Conta recorrente criada.",
      })
      onSuccess()
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Erro ao salvar",
        description: err?.message || "Tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={onCancel} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">
          {bill ? "Editar Conta Recorrente" : "Nova Conta Recorrente"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Conta *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Ex: Equatorial Energia"
                  required
                />
              </div>

              {/* Fornecedor */}
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select
                  value={formData.supplier_id || undefined}
                  onValueChange={(value) => setField("supplier_id", value || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filial (NOVO) */}
              <div className="space-y-2">
                <Label>Filial</Label>
                <Select
                  value={formData.filial_id || undefined}
                  onValueChange={(value) => setField("filial_id", value || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {filiais.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category_id || undefined}
                  onValueChange={(value) => setField("category_id", value || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valor Esperado */}
              <div className="space-y-2">
                <Label htmlFor="expected_amount">Valor Esperado *</Label>
                <Input
                  id="expected_amount"
                  type="number"
                  step="0.01"
                  value={formData.expected_amount}
                  onChange={(e) => setField("expected_amount", e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Dia do Fechamento */}
              <div className="space-y-2">
                <Label htmlFor="closing_day">Dia do Fechamento</Label>
                <Input
                  id="closing_day"
                  type="number"
                  min={1}
                  max={31}
                  value={formData.closing_day}
                  onChange={(e) => setField("closing_day", e.target.value)}
                  placeholder="Ex: 25"
                />
              </div>

              {/* Dia do Vencimento */}
              <div className="space-y-2">
                <Label htmlFor="due_day">Dia do Vencimento *</Label>
                <Input
                  id="due_day"
                  type="number"
                  min={1}
                  max={31}
                  value={formData.due_day}
                  onChange={(e) => setField("due_day", e.target.value)}
                  placeholder="Ex: 4"
                  required
                />
              </div>
            </div>

            {/* Opções extras */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="open_ended"
                  checked={formData.open_ended}
                  onCheckedChange={(checked) => setField("open_ended", Boolean(checked))}
                />
                <Label htmlFor="open_ended">Conta sem data final (contínua)</Label>
              </div>

              {!formData.open_ended && (
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data Final</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setField("end_date", e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Observações adicionais..."
                  value={formData.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default RecurringBillForm
