-- Ativar o sistema de auditoria para a tabela ap_installments
-- Criar triggers para registrar todas as operações (INSERT, UPDATE, DELETE)

-- Trigger para auditoria
CREATE TRIGGER trigger_audit_ap_installments
  AFTER INSERT OR UPDATE OR DELETE ON ap_installments
  FOR EACH ROW
  EXECUTE FUNCTION audit_ap_installments();

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

-- Verificar se a tabela ap_installments já está na publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'ap_installments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ap_installments;
  END IF;
END $$;