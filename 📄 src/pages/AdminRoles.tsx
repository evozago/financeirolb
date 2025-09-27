import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// inicializa o supabase client (usa variáveis de ambiente .env)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type Entidade = {
  id: string;
  nome_razao_social: string;
  cpf_cnpj_normalizado: string | null;
};

type PapelAtivo = {
  papel: string;
};

export default function AdminRoles() {
  const [loading, setLoading] = useState(false);
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [sel, setSel] = useState<Entidade | null>(null);
  const [ativos, setAtivos] = useState<PapelAtivo[]>([]);
  const [novoPapel, setNovoPapel] = useState("");

  // carrega primeiras entidades
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("entidades_corporativas")
        .select("id,nome_razao_social,cpf_cnpj_normalizado")
        .order("nome_razao_social", { ascending: true })
        .limit(50);

      if (!error) setEntidades(data || []);
      setLoading(false);
    })();
  }, []);

  // carregar papéis ativos da entidade selecionada
  async function loadAtivos(eid: string) {
    setLoading(true);

    // usa RPC se existir
    const { data, error } = await supabase.rpc("rpc_papeis_ativos_da_entidade", {
      _entidade: eid,
    });

    if (!error && data) {
      setAtivos(data as PapelAtivo[]);
    } else {
      // fallback: SELECT direto
      const { data: rows } = await supabase
        .from("entidade_papeis")
        .select("papeis(nome)")
        .eq("entidade_id", eid)
        .eq("ativo", true);

      setAtivos((rows || []).map((r: any) => ({ papel: r.papeis?.nome })));
    }

    setLoading(false);
  }

  async function handleSelect(e: Entidade) {
    setSel(e);
    await loadAtivos(e.id);
  }

  // adicionar ou reativar papel
  async function addPapel(nome: string) {
    if (!sel || !nome) return;
    setLoading(true);

    const { error } = await supabase.rpc("upsert_entidade_papel", {
      _entidade: sel.id,
      _papel_nome: nome,
    });

    if (error) console.error("Erro ao adicionar papel:", error);

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

    if (error) console.error("Erro ao remover papel:", error);

    await loadAtivos(sel.id);
    setLoading(false);
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Gestão de Papéis</h1>

      {/* Lista de entidades */}
      <section className="mb-8">
        <h2 className="font-medium mb-2">1) Selecionar Entidade</h2>
        {loading && entidades.length === 0 ? (
          <p>Carregando...</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-auto border rounded p-3">
            {entidades.map((e) => (
              <li key={e.id}>
                <button
                  className={`w-full text-left p-2 rounded ${
                    sel?.id === e.id ? "bg-blue-100" : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleSelect(e)}
                >
                  <span className="font-medium">{e.nome_razao_social}</span>{" "}
                  <span className="text-xs text-gray-500">
                    {e.cpf_cnpj_normalizado || "sem doc"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Papéis ativos */}
      {sel && (
        <section className="mb-8">
          <h2 className="font-medium mb-2">
            2) Papéis ativos de {sel.nome_razao_social}
          </h2>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <ul className="space-y-2">
              {ativos.length === 0 && (
                <li className="text-gray-500">Nenhum papel ativo.</li>
              )}
              {ativos.map((r) => (
                <li
                  key={r.papel}
                  className="flex justify-between items-center border rounded p-2"
                >
                  <span>{r.papel}</span>
                  <button
                    onClick={() => removePapel(r.papel)}
                    className="text-red-600 hover:underline"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Adicionar papel */}
      {sel && (
        <section>
          <h2 className="font-medium mb-2">3) Adicionar Papel</h2>
          <div className="flex gap-2">
            <input
              type="text"
              className="border rounded px-3 py-2 flex-1"
              placeholder="Digite nome do papel (ex.: Vendedora)"
              value={novoPapel}
              onChange={(e) => setNovoPapel(e.target.value)}
            />
            <button
              disabled={!novoPapel}
              onClick={() => addPapel(novoPapel)}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
