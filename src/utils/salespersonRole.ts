import { supabase } from "@/integrations/supabase/client";

interface SalespersonRole {
  id: string;
  nome: string;
}

export const fetchSalespersonRole = async (): Promise<{ id: string }> => {
  const { data, error } = await supabase
    .from('papeis')
    .select('id, nome')
    .ilike('nome', 'vendedor%');

  if (error) throw error;

  const roles = (data ?? []) as SalespersonRole[];
  const role = roles.find((papel) => papel.nome.toLowerCase() === 'vendedora')
    ?? roles.find((papel) => papel.nome.toLowerCase() === 'vendedor');

  if (!role) {
    throw new Error('Papel de vendedora/vendedor não encontrado');
  }

  return { id: role.id };
};
