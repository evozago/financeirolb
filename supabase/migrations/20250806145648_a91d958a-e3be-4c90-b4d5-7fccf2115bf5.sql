-- Drop and recreate the function with new signature
DROP FUNCTION IF EXISTS public.get_ap_installments_complete();

CREATE OR REPLACE FUNCTION public.get_ap_installments_complete()
 RETURNS TABLE(id uuid, descricao text, fornecedor text, categoria text, valor numeric, data_vencimento date, data_pagamento date, status text, status_calculado text, numero_documento text, numero_nfe_display text, banco text, forma_pagamento text, observacoes text, comprovante_path text, numero_parcela integer, total_parcelas integer, valor_total_titulo numeric, eh_recorrente boolean, tipo_recorrencia text, dados_pagamento text, data_hora_pagamento timestamp with time zone, funcionario_id uuid, funcionario_nome text, conta_bancaria_id uuid, conta_banco_nome text, entidade_id uuid, entidade_nome text, entidade_tipo text, nfe_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, valor_fixo boolean)
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
    ap.valor_fixo
  FROM ap_installments ap
  LEFT JOIN funcionarios f ON ap.funcionario_id = f.id
  LEFT JOIN contas_bancarias cb ON ap.conta_bancaria_id = cb.id
  LEFT JOIN entidades e ON ap.entidade_id = e.id
  LEFT JOIN nfe_data nfe ON ap.numero_nfe = nfe.id;
END;
$function$