import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecurringBill } from "@/types/payables";

interface Props {
  bill?: RecurringBill | null;
  onSuccess: () => void;
  onCancel: () => void;
}

type Branch = { id: string; nome: string };

export const RecurringBillForm: React.FC<Props> = ({ bill, onSuccess, onCancel }) => {
  const [name, setName] = useState(bill?.name || "");
  const [supplierId, setSupplierId] = useState(bill?.supplier_id || "");
  const [categoryId, setCategoryId] = useState(bill?.category_id || "");
  const [closingDay, setClosingDay] = useState(bill?.closing_day || "");
  const [dueDay, setDueDay] = useState(bill?.due_day || "");
  const [expectedAmount, setExpectedAmount] = useState(bill?.expected_amount || 0);
  const [notes, setNotes] = useState(bill?.notes || "");
  const [openEnded, setOpenEnded] = useState(bill?.open_ended ?? true);
  const [endDate, setEndDate] = useState(bill?.end_date || "");
  const [branchId, setBranchId] = useState(bill?.filial_id || ""); // campo novo

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuppliers();
    loadCategories();
    loadBranches();
  }, []);

  const loadSuppliers = async () => {
    const { data } = await supabase.from("fornecedores").select("id, nome").order("nome");
    if (data) setSuppliers(data);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from("categorias_produtos").select("id, nome").order("nome");
    if (data) setCategories(data);
  };

  const loadBranches = async () => {
    const { data } = await supabase.from("filiais").select("id, nome").order("nome");
    if (data) setBranches(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      supplier_id: supplierId || null,
      category_id: categoryId || null,
      closing_day: closingDay ? Number(closingDay) : null,
      due_day: dueDay ? Number(dueDay) : null,
      expected_amount: Number(expectedAmount),
      notes,
      open_ended: openEnded,
      end_date: endDate || null,
      filial_id: branchId || null, // grava filial
    };

    let error;
    if (bill?.id) {
      ({ error } = await supabase.from("recurring_bills").update(payload).eq("id", bill.id));
    } else {
      ({ error } = await supabase.from("recurring_bills").insert(payload));
    }

    setLoading(false);

    if (error) {
      alert("Erro ao salvar: " + error.message);
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome da Conta */}
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Conta *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      {/* Fornecedor / Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="supplier">Fornecedor</Label>
          <Select value={supplierId} onValueChange={(v) => setSupplierId(v)}>
            <SelectTrigger id="supplier">
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

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
            <SelectTrigger id="category">
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
      </div>

      {/* Campo novo: Filial */}
      <div className="space-y-2">
        <Label htmlFor="filial">Filial</Label>
        <Select value={branchId} onValueChange={(v) => setBranchId(v)}>
          <SelectTrigger id="filial">
            <SelectValue placeholder="Selecione uma filial" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Valor, Fechamento e Vencimento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="expected_amount">Valor Esperado *</Label>
          <Input
            id="expected_amount"
            type="number"
            value={expectedAmount}
            onChange={(e) => setExpectedAmount(parseFloat(e.target.value))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="closing_day">Dia do Fechamento</Label>
          <Input
            id="closing_day"
            type="number"
            value={closingDay}
            onChange={(e) => setClosingDay(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_day">Dia do Vencimento *</Label>
          <Input
            id="due_day"
            type="number"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações adicionais..."
        />
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};
