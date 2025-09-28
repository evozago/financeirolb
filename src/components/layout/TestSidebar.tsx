import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Building2, UserCheck } from 'lucide-react';

export function TestSidebar() {
  return (
    <div className="w-64 bg-gray-100 p-4">
      <h2 className="text-lg font-bold mb-4">TESTE SIDEBAR</h2>
      
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-600">CADASTROS</h3>
        
        <NavLink 
          to="/pessoas" 
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-200"
        >
          <Users className="h-4 w-4" />
          🔥 PESSOAS TESTE
        </NavLink>
        
        <NavLink 
          to="/entidades-corporativas" 
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-200"
        >
          <Building2 className="h-4 w-4" />
          Entidades
        </NavLink>
        
        <NavLink 
          to="/papeis" 
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-200 bg-yellow-200"
        >
          <UserCheck className="h-4 w-4" />
          ✨ PAPÉIS/CATEGORIAS ✨
        </NavLink>
      </div>
    </div>
  );
}
