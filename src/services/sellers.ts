// src/services/sellers.ts
import { supabase } from "@/integrations/supabase/client";

/**
 * Lista entidades marcadas como vendedoras(es).
 * Fonte: VIEW ec_sellers (já unificada/filtrada no banco).
 */
export async function listSellers() {
  const { data, error } = await supabase
    .from("ec_sellers")
    .select("*")
    .order("nome_razao_social", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Busca por nome entre os sellers.
 */
export async function searchSellersByName(term: string) {
  const { data, error } = await supabase
    .from("ec_sellers")
    .select("*")
    .ilike("nome_razao_social", `%${term}%`)
    .order("nome_razao_social", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
