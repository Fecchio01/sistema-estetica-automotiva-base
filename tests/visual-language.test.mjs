import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8')
const quoteStyles = await readFile(new URL('../quotes-preview.css', import.meta.url), 'utf8')

test('linguagem visual compartilhada evita controles quadrados e campos nativos quebrados', () => {
  assert.match(styles, /--radius-control:14px/)
  assert.match(styles, /\.app-shell>\.sidebar\{[^}]*background:#dceae1!important/)
  assert.match(styles, /\.main-content>\.topbar\{[^}]*background:#f5f8f5!important/)
  assert.match(styles, /\.app-shell>\.sidebar\.sidebar-olive\{[^}]*background:#2f3b32!important/)
  assert.match(styles, /\.main-content>\.topbar\.topbar-integrated\{[^}]*background:transparent!important/)
  assert.match(styles, /\.main-content>\.topbar\.topbar-integrated\{[^}]*height:58px!important/)
  assert.match(styles, /\.main-content>\.topbar\.topbar-integrated\.topbar-collapsed\{[^}]*height:0!important/)
  assert.match(styles, /\.main-content>\.topbar\.topbar-integrated\.topbar-collapsed\{[^}]*backdrop-filter:none!important/)
  assert.match(styles, /\.topbar-collapsed \.topbar-actions\{display:none!important/)
  assert.match(styles, /\.main-content\{background:#f3f0e8;color:#27332d/)
  assert.match(styles, /\.main-content \.module-panel,\.main-content \.panel,\.main-content \.table-panel\{background:#fffdf8/)
  assert.match(styles, /\.main-content \.primary-button\{background:#59684d/)
  assert.match(styles, /\.module-panel select[^}]*appearance:none/)
  assert.match(styles, /\.module-panel[^}]*border-radius:22px/)
  assert.match(quoteStyles, /\.quote-preview-modal \{[^}]*border-radius:\s*26px/)
  assert.match(quoteStyles, /\.quote-service-card \{[^}]*border-radius:\s*17px/)
})
