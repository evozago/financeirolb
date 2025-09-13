// Export selected public tables to CSVs (only if they have data), zip them, and upload to Storage
// Route: POST /export-db-zip?token=LB-temp-Export-123!&include=a,b,c&exclude=x,y
// Body (optional JSON): { "include": ["table1","table2"], "exclude": ["table3"] }
// Uses only SUPABASE_URL + SERVICE_ROLE_KEY (no direct DB connection).
// DEFAULT_TABLES is prefilled from your provided schema list.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import JSZip from "npm:jszip@3.10.1";

// === Hardcoded config (you asked for zero edits) ===
const SUPABASE_URL = "https://mnxemxgcucfuoedqkygw.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ueGVteGdjdWNmdW9lZHFreWd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg5NjkxNiwiZXhwIjoyMDY5NDcyOTE2fQ.y7G0xBAt6BiKJq6gKaAsN243GqzGmTOh30_dMBqJByk";
const EXPORT_TOKEN = "LB-temp-Export-123!"; // change in code if you wish

const PAGE_SIZE = 1000;

// Prefilled default tables (schema 'public')
const DEFAULT_TABLES = [
  "nfe_data",
  "ap_installments",
  "entidades",
  "fornecedores",
  "representantes_contatos",
  "vendedoras",
  "metas_mensais",
  "vendas",
  "meios_pagamento_vendas",
  "config_vendas",
  "marcas",
  "categorias_produtos",
  "tipos_manga",
  "detalhes_produtos",
  "produtos",
  "produto_variacoes",
  "pedidos_produtos",
  "funcionarios",
  "contas_bancarias",
  "system_configurations",
  "ap_audit_log",
  "profiles",
  "filiais",
  "recurring_bills",
  "recurring_bill_occurrences",
  "messages",
  "contas_a_pagar_demo",
  "hr_contracts",
  "hr_payroll_runs",
  "hr_payslips",
  "hr_earnings_deductions",
  "hr_cargos",
  "hr_setores",
  "vendedora_ferias",
  "pessoas",
  "enderecos",
  "contatos",
  "papeis",
  "entidades_corporativas",
  "entidade_papeis",
  "endereco_detalhado",
  "entidade_enderecos",
  "funcionarios_detalhes",
  "arquivos_sistema",
  "documentos_fiscais",
  "contas_recorrentes",
  "vendas_corporativas",
  "itens_venda",
  "contas_pagar_corporativas",
  "parcelas_conta_pagar",
  "vendas_mensais_totais",
  "vendas_mensais_detalhadas",
  "vendedoras_completas",
  "label_templates",
  "sales_goals",
  "store_monthly_sales"
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  s = s.replace(/\r\n|\r|\n/g, "\n");
  const needsQuotes = /[",\n]/.test(s);
  if (needsQuotes) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function parseListParam(value: string | null | undefined): string[] | undefined {
  if (!value) return undefined;
  const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

async function countRows(supabase: ReturnType<typeof createClient>, table: string): Promise<number> {
  const countRes = await supabase.from(table).select("*", { count: "exact", head: true });
  if (countRes.error) throw countRes.error;
  return countRes.count ?? 0;
}

async function getColumnNames(supabase: ReturnType<typeof createClient>, table: string): Promise<string[]> {
  const { data, error } = await supabase.from(table).select("*").range(0, 0); // first row
  if (error) throw error;
  if (!data || !data.length) return [];
  // Sort alphabetically for stable CSV header
  return Object.keys(data[0]).sort();
}

async function exportTableToCsvFile(
  supabase: ReturnType<typeof createClient>,
  table: string,
  columns: string[],
  filePath: string,
  total: number,
) {
  const file = await Deno.open(filePath, { create: true, write: true, truncate: true });
  const encoder = new TextEncoder();
  try {
    await file.write(encoder.encode(columns.join(",") + "\n"));
    for (let from = 0; from < total; from += PAGE_SIZE) {
      const to = Math.min(from + PAGE_SIZE - 1, total - 1);
      const { data, error } = await supabase.from(table).select("*").range(from, to);
      if (error) throw error;
      for (const row of data ?? []) {
        const values = columns.map((col) => csvEscape((row as any)[col]));
        await file.write(encoder.encode(values.join(",") + "\n"));
      }
    }
  } finally {
    file.close();
  }
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST" }), { status: 405, headers: { "Content-Type": "application/json" } });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (token !== EXPORT_TOKEN) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    let includeQP = parseListParam(url.searchParams.get("include"));
    let excludeQP = parseListParam(url.searchParams.get("exclude"));

    let includeBody: string[] | undefined;
    let excludeBody: string[] | undefined;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const body = await req.json();
        includeBody = Array.isArray(body?.include) ? body.include.map((x: string) => String(x)) : undefined;
        excludeBody = Array.isArray(body?.exclude) ? body.exclude.map((x: string) => String(x)) : undefined;
      } catch (_) { /* ignore */ }
    }

    const include = (includeBody ?? includeQP)?.map((t) => t.toLowerCase());
    const exclude = (excludeBody ?? excludeQP)?.map((t) => t.toLowerCase());

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Start from DEFAULT_TABLES
    let tables = [...DEFAULT_TABLES];

    // Apply include/exclude
    if (include && include.length) {
      const set = new Set(include);
      tables = tables.filter((t) => set.has(t.toLowerCase()));
    }
    if (exclude && exclude.length) {
      const set = new Set(exclude);
      tables = tables.filter((t) => !set.has(t.toLowerCase()));
    }

    if (!tables.length) {
      return new Response(JSON.stringify({ error: "No tables to export after filters" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const baseDir = `/tmp/export_{timestamp}`;
    await Deno.mkdir(baseDir, { recursive: true });

    const csvFiles: { table: string; path: string }[] = [];

    for (const table of tables) {
      // Count rows; skip empty
      const total = await countRows(supabase, table).catch((e) => {
        // If table doesn't exist or not exposed, skip
        console.warn(`Skipping ${table}: ${String(e?.message ?? e)}`);
        return 0;
      });
      if (total <= 0) continue;

      // Discover columns from first row
      const columns = await getColumnNames(supabase, table);
      if (!columns.length) continue;

      const filePath = `${baseDir}/${table}.csv`;
      await exportTableToCsvFile(supabase, table, columns, filePath, total);
      csvFiles.push({ table, path: filePath });
    }

    if (!csvFiles.length) {
      return new Response(JSON.stringify({ message: "No tables with data to export" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Build ZIP
    const zip = new JSZip();
    const folder = zip.folder(`public_${timestamp}`)!;
    for (const f of csvFiles) {
      const bytes = await Deno.readFile(f.path);
      folder.file(`${f.table}.csv`, bytes);
    }
    const zipBytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });

    // Upload
    const bucket = "exports";
    const zipKey = `${timestamp}/public_export_${timestamp}.zip`;

    // Ensure bucket exists
    await supabase.storage.createBucket(bucket).catch(() => {});

    const { error: upErr } = await supabase.storage.from(bucket).upload(zipKey, zipBytes, { contentType: "application/zip", upsert: true });
    if (upErr) throw upErr;

    const { data: signed, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(zipKey, 3600);
    if (signErr) throw signErr;

    return new Response(JSON.stringify({
      message: "Export completed",
      tablesExported: csvFiles.length,
      tables: csvFiles.map((f) => f.table),
      zipPath: `${bucket}/${zipKey}`,
      downloadUrl: signed.signedUrl,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
