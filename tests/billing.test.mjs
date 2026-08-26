import test from 'node:test'
import assert from 'node:assert/strict'
import { filterBillingOrders, getBillingPeriodRange, summarizeBilling } from '../src/billing.js'

test('resume faturamento usando valor e pagamento reais das ordens', () => {
  const summary = summarizeBilling([
    { amount: 300, paymentStatus: 'paid', service: 'Polimento' },
    { amount: 500, paymentStatus: 'pending', service: 'Polimento' },
    { amount: 700, paymentStatus: 'partial', service: 'Higienização' },
  ])
  assert.equal(summary.orderCount, 3)
  assert.equal(summary.received, 300)
  assert.equal(summary.outstanding, 1200)
  assert.equal(summary.averageTicket, 500)
  assert.deepEqual(summary.byService, [
    { service: 'Polimento', amount: 800, orders: 2 },
    { service: 'Higienização', amount: 700, orders: 1 },
  ])
})

test('calcula períodos semanal, mensal e anual', () => {
  const now = new Date('2026-08-17T12:00:00')
  const month = getBillingPeriodRange('month', now)
  const week = getBillingPeriodRange('week', now)
  const year = getBillingPeriodRange('year', now)
  const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  assert.equal(localDate(month.start), '2026-08-01')
  assert.equal(localDate(week.start), '2026-08-17')
  assert.equal(localDate(year.start), '2026-01-01')
  assert.equal(filterBillingOrders([
    { createdAt: '2026-08-16T10:00:00', amount: 10 },
    { createdAt: '2026-08-01T10:00:00', amount: 20 },
    { createdAt: '2026-01-02T10:00:00', amount: 30 },
  ], 'month', now).length, 2)
})
