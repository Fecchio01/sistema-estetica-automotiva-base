# Unificação visual dos módulos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar a linguagem visual verde clara e de superfícies consistentes da Visão geral a todos os módulos sem alterar dados, fluxos ou permissões.

**Architecture:** A mudança se concentra em regras de apresentação nos estilos existentes, organizadas por família de módulo. Quando o CSS não puder selecionar uma área dinâmica com segurança, será adicionada uma classe semântica no renderizador atual; não haverá alteração de APIs, consultas Supabase, banco ou regras de acesso.

**Tech Stack:** HTML, JavaScript ES modules, CSS, Node.js test runner e navegador local.

**Spec:** `docs/superpowers/specs/2026-09-03-design-system-unification.md`

## Global Constraints

- Manter uma única família de verde claro para superfícies informativas; o verde fechado permanece para prioridade operacional.
- Não adicionar bibliotecas, fontes, gráficos externos ou dependências de terceiros.
- Não alterar permissões, regras de negócio, banco de dados, API de WhatsApp ou Evolution API.
- Usar gráficos somente quando calculados por dados existentes; estados sem dado devem mostrar vazio, nunca dados simulados.
- Não criar animações contínuas, flicker, mudança de cor no hover ou deslocamento lateral inesperado.
- A validação final obrigatória é `npm run test:e2e`, que executa exatamente 15 fluxos E2E.

---

## Estrutura de arquivos

- `styles.css`: tokens e superfícies compartilhadas para atendimentos, clientes, agenda, equipe, serviços, relatórios, faturamento e configurações.
- `quotes-preview.css`: superfícies e métricas do fluxo de orçamentos.
- `whatsapp-inbox.css`: moldura da central, preservando a identidade funcional de conversa e seus estados de mensagem.
- `app.js` e `src/post-sale-ui.js`: somente se uma classe semântica for necessária para uma área dinâmica.
- `tests/visual-language.test.mjs`: contratos de cores, raios e ausência de movimento lateral.
- `tests/dashboard-layout.test.mjs`: preservação das áreas aprovadas da Visão geral.

### Task 1: Criar tokens e contrato visual compartilhado

**Files:**
- Modify: `styles.css`
- Modify: `tests/visual-language.test.mjs`

**Interfaces:**
- Consumes: `--canvas`, `--surface`, `--line`, `--accent` e as classes `.module-panel`, `.client-directory`, `.attendance-list`.
- Produces: `--module-surface`, `--module-soft`, `--module-border`, `--module-shadow` e superfícies compartilhadas.

- [ ] **Step 1: Write the failing test**

```js
test('módulos usam superfícies verdes consistentes sem cores concorrentes', () => {
  assert.match(styles, /--module-soft:#edf5ee/)
  assert.match(styles, /\.module-panel,\.client-directory,\.attendance-list\{[\s\S]*border-radius:18px/)
  assert.doesNotMatch(styles, /\.attendance-summary>div:nth-child\(\d+\)\{background:#(?:fcf3e5|fcf0ec)/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/visual-language.test.mjs`

Expected: FAIL because the `--module-*` tokens do not exist.

- [ ] **Step 3: Write minimal implementation**

```css
:root{--module-surface:#fff;--module-soft:#edf5ee;--module-border:#cee0d1;--module-shadow:0 12px 30px rgba(35,79,57,.045)}
.module-panel,.client-directory,.attendance-list{background:var(--module-surface);border:1px solid var(--module-border);border-radius:18px;box-shadow:var(--module-shadow)}
.module-toolbar,.directory-toolbar{border-bottom-color:#e2ece4}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/visual-language.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add styles.css tests/visual-language.test.mjs
git commit -m "style: unify shared module surfaces"
```

### Task 2: Padronizar Atendimentos, Clientes, Agenda, Serviços e Equipe

**Files:**
- Modify: `styles.css`
- Modify: `tests/visual-language.test.mjs`

**Interfaces:**
- Consumes: tokens de Task 1 e `.attendance-summary`, `.client-summary`, `.calendar-grid`, `.service-price`, `.permission-item`.
- Produces: resumos verde claro, listas com cabeçalhos suaves e linhas com espaçamento consistente nos módulos operacionais.

- [ ] **Step 1: Write the failing test**

```js
test('módulos operacionais usam o mesmo resumo verde claro da visão geral', () => {
  assert.match(styles, /\.attendance-summary>div,\.client-summary>div\{[\s\S]*background:var\(--module-soft\)/)
  assert.match(styles, /\.calendar-grid\{[\s\S]*border-radius:18px/)
  assert.match(styles, /\.service-price,\.permission-item\{[\s\S]*border-radius:16px/)
  assert.doesNotMatch(styles, /\.attendance-item:hover\{[^}]*translateX\(/)
  assert.doesNotMatch(styles, /\.client-record:hover\{[^}]*translateX\(/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/visual-language.test.mjs`

Expected: FAIL because summaries and hovers use their earlier styles.

- [ ] **Step 3: Write minimal implementation**

```css
.attendance-summary>div,.client-summary>div{background:var(--module-soft);border:1px solid var(--module-border);border-radius:16px;box-shadow:none}
.calendar-grid{border-color:var(--module-border);border-radius:18px;background:var(--module-border)}
.calendar-day{background:var(--module-surface)}
.service-price,.permission-item{margin:7px 0;padding:16px 18px;border:1px solid var(--module-border);border-radius:16px;background:var(--module-surface)}
.attendance-item:hover,.client-record:hover{transform:none;background:#f8fcf9;box-shadow:0 8px 20px rgba(35,79,57,.06)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/visual-language.test.mjs`

Expected: PASS.

- [ ] **Step 5: Verify in local browser**

Run: `node dev-server.mjs`

Expected: Atendimentos, Agenda, Clientes e veículos, Serviços e preços e Equipe preserve actions and show consistent green surfaces without narrow-screen horizontal overflow.

- [ ] **Step 6: Commit**

```bash
git add styles.css tests/visual-language.test.mjs
git commit -m "style: align operational modules with dashboard"
```

### Task 3: Padronizar Orçamentos e Pós-venda sem alterar seus fluxos

**Files:**
- Modify: `quotes-preview.css`
- Modify: `styles.css`
- Modify: `src/post-sale-ui.js` (only if a semantic class is necessary)
- Modify: `tests/post-sale.test.mjs`
- Modify: `tests/visual-language.test.mjs`

**Interfaces:**
- Consumes: tokens de Task 1, `globalThis.__renderQuotesPreview` e `globalThis.__renderPostSale`.
- Produces: métricas, listas, modelos de mensagem e acompanhamento com superfícies verdes consistentes, preservando edição, aprovação, envio e cancelamento.

- [ ] **Step 1: Write failing tests**

```js
test('orçamentos usa métricas verdes uniformes', () => {
  assert.match(quoteStyles, /\.quote-preview-metrics > div\{[\s\S]*background:#edf5ee/)
  assert.doesNotMatch(quoteStyles, /\.quotes-preview-intro\{[^}]*linear-gradient/)
})

test('pós-venda mantém controles de editar, enviar e cancelar após o redesign', () => {
  assert.match(postSaleUi, /data-post-sale-edit/)
  assert.match(postSaleUi, /data-post-sale-send/)
  assert.match(postSaleUi, /data-post-sale-undo/)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/visual-language.test.mjs tests/post-sale.test.mjs`

Expected: FAIL because the quote metrics use their earlier white surface.

- [ ] **Step 3: Write minimal implementation**

```css
.quotes-preview-intro{background:#fff;border-color:#cee0d1}
.quote-preview-metrics>div{background:#edf5ee;border-color:#cee0d1;box-shadow:none}
.quote-sales-card,.post-sale-panel,.post-sale-template-row{border-color:#cee0d1;border-radius:18px;background:#fff}
.post-sale-template-row,.post-sale-follow-up{box-shadow:none}
```

Use existing pós-venda selectors in `styles.css`. If a target has no selector, add one presentation class in `src/post-sale-ui.js`; do not modify `data-post-sale-*` attributes.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/visual-language.test.mjs tests/post-sale.test.mjs`

Expected: PASS, including existing action attributes.

- [ ] **Step 5: Verify in local browser**

Run: `node dev-server.mjs`

Expected: criar orçamento, editar mensagem, enviar e cancelar envio remain accessible; a post-sale client card remains closed when the module opens.

- [ ] **Step 6: Commit**

```bash
git add quotes-preview.css styles.css src/post-sale-ui.js tests/post-sale.test.mjs tests/visual-language.test.mjs
git commit -m "style: unify sales and post-sale surfaces"
```

### Task 4: Padronizar Relatórios, Faturamento e Configurações

**Files:**
- Modify: `styles.css`
- Modify: `tests/visual-language.test.mjs`

**Interfaces:**
- Consumes: markup `.billing-dashboard`, `.billing-summary`, `.billing-chart-grid`, `.settings-toggle` from `renderModule` in `app.js`.
- Produces: superfícies e indicadores uniformes, without changing periods, values, profiles or toggles.

- [ ] **Step 1: Write the failing test**

```js
test('gestão e configurações usam indicadores e painéis da mesma família visual', () => {
  assert.match(styles, /\.billing-summary>div\{[\s\S]*background:var\(--module-soft\)/)
  assert.match(styles, /\.billing-chart-grid \.module-panel\{[\s\S]*border-color:var\(--module-border\)/)
  assert.match(styles, /\.settings-toggle\{[\s\S]*border-bottom:1px solid #e2ece4/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/visual-language.test.mjs`

Expected: FAIL because billing and settings do not use the shared tokens.

- [ ] **Step 3: Write minimal implementation**

```css
.billing-summary>div{background:var(--module-soft);border:1px solid var(--module-border);border-radius:16px;box-shadow:none}
.billing-chart-grid .module-panel,.billing-dashboard>.module-panel{border-color:var(--module-border);box-shadow:var(--module-shadow)}
.settings-toggle{border-bottom:1px solid #e2ece4}
.settings-toggle input{accent-color:var(--accent)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/visual-language.test.mjs`

Expected: PASS.

- [ ] **Step 5: Verify in local browser**

Run: `node dev-server.mjs`

Expected: switching billing period and saving preferences still work; empty data stays empty and no graph is simulated.

- [ ] **Step 6: Commit**

```bash
git add styles.css tests/visual-language.test.mjs
git commit -m "style: unify management module surfaces"
```

### Task 5: Ajustar a moldura de Conversas e executar a validação final

**Files:**
- Modify: `whatsapp-inbox.css`
- Modify: `tests/visual-language.test.mjs`
- Modify: `tests/whatsapp-e2e.test.mjs` only if a visual-container contract needs coverage.

**Interfaces:**
- Consumes: `.whatsapp-inbox`, `.whatsapp-inbox-list`, `.whatsapp-chat` and existing connection controls.
- Produces: a module frame aligned to the system while keeping incoming/outgoing message semantics and optional WhatsApp integration unchanged.

- [ ] **Step 1: Write the failing test**

```js
test('moldura da central de conversas usa superfície do sistema sem mudar mensagens', () => {
  assert.match(whatsappStyles, /\.whatsapp-inbox\{[\s\S]*border-radius:18px/)
  assert.match(whatsappStyles, /\.whatsapp-inbox\{[\s\S]*border-color:#cee0d1/)
  assert.match(whatsappStyles, /\.whatsapp-message\.outgoing \.whatsapp-message-bubble\{[\s\S]*background:#d9fdd3/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/visual-language.test.mjs`

Expected: FAIL because the inbox frame uses the earlier radius and border.

- [ ] **Step 3: Write minimal implementation**

```css
.whatsapp-inbox{border-radius:18px;border-color:#cee0d1;box-shadow:0 12px 30px rgba(35,79,57,.045)}
.whatsapp-inbox-list,.whatsapp-chat-header,.whatsapp-composer{border-color:#e2ece4}
```

Do not change `.whatsapp-message-bubble`, outgoing bubble colors, endpoints or connection controls.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/visual-language.test.mjs`

Expected: PASS.

- [ ] **Step 5: Verify every sidebar module in local browser**

Run: `node dev-server.mjs`

Expected: Visão geral, Atendimentos, Orçamentos, Agenda, Clientes e veículos, Serviços e preços, Equipe, Conversas, Pós-venda, Relatórios, Faturamento and Configurações share surfaces; there is no flash, flicker or horizontal overflow.

- [ ] **Step 6: Run the official regression suite**

Run: `npm run test:e2e`

Expected: exactly 15 E2E tests passing.

- [ ] **Step 7: Commit**

```bash
git add whatsapp-inbox.css tests/visual-language.test.mjs tests/whatsapp-e2e.test.mjs
git commit -m "style: align conversations with app design system"
```

## Review

- Spec coverage: Tasks 1–5 cover shared tokens, operational modules, sales, post-sale, management, settings and conversations. The approved Visão geral remains the reference rather than being redesigned.
- Flow safety: all changes are CSS or semantic classes; existing action attributes, APIs and permissions are preserved.
- Tests: every task starts with a failing test and ends passing; Task 5 closes with the official 15 E2E.
- Scope: no new dependency, database change, permission change or Evolution API activation.

