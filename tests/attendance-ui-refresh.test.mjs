import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('permite criar atendimentos consecutivos e atualiza a lista sem recarregar', async () => {
  const ui = await readFile(new URL('../src/client-live-ui.js', import.meta.url), 'utf8')
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8')
  assert.match(ui, /form\.reset\(\)/)
  assert.match(ui, /button\.disabled = false/)
  assert.match(ui, /form\.dataset\.submitting === 'true'/)
  assert.match(ui, /globalThis\.__serviceSubmissionInFlight/)
  assert.match(ui, /form\.dataset\.requestId \|\| crypto\.randomUUID\(\)/)
  assert.match(ui, /globalThis\.__prepareServiceSubmission = /)
  assert.match(ui, /form\.dataset\.requestId = crypto\.randomUUID\(\)/)
  assert.doesNotMatch(ui, /delete form\.dataset\.requestId/)
  assert.match(ui, /globalThis\.__lastServiceSubmission/)
  assert.match(ui, /Date\.now\(\) - previous\.createdAt < 10000/)
  assert.match(ui, /form\.dataset\.submitting = 'false'/)
  assert.match(app, /const attendanceValues = document\.querySelectorAll\('\.attendance-summary b'\)/)
  assert.doesNotMatch(app, /live-data-ready'[\s\S]{0,1600}renderModule\('atendimentos'\)/)
})

test('mantém o histórico da ficha do cliente dentro do modal', async () => {
  const ui = await readFile(new URL('../src/client-live-ui.js', import.meta.url), 'utf8')
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8')
  assert.match(ui, /order\.service \|\| order\.service_description/)
  assert.match(ui, /order\.completedAt \|\| order\.completed_at \|\| order\.createdAt \|\| order\.created_at/)
  assert.match(ui, /order\.amount \?\? order\.total_amount/)
  assert.match(ui, /historyStatusLabel/)
  assert.match(css, /\.client-details-modal\{width:min\(100%,880px\)/)
  assert.match(css, /\.client-details-grid\{grid-template-columns:minmax\(0,\.8fr\) minmax\(0,1\.2fr\)\}/)
})

test('apagar uma ordem ao vivo usa o DELETE do Supabase', async () => {
  const live = await readFile(new URL('../src/live-data.js', import.meta.url), 'utf8')
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8')
  assert.match(live, /__deleteLiveWorkOrder/)
  assert.match(live, /from\('work_orders'\)\.delete\(\)/)
  assert.match(app, /globalThis\.__deleteLiveWorkOrder\(deleted\.orderId\)/)
})

test('painel do funcionário abre o card real e mantém as ações de etapa', async () => {
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8')
  const migration = await readFile(new URL('../supabase/migrations/20260908_allow_ready_status_in_stage_history.sql', import.meta.url), 'utf8')
  const state = await readFile(new URL('../src/work-order-state.js', import.meta.url), 'utf8')
  assert.match(app, /openEmployeeLiveOrder\(button\.dataset\.liveOrder\)/)
  assert.match(app, /renderEmployeeOrder\(index\)/)
  assert.match(app, /id=\"employee-advance\"/)
  assert.match(app, /id=\"employee-back-stage\"/)
  assert.match(migration, /ready_for_pickup/g)
  assert.match(state, /input\.fromStatus === toStatus/)
})
