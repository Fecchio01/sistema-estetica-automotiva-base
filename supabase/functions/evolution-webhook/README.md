# Evolution webhook

Configure estas variáveis privadas na Edge Function:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `EVOLUTION_INSTANCE`
- `EVOLUTION_COMPANY_ID`
- `EVOLUTION_WEBHOOK_SECRET`

Configure a Evolution para enviar `x-evolution-webhook-secret` com o mesmo valor de `EVOLUTION_WEBHOOK_SECRET`. A função não aceita `company_id` vindo do evento: a empresa é definida pela configuração privada da instância.
