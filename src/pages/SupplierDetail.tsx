import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Supplier {
  id: string;
  nome: string;
  cpf_cnpj_normalizado?: string | null;
  ativo?: boolean;
}

export default function SupplierDetail() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);

      // 1) tenta legacy
      const { data: legacy } = await supabase
        .from("fornecedores")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (legacy) {
        setSupplier({
          id: legacy.id,
          nome: legacy.nome,
          cpf_cnpj_normalizado: legacy.cpf_cnpj_normalizado ?? null,
          ativo: legacy.ativo ?? true,
        });
        setLoading(false);
        return;
      }

      // 2) fallback: entidade
      const { data: ent } = await supabase
        .from("entidades_corporativas")
        .select("id, nome_razao_social, cpf_cnpj_normalizado, ativo")
        .eq("id", id)
        .maybeSingle();

      if (ent) {
        setSupplier({
          id: ent.id,
          nome: ent.nome_razao_social,
          cpf_cnpj_normalizado: ent.cpf_cnpj_normalizado ?? null,
          ativo: ent.ativo ?? true,
        });
        setLoading(false);
        return;
      }

      setSupplier(null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!supplier) return <div className="p-6">Fornecedor não encontrado.</div>;

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Fornecedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div><strong>Nome:</strong> {supplier.nome}</div>
          <div><strong>Documento:</strong> {supplier.cpf_cnpj_normalizado || "-"}</div>
          <div><strong>Status:</strong> {supplier.ativo ? "Ativo" : "Inativo"}</div>
        </CardContent>
      </Card>

      {/* você pode manter aqui as seções de pedidos/contas a pagar existentes */}
    </div>
  );
}
