-- 1) Extensão para UUID (necessária para gen_random_uuid)
create extension if not exists pgcrypto;

-- 2) Função genérica para manter updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- (Recrie os triggers caso já tenham falhado)
drop trigger if exists update_recurring_bills_updated_at on public.recurring_bills;
create trigger update_recurring_bills_updated_at
before update on public.recurring_bills
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_recurring_bill_occurrences_updated_at on public.recurring_bill_occurrences;
create trigger update_recurring_bill_occurrences_updated_at
before update on public.recurring_bill_occurrences
for each row
execute function public.update_updated_at_column();

-- 3) Evitar duplicidade de ocorrência por mês (uma ocorrência por mês por conta)
alter table public.recurring_bill_occurrences
  add constraint uq_rbo_bill_month unique (recurring_bill_id, year_month);

-- 4) Policies: remover dependência de is_admin() e liberar delete para autenticados
drop policy if exists "Only admins can delete recurring_bills" on public.recurring_bills;
drop policy if exists "Only admins can delete recurring_bill_occurrences" on public.recurring_bill_occurrences;

create policy "Authenticated users can delete recurring_bills"
on public.recurring_bills
for delete
using (true);

create policy "Authenticated users can delete recurring_bill_occurrences"
on public.recurring_bill_occurrences
for delete
using (true);

-- 5) VIEW para o Dashboard (próximos 7 dias: fechamento OU vencimento)
drop view if exists public.recurring_events_next7;
create view public.recurring_events_next7 as
with params as (
  select current_date::date as today, (current_date + interval '7 days')::date as until
)
select
  rbo.id as occurrence_id,
  rb.id  as recurring_bill_id,
  rb.name,
  rb.supplier_id,
  rb.category_id,
  rb.expected_amount as default_expected_amount,
  rbo.expected_amount,
  rbo.year_month,
  rbo.closing_date,
  rbo.due_date,
  rb.open_ended,
  rb.end_date,
  rb.active,
  rbo.is_closed_for_month,
  (case
     when rbo.closing_date is not null
          and rbo.closing_date between (select today from params) and (select until from params)
       then rbo.closing_date
     when rbo.due_date between (select today from params) and (select until from params)
       then rbo.due_date
     else null
   end) as next_event_date,
  (case
     when rbo.closing_date is not null
          and rbo.closing_date between (select today from params) and (select until from params)
       then 'closing'
     when rbo.due_date between (select today from params) and (select until from params)
       then 'due'
     else null
   end) as next_event_type
from public.recurring_bill_occurrences rbo
join public.recurring_bills rb on rb.id = rbo.recurring_bill_id
where rb.active = true
  and coalesce(rb.open_ended, true) = true
  and (rb.end_date is null or date_trunc('month', rb.end_date)::date >= rbo.year_month)
  and rbo.is_closed_for_month = false
  and (
    (rbo.closing_date is not null and rbo.closing_date between (select today from params) and (select until from params))
    or (rbo.due_date between (select today from params) and (select until from params))
  )
order by next_event_date asc nulls last;

-- 6) RPC para "marcar como concluída no mês vigente"
create or replace function public.mark_recurring_bill_done(p_recurring_bill_id uuid, p_year_month date)
returns void
language sql
security definer
set search_path = public
as $$
  update public.recurring_bill_occurrences
  set is_closed_for_month = true,
      closed_at = now()
  where recurring_bill_id = p_recurring_bill_id
    and year_month = date_trunc('month', p_year_month)::date;
$$;

-- 7) (Opcional) RPC para desfazer conclusão
create or replace function public.unmark_recurring_bill_done(p_recurring_bill_id uuid, p_year_month date)
returns void
language sql
security definer
set search_path = public
as $$
  update public.recurring_bill_occurrences
  set is_closed_for_month = false,
      closed_at = null
  where recurring_bill_id = p_recurring_bill_id
    and year_month = date_trunc('month', p_year_month)::date;
$$;