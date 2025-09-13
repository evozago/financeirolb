# export-db-zip (Supabase Edge Function)

Exporta tabelas **do schema `public`** que **têm dados**, cada uma em CSV, gera um **ZIP** e envia para o **Storage** no bucket `exports`. Retorna uma **URL assinada** (1h).

## Rotas
`POST /export-db-zip?token=YOUR_TOKEN&include=a,b&exclude=x,y`

Body opcional (JSON):
```json
{ "include": ["table1", "table2"], "exclude": ["table3"] }
```

## Variáveis de ambiente (secrets)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`
- `EXPORT_TOKEN`

## Deploy (CLI)
```bash
supabase link --project-ref <REF>
supabase secrets set SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." SUPABASE_DB_URL="..." EXPORT_TOKEN="..."
supabase functions deploy export-db-zip
```

## Uso
```bash
curl -X POST "https://<REF>.functions.supabase.co/export-db-zip?token=<TOKEN>"
curl -X POST "https://<REF>.functions.supabase.co/export-db-zip?token=<TOKEN>&include=orders,customers"
curl -X POST "https://<REF>.functions.supabase.co/export-db-zip?token=<TOKEN>&exclude=logs,temp_table"
curl -X POST "https://<REF>.functions.supabase.co/export-db-zip?token=<TOKEN>" -H "content-type: application/json" -d '{"include":["orders"],"exclude":["logs"]}'
```

## Observações
- Ignora **views**.
- Usa paginação `PAGE_SIZE = 1000`.
- Salva no Storage: `exports/<timestamp>/public_export_<timestamp>.zip`.
