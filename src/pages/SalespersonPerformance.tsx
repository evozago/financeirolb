// src/pages/SalespersonPerformance.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { listActiveSalespeople, Seller } from "@/lib/salespeople";

type Venda = { id: string; total: number; criado_em: string; vendedor_id: string };

export default function SalespersonPerformance() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [sales, setSales] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await listActiveSalespeople();
      if (error) { setErr(error.message); return; }
      setSellers(data ?? []);
      if (data && data.length) setSelected(data[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setErr(null);
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("vendas")
        .select("id, total, criado_em, vendedor_id")
        .eq("vendedor_id", selected)
        .order("criado_em", { ascending: false });

      if (error) { setErr(error.message); setSales([]); }
      else setSales((data ?? []) as Venda[]);
      setLoading(false);
    })();
  }, [selected]);

  const total = useMemo(
    () => sales.reduce((acc, v) => acc + (Number(v.total) || 0), 0),
    [sales]
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Desempenho por Vendedora(o)</h1>

      <div className="flex gap-2 items-center">
        <select
          className="border rounded px-2 py-1"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>{s.nome}</option>
          ))}
        </select>
        <div className="text-sm text-gray-600">
          {loading ? "Carregando..." : `Vendas: ${sales.length} • Total: R$ ${total.toFixed(2)}`}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">#</th>
            <th className="py-2">Data</th>
            <th className="py-2">Total (R$)</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((v) => (
            <tr key={v.id} className="border-b">
              <td className="py-2">{v.id}</td>
              <td className="py-2">{new Date(v.criado_em).toLocaleString()}</td>
              <td className="py-2">{Number(v.total).toFixed(2)}</td>
            </tr>
          ))}
          {!loading && sales.length === 0 && (
            <tr><td colSpan={3} className="py-6 text-center text-gray-500">Sem vendas para esta vendedora(o).</td></tr>
          )}
        </tbody>
      </table>

      {err && <div className="text-sm text-red-600">{err}</div>}
    </div>
  );
}

