// src/services/entities.ts
import { supabase } from "@/integrations/supabase/client";

// Lista entidades com papel vendedora/vendedor usando a VIEW ec_roles
export async function listEntitiesWithSellerRole() {
  return supabase
    .from("ec_roles")
    .select("*")
    .in("papel_nome", ["vendedora", "vendedor"])
    .order("nome_razao_social", { ascending: true });
}
