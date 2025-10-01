import { createClient } from "@supabase/supabase-js";

const url = "https://mnxemxgcucfuoedqkygw.supabase.co";
const key = process.env.SUPABASE_ANON_KEY; // vem do export no shell

if (!key) {
  console.error("SUPABASE_ANON_KEY não definida. Rode: export SUPABASE_ANON_KEY='...'");
  process.exit(1);
}

const supabase = createClient(url, key);

const run = async () => {
  const { data, error } = await supabase
    .from("ec_roles_agg")
    .select("*")
    .or("papeis.cs.{vendedora},papeis.cs.{vendedor}")
    .order("nome_razao_social", { ascending: true });

  if (error) {
    console.error("Erro:", error);
  } else {
    console.log("OK:", data);
  }
};

run();
