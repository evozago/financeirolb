import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RecurringBill } from "@/types/payables";

interface RecurringBillFormProps {
  bill?: RecurringBill | null;
  onSuccess: () => void;
  onCancel: () => void;
}

type Supplier = { id: string; nome: string; filial_id: string | null };
type Category = { id: string; nome: string };
type Branch = { id: string; nome: string };

// Sentinela para opção “Sem filial” (Radix não aceita value="")
const NONE = "none";

export const RecurringBillForm: React.FC<RecurringBillFormProps> = ({
  bill,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    supplier_id: "",
    category_id: "",
    closing_day: "",
    due_day: "",
    expected_amount: 0 as number,
    open_ended: true as boolean,
    end_date: "",
    notes: "",
    filial_id: "" as string | "" // guardamos id da filial (ou vazio)
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === formData.supplier_id) || null,
    [suppliers, formData.supplier_id]
  );

  // Preenche form ao editar
  useEffect(() => {
    loadSuppliers();
    loadCategories();
    loadBranches();

    if (bill) {
      setFormData({
        name: bill.name,
        supplier_id: bill.supplier_id || "",
        category_id: bill.category_id || "",
        closing_day: bill.closing_day?.toString() || "",
        due_day: bill.due_day.toString(),
        expected_amount: bill.expected_amount,
        open_ended: bill.open_ended,
        end_date: bill.end_date || "",
        notes: bill.notes || "",
        // Se houver campo no tipo RecurringBill, usa; senão, tenta herdar do fornecedor
        filial_id: (bill as any).filial_id || ""
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bill]);

  // Se escolheu fornecedor e ainda não selecionou filial manualmente,
  // herda a filial do fornecedor (se existir)
  useEffect(() => {
    if (selectedSupplier && !formData.filial_id) {
      if (selectedSupplier.filial_id) {
        setFormData((prev) => ({ ...prev, filial_id: selectedSupplier.filial_id! }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSupplier]);

  const loadSuppliers = async () => {
    try {
      // Buscar fornecedores (PJ)
      const { data: fornecedores, error: errorFornecedores } = await supabase
        .from("fornecedores" as any)
        .select("id, nome, filial_id, tipo_pessoa")
        .eq("ativo", true)
        .order("nome");

      // Buscar pessoas (PF)
      const { data: pessoas, error: errorPessoas } = await supabase
        .from("pessoas" as any)
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");

      if (errorFornecedores) console.error("Error loading fornecedores:", errorFornecedores);
      if (errorPessoas) console.error("Error loading pessoas:", errorPessoas);

      // Unificar dados: PJ e PF juntos
      const allSuppliers: Supplier[] = [
        ...(fornecedores || []).map((f: any) => ({
          id: f.id,
          nome: `${f.nome} (PJ)`,
          filial_id: f.filial_id
        })),
        ...(pessoas || []).map((p: any) => ({
          id: p.id,
          nome: `${p.nome} (PF)`,
          filial_id: null
        }))
      ].sort((a, b) => a.nome.localeCompare(b.nome));

      setSuppliers(allSuppliers);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias_produtos" as any)
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setCategories((data as unknown as Category[]) || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadBranches = async () => {
    try {
      const { data, error } = await supabase
        .from("filiais" as any)
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setBranches((data as unknown as Branch[]) || []);
    } catch (e) {
      console.error("Error loading branches:", e);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Monta objeto para INSERT/UPDATE
  const buildSubmitData = () => {
    // Converte filial_id “NONE” para null/”” conforme necessário
    const filialIdToSave =
      !formData.filial_id || formData.filial_id === NONE ? null : formData.filial_id;

    const submitData: Record<string, any> = {
      name: formData.name,
      supplier_id: formData.supplier_id || null,
      category_id: formData.category_id || null,
      closing_day: formData.closing_day ? parseInt(formData.closing_day) : null,
      due_day: parseInt(formData.due_day),
      expected_amount: formData.expected_amount,
      open_ended: formData.open_ended,
      end_date: formData.end_date || null,
      notes: formData.notes || null,
    };

    // Tentamos incluir filial_id. Se a coluna não existir no banco,
    // o bloco try/catch do submit trata e refaz sem ela.
    if (filialIdToSave) {
      submitData.filial_id = filialIdToSave;
    } else {
      // Se não há seleção manual, mas o fornecedor tem filial, herdamos
      if (selectedSupplier?.filial_id) {
        submitData.filial_id = selectedSupplier.filial_id;
      }
    }

    return submitData;
  };

  const submitWithRetryIfNoFilialColumn = async (
    table: "recurring_bills",
    action: "insert" | "update",
    payload: Record<string, any>,
    id?: string
  ) => {
    // 1ª tentativa: com filial_id (se existir no payload)
    let res;
    if (action === "insert") {
      res = await supabase.from(table as any).insert([payload]);
    } else {
      res = await supabase.from(table as any).update(payload).eq("id", id);
    }

    // Se deu erro de coluna inexistente, remove filial_id e tenta de novo:
    const msg = res.error?.message || "";
    const isUnknownColumn =
      res.error?.code === "42703" || /column .*filial_id.* does not exist/i.test(msg);

    if (isUnknownColumn) {
      const { filial_id, ...payloadWithoutFilial } = payload;
      if (action === "insert") {
        res = await supabase.from(table as any).insert([payloadWithoutFilial]);
      } else {
        res = await supabase.from(table as any).update(payloadWithoutFilial).eq("id", id);
      }

      if (!res.error) {
        toast({
          title: "Aviso",
          description:
            "A coluna 'filial_id' não existe em recurring_bills. Salvei sem esse campo. (Se quiser persistir a filial aqui, preciso criar a coluna no banco.)",
        });
      }
    }

    return res;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.due_day || !formData.expected_amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const submitData = buildSubmitData();

      let result;
      if (bill) {
        result = await submitWithRetryIfNoFilialColumn(
          "recurring_bills",
          "update",
          submitData,
          bill.id
        );
      } else {
        result = await submitWithRetryIfNoFilialColumn("recurring_bills", "insert", submitData);
      }

      if (result.error) throw result.error;

      onSuccess();
    } catch (error: any) {
      console.error("Error saving recurring bill:", error);
      toast({
        title: "Erro",
        description: error?.message || "Erro ao salvar conta recorrente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filialSelectValue = formData.filial_id ? formData.filial_id : NONE;

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Conta *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ex: Equatorial Energia"
                  required
                />
              </div>

              {/* Fornecedor */}
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select
                  value={formData.supplier_id || undefined}
                  onValueChange={(value) => handleInputChange("supplier_id", value || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filial (selecionável) */}
              <div className="space-y-2">
                <Label htmlFor="filial_id">Filial</Label>
                <Select
                  value={filialSelectValue}
                  onValueChange={(v) =>
                    handleInputChange("filial_id", v === NONE ? "" : (v as string))
                  }
                >
                  <SelectTrigger id="filial_id">
                    <SelectValue placeholder="Selecione a filial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem filial</SelectItem>
                    {branches.map((f) => (
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
                  onValueChange={(value) => handleInputChange("category_id", value || "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Valor esperado */}
              <div className="space-y-2">
                <Label htmlFor="expected_amount">Valor Esperado *</Label>
                <CurrencyInput
                  value={formData.expected_amount || undefined}
                  onValueChange={(value) => handleInputChange("expected_amount", value || 0)}
                  placeholder="R$ 0,00"
                />
              </div>

              {/* Fechamento */}
              <div className="space-y-2">
                <Label htmlFor="closing_day">Dia do Fechamento</Label>
                <Input
                  id="closing_day"
                  type="number"
                  min={1}
                  max={31}
                  value={formData.closing_day}
                  onChange={(e) => handleInputChange("closing_day", e.target.value)}
                  placeholder="Ex: 25"
                />
              </div>

              {/* Vencimento */}
              <div className="space-y-2">
                <Label htmlFor="due_day">Dia do Vencimento *</Label>
                <Input
                  id="due_day"
                  type="number"
                  min={1}
                  max={31}
                  value={formData.due_day}
                  onChange={(e) => handleInputChange("due_day", e.target.value)}
                  placeholder="Ex: 4"
                  required
                />
              </div>
            </div>

            {/* Contínua / Data final / Observações */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="open_ended"
                  checked={formData.open_ended}
                  onCheckedChange={(checked) =>
                    handleInputChange("open_ended", Boolean(checked))
                  }
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
                    onChange={(e) => handleInputChange("end_date", e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={3}
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
  );
};
