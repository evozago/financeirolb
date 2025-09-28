+// src/services/roles.ts
+import { createClient } from "@supabase/supabase-js";
+
+const supabase = createClient(
+  import.meta.env.VITE_SUPABASE_URL!,
+  import.meta.env.VITE_SUPABASE_ANON_KEY!
+);
+
+export async function addRole(entidadeId: string, papelNome: string) {
+  const { error } = await supabase.rpc("upsert_entidade_papel", {
+    _entidade: entidadeId,
+    _papel_nome: papelNome,
+  });
+  if (error) throw error;
+}
+
+export async function removeRole(entidadeId: string, papelNome: string) {
+  const { error } = await supabase.rpc("desativar_entidade_papel", {
+    _entidade: entidadeId,
+    _papel_nome: papelNome,
+  });
+  if (error) throw error;
+}
+
+export const isSeller = (roles: string[] = []) =>
+  roles.some((r) => {
+    const n = r?.toLowerCase();
+    return n === "vendedora" || n === "vendedor" || n?.startsWith("vendedor");
+  });
