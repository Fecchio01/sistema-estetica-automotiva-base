import test from 'node:test'
import assert from 'node:assert/strict'
import { statusForStage, stageForStatus, stageForOrder, buildStageTransition, buildDeliveryTransition, canConfirmDelivery } from '../src/work-order-state.js'

test('converte a etapa visual para o status persistido da ordem', () => {
  assert.equal(statusForStage(0), 'scheduled')
  assert.equal(statusForStage(2), 'in_progress')
  assert.equal(statusForStage(4), 'ready_for_pickup')
  assert.equal(stageForStatus('scheduled'), 0)
  assert.equal(stageForStatus('in_progress'), 2)
  assert.equal(stageForStatus('completed'), 4)
  assert.equal(stageForStatus('ready_for_pickup'), 4)
})

test('recepção e administração podem confirmar entrega', () => {
  assert.equal(canConfirmDelivery('administrator'), true)
  assert.equal(canConfirmDelivery('reception'), true)
  assert.equal(canConfirmDelivery('employee'), false)
})

test('mantém a etapa exata da ordem depois de recarregar', () => {
  assert.equal(stageForOrder({ status: 'in_progress', current_stage: 3 }), 3)
  assert.equal(stageForOrder({ status: 'in_progress' }), 2)
  assert.equal(stageForOrder({ status: 'completed', current_stage: 4 }), 4)
})

test('monta atualização da etapa e histórico com o mesmo evento', () => {
  assert.deepEqual(buildStageTransition({
    companyId: 'company-1',
    orderId: 'order-1',
    changedBy: 'user-1',
    fromStatus: 'in_progress',
    fromStage: 2,
    toStage: 3,
    comment: 'Polimento concluído',
  }), {
    orderPatch: { status: 'in_progress', current_stage: 3 },
    history: {
      company_id: 'company-1',
      work_order_id: 'order-1',
      changed_by: 'user-1',
      from_status: 'in_progress',
      to_status: 'in_progress',
      comment: 'Polimento concluído',
    },
  })
})

test('confirma entrega persistindo etapa final e horário de conclusão', () => {
  assert.deepEqual(buildDeliveryTransition({
    companyId: 'company-1',
    orderId: 'order-1',
    changedBy: 'reception-1',
    fromStatus: 'ready_for_pickup',
    completedAt: '2026-09-03T12:00:00.000Z',
  }), {
    orderPatch: { status: 'completed', current_stage: 4, completed_at: '2026-09-03T12:00:00.000Z' },
    history: {
      company_id: 'company-1',
      work_order_id: 'order-1',
      changed_by: 'reception-1',
      from_status: 'ready_for_pickup',
      to_status: 'completed',
      comment: 'Entrega confirmada pela recepção.',
    },
  })
})
