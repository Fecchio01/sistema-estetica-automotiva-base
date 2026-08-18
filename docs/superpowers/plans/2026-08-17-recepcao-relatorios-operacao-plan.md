# Recepção com relatórios e operação completa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que a Recepção crie atendimentos, agendamentos e consulte relatórios por período, mantendo Administração e Funcionário com seus limites atuais.

**Architecture:** Ajustar a matriz de seções para expor Relatórios à Recepção e revisar os gatilhos de UI que abrem os formulários. Reutilizar o mesmo relatório em tempo real alimentado por `__liveServices`, sem criar uma segunda tela ou fonte de dados. As políticas existentes do Supabase continuam protegendo os registros por empresa.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Node test runner, Supabase Auth/RLS/Realtime.

## Global Constraints

- Recepção pode operar clientes, veículos, atendimentos, agenda e relatórios.
- Recepção não pode gerenciar usuários, configurações ou permissões.
- Funcionário continua sem acesso aos relatórios.
- Dados devem permanecer vinculados à empresa autenticada e atualizados em tempo real.
- Não criar dependências novas.

---

### Task 1: Corrigir matriz de acesso e garantir capacidades

**Files:**
- Modify: `src/permissions.js`
- Test: `tests/role-access.test.mjs`

**Interfaces:**
- Consumes: `canViewSection(role, section)` e `can(role, capability)`.
- Produces: `canViewSection('reception', 'relatorios') === true`, mantendo `manageUsers` e `manageSettings` falsos.

- [x] **Step 1: Write the failing test**

```js
test('recepção acessa relatórios sem receber poderes administrativos', () => {
  assert.equal(canViewSection('reception', 'relatorios'), true)
  assert.equal(can('reception', 'manageOrders'), true)
  assert.equal(can('reception', 'manageAgenda'), true)
  assert.equal(can('reception', 'manageUsers'), false)
  assert.equal(can('reception', 'manageSettings'), false)
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- --test-name-pattern="recepção acessa relatórios"`

Expected: FAIL because `relatorios` is absent from the reception section set.

- [x] **Step 3: Write minimal implementation**

Add `'relatorios'` to `sectionMatrix.reception` only. Do not add any administrator-only capability to `matrix.reception`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- --test-name-pattern="recepção acessa relatórios"`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/permissions.js tests/role-access.test.mjs
git commit -m "feat: allow reception to view reports"
```

### Task 2: Liberar os gatilhos de criação para a Recepção

**Files:**
- Modify: `app.js`, `src/client-live-ui.js`, `src/agenda-ui.js`
- Test: `tests/role-access.test.mjs`, existing data tests for order and agenda creation

**Interfaces:**
- Consumes: `can(role, 'manageOrders')`, `can(role, 'manageAgenda')`, `createWorkOrder`, and `createBooking`.
- Produces: authenticated Reception users can open and submit both forms; unauthorized Employee users remain blocked by section access and capability checks.

- [x] **Step 1: Write the failing test**

Add assertions that Reception has both creation capabilities and Employee does not:

```js
test('recepção pode lançar atendimento e agendamento', () => {
  assert.equal(can('reception', 'manageOrders'), true)
  assert.equal(can('reception', 'manageAgenda'), true)
  assert.equal(can('employee', 'manageOrders'), false)
  assert.equal(can('employee', 'manageAgenda'), false)
})
```

- [x] **Step 2: Run test to verify it fails if the UI guard is missing**

Run: `npm.cmd test -- --test-name-pattern="recepção pode lançar"`

Expected: the capability assertions pass against the existing matrix; inspect the UI path and add a focused test/guard if a handler still hard-codes administrator-only behavior.

- [x] **Step 3: Write minimal implementation**

Ensure the generic action opens `service-modal` for Reception when `section === 'atendimentos'`, and `agenda-ui.js` is mounted from the Reception agenda section. Any submit handler must use the current authenticated profile and existing data functions, with errors shown in the form.

- [x] **Step 4: Run tests to verify behavior**

Run: `npm.cmd test -- --test-name-pattern="atendimento|agendamento|recepção pode lançar"`

Expected: PASS with existing order/agenda data tests unchanged.

- [x] **Step 5: Commit**

```bash
git add app.js src/client-live-ui.js src/agenda-ui.js tests
git commit -m "fix: enable reception operational forms"
```

### Task 3: Expor relatório em tempo real para Recepção

**Files:**
- Modify: `app.js`, `src/role-access.js` only if the navigation requires a refresh hook
- Test: `tests/role-access.test.mjs`, `tests/billing.test.mjs`

**Interfaces:**
- Consumes: `globalThis.__liveServices`, `globalThis.__filterBillingOrders`, `globalThis.__summarizeBilling`.
- Produces: same `relatorios` module for Administrator and Reception, with week/month/year period data and live refresh after `live-data-ready`.

- [x] **Step 1: Write the failing test**

Add a role assertion for report visibility and a billing-period assertion that a report uses only orders in the selected month.

- [x] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- --test-name-pattern="relatórios|período"`

Expected: FAIL on Reception report visibility before Task 1, or fail if the period helper does not filter the report input.

- [x] **Step 3: Write minimal implementation**

Keep the existing report renderer, ensure it reads the live order collection, and rerender when `live-data-ready` fires while `relatorios` is open. Keep export and period controls available to both roles. Do not expose team/configuration controls.

- [x] **Step 4: Run tests**

Run: `npm.cmd test -- --test-name-pattern="relatórios|período"`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add app.js src/role-access.js tests
git commit -m "feat: add live reports for reception"
```

### Task 4: Verify local app and Supabase authorization

**Files:**
- No production file changes unless verification reveals a concrete regression.

- [x] **Step 1: Run the complete test suite**

Run: `npm.cmd test`

Expected: all tests pass.

- [x] **Step 2: Check JavaScript syntax and diff formatting**

Run: `node --check app.js; node --check src/permissions.js; node --check src/client-live-ui.js; node --check src/agenda-ui.js; git diff --check`

Expected: no syntax or whitespace errors.

- [x] **Step 3: Verify the local server**

Run: `Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4174/`

Expected: HTTP 200.

- [x] **Step 4: Verify Supabase policies read-only**

Run through Supabase SQL:

```sql
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('clients', 'vehicles', 'work_orders')
  and policyname in ('clients_insert_staff', 'vehicles_insert_staff', 'orders_insert_staff');
```

Expected: the three insert policies exist and remain scoped through `private.is_admin_or_reception(company_id)`.

- [x] **Step 5: Commit verification-only changes if any**

```bash
git status --short
```

Expected: only intended files are modified.
