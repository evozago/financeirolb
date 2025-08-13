-- Adicionar campo filial_id aos fornecedores
ALTER TABLE fornecedores 
ADD COLUMN filial_id uuid;

-- Adicionar campo filial_id às contas bancárias  
ALTER TABLE contas_bancarias
ADD COLUMN filial_id uuid;

-- Adicionar campo filial_id às parcelas do contas a pagar
ALTER TABLE ap_installments
ADD COLUMN filial_id uuid;

-- Adicionar chaves estrangeiras para referenciar a tabela entidades
ALTER TABLE fornecedores
ADD CONSTRAINT fk_fornecedores_filial 
FOREIGN KEY (filial_id) REFERENCES entidades(id);

ALTER TABLE contas_bancarias
ADD CONSTRAINT fk_contas_bancarias_filial 
FOREIGN KEY (filial_id) REFERENCES entidades(id);

ALTER TABLE ap_installments
ADD CONSTRAINT fk_ap_installments_filial 
FOREIGN KEY (filial_id) REFERENCES entidades(id);

-- Atualizar a função get_ap_installments_complete para incluir dados da filial
CREATE OR REPLACE FUNCTION public.get_ap_installments_complete()
 RETURNS TABLE(id uuid, descricao text, fornecedor text, categoria text, valor numeric, data_vencimento date, data_pagamento date, status text, status_calculado text, numero_documento text, numero_nfe_display text, banco text, forma_pagamento text, observacoes text, comprovante_path text, numero_parcela integer, total_parcelas integer, valor_total_titulo numeric, eh_recorrente boolean, tipo_recorrencia text, dados_pagamento text, data_hora_pagamento timestamp with time zone, funcionario_id uuid, funcionario_nome text, conta_bancaria_id uuid, conta_banco_nome text, entidade_id uuid, entidade_nome text, entidade_tipo text, nfe_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, valor_fixo boolean, filial_id uuid, filial_nome text, filial_cnpj text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id,
    ap.descricao,
    ap.fornecedor,
    ap.categoria,
    ap.valor,
    ap.data_vencimento,
    ap.data_pagamento,
    ap.status,
    CASE 
      WHEN ap.data_pagamento IS NOT NULL THEN 'pago'::text
      WHEN ap.data_vencimento < CURRENT_DATE THEN 'vencido'::text
      ELSE 'aberto'::text
    END as status_calculado,
    ap.numero_documento,
    COALESCE(nfe.numero_nfe, ap.numero_documento) as numero_nfe_display,
    ap.banco,
    ap.forma_pagamento,
    ap.observacoes,
    ap.comprovante_path,
    ap.numero_parcela,
    ap.total_parcelas,
    ap.valor_total_titulo,
    ap.eh_recorrente,
    ap.tipo_recorrencia,
    ap.dados_pagamento,
    ap.data_hora_pagamento,
    ap.funcionario_id,
    f.nome as funcionario_nome,
    ap.conta_bancaria_id,
    cb.nome_banco as conta_banco_nome,
    ap.entidade_id,
    e.nome as entidade_nome,
    e.tipo as entidade_tipo,
    ap.numero_nfe as nfe_id,
    ap.created_at,
    ap.updated_at,
    ap.valor_fixo,
    ap.filial_id,
    fil.nome as filial_nome,
    fil.cnpj_cpf as filial_cnpj
  FROM ap_installments ap
  LEFT JOIN funcionarios f ON ap.funcionario_id = f.id
  LEFT JOIN contas_bancarias cb ON ap.conta_bancaria_id = cb.id
  LEFT JOIN entidades e ON ap.entidade_id = e.id
  LEFT JOIN entidades fil ON ap.filial_id = fil.id
  LEFT JOIN nfe_data nfe ON ap.numero_nfe = nfe.id
  WHERE ap.deleted_at IS NULL;
END;
$function$

-- Função para identificar filial pelo CNPJ automaticamente
CREATE OR REPLACE FUNCTION public.get_filial_by_cnpj(cnpj_search text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  filial_id_result uuid;
BEGIN
  -- Remove formatação do CNPJ para comparação
  cnpj_search := regexp_replace(cnpj_search, '[^0-9]', '', 'g');
  
  -- Busca entidade com CNPJ correspondente
  SELECT id INTO filial_id_result
  FROM entidades 
  WHERE regexp_replace(cnpj_cpf, '[^0-9]', '', 'g') = cnpj_search
    AND ativo = true
  LIMIT 1;
  
  RETURN filial_id_result;
END;
$function$

-- Trigger para mapear filial automaticamente na importação
CREATE OR REPLACE FUNCTION public.auto_map_filial()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cnpj_destinatario text;
  filial_id_found uuid;
BEGIN
  -- Se filial_id já está definido, não faz nada
  IF NEW.filial_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Busca o CNPJ destinatário na NFe relacionada
  IF NEW.numero_nfe IS NOT NULL THEN
    SELECT cnpj_destinatario INTO cnpj_destinatario
    FROM nfe_data 
    WHERE id = NEW.numero_nfe;
    
    -- Se encontrou CNPJ destinatário, busca a filial correspondente
    IF cnpj_destinatario IS NOT NULL THEN
      SELECT get_filial_by_cnpj(cnpj_destinatario) INTO filial_id_found;
      
      IF filial_id_found IS NOT NULL THEN
        NEW.filial_id := filial_id_found;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$

-- Criar trigger para mapear filial automaticamente
CREATE TRIGGER trigger_auto_map_filial
  BEFORE INSERT OR UPDATE ON ap_installments
  FOR EACH ROW
  EXECUTE FUNCTION auto_map_filial();