-- Update the generate_recurring_bill_occurrences function to handle deleted installments
CREATE OR REPLACE FUNCTION public.generate_recurring_bill_occurrences(p_recurring_bill_id uuid, p_months_ahead integer DEFAULT 2)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  bill_record recurring_bills%rowtype;
  current_month date;
  end_month date;
  occurrence_closing_date date;
  occurrence_due_date date;
begin
  -- Pega dados da conta
  select * into bill_record from recurring_bills where id = p_recurring_bill_id;
  if not found then
    raise exception 'Recurring bill not found';
  end if;

  -- Mês atual e até N meses à frente
  current_month := date_trunc('month', current_date)::date;
  end_month := (current_month + (p_months_ahead || ' months')::interval)::date;

  -- Apaga ocorrências futuras
  delete from recurring_bill_occurrences
  where recurring_bill_id = p_recurring_bill_id
    and year_month >= current_month;

  -- Gera ocorrências mês a mês
  while current_month <= end_month loop
    -- Se a conta tiver fim
    if coalesce(bill_record.open_ended,true) = false
       and bill_record.end_date is not null
       and current_month > date_trunc('month', bill_record.end_date)::date then
      exit;
    end if;

    -- Fecha fatura
    if bill_record.closing_day is not null then
      occurrence_closing_date := (current_month + make_interval(days => bill_record.closing_day - 1))::date;
      if extract(month from occurrence_closing_date) <> extract(month from current_month) then
        occurrence_closing_date := (current_month + interval '1 month' - interval '1 day')::date;
      end if;
    else
      occurrence_closing_date := null;
    end if;

    -- Vencimento
    occurrence_due_date := (current_month + make_interval(days => bill_record.due_day - 1))::date;
    if extract(month from occurrence_due_date) <> extract(month from current_month) then
      occurrence_due_date := (current_month + interval '1 month' - interval '1 day')::date;
    end if;

    -- Insere ocorrência
    insert into recurring_bill_occurrences (
      recurring_bill_id, year_month, closing_date, due_date, expected_amount
    ) values (
      p_recurring_bill_id, current_month, occurrence_closing_date, occurrence_due_date, bill_record.expected_amount
    );

    current_month := (current_month + interval '1 month')::date;
  end loop;
end;
$function$;

-- Update the create_payable_from_recurring function to handle deleted installments and reprocessing
CREATE OR REPLACE FUNCTION public.create_payable_from_recurring(p_recurring_bill_id uuid, p_year_month date DEFAULT date_trunc('month'::text, now()), p_amount numeric DEFAULT NULL::numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_bill           public.recurring_bills%rowtype;
  v_occurrence     public.recurring_bill_occurrences%rowtype;
  v_days_in_month  int;
  v_closing_date   date;
  v_due_date       date;
  v_fornecedor     text;
  v_categoria      text;
  v_new_id         uuid;
  v_existing_installment_id uuid;
begin
  -- (a) conta recorrente ativa
  select *
    into v_bill
  from public.recurring_bills
  where id = p_recurring_bill_id
    and active = true;

  if v_bill.id is null then
    raise exception 'Conta recorrente não encontrada ou inativa (%).', p_recurring_bill_id
      using errcode = 'P0001';
  end if;

  -- (b) nomes (texto) p/ fornecedor & categoria
  select f.nome into v_fornecedor
  from public.fornecedores f
  where f.id = v_bill.supplier_id;

  select c.nome into v_categoria
  from public.categorias_produtos c
  where c.id = v_bill.category_id;

  v_fornecedor := coalesce(v_fornecedor, 'Fornecedor não informado');
  v_categoria  := coalesce(v_categoria , 'Geral');

  -- (c) datas do mês alvo
  v_days_in_month := extract(day from (date_trunc('month', p_year_month) + interval '1 month - 1 day')::date);

  if v_bill.closing_day is not null then
    v_closing_date := (date_trunc('month', p_year_month)::date
                      + (least(v_bill.closing_day, v_days_in_month) - 1) * interval '1 day')::date;
  end if;

  v_due_date := (date_trunc('month', p_year_month)::date
                + (least(v_bill.due_day, v_days_in_month) - 1) * interval '1 day')::date;

  -- (d) garante/obtém occurrence do mês
  insert into public.recurring_bill_occurrences as rbo
    (recurring_bill_id, year_month, closing_date, due_date, expected_amount)
  values
    (v_bill.id, date_trunc('month', p_year_month)::date, v_closing_date, v_due_date, coalesce(v_bill.expected_amount, 0))
  on conflict (recurring_bill_id, year_month) do update
    set closing_date    = excluded.closing_date,
        due_date        = excluded.due_date,
        expected_amount = excluded.expected_amount,
        updated_at      = now()
  returning * into v_occurrence;

  -- (e) verifica se já existe título ativo (não deletado) para esta ocorrência
  select id into v_existing_installment_id
  from public.ap_installments ai
  where ai.recurring_occurrence_id = v_occurrence.id
    and ai.deleted_at is null
  limit 1;

  -- Se já existe título ativo, retorna o ID existente
  if v_existing_installment_id is not null then
    return v_existing_installment_id;
  end if;

  -- (f) cria novo título em ap_installments (somente colunas existentes)
  insert into public.ap_installments (
    descricao,
    fornecedor,
    valor,
    data_vencimento,
    categoria,
    status,
    observacoes,
    numero_parcela,
    total_parcelas,
    valor_total_titulo,
    eh_recorrente,
    tipo_recorrencia,
    valor_fixo,
    data_emissao,
    recurring_occurrence_id
  )
  values (
    v_bill.name,
    v_fornecedor,
    coalesce(p_amount, v_occurrence.expected_amount),
    v_occurrence.due_date,
    v_categoria,
    'aberto',
    'Lançado automaticamente a partir de Conta Recorrente',
    1,
    1,
    coalesce(p_amount, v_occurrence.expected_amount),
    true,
    'mensal',
    true,
    coalesce(v_occurrence.closing_date, date_trunc('month', p_year_month)::date),
    v_occurrence.id
  )
  returning id into v_new_id;

  return v_new_id;
end;
$function$;