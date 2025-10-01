import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';

export function AppHeader() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="font-bold text-xl text-primary hover:text-primary/80 transition-colors"
          >
            SiS Lui Bambini
          </button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </header>
  );
}