import test from 'node:test'
import assert from 'node:assert/strict'
import { PORTAL_STAGES, getPortalStageIndex } from '../src/portal-stages.js'

test('mantém as cinco etapas do portal antigo', () => {
  assert.deepEqual(PORTAL_STAGES, [
    'Veículo recebido',
    'Avaliação inicial',
    'Detalhamento interno',
    'Inspeção e acabamento',
    'Pronto para retirada',
  ])
  assert.equal(getPortalStageIndex('scheduled'), 0)
  assert.equal(getPortalStageIndex('in_progress'), 2)
  assert.equal(getPortalStageIndex('completed'), 4)
})
