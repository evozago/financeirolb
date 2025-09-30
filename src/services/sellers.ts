// src/services/sellers.ts
import { supabase } from "@/integrations/supabase/client";

/**
 * Lista ENTIDADES que possuem papel de vendedora/vendedor.
 * Usa a VIEW ec_roles_agg (1 linha por entidade, com "papeis" agregado).
 */
export async function listSellers() {
  const { data, error } = await supabase
    .from("ec_roles_agg")
    .select("*")
    .or("papeis.cs.{vendedora},papeis.cs.{vendedor}")
    .order("nome_razao_social", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * (Opcional) Busca por nome, mantendo o filtro de papéis.
 */
export async function searchSellersByName(term: string) {
  // filtra por papéis E nome (case-insensitive)
  const { data, error } = await supabase
    .from("ec_roles_agg")
    .select("*")
    .or("papeis.cs.{vendedora},papeis.cs.{vendedor}")
    .ilike("nome_razao_social", `%${term}%`)
    .order("nome_razao_social", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
