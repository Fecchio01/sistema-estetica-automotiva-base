import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const [indexHtml, styles, authBootstrap] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('styles.css', root), 'utf8'),
  readFile(new URL('src/auth-bootstrap.js', root), 'utf8'),
])

test('visão geral usa uma composição bento para os indicadores', () => {
  assert.match(indexHtml, /class="metric-grid dashboard-metric-bento"/)
  assert.match(indexHtml, /dashboard-metric-card dashboard-metric-card-primary/)
  assert.match(indexHtml, /dashboard-metric-card dashboard-metric-card-secondary/)
  assert.match(indexHtml, /class="content-grid dashboard-overview-primary-grid"/)
})

test('layout bento mantém áreas distintas para a métrica principal e secundárias', () => {
  assert.match(styles, /\.dashboard-metric-bento\s*\{[\s\S]*grid-template-areas:/)
  assert.match(styles, /\.dashboard-metric-bento \.metric-block:first-child\s*\{[\s\S]*grid-area:hero/)
  assert.match(styles, /\.dashboard-metric-bento \.metric-block:nth-child\(4\)\s*\{[\s\S]*grid-area:card4/)
})

test('entrada da aplicação bloqueia o flash da tela de login durante a sessão', () => {
  assert.match(indexHtml, /<body class="app-booting">/)
  assert.match(indexHtml, /body\.app-booting #auth-screen,body\.app-booting #app-shell\{visibility:hidden\}/)
  assert.match(authBootstrap, /document\.body\.classList\.remove\('app-booting'\)/)
})
