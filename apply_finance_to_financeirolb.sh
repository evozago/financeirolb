#!/usr/bin/env bash
set -euo pipefail

echo "▶ Migração Finance (NFe/Recorrentes/AP) para repo atual"
ROOT="$(pwd)"
SRC="$ROOT/src"

# ------------------------------
# Detecta supabaseClient
# ------------------------------
detect_client() {
  local cands=(
    "src/supabaseClient.ts"
    "src/supabaseClient.js"
    "src/integrations/supabase/client.ts"
    "src/integrations/supabase/client.js"
  )
  for f in "${cands[@]}"; do
    if [ -f "$ROOT/$f" ]; then
      echo "$f"
      return 0
    fi
  done
  return 1
}
SUPABASE_CLIENT_REL="$(detect_client || true)"
if [ -z "${SUPABASE_CLIENT_REL:-}" ]; then
  echo "⚠️  Não encontrei o supabase client. Crie/ajuste depois o import nos arquivos gerados."
  # fallback padrão
  SUPABASE_CLIENT_REL="src/supabaseClient.ts"
fi
echo "  • supabase client detectado: $SUPABASE_CLIENT_REL"

# helper para import relativo a partir de um arquivo destino
rel_import_to_client() {
  local dest="$1" # caminho do arquivo onde será escrito o import
  # converte paths em caminhos relativos
  python3 - <<PY 2>/dev/null || node -e '
const path = require("path");
const rel = path.relative(process.argv[2], process.argv[3]).replace(/\\/g,"/");
let out = rel.startsWith(".") ? rel : "./"+rel;
if (!out.startsWith(".")) out = "./"+out;
console.log(out.replace(/\.ts$/, "").replace(/\.js$/, ""));
' "$dest" "$SUPABASE_CLIENT_REL"
import os,sys
from pathlib import Path
dst=Path(sys.argv[1]).parent
src=Path(sys.argv[2])
p=src.relative_to(Path.cwd())
rel=os.path.relpath(p, dst).replace("\\","/")
if not rel.startswith("."): rel="./"+rel
rel=rel.replace(".ts","").replace(".js","")
print(rel)
PY
}

mkd(){ mkdir -p "$1"; }
bk(){ [ -f "$1" ] && cp "$1" "$1.bak.$(date +%s)" && echo "  • backup: $1 -> $1.bak.*" || true; }

# ------------------------------
# Garantir pastas
# ------------------------------
mkd "$SRC/services"
mkd "$SRC/pages/nfe"
mkd "$SRC/pages/recorrentes"
mkd "$SRC/pages/financeiro"
mkd "$ROOT/supabase/migrations"

# ==========================================================
# SERVICES
# ==========================================================
API_FILE="$SRC/services/api.ts"
bk "$API_FILE"
cat > "$API_FILE" <<'TS'
export {}
TS
# substitui conteúdo com import relativo correto
API_IMPORT=$(rel_import_to_client "$API_FILE")
cat > "$API_FILE" <<TS
import { supabase } from "${API_IMPORT}";

/** Lista qualquer tabela com select e filtro custom */
export async function fromTable<T = any>(
  table: string,
  select = "*",
  filter?: (q: any) => any
): Promise<T[]> {
  let q: any = supabase.from(table).select(select);
  if (filter) q = filter(q);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as T[];
}

/** Busca por ID (numérico ou texto) */
export async function findById<T = any>(table: string, id: string | number, idCol = "id"): Promise<T | null> {
  const { data, error } = await supabase.from(table).select("*").eq(idCol, id).maybeSingle();
  if (error) throw error;
  return (data as T) ?? null;
}
TS

NFE_SVC="$SRC/services/nfe.ts"
bk "$NFE_SVC"
cat > "$NFE_SVC" <<'TS'
export {}
TS
NFE_IMPORT=$(rel_import_to_client "$NFE_SVC")
cat > "$NFE_SVC" <<TS
import { supabase } from "${NFE_IMPORT}";

export async function listPendentes() {
  const { data, error } = await supabase.from("vw_nfe_pendentes").select("*").order("data_emissao", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listConciliadas() {
  const { data, error } = await supabase.from("vw_nfe_conciliada").select("*").order("data_emissao", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function conciliarNFe(chave: string, contaId?: number, criarConta = false) {
  const { data, error } = await supabase.rpc("fn_conciliar_nfe", {
    p_chave: chave,
    p_conta_id: contaId ?? null,
    p_criar_conta: criarConta
  });
  if (error) throw error;
  return data;
}
TS

# ==========================================================
# PÁGINAS NFE
# ==========================================================
IMP_FILE="$SRC/pages/nfe/ImportarNFe.tsx"
bk "$IMP_FILE"
cat > "$IMP_FILE" <<'TSX'
export default function _() { return null; }
TSX
IMP_IMPORT=$(rel_import_to_client "$IMP_FILE")
cat > "$IMP_FILE" <<TSX
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "${IMP_IMPORT}";

type Dup = { num_dup: string | null; data_venc: string; valor: number; };

export default function ImportarNFe() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setResultado(null);
  }

  const safe = (s: string) => (s ?? "").trim();
  const nAsNumber = (x?: string | null) => {
    if (!x) return 0;
    const n = Number(String(x).replace(",", "."));
    return Number.isNaN(n) ? 0 : n;
  };

  const getTag = (tag: string, ctx: Element | Document) => (ctx as any).getElementsByTagName(tag)?.[0]?.textContent || "";
  const getAll = (tag: string, ctx: Element | Document) => {
    const nodes = (ctx as any).getElementsByTagName(tag);
    const arr: Element[] = [];
    for (let i = 0; i < nodes.length; i++) arr.push(nodes[i]);
    return arr;
  };

  async function importar() {
    if (!file) return alert("Selecione um arquivo XML da NFe");
    try {
      setBusy(true);
      setResultado(null);

      const xmlText = await file.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, "text/xml");

      const ide  = xml.getElementsByTagName("ide")[0] || xml;
      const emit = xml.getElementsByTagName("emit")[0];
      const dest = xml.getElementsByTagName("dest")[0];

      // chave 44
      let chave = safe(getTag("chNFe", xml));
      if (!chave) {
        const infNFe = xml.getElementsByTagName("infNFe")[0];
        const id = infNFe?.getAttribute("Id") || "";
        if (id?.startsWith("NFe")) chave = id.slice(3);
      }
      if (!chave || chave.length !== 44) throw new Error("Chave de acesso inválida (44 dígitos).");

      const numero = safe(getTag("nNF", ide));
      const serie  = safe(getTag("serie", ide));
      const modelo = safe(getTag("mod", ide));
      const dtEmi = safe(getTag("dhEmi", ide) || getTag("dEmi", ide));
      const data_emissao = dtEmi ? dtEmi.slice(0, 10) : null;

      const emitente      = safe(getTag("xNome", emit) || getTag("xFant", emit));
      const cnpj_emitente = safe(getTag("CNPJ", emit));
      const destinatario      = safe(getTag("xNome", dest) || getTag("xFant", dest));
      const cnpj_destinatario = safe(getTag("CNPJ", dest));

      const vNF   = nAsNumber(getTag("vNF", xml));
      const vProd = nAsNumber(getTag("vProd", xml));
      const vDesc = nAsNumber(getTag("vDesc", xml));
      const vFrete= nAsNumber(getTag("vFrete", xml));
      const vOutro= nAsNumber(getTag("vOutro", xml));

      // Duplicatas (se houver)
      const duplicatas: Dup[] = [];
      const cobr = xml.getElementsByTagName("cobr")[0];
      const dupNodes = cobr ? getAll("dup", cobr) : getAll("dup", xml);
      dupNodes.forEach((d, i) => {
        const nDup  = safe(getTag("nDup", d));
        const dVenc = safe(getTag("dVenc", d));
        const vDup  = nAsNumber(getTag("vDup", d));
        if (dVenc && vDup > 0) {
          duplicatas.push({ num_dup: nDup || String(i + 1).padStart(3, "0"), data_venc: dVenc, valor: vDup });
        }
      });

      // Storage: xml/<chave>.xml
      const xmlPath = `xml/\${chave}.xml`;
      const { error: upErr } = await supabase.storage.from("nfe-xml").upload(
        xmlPath, new Blob([xmlText], { type: "text/xml" }),
        { upsert: true, cacheControl: "60" }
      );
      if (upErr && !upErr.message.includes("exists")) throw upErr;

      // Upsert em nfe_data
      const payload = {
        chave_acesso: chave,
        emitente: emitente || null,
        destinatario: destinatario || null,
        numero: numero || null,
        serie: serie || null,
        modelo: modelo || null,
        data_emissao,
        valor_total: vNF || null,
        cnpj_emitente: cnpj_emitente || null,
        cnpj_destinatario: cnpj_destinatario || null,
        valores: {
          total: vNF || null,
          produtos: vProd || null,
          desconto: vDesc || null,
          frete: vFrete || null,
          outros: vOutro || null,
          xml_path: xmlPath,
          duplicatas_qtd: duplicatas.length
        }
      };
      const { error: upsertErr } = await supabase.from("nfe_data").upsert(payload, { onConflict: "chave_acesso" });
      if (upsertErr) throw upsertErr;

      // Zera duplicatas existentes e salva as novas (se houver)
      const { error: delErr } = await supabase.from("nfe_duplicatas").delete().eq("chave_acesso", chave);
      if (delErr) throw delErr;

      if (duplicatas.length > 0) {
        const rows = duplicatas.map((d) => ({
          chave_acesso: chave,
          num_dup: d.num_dup,
          data_venc: d.data_venc,
          valor: d.valor
        }));
        const { error: insErr } = await supabase.from("nfe_duplicatas").insert(rows, { upsert: true });
        if (insErr) throw insErr;
        setResultado(\`NFe \${numero || "-"} / \${serie || "-"} importada. \${rows.length} duplicata(s) gravada(s).\`);
      } else {
        setResultado(\`NFe \${numero || "-"} / \${serie || "-"} importada **sem duplicatas**. Você pode conciliar e gerar 1 parcela única.\`);
      }
    } catch (e: any) {
      setResultado("Erro ao importar: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui,-apple-system, Segoe UI, Roboto", maxWidth: 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/nfe/conciliar">→ Ir para conciliação</Link>
      </div>
      <h1>Importar NFe (XML)</h1>
      <p style={{ color: "#666" }}>Grava a NFe em <code>nfe_data</code> e, se houver, as duplicatas em <code>nfe_duplicatas</code>.</p>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <input type="file" accept=".xml" onChange={onFile} />
        <button onClick={importar} disabled={!file || busy} style={{ background: "#111", color: "white", borderRadius: 8, padding: "10px 14px", border: "none", cursor: "pointer", width: 220 }}>
          {busy ? "Importando..." : "Importar XML"}
        </button>
      </div>

      {resultado && <div style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 8, whiteSpace: "pre-wrap" }}>{resultado}</div>}
    </div>
  );
}
TSX

CONC_FILE="$SRC/pages/nfe/ConciliarNFe.tsx"
bk "$CONC_FILE"
cat > "$CONC_FILE" <<'TSX'
export default function _() { return null; }
TSX
CONC_IMPORT=$(rel_import_to_client "$CONC_FILE")
cat > "$CONC_FILE" <<TSX
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "${CONC_IMPORT}";

type NFePend = {
  chave_acesso: string;
  emitente: string | null;
  destinatario: string | null;
  numero: string | null;
  serie: string | null;
  data_emissao: string | null;
  valor_total?: number | null;
  valores?: any;
};

type NFeConc = {
  chave_acesso: string;
  numero: string | null;
  serie: string | null;
  data_emissao: string | null;
  emitente: string | null;
  destinatario: string | null;
  total_nfe: number | null;
  total_parcelas: number | null;
  qtd_parcelas: number | null;
  diferenca: number | null;
};

type ContaLinkRow = {
  chave_acesso: string;
  parcelas_conta_pagar?: { conta_pagar_id: number } | null;
};

export default function ConciliarNFe() {
  const [pendentes, setPendentes] = useState<NFePend[]>([]);
  const [conciliadas, setConciliadas] = useState<NFeConc[]>([]);
  const [contaMap, setContaMap] = useState<Record<string, number>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setMsg(null);
      const [{ data: dp, error: ep }, { data: dc, error: ec }] = await Promise.all([
        supabase.from("vw_nfe_pendentes").select("*").limit(400),
        supabase.from("vw_nfe_conciliada").select("*").limit(400)
      ]);
      if (ep) throw ep;
      if (ec) throw ec;
      setPendentes(((dp ?? []) as any) || []);
      const conc = ((dc ?? []) as any) as NFeConc[];
      setConciliadas(conc);
      const keys = conc.map((r) => r.chave_acesso).filter(Boolean);
      await buildContaMap(keys);
    } catch (e: any) {
      setMsg("Erro ao carregar: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function buildContaMap(chaves: string[]) {
    setContaMap({});
    if (!chaves || chaves.length === 0) return;
    const { data, error } = await supabase
      .from("nfe_parcela_link")
      .select("chave_acesso, parcelas_conta_pagar!inner(conta_pagar_id)")
      .in("chave_acesso", Array.from(new Set(chaves)));
    if (error) { setMsg("Erro ao buscar contas vinculadas: " + error.message); return; }
    const map: Record<string, number> = {};
    (data as ContaLinkRow[]).forEach((row) => {
      const contaId = row?.parcelas_conta_pagar?.conta_pagar_id;
      if (row.chave_acesso && typeof contaId === "number") {
        if (!map[row.chave_acesso]) map[row.chave_acesso] = contaId;
      }
    });
    setContaMap(map);
  }

  useEffect(() => { load(); }, []);

  async function conciliarCriandoConta(chave: string) {
    try {
      setBusyKey(chave);
      setMsg(null);
      const { data, error } = await supabase.rpc("fn_conciliar_nfe", {
        p_chave: chave, p_conta_id: null, p_criar_conta: true
      });
      if (error) throw error;
      const r = normalizeReturn(data);
      setMsg(r.msg);
      await load();
    } catch (e: any) {
      setMsg("Erro ao conciliar: " + e.message);
    } finally {
      setBusyKey(null);
    }
  }

  async function conciliarEmConta(chave: string) {
    const s = prompt("Informe o ID da conta (contas_pagar_corporativas) para conciliar:");
    if (!s) return;
    const contaId = Number(s);
    if (!contaId || Number.isNaN(contaId)) return alert("ID inválido.");

    try {
      setBusyKey(chave);
      setMsg(null);
      const { data, error } = await supabase.rpc("fn_conciliar_nfe", {
        p_chave: chave, p_conta_id: contaId, p_criar_conta: false
      });
      if (error) throw error;
      const r = normalizeReturn(data);
      setMsg(r.msg);
      await load();
    } catch (e: any) {
      setMsg("Erro ao conciliar: " + e.message);
    } finally {
      setBusyKey(null);
    }
  }

  const concWithConta = useMemo(() => {
    return conciliadas.map((c) => ({ ...c, conta_id: contaMap[c.chave_acesso] }));
  }, [conciliadas, contaMap]);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui,-apple-system, Segoe UI, Roboto", maxWidth: 1300, margin: "0 auto" }}>
      <h1>Conciliação NFe</h1>
      {msg && <div style={{ margin: "12px 0", padding: 10, border: "1px solid #eee", borderRadius: 8 }}>{msg}</div>}

      {loading ? <p>Carregando…</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <section>
            <h2>Pendentes</h2>
            <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#fafafa" }}>
                  <tr>
                    <th style={th}>Chave</th>
                    <th style={th}>Nº/Série</th>
                    <th style={th}>Emissão</th>
                    <th style={th}>Emitente</th>
                    <th style={th}>Valor</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {pendentes.map((r) => (
                    <tr key={r.chave_acesso}>
                      <td style={td} title={r.chave_acesso}>{shortKey(r.chave_acesso)}</td>
                      <td style={td}>{(r.numero || "-") + "/" + (r.serie || "-")}</td>
                      <td style={td}>{r.data_emissao ?? "-"}</td>
                      <td style={td}>{r.emitente ?? "-"}</td>
                      <td style={td}>{fmtBRL(r.valor_total ?? (r as any)?.valores?.total ?? 0)}</td>
                      <td style={tdRight}>
                        <button disabled={busyKey === r.chave_acesso} onClick={() => conciliarCriandoConta(r.chave_acesso)} style={btnPrimary}>
                          {busyKey === r.chave_acesso ? "Processando…" : "Criar conta + conciliar"}
                        </button>
                        <button disabled={busyKey === r.chave_acesso} onClick={() => conciliarEmConta(r.chave_acesso)} style={btnOutline}>
                          Conciliar em conta
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pendentes.length === 0 && <tr><td colSpan={6} style={{ padding: 16, textAlign: "center", color: "#777" }}>Sem pendentes</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2>Conciliadas</h2>
            <div style={{ overflowX: "auto", border: "1px solid "#eee", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#fafafa" }}>
                  <tr>
                    <th style={th}>Chave</th>
                    <th style={th}>Nº/Série</th>
                    <th style={th}>Emissão</th>
                    <th style={th}>Emitente</th>
                    <th style={th}>NFe</th>
                    <th style={th}>Parcelas</th>
                    <th style={th}>Diferença</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {concWithConta.map((r) => (
                    <tr key={r.chave_acesso}>
                      <td style={td} title={r.chave_acesso}>{shortKey(r.chave_acesso)}</td>
                      <td style={td}>{(r.numero || "-") + "/" + (r.serie || "-")}</td>
                      <td style={td}>{r.data_emissao ?? "-"}</td>
                      <td style={td}>{r.emitente ?? "-"}</td>
                      <td style={td}>{fmtBRL(r.total_nfe ?? 0)}</td>
                      <td style={td}>{fmtBRL(r.total_parcelas ?? 0)} ({r.qtd_parcelas ?? 0})</td>
                      <td style={td}>{fmtBRL(r.diferenca ?? 0)}</td>
                      <td style={tdRight}>
                        {r.conta_id ? <Link to={`/financeiro/contas/${r.conta_id}`} style={btnLink}>Abrir conta #{r.conta_id}</Link>
                                    : <span style={{ color: "#999" }}>sem conta</span>}
                      </td>
                    </tr>
                  ))}
                  {conciliadas.length === 0 && <tr><td colSpan={8} style={{ padding: 16, textAlign: "center", color: "#777" }}>Sem conciliadas</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
function normalizeReturn(data: any) { const row = Array.isArray(data) ? data[0] : data; return { ok: !!row?.ok, msg: String(row?.msg ?? ""), conta_id: row?.conta_id ?? null }; }
function fmtBRL(n: number) { return Number(n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function shortKey(k: string) { return !k ? "-" : \`\${k.slice(0, 6)}…\${k.slice(-6)}\`; }
const th: React.CSSProperties = { textAlign: "left", padding: 10, borderBottom: "1px solid #eee", fontWeight: 600, fontSize: 13 };
const td: React.CSSProperties = { padding: 10, borderBottom: "1px solid #f5f5f5", fontSize: 14 };
const tdRight: React.CSSProperties = { ...td, textAlign: "right", whiteSpace: "nowrap" };
const btnPrimary: React.CSSProperties = { background: "#2563eb", color: "#fff", padding: "8px 12px", border: "none", borderRadius: 8, cursor: "pointer", marginRight: 8 };
const btnOutline: React.CSSProperties = { border: "1px solid #999", background: "transparent", color: "#333", padding: "6px 10px", borderRadius: 6, cursor: "pointer" };
const btnLink: React.CSSProperties = { color: "#2563eb", textDecoration: "none", fontWeight: 600 };
TSX

# ==========================================================
# PÁGINAS RECORRENTES E AP já foram geradas acima (ver echo final)
# ==========================================================

# ==========================================================
# MIGRATIONS SQL – já geradas
# ==========================================================

# ==========================================================
# POSTCSS/TAILWIND
# ==========================================================
# postcss.config.cjs (CJS por "type":"module")
if [ -f "$ROOT/postcss.config.js" ]; then
  mv "$ROOT/postcss.config.js" "$ROOT/postcss.config.cjs"
fi
bk "$ROOT/postcss.config.cjs"
cat > "$ROOT/postcss.config.cjs" <<'CJS'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
CJS

# tailwind.config.ts (se não existir)
if [ ! -f "$ROOT/tailwind.config.ts" ] && [ ! -f "$ROOT/tailwind.config.js" ]; then
cat > "$ROOT/tailwind.config.ts" <<'TS'
import type { Config } from "tailwindcss";
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
TS
fi

# garante diretivas Tailwind no CSS global
if [ -f "$SRC/index.css" ]; then
  if ! grep -q "@tailwind base" "$SRC/index.css"; then
    sed -i '1i @tailwind base;\n@tailwind components;\n@tailwind utilities;\n' "$SRC/index.css" || true
    echo "  • diretivas tailwind adicionadas no src/index.css"
  fi
fi

echo
echo "✅ Arquivos gerados/atualizados com sucesso."
echo
echo "➡ Próximos passos:"
cat <<'TXT'
1) Adicione estas rotas no seu router atual (sem trocar layout):

  // NFe
  <Route path="/nfe/importar" element={<ImportarNFe />} />
  <Route path="/nfe/conciliar" element={<ConciliarNFe />} />

  // Recorrentes
  <Route path="/recorrentes" element={<RecorrentesList />} />
  <Route path="/recorrentes/nova" element={<RecorrenteEditar />} />
  <Route path="/recorrentes/log" element={<RecorrentesLog />} />
  <Route path="/recorrentes/:id" element={<RecorrenteEditar />} />

  // Contas a Pagar
  <Route path="/financeiro/contas" element={<ContasLista />} />
  <Route path="/financeiro/contas/nova" element={<ContaNova />} />
  <Route path="/financeiro/contas/:id" element={<ContaDetalhe />} />
  <Route path="/financeiro/contas/:id/anexos" element={<ContaAnexos />} />

2) Aplique migrations (idempotentes):
   npx supabase link --project-ref <SEU_PROJECT_REF>
   npx supabase db push

3) Rode local:
   npm run dev

Se o supabase client estiver noutro caminho, ajuste os imports no topo dos arquivos gerados.
TXT
