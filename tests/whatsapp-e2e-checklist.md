# Checklist de validação WhatsApp

## Cenários automatizados locais

Executados por `tests/whatsapp-e2e.test.mjs`:

1. Rota de conexão
2. Rota de QR Code
3. Autenticação do webhook
4. Bloqueio de instância desconhecida
5. Mensagem recebida
6. Mensagem enviada
7. Contador de não lidas
8. Vínculo entre mensagem, conversa e empresa
9. Idempotência por id remoto
10. Normalização de telefone
11. Envio de texto
12. Envio de mídia
13. Limite de mídia
14. Permissão por função
15. Escape e ordenação da inbox

## Cenários dependentes de Evolution real

Ainda dependem de uma URL, chave e instância Evolution configuradas:

- escanear QR Code real;
- receber mensagem real;
- receber imagem real e gerar URL assinada;
- responder pelo WhatsApp real;
- confirmar atualização em duas abas simultâneas.
