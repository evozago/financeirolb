-- Update RLS policy for funcionarios table to allow authenticated users to insert employees
-- This is needed for the HR system to work properly

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Only admins can modify funcionarios" ON public.funcionarios;

-- Create a new policy that allows authenticated users to insert employees
CREATE POLICY "Authenticated users can create funcionarios"
ON public.funcionarios
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Keep the admin-only policies for UPDATE and DELETE for security
-- (These policies already exist and are appropriate)