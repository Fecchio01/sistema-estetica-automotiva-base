import test from 'node:test'
import assert from 'node:assert/strict'
import { getEmployeeOrders } from '../src/employee-orders.js'

test('filtra somente as ordens atribuídas ao funcionário autenticado', () => {
  const services = [
    { orderId: 'order-1', responsibleId: 'employee-1', client: 'Cliente 1' },
    { orderId: 'order-2', responsibleId: 'employee-2', client: 'Cliente 2' },
  ]

  assert.deepEqual(getEmployeeOrders(services, { id: 'employee-1' }), [services[0]])
})

test('não mostra ordens quando o funcionário não possui atribuições', () => {
  const services = [{ orderId: 'order-1', responsibleId: 'employee-1' }]

  assert.deepEqual(getEmployeeOrders(services, { id: 'employee-2' }), [])
})
