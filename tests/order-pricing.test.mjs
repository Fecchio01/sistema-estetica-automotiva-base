import test from 'node:test'
import assert from 'node:assert/strict'
import { findMissingOrderAmounts, findOrdersAwaitingPaymentMigration } from '../src/order-pricing.js'

test('encontra somente ordens sem valor cujos serviços existem no catálogo', () => {
  const catalog = [{ name: 'Detalhamento interno', price: 280 }, { name: 'Polimento técnico', price: 690 }]
  const result = findMissingOrderAmounts([
    { id: 'jorge', total_amount: 0, service_description: 'Detalhamento interno' },
    { id: 'pago', total_amount: 280, service_description: 'Detalhamento interno' },
    { id: 'desconhecido', total_amount: 0, service_description: 'Serviço personalizado' },
  ], catalog)

  assert.deepEqual(result, [{ id: 'jorge', totalAmount: 280 }])
})

test('migra ordens legadas para pago quando o pagamento antecede o atendimento', () => {
  assert.deepEqual(findOrdersAwaitingPaymentMigration([
    { id: 'jorge', payment_status: 'pending' },
    { id: 'artur', payment_status: 'paid' },
  ]), ['jorge'])
})
