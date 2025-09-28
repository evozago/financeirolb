import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * NOVO Painel de Vendedoras
 * - Lista por view v_vendedoras (Pessoa + Papel + Config por entidade)
 * - Não cria Pessoa aqui. Apenas vincula Pessoa existente como Vendedora.
 * - Salva "ativa", "metas" e "preferencia" em vendedora_config.
 * - Mantém compatibilidade com window.selectedEntity e evento saveAllSalesData.
 */

declare global {
  interface Window {
    selectedEntity?: string;
  }
}

type UUID = string;

type Pessoa = {
  id: UUID;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
};

type VendedoraView = {
  pessoa_id: UUID;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  pessoa_ativa: boolean;
  entidade_id: UUID;
  vendedora_ativa: boolean;
  metas: any | null;
  preferencia: any | null;
};

export function SalespersonPanel() {
  const [lista, setLista] = React.useState<VendedoraView[]>([]);
  const [loading, setLoading] = React.useState(false);

  // busca/vinculação de Pessoa existente
  const [busca, setBusca] = React.useState("");
  const [pessoas, setPessoas] = React.useState<Pessoa[]>([]);
  const [pessoaSelecionada, setPessoaSelecionada] = React.useState<UUID | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // edição de config por pessoa
  const [edits, setEdits] = React.useState<Record<
    UUID,
    { ativa: boolean; metas: string; preferencia: string }
  >>({});

  // ————— Helpers —————

  async function getVendedoraPapelId(): Promise<UUID> {
    const { data, error } = await supabase
      .from("papeis")
      .select("id, nome")
      .ilike("nome", "vendedor%")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Papel Vendedora/Vendedor não encontrado em 'papeis'.");
    return data.id as UUID;
  }

  async function carregarLista() {
    const entidadeId = window.selectedEntity;
    if (!entidadeId) {
      setLista([]);
      return;
    }
    const { data, error } = await supabase
      .from("v_vendedoras")
      .select("*")
      .eq("entidade_id", entidadeId)
      .order("nome", { ascending: true });

    if (error) {
      toast.error(error.message || "Erro ao carregar vendedoras");
      return;
    }
    const arr = (data || []) as VendedoraView[];
    setLista(arr);

    // preparar estado de edição
    const next: typeof edits = {};
    arr.forEach((v) => {
      next[v.pessoa_id] = {
        ativa: !!v.vendedora_ativa,
        metas: v.metas ? JSON.stringify(v.metas, null, 2) : "",
        preferencia: v.preferencia ? JSON.stringify(v.preferencia, null, 2) : "",
      };
    });
    setEdits(next);
  }

  async function carregarPessoas() {
    const q = busca?.trim();
    let sel = supabase.from("pessoas")
      .select("id, nome, cpf, email, telefone, ativo")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (q) sel = sel.ilike("nome", `%${q}%`);

    const { data, error } = await sel;
    if (error) {
      toast.error(error.message || "Erro ao buscar pessoas");
      return;
    }
    setPessoas((data || []) as Pessoa[]);
  }

  // ————— Ações —————

  async function vincularPessoaComoVendedora() {
    const entidadeId = window.selectedEntity;
    if (!entidadeId) {
      toast.error("Selecione uma entidade antes de vincular");
      return;
    }
    if (!pessoaSelecionada) {
      toast.error("Selecione uma pessoa do cadastro");
      return;
    }
    setLoading(true);
    try {
      const papelId = await getVendedoraPapelId();

      // 1) upsert em papeis_pessoa (único por pessoa/papel/entidade)
      {
        const { error } = await supabase.from("papeis_pessoa").upsert(
          [{
            pessoa_id: pessoaSelecionada,
            papel_id: papelId,
            entidade_id: entidadeId,
            ativo: true,
          }],
          { onConflict: "pessoa_id,papel_id,entidade_id", ignoreDuplicates: false }
        );
        if (error) throw error;
      }

      // 2) garantir registro em vendedora_config
      {
        const { error } = await supabase.from("vendedora_config").upsert(
          [{ pessoa_id: pessoaSelecionada, entidade_id: entidadeId, ativa: true }],
          { onConflict: "pessoa_id,entidade_id", ignoreDuplicates: false }
        );
        if (error) throw error;
      }

      toast.success("Pessoa vinculada como vendedora.");
      setDialogOpen(false);
      setPessoaSelecionada(null);
      setBusca("");
      await carregarLista();
    } catch (e: any) {
      toast.error(e.message || "Erro ao vincular vendedora");
    } finally {
      setLoading(false);
    }
  }

  async function salvarConfig(pessoaId: UUID) {
    const entidadeId = window.selectedEntity;
    if (!entidadeId) {
      toast.error("Selecione uma entidade antes de salvar");
      return;
    }
    const row = edits[pessoaId];
    if (!row) return;

    setLoading(true);
    try {
      const metas = row.metas ? JSON.parse(row.metas) : null;
      const preferencia = row.preferencia ? JSON.parse(row.preferencia) : null;

      const { error } = await supabase.from("vendedora_config").upsert(
        [{
          pessoa_id: pessoaId,
          entidade_id: entidadeId,
          ativa: !!row.ativa,
          metas,
          preferencia,
        }],
        { onConflict: "pessoa_id,entidade_id", ignoreDuplicates: false }
      );
      if (error) throw error;

      toast.success("Configuração salva.");
      await carregarLista();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar configuração");
    } finally {
      setLoading(false);
    }
  }

  // compatibilidade: salvar tudo via evento global
  const saveAllData = React.useCallback(async () => {
    const entidadeId = window.selectedEntity;
    if (!entidadeId) {
      toast.error("Selecione uma entidade antes de salvar");
      return;
    }
    // salva todas as linhas em edição
    setLoading(true);
    try {
      const payloads = Object.entries(edits).map(([pessoaId, row]) => {
        let metas: any = null;
        let preferencia: any = null;
        try { metas = row.metas ? JSON.parse(row.metas) : null; } catch {}
        try { preferencia = row.preferencia ? JSON.parse(row.preferencia) : null; } catch {}
        return {
          pessoa_id: pessoaId,
          entidade_id: entidadeId,
          ativa: !!row.ativa,
          metas,
          preferencia,
        };
      });

      if (payloads.length > 0) {
        const { error } = await supabase.from("vendedora_config").upsert(
          payloads,
          { onConflict: "pessoa_id,entidade_id", ignoreDuplicates: false }
        );
        if (error) throw error;
      }

      toast.success("Dados salvos com sucesso!");
      await carregarLista();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao salvar dados");
    } finally {
      setLoading(false);
    }
  }, [edits]);

  // ————— Effects —————
  React.useEffect(() => {
    carregarLista();
  }, [window.selectedEntity]);

  React.useEffect(() => {
    carregarPessoas();
  }, [busca]);

  // Listener compatível com a página SalesManagement
  React.useEffect(() => {
    const handleSave = () => { void saveAllData(); };
    window.addEventListener("saveAllSalesData", handleSave);
    return () => window.removeEventListener("saveAllSalesData", handleSave);
  }, [saveAllData]);

  // ————— UI —————
  return (
    <div className="space-y-6">
      {/* Vincular Pessoa existente */}
      <Card>
        <CardHeader>
          <CardTitle>Vendedoras</CardTitle>
          <CardDescription>Vincule pessoas existentes e gerencie status/metas por entidade.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Vincular pessoa existente</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Vincular Pessoa como Vendedora</DialogTitle>
                <DialogDescription>Selecione uma pessoa já cadastrada.</DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <Label>Buscar por nome</Label>
                <Input
                  placeholder="Digite para buscar…"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />

                <div className="max-h-64 overflow-auto border rounded-md p-2">
                  {pessoas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma pessoa encontrada.</p>
                  ) : (
                    pessoas.map((p) => (
                      <label key={p.id} className="flex items-center gap-3 py-1 cursor-pointer">
                        <input
                          type="radio"
                          name="pessoa"
                          checked={pessoaSelecionada === p.id}
                          onChange={() => setPessoaSelecionada(p.id)}
                        />
                        <span className="text-sm">
                          {p.nome} {p.cpf ? `(${p.cpf})` : ""}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={vincularPessoaComoVendedora} disabled={loading}>
                  Vincular
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Lista da entidade atual */}
          <div className="space-y-3">
            {lista.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma vendedora vinculada para a entidade selecionada.</p>
            ) : (
              <div className="space-y-4">
                {lista.map((v) => {
                  const row = edits[v.pessoa_id] ?? { ativa: true, metas: "", preferencia: "" };
                  return (
                    <div key={`${v.pessoa_id}-${v.entidade_id}`} className="border rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{v.nome}</div>
                          <div className="text-xs text-muted-foreground">
                            Pessoa: {v.pessoa_id} · Entidade: {v.entidade_id}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Ativa</Label>
                          <Select
                            value={row.ativa ? "true" : "false"}
                            onValueChange={(val) =>
                              setEdits((s) => ({
                                ...s,
                                [v.pessoa_id]: { ...row, ativa: val === "true" },
                              }))
                            }
                          >
                            <SelectTrigger className="w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Ativa</SelectItem>
                              <SelectItem value="false">Inativa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label>Metas (JSON)</Label>
                          <Textarea
                            className="font-mono text-xs min-h-[120px]"
                            placeholder='Ex.: {"meta_mensal": 50000}'
                            value={row.metas}
                            onChange={(e) =>
                              setEdits((s) => ({ ...s, [v.pessoa_id]: { ...row, metas: e.target.value } }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Preferências (JSON)</Label>
                          <Textarea
                            className="font-mono text-xs min-h-[120px]"
                            placeholder='Ex.: {"ordem": "vendas_desc"}'
                            value={row.preferencia}
                            onChange={(e) =>
                              setEdits((s) => ({ ...s, [v.pessoa_id]: { ...row, preferencia: e.target.value } }))
                            }
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={() => salvarConfig(v.pessoa_id)} disabled={loading}>
                          <Save className="mr-2 h-4 w-4" /> Salvar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
