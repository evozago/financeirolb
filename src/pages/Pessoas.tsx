import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

/**
 * Pessoas.tsx — substituição total
 * - Carrega pessoas com seus papéis (via RPC get_pessoas_with_papeis)
 * - Fallback: usa search_entidades_pessoas e PREENCHE p.papeis com base em p.categorias
 * - Filtro corrige o problema: considera p.papeis OU p.categorias
 * - Busca por nome (searchTerm) e filtros por Tipo (PF/PJ) e Categoria/Papel
 */

type UUID = string;

type PessoaBase = {
  id: UUID;
  nome?: string | null;
  nome_razao_social?: string | null;
  cpf_cnpj?: string | null;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  ativo?: boolean | null;
  tipo_pessoa?: "PF" | "PJ" | null;
  // Em algumas respostas a API retorna 'categorias' (array textual)
  categorias?: string[] | null;
  // Em RPC principal esperamos 'papeis' (array textual)
  papeis?: string[] | null;
};

type Pessoa = Required<Pick<PessoaBase, "id">> &
  PessoaBase & {
    nome: string; // normalizado
    papeis: string[]; // garantido
  };

export default function Pessoas() {
  const [loading, setLoading] = React.useState(false);
  const [pessoas, setPessoas] = React.useState<Pessoa[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterTipo, setFilterTipo] = React.useState<"all" | "PF" | "PJ">("all");
  const [filterCategoria, setFilterCategoria] = React.useState<string>("all");

  // Carrega pessoas com papéis
  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1) Tenta a RPC que já retorna papeis agregados
      const rpc = await supabase.rpc("get_pessoas_with_papeis", {
        p_search: searchTerm || null,
        p_limit: 1000,
        p_offset: 0,
      });

      if (!rpc.error && Array.isArray(rpc.data)) {
        const list = (rpc.data as PessoaBase[]).map((p) => ({
          ...p,
          nome: (p.nome_razao_social || p.nome || "").toString(),
          papeis: (Array.isArray(p.papeis) ? p.papeis : []) as string[],
        })) as Pessoa[];
        setPessoas(list);
        setLoading(false);
        return;
      }

      // 2) Fallback: search_entidades_pessoas
      const fb = await supabase.rpc("search_entidades_pessoas", {
        p_search: searchTerm || null,
        p_limit: 1000,
        p_offset: 0,
      });

      if (fb.error) {
        throw fb.error;
      }

      const list = (fb.data as PessoaBase[]).map((p) => ({
        ...p,
        nome: (p.nome_razao_social || p.nome || "").toString(),
        // 🔧 GUARANTE: se não vier 'papeis', usa 'categorias' para o filtro funcionar
        papeis: Array.isArray(p.papeis)
          ? (p.papeis as string[])
          : Array.isArray(p.categorias)
          ? (p.categorias as string[])
          : [],
      })) as Pessoa[];

      setPessoas(list);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao carregar pessoas");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filtro corrigido: usa p.papeis || p.categorias (já normalizado no load)
  const filteredPessoas = React.useMemo(() => {
    return pessoas.filter((p) => {
      const matchesTipo = filterTipo === "all" || (p.tipo_pessoa || "PF") === filterTipo;

      const nomesPapeis = Array.isArray(p.papeis) && p.papeis.length > 0
        ? p.papeis
        : Array.isArray(p.categorias)
        ? p.categorias!
        : [];

      if (filterCategoria === "all") {
        return matchesTipo;
      }

      const fq = filterCategoria.toLowerCase();
      const hit = nomesPapeis.some((n) => {
        const s = (n || "").toLowerCase();
        // cobre vendedor/vendedora/vendedor(a)
        if (fq === "vendedor" || fq === "vendedora") {
          return s === "vendedor" || s === "vendedora" || s.startsWith("vendedor");
        }
        return s.includes(fq);
      });

      return matchesTipo && hit;
    });
  }, [pessoas, filterTipo, filterCategoria]);

  // UI de filtros
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pessoas</CardTitle>
          <CardDescription>Gerencie o cadastro e filtre por tipo e papel/categoria.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="search">Buscar por nome</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Digite o nome…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void loadData();
                  }}
                />
                <Button onClick={() => void loadData()} disabled={loading}>
                  Buscar
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Tipo (PF/PJ)</Label>
              <Select value={filterTipo} onValueChange={(v: "all" | "PF" | "PJ") => setFilterTipo(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Categoria/Papel</Label>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {/* ajuste a lista conforme seu catálogo; mantive os mais comuns */}
                  <SelectItem value="vendedora">Vendedora</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="funcionaria">Funcionária</SelectItem>
                  <SelectItem value="funcionario">Funcionário</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="fornecedor">Fornecedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2">
            <div className="text-sm text-muted-foreground">
              {loading ? "Carregando…" : `${filteredPessoas.length} registro(s)`}
            </div>
          </div>

          {/* Lista */}
          <div className="space-y-3">
            {filteredPessoas.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredPessoas.map((p) => (
                  <div key={p.id} className="border rounded-xl p-4">
                    <div className="font-medium">{p.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.tipo_pessoa || "PF"} · {p.cpf_cnpj || p.cpf || "—"}
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="font-medium">Papéis: </span>
                      {Array.isArray(p.papeis) && p.papeis.length > 0
                        ? p.papeis.join(", ")
                        : Array.isArray(p.categorias) && p.categorias!.length > 0
                        ? p.categorias!.join(", ")
                        : "—"}
                    </div>
                    {(p.email || p.telefone) && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {p.email ? `Email: ${p.email}` : ""} {p.telefone ? ` · Tel: ${p.telefone}` : ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ações adicionais poderiam entrar aqui (editar, abrir modal, etc.) */}
        </CardContent>
      </Card>
    </div>
  );
}
