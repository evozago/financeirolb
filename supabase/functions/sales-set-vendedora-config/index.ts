// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders } from "../_shared/cors.ts";
import type { SetVendedoraConfigBody } from "../_shared/types.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: { ...corsHeaders(req) } });

  try {
    const body = (await req.json()) as SetVendedoraConfigBody;
    if (!body?.pessoaId || !body?.entidadeId) {
      return new Response(JSON.stringify({ error: "pessoaId e entidadeId são obrigatórios" }), {
        status: 400, headers: { "content-type": "application/json", ...corsHeaders(req) },
      });
    }

    const payload: any = {
      pessoa_id: body.pessoaId,
      entidade_id: body.entidadeId,
    };
    if (typeof body.ativa === "boolean") payload.ativa = body.ativa;
    if (typeof body.metas !== "undefined") payload.metas = body.metas;
    if (typeof body.preferencia !== "undefined") payload.preferencia = body.preferencia;

    const { error } = await supabase
      .from("vendedora_config")
      .upsert([payload], { onConflict: "pessoa_id,entidade_id", ignoreDuplicates: false });
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json", ...corsHeaders(req) },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? "Erro desconhecido" }), {
      status: 500, headers: { "content-type": "application/json", ...corsHeaders(req) },
    });
  }
});
