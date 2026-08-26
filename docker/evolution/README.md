# Evolution API local

Esta configuração sobe uma Evolution API local para testes do Atelier OS.

1. Copie `.env.example` para `.env` e altere `AUTHENTICATION_API_KEY`.
2. Execute `docker compose up -d` nesta pasta.
3. Crie a instância `atelier` usando a chave configurada.
4. No Atelier OS, use `EVOLUTION_API_URL=http://localhost:8080`, a mesma chave e `EVOLUTION_INSTANCE=atelier`.

O volume `evolution_instances` mantém a sessão da instância entre reinícios. Não envie o arquivo `.env` para o GitHub.
