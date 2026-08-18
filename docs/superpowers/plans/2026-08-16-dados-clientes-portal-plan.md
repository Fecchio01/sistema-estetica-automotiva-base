# Dados reais de clientes e portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Conectar clientes, veículos, ordens, agenda, faturamento e portal à mesma fonte de dados do Supabase.

**Architecture:** `src/clients-data.js` concentra leitura, criação e arquivamento de clientes; `src/portal-data.js` monta links e consulta o portal; `app.js` passa a renderizar somente dados carregados. Uma migração adiciona políticas e uma função segura para o portal.

## Tasks

### 1. Banco e portal seguro

- Criar migração com políticas de arquivamento de clientes/veículos e leitura pública somente via RPC segura.
- Criar Edge Function `client-portal` para validar token, buscar ordem e retornar payload público.
- Criar Edge Function autenticada `order-link` para gerar token hash e URL da ordem.
- Verificar advisors e consultar contagens antes/depois.

### 2. Dados de clientes e veículos

- Criar `src/clients-data.js` com load/create/archive e testes com cliente Supabase falso.
- Substituir cadastro local por insert em `clients` e `vehicles`.
- Renderizar data real e contagem real de ordens.
- Adicionar arquivamento e atualizar imediatamente clientes, atendimento e agenda.

### 3. Ordens, agenda e indicadores

- Usar clientes/veículos reais no formulário de atendimento.
- Integrar a reserva existente ao catálogo de clientes reais.
- Remover “Aguardando aprovação” das métricas e filtros visíveis.
- Calcular faturamento somente de `work_orders.total_amount`.

### 4. Portal e verificação

- Criar rota pública `/portal/<token>` sem exigir sessão autenticada.
- Trocar link fixo por link retornado pela Edge Function e copiar para o clipboard.
- Testar token válido, inválido, expirado e dados públicos mínimos.
- Rodar `npm.cmd test -- --runInBand`, `node --check` e validação no navegador.
