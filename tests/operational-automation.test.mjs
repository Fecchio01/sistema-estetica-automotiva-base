import test from 'node:test'
import assert from 'node:assert/strict'
import { buildOperationalAutomationModel } from '../src/operational-automation.js'

const now = new Date('2026-09-04T15:00:00.000Z')

test('identifica agenda próxima, ordem sem responsável, operação parada e retirada aguardando sem alterar as ordens', () => {
  const services = [
    { orderId: 'soon', client: 'Jorge', orderStatus: 'scheduled', scheduledAt: '2026-09-05T12:00:00.000Z', createdAt: '2026-09-04T14:00:00.000Z', checklistPhotos: [{ stage: 'received' }, { stage: 'assessment' }, { stage: 'execution' }, { stage: 'inspection' }, { stage: 'delivery' }] },
    { orderId: 'stale', client: 'Artur', orderStatus: 'in_progress', createdAt: '2026-09-04T10:00:00.000Z', checklistPhotos: [{ stage: 'received' }, { stage: 'assessment' }, { stage: 'execution' }, { stage: 'inspection' }, { stage: 'delivery' }] },
    { orderId: 'pickup', client: 'Luna', orderStatus: 'ready_for_pickup', createdAt: '2026-09-03T10:00:00.000Z', checklistPhotos: [{ stage: 'received' }, { stage: 'assessment' }, { stage: 'execution' }, { stage: 'inspection' }, { stage: 'delivery' }] },
  ]

  const result = buildOperationalAutomationModel({ services }, now)

  assert.deepEqual(result.alerts.map((alert) => [alert.type, alert.orderId]), [
    ['appointment_soon', 'soon'],
    ['unassigned', 'soon'],
    ['unassigned', 'stale'],
    ['stale', 'stale'],
    ['unassigned', 'pickup'],
    ['pickup_waiting', 'pickup'],
  ])
  assert.equal(services[1].orderStatus, 'in_progress')
})

test('resume foto e pós-venda pendentes e ignora dados inválidos ou concluídos', () => {
  const result = buildOperationalAutomationModel({
    services: [
      { orderId: 'active', client: 'Jorge', orderStatus: 'in_progress', responsibleId: 'employee-1', checklistPhotos: [{ stage: 'received' }, { stage: 'assessment' }] },
      { orderId: 'done', client: 'Artur', orderStatus: 'completed', checklistPhotos: [] },
      { orderId: 'bad-date', client: 'Luna', orderStatus: 'scheduled', scheduledAt: 'not-a-date', responsibleId: 'employee-1', checklistPhotos: [{ stage: 'received' }, { stage: 'assessment' }, { stage: 'execution' }, { stage: 'inspection' }, { stage: 'delivery' }] },
    ],
    postSaleFollowUps: [
      { id: 'follow-up-1', work_order_id: 'active', status: 'pending', due_at: '2026-09-04T10:00:00.000Z', clients: { full_name: 'Jorge' } },
      { id: 'sent', work_order_id: 'done', status: 'sent', due_at: '2026-09-01T10:00:00.000Z' },
    ],
  }, now)

  assert.deepEqual(result.alerts.filter((alert) => alert.type === 'photos_missing').map((alert) => [alert.orderId, alert.count]), [['active', 3]])
  assert.deepEqual(result.alerts.filter((alert) => alert.type === 'post_sale_due').map((alert) => alert.followUpId), ['follow-up-1'])
  assert.equal(result.alerts.some((alert) => alert.orderId === 'done'), false)
})

test('sugere o funcionário ativo com menor carga e preserva a ordem alfabética no empate', () => {
  const result = buildOperationalAutomationModel({
    services: [
      { orderId: 'one', orderStatus: 'in_progress', responsibleId: 'employee-1' },
      { orderId: 'two', orderStatus: 'scheduled', responsibleId: 'employee-1' },
      { orderId: 'three', orderStatus: 'in_progress', responsibleId: 'employee-2' },
    ],
    profiles: [
      { id: 'employee-1', full_name: 'Zeca', role: 'employee', active: true },
      { id: 'employee-2', full_name: 'Bruna', role: 'employee', active: true },
      { id: 'employee-3', full_name: 'Ana', role: 'employee', active: true },
      { id: 'reception-1', full_name: 'Carlos', role: 'reception', active: true },
    ],
  }, now)

  assert.equal(result.suggestedResponsibleId, 'employee-3')
  assert.deepEqual(result.workload, [
    { profileId: 'employee-3', name: 'Ana', activeOrders: 0 },
    { profileId: 'employee-2', name: 'Bruna', activeOrders: 1 },
    { profileId: 'employee-1', name: 'Zeca', activeOrders: 2 },
  ])
})
