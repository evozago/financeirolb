// src/components/Sidebar.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { features } from "@/config/featureFlags";

const itemBase =
  "block rounded px-3 py-2 text-sm hover:bg-gray-100 transition-colors";
const itemActive = "bg-gray-200 font-semibold";

function NavItem({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link className={`${itemBase} ${active ? itemActive : ""}`} to={to}>
      {children}
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 border-r min-h-screen p-3 space-y-1">
      <div className="text-xs uppercase text-gray-500 px-3">Financeiro</div>
      <NavItem to="/">Dashboard</NavItem>
      {/* Coloque aqui outros itens do FINANCEIRO */}
      {/* <NavItem to="/financeiro/compras">Compras</NavItem> */}
      {/* <NavItem to="/financeiro/fluxo">Fluxo de Caixa</NavItem> */}

      {features.sales && (
        <>
          <div className="text-xs uppercase text-gray-500 px-3 mt-4">
            Vendas
          </div>
          <NavItem to="/vendas">Gestão de Vendas</NavItem>
          <NavItem to="/vendas/performance">Performance</NavItem>
        </>
      )}
    </aside>
  );
}
