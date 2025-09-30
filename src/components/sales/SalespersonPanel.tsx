// src/components/sales/SalespersonPanel.tsx
import React from "react";
import { listSellers, searchSellersByName } from "@/services/sellers";
import { supabase } from "@/integrations/supabase/client";

/**
 * Painel simples para listar "vendedoras(es)" a partir de ENTIDADES
 * usando a VIEW ec_roles_agg no Supabase.
 *
 * - Mostra a lista (deduplicada por id, 1 linha por entidade na ec_roles_agg)
 * - Campo de busca por nome (opcional)
 * - (Opcional) Botão para recarregar
 *
 * Observação: Este painel NÃO atribui papel (isso é feito em outras telas).
 * Aqui focamos em listar de forma estável, sem depender de FK automático do PostgREST.
 */

type EcRoleAgg = {
  id: string;
  nome_razao_social: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean | null;
  tipo_pessoa: string | null;
  papeis: string[] | null; // ["vendedora", "vendedor", ...]
};

export default function SalespersonPanel() {
  const [items, setItems] = React.useState<EcRoleAgg[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const data = await listSellers();
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao carregar vendedoras(es).");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!search.trim()) {
      loadData();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchSellersByName(search.trim());
      setItems(data);
    } catch (e: any) {
      setError(e?.message ?? "Erro ao buscar.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    // só para garantir que o client está ok
    if (!supabase) {
      setError("Cliente Supabase não inicializado.");
      setLoading(false);
      return;
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-lg font-semibold">Vendedoras(es)</div>
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-2 py-1"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={handleSearch}
            className="px-3 py-1 rounded bg-black text-white"
          >
            Buscar
          </button>
          <button
            onClick={loadData}
            className="px-3 py-1 rounded border"
          >
            Recarregar
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Carregando...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="border rounded">
          <table className="w-full border-collapse">
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
              {items.length === 0 ? (
                <tr>
                  <td className="py-6 px-3 text-center text-gray-500" colSpan={5}>
                    Nenhuma vendedora(o) encontrada(o).
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="py-2 px-3">{row.nome_razao_social}</td>
                    <td className="py-2 px-3">
                      {(row.papeis ?? []).join(", ")}
                    </td>
                    <td className="py-2 px-3">{row.email ?? "-"}</td>
                    <td className="py-2 px-3">{row.telefone ?? "-"}</td>
                    <td className="py-2 px-3">
                      {row.ativo ? (
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
