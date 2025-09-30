import { supabase } from "@/lib/supabaseClient";

export async function listActiveSalespeople() {
  return supabase
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
}

export async function assignSalespersonRole(pessoaId: string) {
  // Reativa/cria papel "vendedora" para a pessoa
  const { data: papel } = await supabase
    .from("papeis")
    .select("id")
    .in("nome", ["vendedora", "vendedor"]) // tenta vendedora; se não tiver, usa vendedor
    .order("nome", { ascending: true })
    .limit(1)
    .single();

  if (!papel?.id) throw new Error("Papel de vendedora/vendedor não encontrado");

  // Upsert em entidade_papeis — precisa do índice único (entidade_id, papel_id, ativo)
  const { error } = await supabase
    .from("entidade_papeis")
    .upsert({ entidade_id: pessoaId, papel_id: papel.id, ativo: true }, { onConflict: "entidade_id,papel_id,ativo" });

  if (error) throw error;
}
