// src/lib/salespeople.ts
import { supabase } from "@/lib/supabaseClient";

export type Seller = { id: string; nome: string };

type DbPessoa = {
  id: string;
  nome: string;
  entidade_papeis?: { ativo: boolean; papeis: { nome: string } }[];
};

// Lista vendedoras(es) com papel ativo (vendedora/vendedor)
export async function listActiveSalespeople(): Promise<{ data: Seller[]; error: any }> {
  const { data, error } = await supabase
    .from("pessoas")
    .select(`
      id, nome,
      entidade_papeis!inner(
        ativo,
        papeis!inner(nome)
      )
    `)
    .eq("entidade_papeis.ativo", true)
    .in("entidade_papeis.papeis.nome", ["vendedora", "vendedor"])
    .order("nome");

  if (error) return { data: [], error };
  const mapped = (data as DbPessoa[] | null)?.map(p => ({ id: p.id, nome: p.nome })) ?? [];
  return { data: mapped, error: null };
}

// pega o id do papel (prioriza "vendedora", cai para "vendedor")
async function getSalesRoleId(): Promise<string> {
  const { data, error } = await supabase
    .from("papeis")
    .select("id, nome")
    .in("nome", ["vendedora", "vendedor"])
    .order("nome", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) throw new Error("Papel de vendedora/vendedor não encontrado em 'papeis'.");
  return data.id;
}

// atribui (ou reativa) o papel de vendedora/vendedor
export async function assignSalespersonRole(pessoaId: string): Promise<void> {
  const papelId = await getSalesRoleId();
  const { error } = await supabase
    .from("entidade_papeis")
    .upsert(
      { entidade_id: pessoaId, papel_id: papelId, ativo: true },
      { onConflict: "entidade_id,papel_id,ativo" }
    );

  if (error) throw error;
}

// desativa o papel (mantém histórico)
export async function deactivateSalespersonRole(pessoaId: string): Promise<void> {
  const papelId = await getSalesRoleId();
  const { error } = await supabase
    .from("entidade_papeis")
    .update({ ativo: false })
    .eq("entidade_id", pessoaId)
    .eq("papel_id", papelId)
    .eq("ativo", true);

  if (error) throw error;
}
