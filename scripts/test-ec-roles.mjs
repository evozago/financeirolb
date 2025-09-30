import { createClient } from "@supabase/supabase-js";

const url = "https://mnxemxgcucfuoedqkygw.supabase.co";
const key = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ueGVteGdjdWNmdW9lZHFreWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTY5MTYsImV4cCI6MjA2OTQ3MjkxNn0.JeDMKgnwRcK71KOIun8txqFFBWEHSKdPzIF8Qm9tw1o; // use a mesma ANON KEY que vc exportou no shell

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
