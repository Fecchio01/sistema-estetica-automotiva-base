import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('atualiza a lista da equipe logo após criar um acesso', async () => {
  const source = await readFile(new URL('../src/team.js', import.meta.url), 'utf8')
  assert.match(source, /Acesso criado[^\n]*form\.reset\(\); await refreshTeamList\(\{ id: createdData\?\.profileId/)
  assert.match(source, /createdData\?\.profileId/)
  assert.match(source, /extraProfile = null/)
})

test('a exclusão de funcionário remove também o usuário do Auth', async () => {
  const source = await readFile(new URL('../supabase/functions/admin-delete-user/index.ts', import.meta.url), 'utf8')
  assert.match(source, /auth\.admin\.deleteUser\(target\.id, false\)/)
  assert.match(source, /authDeleted: true/)
})

test('carrega somente a equipe ativa da empresa atual sem exibir dados antigos', async () => {
  const source = await readFile(new URL('../src/team.js', import.meta.url), 'utf8')
  assert.match(source, /\.eq\('company_id', companyId\)/)
  assert.match(source, /\.eq\('active', true\)/)
  assert.match(source, /Carregando equipe/)
})

test('atualiza a equipe quando a sessão termina de carregar', async () => {
  const source = await readFile(new URL('../src/team.js', import.meta.url), 'utf8')
  assert.match(source, /document\.addEventListener\('auth-ready', refreshTeamList\)/)
})

test('saudação alterna apenas entre dia e noite', async () => {
  const source = await readFile(new URL('../src/auth-bootstrap.js', import.meta.url), 'utf8')
  assert.match(source, /date\.getHours\(\) >= 18 \|\| date\.getHours\(\) < 6/)
  assert.match(source, /'Boa noite' : 'Bom dia'/)
  assert.doesNotMatch(source, /Boa tarde/)
})
