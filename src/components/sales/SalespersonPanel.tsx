// src/components/SalespersonPanel.tsx
import { useEffect, useMemo, useState } from "react";
import {
  assignSalespersonRole,
  listActiveSalespeople,
  Seller,
} from "@/lib/salespeople";

export default function SalespersonPanel() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedPessoaId, setSelectedPessoaId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function loadSellers() {
    const { data, error } = await listActiveSalespeople();
    if (error) throw error;
    setSellers(data ?? []);
  }

  useEffect(() => {
    loadSellers().catch((e) =>
      setMsg({ type: "err", text: e?.message ?? "Erro ao carregar vendedoras(es)." })
    );
  }, []);

  const sorted = useMemo(
    () => [...sellers].sort((a, b) => a.nome.localeCompare(b.nome)),
    [sellers]
  );

  async function handleAssign() {
    setMsg(null);
    if (!selectedPessoaId) {
      setMsg({ type: "err", text: "Cole o UUID da pessoa (pessoas.id)." });
      return;
    }
    try {
      setBusy(true);
      await assignSalespersonRole(selectedPessoaId.trim());
      await loadSellers();
      setSelectedPessoaId("");
      setMsg({ type: "ok", text: "Papel de vendedora/vendedor atribuído com sucesso." });
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message ?? "Falha ao atribuir papel." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="font-semibold text-lg">Vendedoras(es)</div>

      <ul className="border rounded p-3 max-h-60 overflow-auto">
        {sorted.length === 0 ? (
          <li className="text-sm text-gray-500">Nenhum cadastro com papel de vendedora/vendedor.</li>
        ) : (
          sorted.map((s) => (
            <li key={s.id} className="py-1">{s.nome}</li>
          ))
        )}
      </ul>

      <div className="flex gap-2 items-center">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Cole o UUID da pessoa (pessoas.id)"
          value={selectedPessoaId}
          onChange={(e) => setSelectedPessoaId(e.target.value)}
        />
        <button
          onClick={handleAssign}
          disabled={busy}
          className="px-3 py-1 rounded bg-black text-white disabled:opacity-60"
        >
          {busy ? "Salvando..." : "Adicionar como Vendedora(o)"}
        </button>
      </div>

      {msg && (
        <div className={msg.type === "ok" ? "text-sm text-green-700" : "text-sm text-red-600"}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

