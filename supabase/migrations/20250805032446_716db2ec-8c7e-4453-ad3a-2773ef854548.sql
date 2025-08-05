-- Primeiro vamos verificar se as políticas estão corretas para fornecedores
-- Vamos recriar as políticas com permissões adequadas

-- Remover políticas existentes
DROP POLICY IF EXISTS "Authenticated users can insert fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated users can update fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated users can view fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Only admins can delete fornecedores" ON public.fornecedores;

-- Criar políticas com permissões corretas
CREATE POLICY "Enable insert for authenticated users" ON public.fornecedores
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" ON public.fornecedores
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable update for authenticated users" ON public.fornecedores
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for admins only" ON public.fornecedores
  FOR DELETE TO authenticated
  USING (is_admin());