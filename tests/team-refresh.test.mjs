import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('atualiza a lista da equipe logo após criar um acesso', async () => {
  const source = await readFile(new URL('../src/team.js', import.meta.url), 'utf8')
  assert.match(source, /Acesso criado[^\n]*form\.reset\(\); await refreshTeamList\(\)/)
})
