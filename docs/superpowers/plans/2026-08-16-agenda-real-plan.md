# Agenda real e reservas persistidas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir semanas navegáveis com datas reais e permitir que administradora/recepção criem reservas persistidas em `work_orders` no Supabase.

**Architecture:** Um módulo de agenda será responsável pelo período visual e pelo formulário; um adaptador de dados consultará clientes, veículos, responsáveis e ordens; o salvamento reutilizará as políticas RLS de `work_orders`. A UI atualizará a grade após cada operação, sem recarregar a página.

**Tech Stack:** JavaScript ES modules, HTML/CSS existente, Supabase JS, Node test runner.

## Global Constraints

- Usar o projeto Supabase de teste já configurado.
- Usar o fuso `America/Sao_Paulo` para exibição e persistir `scheduled_at` em ISO 8601.
- Não inserir dados fictícios na agenda.
- Não expor service role ou chaves secretas no navegador.
- Administrador(a) e recepção podem criar reservas; funcionários não podem criar ordens globais.

### Task 1: Criar utilitários testáveis de período e payload

**Files:**
- Create: `src/agenda-utils.js`
- Test: `tests/agenda-utils.test.mjs`

**Interfaces:**
- `getWeekStart(date): Date` retorna a segunda-feira às 00:00:00 do período informado.
- `getWeekDays(referenceDate): Date[]` retorna exatamente sete dias consecutivos.
- `buildScheduledAt(dateValue, timeValue): string` retorna ISO válido e rejeita data/hora inválidas ou anteriores ao momento atual.
- `buildBookingPayload(input, profile): object` retorna os campos necessários de `work_orders`.

- [ ] **Step 1: Write failing tests** para segunda-feira, virada de mês, sete dias, payload e bloqueio de datas passadas.
- [ ] **Step 2: Run** `node --test tests/agenda-utils.test.mjs`; confirmar falha por módulo ausente.
- [ ] **Step 3: Implement** as quatro funções sem dependência de DOM ou Supabase.
- [ ] **Step 4: Run** o teste novamente e confirmar aprovação.

### Task 2: Carregar e salvar reservas no Supabase

**Files:**
- Create: `src/agenda-data.js`
- Modify: `src/live-data.js`
- Test: `tests/agenda-data.test.mjs`

**Interfaces:**
- `loadAgendaData(profile, rangeStart, rangeEnd)` consulta `work_orders` da empresa entre os limites e retorna ordens, clientes, veículos e responsáveis.
- `createBooking(profile, input)` insere em `work_orders` com `status: 'scheduled'`, `company_id`, `responsible_id`, `scheduled_at` e `service_description`.

- [ ] **Step 1: Write failing tests** com um cliente Supabase falso verificando filtros de empresa/período e payload do insert.
- [ ] **Step 2: Run** `node --test tests/agenda-data.test.mjs`; confirmar falha por módulo ausente.
- [ ] **Step 3: Implement** consultas usando apenas o cliente público autenticado e normalizar mensagens de erro.
- [ ] **Step 4: Atualizar** o evento de dados ao vivo para que a agenda use as ordens reais, sem substituir a grade por dados estáticos.
- [ ] **Step 5: Run** os testes da tarefa e a suíte completa.

### Task 3: Implementar navegação semanal e formulário de reserva

**Files:**
- Create: `src/agenda-ui.js`
- Modify: `app.js`, `index.html`, `styles.css`

**Interfaces:**
- `renderAgenda(container, state)` monta cabeçalho, botões de período, grade de sete dias e reservas do intervalo.
- `openBookingForm()` abre o formulário com dados reais carregados.
- `refreshAgenda()` recarrega o intervalo atual e atualiza a tela sem F5.

- [ ] **Step 1: Substituir** o conteúdo estático do módulo agenda por um container controlado por `agenda-ui.js`.
- [ ] **Step 2: Adicionar** “Semana anterior” e “Próxima semana”, mantendo a semana selecionada no estado da UI.
- [ ] **Step 3: Adicionar** botão “Hoje” para voltar ao período atual.
- [ ] **Step 4: Criar** formulário com cliente, veículo dependente, serviço, responsável, data e horário.
- [ ] **Step 5: Validar** campos obrigatórios, cliente/veículo da mesma empresa e data passada antes do insert.
- [ ] **Step 6: Após salvar**, fechar o formulário, consultar novamente o intervalo e mostrar confirmação.
- [ ] **Step 7: Rodar** `node --check` nos módulos e os testes existentes.

### Task 4: Garantir permissões e verificação local

**Files:**
- Modify: `src/permissions.js`, `src/role-access.js` only if required by the existing capability map.
- Test: `tests/role-access.test.mjs`, `tests/agenda-ui.test.mjs`

- [ ] **Step 1: Confirmar** que administrador(a) e recepção veem o botão e funcionário não.
- [ ] **Step 2: Testar** que a reserva não usa responsáveis genéricos e lista somente perfis ativos da empresa.
- [ ] **Step 3: Rodar** `npm.cmd test -- --runInBand`.
- [ ] **Step 4: Verificar** o servidor em `http://127.0.0.1:4174/`, abrir a agenda, navegar semanas e abrir o formulário.
- [ ] **Step 5: Fazer** uma reserva de teste apenas se houver confirmação para criar esse registro no Supabase de teste; consultar a linha criada e removê-la apenas com autorização explícita.
