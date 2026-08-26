import test from 'node:test'
import assert from 'node:assert/strict'
import { can } from '../src/permissions.js'

test('administradora acessa equipe e configurações', () => {
  assert.equal(can('administrator', 'manageUsers'), true)
  assert.equal(can('administrator', 'manageSettings'), true)
})

test('recepção opera ordens mas não administra usuários', () => {
  assert.equal(can('reception', 'manageOrders'), true)
  assert.equal(can('reception', 'manageUsers'), false)
})

test('funcionário só recebe capacidades operacionais', () => {
  assert.equal(can('employee', 'manageAssignedOrders'), true)
  assert.equal(can('employee', 'manageUsers'), false)
  assert.equal(can('employee', 'manageOrders'), false)
})
