# Configuração da central WhatsApp

## Pré-requisitos

O sistema precisa de uma instância Evolution API acessível por HTTPS. O computador local não precisa executar Docker se a Evolution estiver hospedada em outro servidor.

## Variáveis do servidor local

Copie `.env.example` para `.env.local` e preencha somente no ambiente do servidor:

```text
EVOLUTION_API_URL=https://sua-evolution.exemplo
EVOLUTION_API_KEY=chave-privada-da-instancia
EVOLUTION_INSTANCE=atelier
EVOLUTION_WEBHOOK_URL=https://seu-supabase.exemplo/functions/v1/evolution-webhook
EVOLUTION_WEBHOOK_SECRET=segredo-longo-e-aleatorio
```

Nunca coloque `EVOLUTION_API_KEY` em código do navegador, GitHub ou mensagem de chat.

## Edge Function

Configure na função `evolution-webhook`:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
EVOLUTION_INSTANCE
EVOLUTION_COMPANY_ID
EVOLUTION_WEBHOOK_SECRET
```

Na Evolution, configure o webhook para `EVOLUTION_WEBHOOK_URL` e o cabeçalho `x-evolution-webhook-secret`. Os eventos utilizados são conexão, QR Code, chats e mensagens.

## Conexão do celular

1. Abra o painel Conversas no Atelier OS.
2. Clique em “Conectar por QR Code”.
3. No celular, abra WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho.
4. Escaneie o QR Code.
5. Aguarde o estado mudar para conectado.

O painel é uma inbox própria do Atelier OS. Ele não incorpora a tela original do WhatsApp Web e não cria respostas automáticas.
