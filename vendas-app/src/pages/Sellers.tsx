import React from "react";
import { listSellers } from "@/services/sellers";

export default function Sellers() {
  const [items, setItems] = React.useState<any[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try { setItems(await listSellers()); } catch (e:any) { setErr(e.message); }
    })();
  }, []);

  if (err) return <div>Erro: {err}</div>;
  return (
    <div style={{ padding: 16 }}>
      <h1>Vendedoras(es)</h1>
      <ul>
        {items.map((r:any) => <li key={r.id}>{r.nome_razao_social}</li>)}
      </ul>
    </div>
  );
}
