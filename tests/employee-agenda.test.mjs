import test from 'node:test'
import assert from 'node:assert/strict'
import { getEmployeeAgenda } from '../src/employee-agenda.js'

test('agenda do funcionário contém apenas suas ordens agendadas', () => {
  const orders = [
    { orderId: 'order-2', responsibleId: 'employee-2', scheduledAt: '2026-08-18T10:00:00Z' },
    { orderId: 'order-1', responsibleId: 'employee-1', scheduledAt: '2026-08-18T09:00:00Z' },
    { orderId: 'order-3', responsibleId: 'employee-1', scheduledAt: null },
  ]

  assert.deepEqual(getEmployeeAgenda(orders, { id: 'employee-1' }), [orders[1]])
})
