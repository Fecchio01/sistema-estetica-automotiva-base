import test from 'node:test'
import assert from 'node:assert/strict'
import { can, canCreateSection, canViewSection } from '../src/permissions.js'

test('cada função visualiza somente seus módulos', () => {
  assert.equal(canViewSection('administrator', 'faturamento'), true)
  assert.equal(canViewSection('administrator', 'equipe'), true)
  assert.equal(canViewSection('reception', 'agenda'), true)
  assert.equal(canViewSection('reception', 'equipe'), false)
  assert.equal(canViewSection('employee', 'faturamento'), false)
  assert.equal(canViewSection('employee', 'atendimentos'), false)
})

test('recepção acessa relatórios sem receber poderes administrativos', () => {
  assert.equal(canViewSection('reception', 'relatorios'), true)
  assert.equal(can('reception', 'manageOrders'), true)
  assert.equal(can('reception', 'manageAgenda'), true)
  assert.equal(can('reception', 'manageUsers'), false)
  assert.equal(can('reception', 'manageSettings'), false)
})

test('recepção pode lançar atendimento e agendamento, funcionário não', () => {
  assert.equal(can('reception', 'manageOrders'), true)
  assert.equal(can('reception', 'manageAgenda'), true)
  assert.equal(can('employee', 'manageOrders'), false)
  assert.equal(can('employee', 'manageAgenda'), false)
})

test('ações operacionais da recepção abrem atendimento e agenda', () => {
  assert.equal(canCreateSection('reception', 'atendimentos'), true)
  assert.equal(canCreateSection('reception', 'agenda'), true)
  assert.equal(canCreateSection('employee', 'atendimentos'), false)
})
