import test from 'node:test'
import assert from 'node:assert/strict'
import { archiveClient, createClient, loadClientRecords } from '../src/clients-data.js'

function fakeClient() {
  const calls = []
  const make = (table) => { const query = { table }; for (const method of ['select', 'eq', 'order']) query[method] = (...args) => { calls.push([table, method, ...args]); return query }; query.insert = (payload) => { calls.push([table, 'insert', payload]); return { select: () => ({ single: async () => ({ data: { id: `${table}-1`, ...payload, created_at: '2026-08-16T12:00:00Z' }, error: null }) }) } }; query.update = (payload) => { calls.push([table, 'update', payload]); return query }; query.then = (resolve) => resolve({ data: table === 'clients' ? [{ id: 'client-1', full_name: 'Arthur', created_at: '2026-08-16T12:00:00Z' }] : [], error: null }); return query }
  return { calls, from: make }
}

test('carrega clientes ativos com data e ordens reais', async () => {
  const client = fakeClient(); const records = await loadClientRecords({ company_id: 'company-1' }, client); assert.equal(records[0].name, 'Arthur'); assert.equal(records[0].orderCount, 0)
})
test('cadastra cliente e veículo na mesma empresa', async () => {
  const client = fakeClient(); await createClient({ company_id: 'company-1' }, { name: 'Arthur', phone: '11999990000', vehicle: 'Honda Civic · RGT-4B21' }, client); assert.deepEqual(client.calls.find((call) => call[0] === 'clients' && call[1] === 'insert')[2], { company_id: 'company-1', full_name: 'Arthur', phone: '11999990000' }); assert.equal(client.calls.filter((call) => call[0] === 'vehicles' && call[1] === 'insert').length, 1)
})
test('arquiva cliente sem apagar histórico', async () => { const client = fakeClient(); await archiveClient({ company_id: 'company-1' }, 'client-1', client); assert.deepEqual(client.calls.find((call) => call[1] === 'update')[2], { active: false }) })
