// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/cors.ts";
import type { AssignVendedoraBody, UUID } from "../_shared/types.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

async function getVendedoraPapelId(): Promise<UUID> {
  const { data, error } = await supabase
    .from("papeis")
    .select("id, nome")
    .ilike("nome", "vendedor%")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Papel Vendedora/Vendedor não encontrado.");
  return data.id as UUID;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { ...corsHeaders(req) } });

  try {
    const { pessoaId, entidadeId } = (await req.json()) as AssignVendedoraBody;
    if (!pessoaId || !entidadeId) {
      return new Response(JSON.stringify({ error: "pessoaId e entidadeId são obrigatórios" }), {
        status: 400, headers: { "content-type": "application/json", ...corsHeaders(req) },
      });
    }

    const papelId = await getVendedoraPapelId();

    // 1) vincular papel por entidade (sem duplicar)
    {
      const { error } = await supabase.from("papeis_pessoa").upsert(
        [{ pessoa_id: pessoaId, papel_id: papelId, entidade_id: entidadeId, ativo: true }],
        { onConflict: "pessoa_id,papel_id,entidade_id", ignoreDuplicates: false },
      );
      if (error) throw error;
    }

    // 2) garantir config por entidade
    {
      const { error } = await supabase.from("vendedora_config").upsert(
        [{ pessoa_id: pessoaId, entidade_id: entidadeId, ativa: true }],
        { onConflict: "pessoa_id,entidade_id", ignoreDuplicates: false },
      );
      if (error) throw error;
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json", ...corsHeaders(req) },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "Erro desconhecido" }), {
      status: 500, headers: { "content-type": "application/json", ...corsHeaders(req) },
    });
  }
});
