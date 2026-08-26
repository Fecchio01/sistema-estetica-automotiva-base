# Autenticação e acesso por função Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o protótipo estático em uma aplicação de teste com login Supabase, painel compartilhado por função, cadastro de funcionários pela administradora e portal seguro do cliente.

**Architecture:** O frontend continuará em HTML, CSS e JavaScript, mas será dividido em módulos pequenos para configuração Supabase, autenticação, autorização e dados. O Supabase Auth cuidará das sessões; `profiles` e `companies` determinarão a função e o escopo; uma Edge Function fará o cadastro administrativo de usuários sem expor `service_role`. O portal do cliente usará token próprio por ordem.

**Tech Stack:** HTML/CSS/JavaScript, Supabase Auth, PostgreSQL/RLS, Supabase Storage, Supabase Edge Functions, Node.js built-in test runner e testes de navegador.

## Global Constraints

- Trabalhar somente em `C:\Users\Alexandre\Documents\Codex\2026-08-14\j\sistema-estetica-automotiva-base-teste`.
- Não alterar o repositório original em `C:\Users\Alexandre\Documents\Codex\2026-08-03\pre\sistema-estetica-automotiva-base`.
- Usar o projeto Supabase `qqrbfpdenhhellgbgimo` na região `sa-east-1`.
- Nunca expor ou salvar a chave `service_role` no frontend.
- Usar somente publishable/anon key no navegador e fixar a versão do `@supabase/supabase-js` no `package.json`.
- Habilitar RLS em todas as tabelas expostas e validar `company_id` em cada política.
- Não usar `user_metadata` para autorização; a função deve vir de `profiles`/`app_metadata` controlado.
- Não tornar obrigatória a troca de senha no primeiro acesso.
- Manter o mesmo link e painel visual compartilhado para administradora e recepção.
- Cada tarefa termina com teste e commit independente.

---

## Mapa de arquivos

- Create: `package.json` e `package-lock.json` — dependência pinada e comandos de teste.
- Create: `src/config.js` — URL e publishable key do projeto, sem segredos administrativos.
- Create: `src/supabase-client.js` — único ponto de criação do cliente Supabase.
- Create: `src/auth.js` — login, logout, sessão, perfil e eventos de autenticação.
- Create: `src/permissions.js` — matriz pura de permissões por função.
- Create: `src/data.js` — consultas e mutações de clientes, veículos e ordens.
- Create: `src/ui-auth.js` — tela de login, estados de carregamento e mensagens de erro.
- Modify: `index.html` — tela de login, shell autenticado, área de equipe e estado do portal.
- Modify: `app.js` — inicialização autenticada e renderização por função; remover arrays como fonte principal.
- Modify: `styles.css` — estilos da tela de login, cadastro de funcionário e estados protegidos.
- Create: `supabase/functions/admin-create-user/index.ts` — criação segura de funcionário.
- Create: `supabase/functions/client-order-access/index.ts` — validação do link do cliente.
- Create: `tests/permissions.test.mjs` — testes da matriz de permissões.
- Create: `tests/auth-ui.test.mjs` — teste de navegador da troca login/painel/logout.
- Create: `docs/superpowers/plans/2026-08-15-auth-and-role-access-plan.md` — este plano.

## Task 1: Preparar dependência, configuração e testes de autorização

**Files:**
- Create: `package.json`
- Create: `src/config.js`
- Create: `src/permissions.js`
- Create: `tests/permissions.test.mjs`

**Interfaces:**
- `getPermissions(role)` recebe `administrator | reception | employee` e retorna um objeto booleano de capacidades.
- `can(role, capability)` retorna `boolean`.
- Capacidades exatas: `manageUsers`, `manageSettings`, `manageClients`, `manageVehicles`, `manageOrders`, `manageAgenda`, `manageConversations`, `manageAssignedOrders`, `managePhotos`, `manageInternalNotes`, `manageDelivery`.

- [ ] **Step 1: Criar o teste falhando da matriz de permissões**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { can } from '../src/permissions.js'

test('administradora acessa equipe e configurações', () => {
  assert.equal(can('administrator', 'manageUsers'), true)
  assert.equal(can('administrator', 'manageSettings'), true)
})

test('recepção opera ordens mas não administra usuários', () => {
  assert.equal(can('reception', 'manageOrders'), true)
  assert.equal(can('reception', 'manageUsers'), false)
})

test('funcionário só recebe capacidades operacionais', () => {
  assert.equal(can('employee', 'manageAssignedOrders'), true)
  assert.equal(can('employee', 'manageUsers'), false)
  assert.equal(can('employee', 'manageOrders'), false)
})
```

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `node --test tests/permissions.test.mjs`

Expected: FAIL porque `src/permissions.js` ainda não existe.

- [ ] **Step 3: Adicionar a implementação mínima e configuração**

Criar `src/permissions.js` com uma matriz explícita e sem fallback permissivo:

```js
const matrix = {
  administrator: new Set(['manageUsers', 'manageSettings', 'manageClients', 'manageVehicles', 'manageOrders', 'manageAgenda', 'manageConversations', 'manageAssignedOrders', 'managePhotos', 'manageInternalNotes', 'manageDelivery']),
  reception: new Set(['manageClients', 'manageVehicles', 'manageOrders', 'manageAgenda', 'manageConversations', 'manageDelivery']),
  employee: new Set(['manageAssignedOrders', 'managePhotos', 'manageInternalNotes', 'manageDelivery']),
}

export function can(role, capability) {
  return matrix[role]?.has(capability) === true
}

export function getPermissions(role) {
  return Object.fromEntries([...new Set([...matrix.administrator])].map((capability) => [capability, can(role, capability)]))
}
```

O `package.json` deve declarar `"type": "module"`, o script `"test": "node --test tests/*.test.mjs"` e a versão exata de `@supabase/supabase-js` obtida por `npm view @supabase/supabase-js version` antes de instalar e salvar o lockfile. `src/config.js` deve ler valores de uma configuração pública documentada, nunca de uma chave administrativa.

- [ ] **Step 4: Rodar o teste e confirmar a passagem**

Run: `npm.cmd test -- --test-reporter spec`

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/config.js src/permissions.js tests/permissions.test.mjs
git commit -m "feat: add role permission matrix"
```

## Task 2: Criar banco, perfis, RLS e dados de teste

**Files:**
- Create: `supabase/migrations/20260815_auth_and_operations.sql`
- Create: `tests/sql-verification.md`

**Interfaces:**
- Tabelas: `companies`, `profiles`, `clients`, `vehicles`, `work_orders`, `work_order_photos`, `work_order_notes`, `work_order_stage_history`, `client_order_tokens`.
- `profiles.role` aceita somente `administrator`, `reception`, `employee`.
- `work_orders.responsible_id` referencia `profiles.id`.

- [ ] **Step 1: Escrever consultas de verificação antes do schema**

Preparar consultas que falhem no banco vazio:

```sql
select to_regclass('public.companies') as companies_table,
       to_regclass('public.profiles') as profiles_table,
       to_regclass('public.work_orders') as work_orders_table;
```

Expected before migration: as três colunas retornam `null`.

- [ ] **Step 2: Aplicar o DDL iterativo pelo MCP Supabase**

Executar `execute_sql` no projeto `qqrbfpdenhhellgbgimo` com `CREATE TABLE`, constraints, índices, trigger de `updated_at`, `ENABLE ROW LEVEL SECURITY` e policies. As policies devem usar uma função invoker segura para buscar o perfil atual por `auth.uid()` e filtrar pelo mesmo `company_id`; funcionários devem filtrar `work_orders.responsible_id = auth.uid()`.

- [ ] **Step 3: Criar o arquivo de migração equivalente**

Salvar no arquivo a mesma estrutura aplicada, incluindo `DROP POLICY IF EXISTS` somente dentro da migração idempotente, foreign keys, checks de função/status e policies completas de `SELECT`, `INSERT`, `UPDATE` e `DELETE` conforme o papel. Não incluir senhas ou tokens reais.

- [ ] **Step 4: Rodar a verificação de schema e segurança**

Run via Supabase MCP: `list_tables(project_id="qqrbfpdenhhellgbgimo", schemas=["public"], verbose=true)` e `get_advisors(project_id="qqrbfpdenhhellgbgimo", type="security")`.

Expected: todas as tabelas aparecem, RLS está habilitado e não há alerta crítico causado pelas novas policies.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260815_auth_and_operations.sql tests/sql-verification.md
git commit -m "feat: add company profiles and operations schema"
```

## Task 3: Implementar autenticação e shell do painel

**Files:**
- Create: `src/supabase-client.js`
- Create: `src/auth.js`
- Create: `src/ui-auth.js`
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`

**Interfaces:**
- `createSupabaseClient()` retorna o cliente singleton.
- `signIn(email, password)` retorna `{ user, profile }` ou lança erro sanitizado.
- `loadSession()` retorna sessão e perfil ou `null`.
- `signOut()` encerra a sessão.
- `renderAuthenticatedShell(profile)` mostra o painel compartilhado e os controles permitidos.

- [ ] **Step 1: Escrever teste de navegador falhando**

Criar `tests/auth-ui.test.mjs` com um servidor local de teste e uma camada fake de Auth que simule `INITIAL_SESSION`, `SIGNED_IN` e `SIGNED_OUT`. Verificar que uma sessão inexistente mostra `#auth-screen`, uma sessão válida remove a tela de login e o logout retorna a ela.

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `node --test tests/auth-ui.test.mjs`

Expected: FAIL porque os seletores de autenticação ainda não existem.

- [ ] **Step 3: Adicionar cliente e fluxo de sessão**

Implementar `src/supabase-client.js` com `createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)`. Implementar `auth.js` usando `signInWithPassword`, `getSession`, `onAuthStateChange` e `signOut`. Após autenticar, buscar `profiles` por `id = session.user.id` e rejeitar perfil ausente ou inativo.

- [ ] **Step 4: Adicionar tela de login e shell autenticado**

Adicionar formulário com e-mail, senha, mensagem genérica de erro e botão de sair. O sistema deve iniciar em `loadSession()`, renderizar a aplicação existente somente depois do perfil ser carregado e manter uma única URL.

- [ ] **Step 5: Rodar teste e validações de navegador**

Run: `npm.cmd test -- --test-reporter spec` e abrir `http://127.0.0.1:4174/`.

Expected: login aparece sem sessão, erro não revela se o e-mail existe, logout retorna ao login e a sessão persistida abre o painel após recarregar.

- [ ] **Step 6: Commit**

```bash
git add src/supabase-client.js src/auth.js src/ui-auth.js index.html app.js styles.css tests/auth-ui.test.mjs
git commit -m "feat: add Supabase authentication shell"
```

## Task 4: Migrar o painel compartilhado para permissões reais

**Files:**
- Modify: `app.js`
- Modify: `src/data.js`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `tests/permissions.test.mjs`

**Interfaces:**
- `loadCompanyData(profile)` carrega somente dados da empresa atual.
- `visibleFor(profile, capability)` usa `can(profile.role, capability)`.
- `renderRoleAwareNavigation(profile)` habilita ou oculta módulos sem tratar isso como segurança única.

- [ ] **Step 1: Escrever testes de comportamento por função**

Adicionar testes que afirmem: administradora vê “Equipe” e “Configurações”; recepção vê clientes, agenda e ordens mas não “Equipe”; funcionário vê o painel operacional e não a lista global de ordens.

- [ ] **Step 2: Rodar testes antes da migração**

Run: `npm.cmd test -- --test-reporter spec`

Expected: FAIL nos novos casos porque o painel ainda usa dados demonstrativos sem perfil.

- [ ] **Step 3: Criar `src/data.js` com consultas escopadas**

Implementar consultas Supabase para clientes, veículos e ordens. Todas devem filtrar por `company_id` indiretamente pelas policies e nunca aceitar `company_id` vindo de input do navegador. A consulta do funcionário deve limitar as ordens ao `responsible_id` autenticado.

- [ ] **Step 4: Adaptar o shell existente**

Preservar o visual atual, mas substituir contagens fixas e arrays como fonte principal por dados carregados. Renderizar o menu compartilhado e condicionar somente ações de interface; a autorização real permanece no banco.

- [ ] **Step 5: Rodar testes e verificar recarga**

Run: `npm.cmd test -- --test-reporter spec`; depois criar uma ordem de teste, recarregar a página e confirmar que ela continua no banco.

- [ ] **Step 6: Commit**

```bash
git add app.js src/data.js index.html styles.css tests/permissions.test.mjs
git commit -m "feat: apply role-aware shared dashboard"
```

## Task 5: Criar cadastro de funcionários pela administradora

**Files:**
- Create: `supabase/functions/admin-create-user/index.ts`
- Create: `src/team.js`
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/team-management.test.mjs`

**Interfaces:**
- Edge Function `POST /admin-create-user` recebe `{ name, email, password, role }`.
- Resposta de sucesso contém `{ profileId, email, role }`, nunca senha ou `service_role`.
- `createEmployee(input)` valida campos e chama a Edge Function.
- `setEmployeeActive(profileId, active)` desativa/reativa o perfil sem apagar histórico.

- [ ] **Step 1: Escrever teste falhando do formulário**

Testar que apenas administradora vê o formulário e que e-mail, senha, nome e função são obrigatórios; recepção não vê o módulo.

- [ ] **Step 2: Implementar a Edge Function protegida**

Validar o JWT do solicitante, consultar o perfil do solicitante e exigir `role = 'administrator'`. Usar o cliente administrativo somente dentro da função para criar o usuário e o perfil. Rejeitar função desconhecida, senha menor que o mínimo configurado e e-mail inválido.

- [ ] **Step 3: Implementar painel da equipe**

Adicionar listagem de funcionários, formulário de cadastro, status ativo/inativo e ação de redefinição. Exibir a senha apenas no campo durante o cadastro; nunca persistir ou retornar a senha.

- [ ] **Step 4: Rodar teste e smoke test real**

Run: `npm.cmd test -- --test-reporter spec`; pelo conector Supabase, verificar o perfil criado e depois desativá-lo para confirmar que o login é bloqueado.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/admin-create-user/index.ts src/team.js index.html app.js styles.css tests/team-management.test.mjs
git commit -m "feat: add administrator employee management"
```

## Task 6: Implementar portal do cliente por link seguro

**Files:**
- Create: `supabase/functions/client-order-access/index.ts`
- Create: `src/client-portal.js`
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Create: `tests/client-portal.test.mjs`

**Interfaces:**
- `createOrderAccessToken(workOrderId)` retorna URL pronta para a administradora/recepção compartilhar.
- `loadClientOrder(token)` retorna somente dados públicos daquela ordem.
- Token bruto nunca será salvo; a tabela armazenará hash, expiração, revogação e `work_order_id`.

- [ ] **Step 1: Escrever teste falhando para isolamento do portal**

Testar token válido, token inválido, token expirado e tentativa de usar token de uma ordem em outra.

- [ ] **Step 2: Criar token e Edge Function**

Gerar token aleatório no backend, salvar apenas hash e retornar o token uma vez. A função de acesso deve validar hash, expiração e revogação antes de buscar veículo, status, etapas e fotos.

- [ ] **Step 3: Integrar link e portal na aplicação**

Detectar a rota/query do portal antes do shell interno, renderizar o acompanhamento sem menu administrativo e manter observações internas fora da resposta.

- [ ] **Step 4: Rodar testes de portal**

Run: `npm.cmd test -- --test-reporter spec`; verificar no navegador que um cliente não autenticado abre o portal válido, mas não o painel.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/client-order-access/index.ts src/client-portal.js index.html app.js styles.css tests/client-portal.test.mjs
git commit -m "feat: add secure client order portal"
```

## Task 7: Verificação final integrada

**Files:**
- Modify: `docs/superpowers/specs/2026-08-15-auth-and-role-access-design.md`
- Modify: `docs/superpowers/plans/2026-08-15-auth-and-role-access-plan.md`

- [ ] **Step 1: Rodar a suíte local completa**

Run: `npm.cmd test -- --test-reporter spec`

Expected: todos os testes passam.

- [ ] **Step 2: Rodar advisors Supabase**

Run via MCP: `get_advisors(project_id="qqrbfpdenhhellgbgimo", type="security")` e `get_advisors(project_id="qqrbfpdenhhellgbgimo", type="performance")`.

Expected: nenhum alerta crítico novo introduzido pelas tabelas ou policies.

- [ ] **Step 3: Executar checklist manual**

Testar administradora, recepção, funcionário, usuário inativo, cliente, logout, sessão persistida, ordem criada, foto e token expirado.

- [ ] **Step 4: Verificar que o original não mudou**

Run: `git -C "C:\Users\Alexandre\Documents\Codex\2026-08-03\pre\sistema-estetica-automotiva-base" diff --quiet HEAD --`

Expected: exit code `0`.

- [ ] **Step 5: Commit final de documentação**

```bash
git add docs/superpowers/specs/2026-08-15-auth-and-role-access-design.md docs/superpowers/plans/2026-08-15-auth-and-role-access-plan.md
git commit -m "docs: finalize auth implementation plan"
```
