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
  assert.match(app, /dataset\.module === 'atendimentos'\) renderModule\('atendimentos'\)/)
})

test('mantém o histórico da ficha do cliente dentro do modal', async () => {
  const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8')
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
