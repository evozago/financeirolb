import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { LoginForm } from "@/components/auth/LoginForm";
import { AppHeader } from "@/components/layout/AppHeader";
import { TestSidebar } from "@/components/layout/TestSidebar";
import { StatePersistenceProvider } from "@/contexts/StatePersistenceContext";
import { UndoRedoManager } from "@/components/ui/undo-redo-manager";
import { useIsMobile } from "@/hooks/use-mobile";
import { features } from "@/config/featureFlags";

// Páginas SEMPRE ativas (Financeiro e cadastros)
import EntidadesCorporativas from "./pages/EntidadesCorporativas";
import DashboardPayables from "./pages/DashboardPayables";
import AccountsPayable from "./pages/AccountsPayable";
import NewBill from "./pages/NewBill";
import BillDetail from "./pages/BillDetail";
import EditBill from "./pages/EditBill";
import Suppliers from "./pages/Suppliers";
import SupplierDetail from "./pages/SupplierDetail";
import NewSupplier from "./pages/NewSupplier";
import EditSupplier from "./pages/EditSupplier";
import Pessoas from "./pages/Pessoas";
import Cadastros from "./pages/Cadastros";
import Reports from "./pages/Reports";
import BankAccounts from "./pages/BankAccounts";
import NewBankAccount from "./pages/NewBankAccount";
import EditBankAccount from "./pages/EditBankAccount";
import BankAccountDetail from "./pages/BankAccountDetail";
import Orders from "./pages/Orders";
import NewOrder from "./pages/NewOrder";
import OrderDetail from "./pages/OrderDetail";
import EditOrder from "./pages/EditOrder";
import ManageFiliais from "./pages/ManageFiliais";
import RecurringBills from "./pages/RecurringBills";
import GerenciarPapeis from "./pages/GerenciarPapeis";
import TestePage from "./pages/TestePage";
import NotFound from "./pages/NotFound";

// Dashboards em lazy
const DashboardFinancial = React.lazy(() => import("./pages/DashboardFinancial"));
const DashboardPurchases = React.lazy(() => import("./pages/DashboardPurchases"));

// Módulo de VENDAS em lazy (só criamos os imports se a flag estiver ON)
const SalesManagement = features.sales ? React.lazy(() => import("./pages/SalesManagement")) : null;
const SalespersonPerformance = features.sales ? React.lazy(() => import("./pages/SalespersonPerformance")) : null;
const DashboardSales = features.sales ? React.lazy(() => import("./pages/DashboardSales")) : null;

const queryClient = new QueryClient();

// Guard das rotas de vendas: se desligado, redireciona pra home
function SalesRoute({ element }: { element: JSX.Element }) {
  if (!features.sales) return <Navigate to="/" replace />;
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      }
    >
      {element}
    </React.Suspense>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <LoginForm />;

  return (
    <BrowserRouter>
      <StatePersistenceProvider>
        <div className="min-h-screen flex w-full bg-background">
          <TestSidebar />
          <div className="flex-1 flex flex-col">
            <AppHeader />
            <main className="flex-1 p-4 md:p-6">
              <React.Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                  </div>
                }
              >
                <Routes>
                  {/* HOME / Financeiro */}
                  <Route path="/" element={<DashboardPayables />} />
                  <Route path="/dashboard/financial" element={<DashboardFinancial />} />
                  <Route path="/dashboard/purchases" element={<DashboardPurchases />} />

                  {/* VENDAS (só existem quando a flag está ON) */}
                  {features.sales && DashboardSales && (
                    <Route path="/dashboard/sales" element={<SalesRoute element={<DashboardSales />} />} />
                  )}
                  {features.sales && SalespersonPerformance && (
                    <Route path="/salesperson-performance" element={<SalesRoute element={<SalespersonPerformance />} />} />
                  )}
                  {features.sales && SalesManagement && (
                    <Route path="/sales-management" element={<SalesRoute element={<SalesManagement />} />} />
                  )}

                  {/* Financeiro / Cadastros / Relatórios / Bancos / Pedidos */}
                  <Route path="/accounts-payable" element={<AccountsPayable />} />
                  <Route path="/accounts-payable/new" element={<NewBill />} />
                  <Route path="/bills/:id" element={<BillDetail />} />
                  <Route path="/bills/:id/edit" element={<EditBill />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/suppliers/new" element={<NewSupplier />} />
                  <Route path="/suppliers/:id" element={<SupplierDetail />} />
                  <Route path="/suppliers/:id/edit" element={<EditSupplier />} />
                  <Route path="/bank-accounts" element={<BankAccounts />} />
                  <Route path="/bank-accounts/new" element={<NewBankAccount />} />
                  <Route path="/bank-accounts/:id" element={<BankAccountDetail />} />
                  <Route path="/bank-accounts/:id/edit" element={<EditBankAccount />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/new" element={<NewOrder />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/orders/:id/edit" element={<EditOrder />} />
                  <Route path="/recurring-bills" element={<RecurringBills />} />
                  <Route path="/filiais" element={<ManageFiliais />} />
                  <Route path="/pessoas" element={<Pessoas />} />
                  <Route path="/entidades-corporativas" element={<EntidadesCorporativas />} />
                  <Route path="/papeis" element={<GerenciarPapeis />} />
                  <Route path="/teste" element={<TestePage />} />
                  <Route path="/settings" element={<Cadastros />} />
                  <Route path="/reports" element={<Reports />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </React.Suspense>
            </main>
          </div>
          <UndoRedoManager />
        </div>
      </StatePersistenceProvider>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
