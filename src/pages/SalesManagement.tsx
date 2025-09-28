import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isSeller } from "@/utils/isSeller";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Entidade {
  id: string;
  nome_razao_social: string;
  papeis?: string[];
}

export default function SalesManagement() {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // exemplo: buscar entidades com papéis (use sua view/função preferida)
      const { data, error } = await supabase.rpc("get_entidades_with_papeis");
      if (!error) setEntidades(data || []);
      setLoading(false);
    })();
  }, []);

  const vendedoras = entidades.filter((e) => isSeller(e.papeis || []));

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">Vendedoras/Vendedores ativos: {vendedoras.length}</div>
          <ul className="list-disc ml-4">
            {vendedoras.map(v => (
              <li key={v.id}>{v.nome_razao_social}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
