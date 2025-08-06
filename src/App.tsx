import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { LoginForm } from "@/components/auth/LoginForm";
import { AppHeader } from "@/components/layout/AppHeader";
import DashboardPayables from "./pages/DashboardPayables";
import AccountsPayable from "./pages/AccountsPayable";
import NewBill from "./pages/NewBill";
import BillDetail from "./pages/BillDetail";
import EditBill from "./pages/EditBill";
import Suppliers from "./pages/Suppliers";
import SupplierDetail from "./pages/SupplierDetail";
import NewSupplier from "./pages/NewSupplier";
import EditSupplier from "./pages/EditSupplier";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <AppHeader />
        <Routes>
          <Route path="/" element={<DashboardPayables />} />
          <Route path="/accounts-payable" element={<AccountsPayable />} />
          <Route path="/accounts-payable/new" element={<NewBill />} />
          <Route path="/bills/:id" element={<BillDetail />} />
          <Route path="/bills/:id/edit" element={<EditBill />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/suppliers/new" element={<NewSupplier />} />
          <Route path="/suppliers/:id" element={<SupplierDetail />} />
          <Route path="/suppliers/:id/edit" element={<EditSupplier />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
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
