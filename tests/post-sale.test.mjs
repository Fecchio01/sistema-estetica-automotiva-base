import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPostSalePlan, classifyFollowUp } from '../src/post-sale-rules.js'

test('cria uma sequência de pós-venda somente para atendimento concluído', () => {
  const plan = buildPostSalePlan({
    id: 'order-1',
    status: 'completed',
    completed_at: '2026-08-28T15:00:00.000Z',
    client_id: 'client-1',
    vehicle_id: 'vehicle-1',
    clientName: 'João Silva',
    vehicleLabel: 'Honda Civic · ABC-1234',
    serviceDescription: 'Detalhamento interno',
  })

  assert.deepEqual(plan.map((item) => item.type), ['check_in', 'care_tip', 'review', 'return'])
  assert.equal(plan[0].dueAt, '2026-08-29T15:00:00.000Z')
  assert.equal(plan[3].dueAt, '2026-09-27T15:00:00.000Z')
  assert.equal(plan[0].status, 'pending')
  assert.match(plan[0].message, /João Silva/)
})

test('não cria pós-venda para atendimento ainda aberto', () => {
  assert.deepEqual(buildPostSalePlan({ id: 'order-2', status: 'in_progress' }), [])
})

test('classifica a fila por vencimento sem tratar próximos como atrasados', () => {
  const now = new Date('2026-08-29T12:00:00.000Z')
  assert.equal(classifyFollowUp({ due_at: '2026-08-28T12:00:00.000Z', status: 'pending' }, now), 'overdue')
  assert.equal(classifyFollowUp({ due_at: '2026-08-29T12:00:00.000Z', status: 'pending' }, now), 'today')
  assert.equal(classifyFollowUp({ due_at: '2026-09-02T12:00:00.000Z', status: 'pending' }, now), 'upcoming')
  assert.equal(classifyFollowUp({ due_at: '2026-08-28T12:00:00.000Z', status: 'sent' }, now), 'done')
})
