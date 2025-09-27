// pages/admin/roles.tsx
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// sugere ler de process.env.NEXT_PUBLIC_*
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Entidade = { id: string; nome_razao_social: string; cpf_cnpj_normalizado: string | null };
type Papel = { id: string; nome: string };
type PapelAtivo = { papel: string };

export default function RolesPage() {
  const [loading, setLoading] = useState(false);
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Entidade | null>(null);
  const [ativos, setAtivos] = useState<PapelAtivo[]>([]);
  const [novoPapel, setNovoPapel] = useState("");

  // carrega catálogo e algumas entidades
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: cat } = await supabase
        .from("papeis")
        .select("id,nome")
        .order("nome", { ascending: true });
      setPapeis(cat || []);
      const { data: ents } = await supabase
        .from("entidades_corporativas")
        .select("id,nome_razao_social,cpf_cnpj_normalizado")
        .order("nome_razao_social", { ascending: true })
        .limit(50);
      setEntidades(ents || []);
      setLoading(false);
    })();
  }, []);

  // busca entidades por texto
  const filtered = useMemo(() => {
    if (!q) return entidades;
    const m = q.toLowerCase();
    return entidades.filter(
      (e) =>
        e.nome_razao_social.toLowerCase().includes(m) ||
        (e.cpf_cnpj_normalizado || "").includes(q.replace(/\D/g, ""))
    );
  }, [q, entidades]);

  // carregar papeis ATIVOS da entidade selecionada
  async function loadAtivos(eid: string) {
    setLoading(true);
    const { data, error } = await supabase.rpc("rpc_papeis_ativos_da_entidade", { _entidade: eid });
    // fallback caso RPC não exista: usa SELECT direto
    let rows = data as { papel: string }[] | null;
    if (error || !rows) {
      const { data: selRows } = await supabase
        .from("entidade_papeis")
        .select("papeis(nome)")
        .eq("ativo", true)
        .eq("entidade_id", eid);
      rows = (selRows || []).map((r: any) => ({ papel: r.papeis?.nome }));
    }
    setAtivos(rows || []);
    setLoading(false);
  }

  // selecionar entidade
  async function handleSelect(e: Entidade) {
    setSel(e);
    await loadAtivos(e.id);
  }

  // adicionar/reativar papel (RPC upsert_entidade_papel)
  async function addPapel(nome: string) {
    if (!sel) return;
    setLoading(true);
    const { error } = await supabase.rpc("upsert_entidade_papel", {
      _entidade: sel.id,
      _papel_nome: nome,
    });
    if (error) {
      // se a unique ainda for absoluta, tentar reativar via PATCH
      console.error("Erro upsert papel:", error);
    }
    await loadAtivos(sel.id);
    setLoading(false);
  }

  // desativar papel
  async function removePapel(nome: string) {
    if (!sel) return;
    setLoading(true);
    const { error } = await supabase.rpc("desativar_entidade_papel", {
      _entidade: sel.id,
      _papel_nome: nome,
    });
    if (error) console.error("Erro desativar papel:", error);
    await loadAtivos(sel.id);
    setLoading(false);
  }

  return (
    <main className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Gestão de Papéis</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* coluna 1: busca entidade */}
        <section className="border rounded p-4">
          <h2 className="font-medium mb-2">1) Buscar pessoa/empresa</h2>
          <input
            className="w-full border rounded px-3 py-2 mb-3"
            placeholder="Nome ou CPF/CNPJ"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="max-h-80 overflow-auto space-y-2">
            {filtered.map((e) => (
              <button
                key={e.id}
                className={`w-full text-left border rounded px-3 py-2 ${
                  sel?.id === e.id ? "bg-blue-50 border-blue-400" : ""
                }`}
                onClick={() => handleSelect(e)}
              >
                <div className="font-medium">{e.nome_razao_social}</div>
                <div className="text-xs text-gray-500">
                  {e.cpf_cnpj_normalizado || "sem doc"}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* coluna 2: papéis ativos */}
        <section className="border rounded p-4">
          <h2 className="font-medium mb-2">2) Papéis ativos</h2>
          {!sel ? (
            <p className="text-gray-500">Selecione uma entidade…</p>
          ) : loading ? (
            <p>Carregando…</p>
          ) : (
            <ul className="space-y-2">
              {ativos.length === 0 && <li className="text-gray-500">Sem papéis ativos.</li>}
              {ativos.map((r) => (
                <li key={r.papel} className="flex items-center justify-between border rounded px-3 py-2">
                  <span>{r.papel}</span>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => removePapel(r.papel)}
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* coluna 3: adicionar papel */}
        <section className="border rounded p-4">
          <h2 className="font-medium mb-2">3) Adicionar papel</h2>
          <div className="space-y-2">
            {/* catálogo existente */}
            <select
              className="w-full border rounded px-3 py-2"
              onChange={(e) => setNovoPapel(e.target.value)}
              value={novoPapel}
            >
              <option value="">— Selecionar —</option>
              {papeis.map((p) => (
                <option key={p.id} value={p.nome}>
                  {p.nome}
                </option>
              ))}
            </select>
            <button
              disabled={!sel || !novoPapel}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              onClick={() => addPapel(novoPapel)}
            >
              Adicionar/Ativar
            </button>

            <hr className="my-3" />
            {/* criar papel por nome, se quiser algo novo */}
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Ou digite um novo papel (ex.: Vendedora)"
              onChange={(e) => setNovoPapel(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Dica: nomes iguais com/sem acento serão tratados como um (via normalização no catálogo).
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
