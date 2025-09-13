// Export selected public tables to CSVs (only if they have data), zip them, and upload to Storage
// Route: POST /export-db-zip?token=YOUR_TOKEN&include=a,b,c&exclude=x,y
// Body (optional JSON): { "include": ["table1","table2"], "exclude": ["table3"] }
// Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL, EXPORT_TOKEN (custom)

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import JSZip from "npm:jszip@3.10.1";
import pg from "npm:pg@8.11.3";
const { Client } = pg;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DB_URL = Deno.env.get("SUPABASE_DB_URL")!;
const EXPORT_TOKEN = Deno.env.get("EXPORT_TOKEN");

const PAGE_SIZE = 1000;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Normalize newlines
  s = s.replace(/\r\n|\r|\n/g, "\n");
  const needsQuotes = /[",\n]/.test(s);
  if (needsQuotes) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

async function listPublicTables(): Promise<string[]> {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const res = await client.query(
      "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
    );
    return res.rows.map((r: any) => r.tablename as string);
  } finally {
    await client.end();
  }
}

async function listColumns(table: string): Promise<string[]> {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT column_name
         FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;`,
      [table],
    );
    return res.rows.map((r: any) => r.column_name as string);
  } finally {
    await client.end();
  }
}

async function countRows(supabase: ReturnType<typeof createClient>, table: string): Promise<number> {
  const countRes = await supabase.from(table).select("*", { count: "exact", head: true });
  if (countRes.error) throw countRes.error;
  return countRes.count ?? 0;
}

async function exportTableToCsvFile(
  supabase: ReturnType<typeof createClient>,
  table: string,
  columns: string[],
  filePath: string,
  total: number,
) {
  // Open file for writing
  const file = await Deno.open(filePath, { create: true, write: true, truncate: true });
  const encoder = new TextEncoder();
  try {
    // Write header
    await file.write(encoder.encode(columns.join(",") + "\n"));

    // Page through
    for (let from = 0; from < total; from += PAGE_SIZE) {
      const to = Math.min(from + PAGE_SIZE - 1, total - 1);
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .range(from, to);
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

function parseListParam(value: string | null | undefined): string[] | undefined {
  if (!value) return undefined;
  const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : undefined;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST" }), { status: 405, headers: { "Content-Type": "application/json" } });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (EXPORT_TOKEN && token !== EXPORT_TOKEN) {
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
      } catch (_) {
        // ignore body parse errors
      }
    }

    const include = (includeBody ?? includeQP)?.map((t) => t.toLowerCase());
    const exclude = (excludeBody ?? excludeQP)?.map((t) => t.toLowerCase());

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // List tables (base tables only; no views)
    let tables = await listPublicTables();

    // Apply include/exclude filters
    if (include && include.length) {
      const includeSet = new Set(include);
      tables = tables.filter((t) => includeSet.has(t.toLowerCase()));
    }
    if (exclude && exclude.length) {
      const excludeSet = new Set(exclude);
      tables = tables.filter((t) => !excludeSet.has(t.toLowerCase()));
    }

    if (!tables.length) {
      return new Response(JSON.stringify({ error: "No tables to export after filters" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const baseDir = `/tmp/export_${timestamp}`;
    await Deno.mkdir(baseDir, { recursive: true });

    const csvFiles: { table: string; path: string }[] = [];

    for (const table of tables) {
      const cols = await listColumns(table);
      if (!cols.length) continue;

      // Count rows; skip empty
      const total = await countRows(supabase, table);
      if (total <= 0) continue; // only with data

      const filePath = `${baseDir}/${table}.csv`;
      await exportTableToCsvFile(supabase, table, cols, filePath, total);
      csvFiles.push({ table, path: filePath });
    }

    if (!csvFiles.length) {
      return new Response(JSON.stringify({ message: "No tables with data to export" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Build ZIP in memory
    const zip = new JSZip();
    const folder = zip.folder(`public_${timestamp}`)!;
    for (const f of csvFiles) {
      const bytes = await Deno.readFile(f.path);
      folder.file(`${f.table}.csv`, bytes);
    }
    const zipBytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });

    // Upload to Storage
    const bucket = "exports";
    const zipKey = `${timestamp}/public_export_${timestamp}.zip`; // store at <bucket>/<timestamp>/...

    // Ensure bucket exists (ignore error if already exists)
    await supabase.storage.createBucket(bucket).catch(() => {});

    const { error: upErr } = await supabase.storage.from(bucket).upload(zipKey, zipBytes, { contentType: "application/zip", upsert: true });
    if (upErr) throw upErr;

    // Sign URL (1h)
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
