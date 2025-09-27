import { supabase } from "@/integrations/supabase/client";

interface SalespersonRole {
  id: string;
  nome: string;
}

export const fetchSalespersonRole = async (): Promise<{ id: string }> => {
  const { data, error } = await supabase
    .from('papeis')
    .select<SalespersonRole>('id, nome')
    .ilike('nome', 'vendedor%');

  if (error) throw error;

  const role = data?.find((papel) => papel.nome.toLowerCase() === 'vendedora')
    ?? data?.find((papel) => papel.nome.toLowerCase() === 'vendedor');

  if (!role) {
    throw new Error('Papel de vendedora/vendedor não encontrado');
  }

  return { id: role.id };
};
