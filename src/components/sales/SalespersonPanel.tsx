// src/components/sales/SalespersonPanel.tsx
import React from "react";
import { listSellers, searchSellersByName } from "@/services/sellers";

type SellerRow = {
  id: string;
  nome_razao_social: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean | null;
  tipo_pessoa: string | null;
  papeis: string[] | null; // ex.: ["vendedora","Funcionario"]
};

export default function SalespersonPanel() {
  const [items, setItems] = React.useState<SellerRow[]>([]);
  const [filtered, setFiltered] = React.useState<SellerRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");

  async function loadAll() {
    setLoading(true);
    setErr(null);
    try {
      const data = await listSellers();
      setItems(data);
      setFiltered(q.trim()
        ? data.filter(r => r.nome_razao_social?.toLowerCase().includes(q.trim().toLowerCase()))
        : data
      );
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao carregar vendedoras(es).");
      setItems([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadAll(); }, []);

  async function onSearch() {
    if (!q.trim()) { loadAll(); return; }
    setLoading(true);
    setErr(null);
    try {
      const data = await searchSellersByName(q.trim());
      setItems(data);
      setFiltered(data);
    } catch (e: any) {
      setErr(e?.message ?? "Erro ao buscar.");
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Vendedoras(es)</h1>

        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 w-64"
            placeholder="Buscar por nome…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
          <button onClick={onSearch} className="px-3 py-1 rounded bg-black text-white">
            Buscar
          </button>
          <button onClick={loadAll} className="px-3 py-1 rounded border">
            Recarregar
          </button>
        </div>
      </header>

      {loading && <div className="text-sm text-gray-600">Carregando…</div>}
      {err && <div className="text-sm text-red-600">Erro: {err}</div>}

      {!loading && !err && (
        <div className="border rounded overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="py-2 px-3">Nome</th>
                <th className="py-2 px-3">Papéis</th>
                <th className="py-2 px-3">E-mail</th>
                <th className="py-2 px-3">Telefone</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className="py-6 px-3 text-center text-gray-500" colSpan={5}>
                    Nenhuma vendedora(o) encontrada(o).
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 px-3">{r.nome_razao_social}</td>
                    <td className="py-2 px-3">{(r.papeis ?? []).join(", ") || "-"}</td>
                    <td className="py-2 px-3">{r.email ?? "-"}</td>
                    <td className="py-2 px-3">{r.telefone ?? "-"}</td>
                    <td className="py-2 px-3">
                      {r.ativo ? (
                        <span className="text-green-700">Ativo</span>
                      ) : (
                        <span className="text-gray-600">Inativo</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
