import test from 'node:test'
import assert from 'node:assert/strict'
import { canCreateClientLink } from '../src/order-link-policy.js'

test('só permite link depois que o atendimento começou', () => {
  assert.equal(canCreateClientLink('scheduled'), false)
  assert.equal(canCreateClientLink('in_progress'), true)
  assert.equal(canCreateClientLink('completed'), true)
  assert.equal(canCreateClientLink('cancelled'), false)
})
