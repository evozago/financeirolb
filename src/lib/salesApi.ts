import type { UUID } from "./types";

export async function apiAssignVendedora(pessoaId: UUID, entidadeId: UUID) {
  const res = await fetch("/functions/v1/sales-assign-vendedora", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pessoaId, entidadeId }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || `Erro HTTP ${res.status}`);
  }
  return true;
}

export async function apiSetVendedoraConfig(opts: {
  pessoaId: UUID; entidadeId: UUID; ativa?: boolean; metas?: any; preferencia?: any;
}) {
  const res = await fetch("/functions/v1/sales-set-vendedora-config", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || `Erro HTTP ${res.status}`);
  }
  return true;
}
