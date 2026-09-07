import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

test('mutações de tela não consultam a equipe nem geram um ciclo de eventos', async () => {
  const source = (await readFile(new URL('../src/team.js', import.meta.url), 'utf8')).replace(/^import .*\r?\n/gm, '')
  const observers = []
  let requests = 0
  let events = 0
  const element = { addEventListener() {} }
  const context = vm.createContext({
    __sessionProfile: { company_id: 'company-a' },
    supabase: { from() {
      requests++
      return { select() { return this }, eq() { return this }, order: async () => ({ data: [{ id: 'pedro', full_name: 'Pedro', role: 'employee' }] }) }
    } },
    can: () => false,
    document: {
      body: {}, querySelector: () => element, querySelectorAll: () => [], addEventListener() {},
      dispatchEvent() { events++ }, createTreeWalker: () => ({ nextNode: () => false }),
    },
    NodeFilter: { SHOW_TEXT: 4 }, CustomEvent: class {}, setTimeout() {},
    MutationObserver: class { constructor(fn) { observers.push(fn) } observe() {} },
  })
  vm.runInContext(source, context)
  await vm.runInContext('refreshResponsibleOptions()', context)
  for (let i = 0; i < 50; i++) for (const observer of observers) await observer([])
  assert.equal(requests, 1)
  assert.equal(events, 1)
  await vm.runInContext('refreshResponsibleOptions()', context)
  assert.equal(events, 1, 'dados idênticos não notificam renderização novamente')
})
