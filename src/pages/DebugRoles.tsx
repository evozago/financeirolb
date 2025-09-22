import React from 'react';
import RoleSystemFixer from '@/components/debug/RoleSystemFixer';

const DebugRoles: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Debug - Sistema de Papéis</h1>
        <p className="text-gray-600 mt-2">
          Esta página permite testar e corrigir problemas no sistema de papéis.
        </p>
      </div>
      
      <RoleSystemFixer />
    </div>
  );
};

export default DebugRoles;
