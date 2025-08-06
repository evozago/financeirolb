-- Adicionar coluna data_emissao na tabela ap_installments
ALTER TABLE ap_installments ADD COLUMN IF NOT EXISTS data_emissao date;

-- Comentário explicando o campo
COMMENT ON COLUMN ap_installments.data_emissao IS 'Data de emissão da nota fiscal extraída do XML';