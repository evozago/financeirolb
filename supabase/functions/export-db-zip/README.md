# export-db-zip (sem DB_URL)

Pronto para deploy **sem** precisar de senha do Postgres. Usa `DEFAULT_TABLES` (extraído da sua lista) e o `SERVICE_ROLE_KEY` para exportar.

## Deploy
```bash
supabase login
supabase link --project-ref mnxemxgcucfuoedqkygw
supabase functions deploy export-db-zip
```

## Uso
```bash
curl -X POST "https://mnxemxgcucfuoedqkygw.functions.supabase.co/export-db-zip?token=LB-temp-Export-123!"
```

Você pode passar `include`/`exclude` por query ou JSON body.
