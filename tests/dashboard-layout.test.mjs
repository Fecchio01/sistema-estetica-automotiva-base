import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const [indexHtml, styles, authBootstrap, appJs] = await Promise.all([
  readFile(new URL('index.html', root), 'utf8'),
  readFile(new URL('styles.css', root), 'utf8'),
  readFile(new URL('src/auth-bootstrap.js', root), 'utf8'),
  readFile(new URL('app.js', root), 'utf8'),
])

test('visão geral mantém os indicadores superiores no formato compacto original', () => {
  assert.match(indexHtml, /class="metric-grid">\s*<article class="metric-block">/)
  assert.doesNotMatch(indexHtml, /dashboard-metric-bento/)
  assert.match(indexHtml, /class="content-grid dashboard-overview-primary-grid"/)
})

test('operação de hoje reserva uma faixa visual de status sem remover a lista', () => {
  assert.match(indexHtml, /id="dashboard-today-summary"/)
  assert.match(indexHtml, /id="service-list"/)
  assert.match(appJs, /function refreshDashboardTodaySummary\(\)/)
})

test('painéis inferiores usam uma composição própria de acompanhamento', () => {
  assert.match(appJs, /workspace\.className = 'dashboard-organization dashboard-live-overview'/)
  assert.match(styles, /\.dashboard-live-overview\s*\{[\s\S]*grid-template-columns:/)
  assert.match(styles, /\.dashboard-live-overview>\.dashboard-paddock-panel,[\s\S]*grid-column:1/)
  assert.match(styles, /\.dashboard-operation-summary-grid\.dashboard-summary-layout-open\s*\{[\s\S]*grid-template-columns:/)
})

test('entrada da aplicação bloqueia o flash da tela de login durante a sessão', () => {
  assert.match(indexHtml, /<body class="app-booting">/)
  assert.match(indexHtml, /html,body\{background:#f5f7f5\}/)
  assert.match(indexHtml, /body\.app-booting #auth-screen,body\.app-booting #app-shell\{display:none\}/)
  assert.match(authBootstrap, /document\.body\.classList\.remove\('app-booting'\)/)
})

test('troca de seção não reaplica animação que causa flash no painel', () => {
  assert.match(styles, /\.main-content \.page-section:not\(\.hidden\)\{animation:none!important\}/)
})

test('operação de hoje preserva contraste dos atalhos e status no painel escuro', () => {
  assert.match(styles, /\.dashboard-recent-panel \.text-button\{color:#e3eee5!important\}/)
  assert.match(styles, /\.main-content \.dashboard-overview-primary-grid \.dashboard-recent-panel \.service-row \.status-pill\.received\{background:#edf1f0!important;color:#4a594f!important\}/)
  assert.match(styles, /\.main-content \.dashboard-overview-primary-grid \.dashboard-recent-panel \.service-row \.status-pill\.delivered\{background:#e9eee8!important;color:#4a594f!important\}/)
  assert.match(styles, /html,body\{background:#fff!important\}/)
})

test('sidebar e painéis de operação usam o verde fechado compartilhado', () => {
  assert.match(styles, /--dashboard-forest:#2f3b32/)
  assert.match(styles, /\.app-shell>\.sidebar\.sidebar-olive\{background:#2f3b32!important;border-right-color:rgba\(255,255,255,\.12\)!important\}/)
})
