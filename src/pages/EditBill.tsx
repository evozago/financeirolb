import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type Branch = { id: string; nome: string };

type Installment = {
  id: string;
  descricao: string;
  fornecedor: string | null;
  categoria: string | null;
  valor: number;
  data_vencimento: string; // yyyy-mm-dd
  data_emissao: string | null;
  observacoes: string | null;
  numero_parcela: number | null;
  total_parcelas: number | null;
  filial_id: string | null;
};

const brl = (v: number | string) => {
  const n = typeof v === "string" ? Number(v || 0) : v || 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    isFinite(n) ? n : 0
  );
};

export default function EditBill() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { id: routeId } = useParams(); // <-- pega do path /bills/:id/edit
  const installmentId = routeId ?? sp.get("id"); // fallback para ?id=

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [form, setForm] = useState<Installment | null>(null);

  const setField = <K extends keyof Installment>(key: K, value: Installment[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  // Carrega a parcela (ap_installments)
  useEffect(() => {
    (async () => {
      if (!installmentId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("ap_installments" as any)
          .select(
            [
              "id",
              "descricao",
              "fornecedor",
              "categoria",
              "valor",
              "data_vencimento",
              "data_emissao",
              "observacoes",
              "numero_parcela",
              "total_parcelas",
              "filial_id",
            ].join(",")
          )
          .eq("id", installmentId)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setForm(null);
        } else {
          // normaliza valores/strings
          const payload: Installment = {
            id: data.id,
            descricao: data.descricao ?? "",
            fornecedor: data.fornecedor ?? null,
            categoria: data.categoria ?? null,
            valor: Number(data.valor ?? 0),
            data_vencimento:
              (data.data_vencimento || new Date().toISOString().slice(0, 10)) as string,
            data_emissao: data.data_emissao,
            observacoes: data.observacoes ?? "",
            numero_parcela: data.numero_parcela ?? 1,
            total_parcelas: data.total_parcelas ?? 1,
            filial_id: data.filial_id ?? null,
          };
          setForm(payload);
        }
      } catch (err: any) {
        console.error("Erro carregando parcela:", err);
        alert("Erro ao carregar a conta: " + (err?.message ?? "desconhecido"));
      } finally {
        setLoading(false);
      }
    })();
  }, [installmentId]);

  // Carrega filiais
  useEffect(() => {
    (async () => {
      try {
        setLoadingBranches(true);
        const { data, error } = await supabase
          .from("filiais" as any)
          .select("id, nome")
          .eq("ativo", true)
          .order("nome", { ascending: true });

        if (error) throw error;
        setBranches((data || []) as Branch[]);
      } catch (err: any) {
        console.error("Erro carregando filiais:", err);
      } finally {
        setLoadingBranches(false);
      }
    })();
  }, []);

  const valorPorParcela = useMemo(() => {
    if (!form) return 0;
    const total = Number(form.valor || 0);
    const qtd = Number(form.total_parcelas || 1);
    return qtd > 0 ? total / qtd : total;
  }, [form?.valor, form?.total_parcelas]);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);

    try {
      // Monta payload compatível com ap_installments
      const payload = {
        descricao: form.descricao,
        fornecedor: form.fornecedor,
        categoria: form.categoria,
        valor: Number(form.valor || 0),
        data_vencimento: form.data_vencimento,
        observacoes: form.observacoes,
        numero_parcela: form.numero_parcela,
        total_parcelas: form.total_parcelas,
        filial_id: form.filial_id, // chave estrangeira para public.filiais(id)
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("ap_installments" as any)
        .update(payload)
        .eq("id", form.id);

      if (error) throw error;

      alert("Alterações salvas com sucesso!");
      navigate(-1);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar alterações: " + (err?.message ?? "desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form) return;
    if (!confirm("Você realmente deseja excluir esta conta?")) return;

    const { error } = await supabase
      .from("ap_installments" as any)
      .delete()
      .eq("id", form.id);

    if (error) {
      alert("Erro ao excluir: " + error.message);
      return;
    }

    alert("Conta excluída com sucesso!");
    navigate(-1);
  };

  // Estados de carregamento / ausências
  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Editar Conta</CardTitle>
          </CardHeader>
          <CardContent>Carregando…</CardContent>
        </Card>
      </div>
    );
  }

  if (!installmentId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Editar Conta</CardTitle>
          </CardHeader>
        </Card>
        <div className="mt-4">ID da conta não informado.</div>
        <div className="mt-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Editar Conta</CardTitle>
          </CardHeader>
          <CardContent>Conta não encontrada.</CardContent>
        </Card>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Linha: Descrição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={form.descricao}
                onChange={(e) => setField("descricao", e.target.value)}
                placeholder="Ex.: ALUGUEL T9"
              />
            </div>
          </div>

          {/* Linha: Fornecedor / Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input
                id="fornecedor"
                value={form.fornecedor ?? ""}
                onChange={(e) => setField("fornecedor", e.target.value || null)}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                value={form.categoria ?? ""}
                onChange={(e) => setField("categoria", e.target.value || null)}
                placeholder="Categoria (texto)"
              />
            </div>
          </div>

          {/* Linha: Filial / Valor total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="filial_id">Filial</Label>
              <Select
                value={form.filial_id ?? ""}
                onValueChange={(v) => setField("filial_id", v === "" ? null : v)}
                disabled={loadingBranches}
              >
                <SelectTrigger id="filial_id" className="w-full">
                  <SelectValue
                    placeholder={loadingBranches ? "Carregando..." : "Selecione a filial"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem filial</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_total">Valor Total *</Label>
              <Input
                id="valor_total"
                type="number"
                inputMode="decimal"
                value={form.valor}
                onChange={(e) => setField("valor", Number(e.target.value || 0))}
              />
              <div className="text-xs text-muted-foreground">
                Valor por parcela: {brl(valorPorParcela)}
              </div>
            </div>
          </div>

          {/* Linha: Quantidade de parcelas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Quantidade de Parcelas *</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setField(
                      "total_parcelas",
                      Math.max(1, Number(form.total_parcelas || 1) - 1) as any
                    )
                  }
                >
                  –
                </Button>
                <Input
                  className="text-center"
                  value={Number(form.total_parcelas || 1)}
                  onChange={(e) =>
                    setField("total_parcelas", Math.max(1, Number(e.target.value || 1)) as any)
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setField("total_parcelas", (Number(form.total_parcelas || 1) + 1) as any)
                  }
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* Linha: Datas */}
          <div className="space-y-2">
            <Label htmlFor="data_vencimento">Datas de Vencimento das Parcelas</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primeira_parcela">1ª Parcela</Label>
                <Input
                  id="primeira_parcela"
                  type="date"
                  value={form.data_vencimento?.slice(0, 10)}
                  onChange={(e) => setField("data_vencimento", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              rows={4}
              value={form.observacoes ?? ""}
              onChange={(e) => setField("observacoes", e.target.value)}
              placeholder="Lançado automaticamente a partir de Conta Recorrente"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between pt-4">
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Excluir Conta
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
