// src/services/vendedoras.ts
// Substituição total. Fonte única: pessoas + papeis_pessoa + vendedora_config / v_vendedoras.

import { createClient } from "@supabase/supabase-js";

// Ajuste se você já centraliza este client em outro arquivo:
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Tipos básicos
export type UUID = string;

export interface Pessoa {
  id: UUID;
  nome: string;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  ativo: boolean;
}

export interface VendedoraView {
  pessoa_id: UUID;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  pessoa_ativa: boolean;
  entidade_id: UUID;
  vendedora_ativa: boolean;
  metas: Record<string, any> | null;
  preferencia: Record<string, any> | null;
}

// 1) Busca o papel “Vendedora/Vendedor” no catálogo
export async function getVendedoraPapelId(): Promise<UUID> {
  const { data, error } = await supabase
    .from("papeis")
    .select("id, nome")
    .ilike("nome", "vendedor%")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Papel Vendedora/Vendedor não encontrado em 'papeis'.");
  return data.id as UUID;
}

// 2) Lista Pessoas ativas (para autocomplete)
export async function listPessoasAtivas(query?: string): Promise<Pessoa[]> {
  let q = supabase.from("pessoas").select("id, nome, cpf, email, telefone, ativo").eq("ativo", true);
  if (query && query.trim()) {
    q = q.ilike("nome", `%${query.trim()}%`);
  }
  const { data, error } = await q.order("nome", { ascending: true });
  if (error) throw error;
  return (data || []) as Pessoa[];
}

// 3) Lista vendedoras pela entidade via VIEW v_vendedoras
export async function listVendedoras(entidadeId: UUID): Promise<VendedoraView[]> {
  const { data, error } = await supabase
    .from("v_vendedoras")
    .select("*")
    .eq("entidade_id", entidadeId)
    .order("nome", { ascending: true });

  if (error) throw error;
  return (data || []) as VendedoraView[];
}

// 4) Vincula Pessoa→Papel(Vendedora) na Entidade e garante config (upsert)
export async function assignVendedora(pessoaId: UUID, entidadeId: UUID): Promise<void> {
  const papelId = await getVendedoraPapelId();

  // upsert em papeis_pessoa (único por pessoa/papel/entidade)
  {
    const { error } = await supabase.from("papeis_pessoa").upsert(
      [
        {
          pessoa_id: pessoaId,
          papel_id: papelId,
          entidade_id: entidadeId,
          ativo: true,
        },
      ],
      { onConflict: "pessoa_id,papel_id,entidade_id", ignoreDuplicates: false }
    );
    if (error) throw error;
  }

  // garantir vendedora_config
  {
    const { error } = await supabase.from("vendedora_config").upsert(
      [
        {
          pessoa_id: pessoaId,
          entidade_id: entidadeId,
          ativa: true,
        },
      ],
      { onConflict: "pessoa_id,entidade_id", ignoreDuplicates: false }
    );
    if (error) throw error;
  }
}

// 5) Atualiza ativação/metas/preferência (não toca no cadastro de pessoa)
export async function setVendedoraConfig(input: {
  pessoaId: UUID;
  entidadeId: UUID;
  ativa?: boolean;
  metas?: Record<string, any> | null;
  preferencia?: Record<string, any> | null;
}): Promise<void> {
  const payload: any = {
    pessoa_id: input.pessoaId,
    entidade_id: input.entidadeId,
  };
  if (typeof input.ativa === "boolean") payload.ativa = input.ativa;
  if (typeof input.metas !== "undefined") payload.metas = input.metas;
  if (typeof input.preferencia !== "undefined") payload.preferencia = input.preferencia;

  const { error } = await supabase
    .from("vendedora_config")
    .upsert([payload], { onConflict: "pessoa_id,entidade_id", ignoreDuplicates: false });

  if (error) throw error;
}
