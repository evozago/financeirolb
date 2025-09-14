-- verify_checks.sql — rode após aplicar os outros scripts

SELECT 'idx metas loja' AS check, count(*) FROM pg_indexes WHERE indexname='uq_store_monthly_sales_entity_year_month';
SELECT 'idx metas vendedora' AS check, count(*) FROM pg_indexes WHERE indexname='uq_sales_goals_salesperson_entity_year_month';
SELECT 'trigger store_monthly_sales' AS check, count(*) FROM pg_trigger WHERE tgname='trg_set_updated_at_store_monthly_sales';
SELECT 'trigger sales_goals' AS check, count(*) FROM pg_trigger WHERE tgname='trg_set_updated_at_sales_goals';

SELECT 'unicas count' AS check, count(*) FROM public.entidades_unicas;
SELECT 'map count' AS check, count(*) FROM public.entidade_map;

-- Amostras de duplicidades (se existirem)
SELECT * FROM public.vw_entidades_dup_cpf_cnpj LIMIT 20;
SELECT * FROM public.vw_entidades_dup_email LIMIT 20;
SELECT * FROM public.vw_entidades_dup_phone LIMIT 20;