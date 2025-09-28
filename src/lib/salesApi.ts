// /src/lib/salesApi.ts
export type UUID = string;

async function postJSON(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* noop */ }
  if (!res.ok) throw new Error(data?.error || `Erro HTTP ${res.status}`);
  return data;
}

/** Vincula Pessoa existente como Vendedora para a entidade (sem criar pessoa nova) */
export async function apiAssignVendedora(pessoaId: UUID, entidadeId: UUID) {
  await postJSON("/functions/v1/sales-assign-vendedora", { pessoaId, entidadeId });
  return true;
}

/** Atualiza ativa/metas/preferência na vendedora_config (chave: pessoa_id+entidade_id) */
export async function apiSetVendedoraConfig(opts: {
  pessoaId: UUID; entidadeId: UUID;
  ativa?: boolean; metas?: any; preferencia?: any;
}) {
  await postJSON("/functions/v1/sales-set-vendedora-config", opts);
  return true;
}
