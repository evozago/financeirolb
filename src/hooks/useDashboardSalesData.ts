// src/hooks/useDashboardSalesData.ts
import { useEffect, useState } from "react";
import { listActiveSalespeople, Seller } from "@/lib/salespeople";

type State = {
  sellers: Seller[];
  loading: boolean;
  error: string | null;
};

export function useDashboardSalesData(): State {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await listActiveSalespeople();
      if (!alive) return;
      if (error) {
        setError(error.message ?? "Erro ao carregar vendedoras(es).");
        setSellers([]);
      } else {
        setSellers(data);
      }
      setLoading(false);
    })();

    return () => { alive = false; };
  }, []);

  return { sellers, loading, error };
}
