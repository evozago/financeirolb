
// src/integrations/supabase/client.ts
// Cliente do Supabase pronto para uso no browser (pode ficar público).
// OBS: NUNCA exponha a service_role no frontend.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://mnxemxgcucfuoedqkygw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ueGVteGdjdWNmdW9lZHFreWd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTY5MTYsImV4cCI6MjA2OTQ3MjkxNn0.JeDMKgnwRcK71KOIun8txqFFBWEHSKdPzIF8Qm9tw1o'

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
