import test from 'node:test'
import assert from 'node:assert/strict'
import { createBooking, deleteBooking, loadAgendaData } from '../src/agenda-data.js'

function fakeClient() {
  const calls = []
  const makeQuery = (table) => {
    const query = { table, calls }
    for (const method of ['select', 'eq', 'gte', 'lt', 'order']) query[method] = (...args) => { calls.push([table, method, ...args]); return query }
    query.insert = (payload) => { calls.push([table, 'insert', payload]); return { select: () => ({ single: async () => ({ data: { id: 'order-1', ...payload }, error: null }) }) } }
    query.delete = () => { calls.push([table, 'delete']); return query }
    query.then = (resolve) => resolve({ data: [], error: null })
    return query
  }
  return { calls, from: makeQuery }
}

test('carrega a agenda com limites e empresa', async () => {
  const client = fakeClient()
  await loadAgendaData({ company_id: 'company-1' }, new Date('2026-08-10T03:00:00.000Z'), new Date('2026-08-17T03:00:00.000Z'), client)
  assert.ok(client.calls.some((call) => call[0] === 'work_orders' && call[1] === 'gte'))
  assert.ok(client.calls.some((call) => call[0] === 'profiles' && call[1] === 'eq' && call[3] === 'company-1'))
})

test('cria reserva com status agendado', async () => {
  const client = fakeClient()
  const result = await createBooking({ company_id: 'company-1' }, { clientId: 'client-1', vehicleId: 'vehicle-1', responsibleId: 'person-1', service: 'Polimento', scheduledAt: '2099-08-16T13:30:00.000Z' }, client)
  assert.equal(result.status, 'scheduled')
  assert.deepEqual(client.calls.find((call) => call[1] === 'insert')[2], { company_id: 'company-1', client_id: 'client-1', vehicle_id: 'vehicle-1', responsible_id: 'person-1', status: 'scheduled', scheduled_at: '2099-08-16T13:30:00.000Z', service_description: 'Polimento' })
})

test('apaga uma reserva da empresa pelo id', async () => {
  const client = fakeClient()
  await deleteBooking({ company_id: 'company-1' }, 'order-1', client)
  assert.ok(client.calls.some((call) => call[0] === 'work_orders' && call[1] === 'delete'))
  assert.ok(client.calls.some((call) => call[0] === 'work_orders' && call[1] === 'eq' && call[2] === 'company_id' && call[3] === 'company-1'))
})
