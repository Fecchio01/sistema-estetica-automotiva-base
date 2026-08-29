import test from 'node:test'
import assert from 'node:assert/strict'
import { statusForStage, stageForStatus, canConfirmDelivery } from '../src/work-order-state.js'

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
