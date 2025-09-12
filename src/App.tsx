import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { Toaster } from './components/ui/toaster';
import AppHeader from './components/layout/AppHeader';
import AppSidebar from './components/layout/AppSidebar';
import LoginForm from './components/auth/LoginForm';

// Importação das páginas com caminhos relativos
import Index from './pages/Index';
import AccountsPayable from './pages/AccountsPayable';
import NewBill from './pages/NewBill';
import EditBill from './pages/EditBill';
import BillDetail from './pages/BillDetail';
import DashboardFinancial from './pages/DashboardFinancial';
import BankAccounts from './pages/BankAccounts';
import NewBankAccount from './pages/NewBankAccount';
import EditBankAccount from './pages/EditBankAccount';
import BankAccountDetail from './pages/BankAccountDetail';
import Suppliers from './pages/Suppliers';
import NewSupplier from './pages/NewSupplier';
import EditSupplier from './pages/EditSupplier';
import SupplierDetail from './pages/SupplierDetail';
import Orders from './pages/Orders';
import NewOrder from './pages/NewOrder';
import EditOrder from './pages/EditOrder';
import OrderDetail from './pages/OrderDetail';
import Cadastros from './pages/Cadastros';
import Pessoas from './pages/Pessoas';
import RecurringBills from './pages/RecurringBills';
import DashboardSales from './pages/DashboardSales';
import SalesManagement from './pages/SalesManagement';
import SalespersonPerformance from './pages/SalespersonPerformance';
import EntidadesCorporativas from './pages/EntidadesCorporativas';
import ManageFiliais from './pages/ManageFiliais';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { SalesDataProvider } from './hooks/useSalesData';

function App() {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Contas a Pagar */}
            <Route path="/accounts-payable" element={<AccountsPayable />} />
            <Route path="/accounts-payable/new" element={<NewBill />} />
            <Route path="/accounts-payable/edit/:id" element={<EditBill />} />
            <Route path="/accounts-payable/detail/:id" element={<BillDetail />} />

            {/* Contas Bancárias */}
            <Route path="/bank-accounts" element={<BankAccounts />} />
            <Route path="/bank-accounts/new" element={<NewBankAccount />} />
            <Route path="/bank-accounts/edit/:id" element={<EditBankAccount />} />
            <Route path="/bank-accounts/detail/:id" element={<BankAccountDetail />} />
            
            {/* Fornecedores */}
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/suppliers/new" element={<NewSupplier />} />
            <Route path="/suppliers/edit/:id" element={<EditSupplier />} />
            <Route path="/suppliers/detail/:id" element={<SupplierDetail />} />

            {/* Pedidos de Compra */}
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/new" element={<NewOrder />} />
            <Route path="/orders/edit/:id" element={<EditOrder />} />
            <Route path="/orders/detail/:id" element={<OrderDetail />} />
            
            {/* Vendas */}
            <Route path="/sales/dashboard" element={<DashboardSales />} />
            <Route 
              path="/sales/management" 
              element={
                <SalesDataProvider>
                  <SalesManagement />
                </SalesDataProvider>
              } 
            />
            <Route path="/sales/performance" element={<SalespersonPerformance />} />

            {/* Cadastros Gerais */}
            <Route path="/cadastros" element={<Cadastros />} />
            <Route path="/cadastros/pessoas" element={<Pessoas />} />
            <Route path="/cadastros/filiais" element={<ManageFiliais />} />
            <Route path="/cadastros/entidades" element={<EntidadesCorporativas />} />

            {/* Outros Módulos */}
            <Route path="/recurring-bills" element={<RecurringBills />} />
            <Route path="/financial-dashboard" element={<DashboardFinancial />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            
            <Route path="/login" element={<Navigate to="/" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

