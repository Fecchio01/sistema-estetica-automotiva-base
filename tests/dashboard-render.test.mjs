import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('visão geral remove o bloco estático antigo antes de montar a organização dinâmica', async () => {
  const source = await readFile(new URL('../app.js', import.meta.url), 'utf8')

  assert.match(source, /dashboard\.querySelector\('\.content-grid'\)/)
  assert.match(source, /legacyOverview\?\.remove\(\)/)
})
