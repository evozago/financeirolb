// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">SiS Lui Bambini</h1>
          <p className="text-xl text-muted-foreground mb-8">Sistema de Gestão Empresarial</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold mb-2">Contas a Pagar</h3>
              <p className="text-muted-foreground text-sm">Gerencie suas contas e pagamentos</p>
            </div>
            
            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold mb-2">Contas Recorrentes</h3>
              <p className="text-muted-foreground text-sm">Controle contas mensais automáticas</p>
            </div>
            
            <div className="p-6 border rounded-lg hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold mb-2">Fornecedores</h3>
              <p className="text-muted-foreground text-sm">Cadastro e gestão de fornecedores</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
