-- Ativar realtime para a tabela de auditoria (opcional, para atualizações em tempo real)
ALTER TABLE ap_audit_log REPLICA IDENTITY FULL;

-- Adicionar ao realtime publication se não estiver
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'ap_audit_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ap_audit_log;
  END IF;
END $$;