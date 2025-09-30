// src/services/sellers.ts
import { supabase } from "@/integrations/supabase/client"; // com alias; senão "./integrations/supabase/client"

export async function listSellers() {
  const { data, error } = await supabase
    .from("ec_sellers")        // ou "ec_roles_agg", se preferir
    .select("*")
    .order("nome_razao_social", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
