import { supabase } from "@/integrations/supabase/client";
export async function listSellers() {
  const { data, error } = await supabase.from("ec_sellers").select("*").order("nome_razao_social", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
