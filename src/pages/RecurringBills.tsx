import React, { useState, useEffect } from "react";
import { Plus, Calendar, Edit, Archive, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedDataTable } from "@/components/ui/enhanced-data-table";
import { useToast } from "@/hooks/use-toast";

import { supabase } from "@/integrations/supabase/client";
import { RecurringBill } from "@/types/payables";
import { RecurringBillForm } from "@/components/features/recurring-bills/RecurringBillForm";

type Column = {
  key: string;
  header: string;
  sortable: boolean;
  cell: (item: RecurringBill) => React.ReactNode;
};

type Branch = { id: string; nome: string };

const RecurringBills: React.FC = () => {
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);

  const [branches, setBranches] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEdit = (bill: RecurringBill) => {
    setEditingBill(bill);
    setShowForm(true);
  };

  const handleToggleActive = async (bill: RecurringBill) => {
    const { error } = await supabase
      .from("recurring_bills" as any)
      .update({ active: !bill.active })
      .eq("id", bill.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Sucesso",
      description: `Conta ${bill.active ? "arquivada" : "reativada"} com sucesso`,
    });
    loadBills();
  };

  const handleLaunch = async (bill: RecurringBill) => {
    try {
      const { data, error } = await supabase.functions.invoke('launch-recurring-bill', {
        body: { billId: bill.id }
      });

      if (error) {
        throw error;
      }

      toast({ 
        title: "Sucesso", 
        description: `Conta "${bill.name}" lançada em Contas a Pagar para o mês vigente!` 
      });
    } catch (error: any) {
      toast({ 
        title: "Erro ao lançar", 
        description: error.message || "Erro desconhecido", 
        variant: "destructive" 
      });
    }
  };

  const columns: Column[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
      cell: (bill) => <div className="font-medium">{bill.name}</div>,
    },
    {
      key: "supplier",
      header: "Fornecedor",
      sortable: false,
      cell: (bill) => (
        <div className="text-sm text-muted-foreground">{bill.supplier?.nome || "-"}</div>
      ),
    },
    {
      key: "branch",
      header: "Filial",
      sortable: false,
      cell: (bill) => {
        const filialId = (bill as any).supplier?.filial_id as string | undefined;
        const nome = filialId ? branches[filialId] : undefined;
        return <div className="text-sm text-muted-foreground">{nome || "-"}</div>;
      },
    },
    {
      key: "category",
      header: "Categoria",
      sortable: false,
      cell: (bill) => (
        <div className="text-sm text-muted-foreground">{bill.category?.nome || "-"}</div>
      ),
    },
    {
      key: "dates",
      header: "Fechamento/Vencimento",
      sortable: false,
      cell: (bill) => (
        <div className="text-sm">
          <div>Fechamento: {bill.closing_day ? `Dia ${bill.closing_day}` : "-"}</div>
          <div>Vencimento: Dia {bill.due_day}</div>
        </div>
      ),
    },
    {
      key: "expected_amount",
      header: "Valor Esperado",
      sortable: true,
      cell: (bill) => (
        <div className="font-medium">
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
            bill.expected_amount
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: false,
      cell: (bill) => (
        <div className="flex items-center gap-2">
          <Badge variant={bill.active ? "default" : "secondary"}>
            {bill.active ? "Ativo" : "Inativo"}
          </Badge>
          {(bill as any).recorrente_livre && (
            <Badge variant="outline" className="text-xs">
              Livre
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Ações",
      sortable: false,
      cell: (bill) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(bill)} title="Editar">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleActive(bill)}
            title="Arquivar / Reativar"
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleLaunch(bill)}
            title="Lançar mês vigente"
          >
            <Zap className="h-4 w-4 mr-1" />
            Lançar mês vigente
          </Button>
        </div>
      ),
    },
  ];

  const loadBranches = async () => {
    const { data, error } = await supabase.from("filiais" as any).select("id, nome").eq("ativo", true);
    if (error) return;
    const map: Record<string, string> = {};
    ((data as unknown as Branch[]) || []).forEach((f) => (map[f.id] = f.nome));
    setBranches(map);
  };

  const loadBills = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("recurring_bills" as any)
        .select(
          `
          *,
          supplier:fornecedores(id, nome, filial_id),
          category:categorias_produtos(id, nome)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBills((data as any) || []);
    } catch (err) {
      toast({ title: "Erro", description: "Erro ao carregar contas recorrentes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
    loadBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = () => {
    setEditingBill(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingBill(null);
    loadBills();
    toast({ title: "Sucesso", description: editingBill ? "Conta atualizada" : "Conta criada" });
  };

  if (showForm) {
    return (
      <RecurringBillForm
        bill={editingBill}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingBill(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas Recorrentes</h1>
          <p className="text-muted-foreground">Gerencie suas contas mensais recorrentes</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta Recorrente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Contas Recorrentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedDataTable
            data={bills}
            columns={columns}
            loading={loading}
            emptyMessage="Nenhuma conta recorrente encontrada"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default RecurringBills;
