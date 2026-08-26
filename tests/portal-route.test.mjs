import test from 'node:test'
import assert from 'node:assert/strict'
import { isClientPortalPath } from '../src/portal-route.js'

test('identifica uma rota pública de portal sem expor o painel autenticado', () => {
  assert.equal(isClientPortalPath('/portal/atelier-test-token'), true)
  assert.equal(isClientPortalPath('/'), false)
  assert.equal(isClientPortalPath('/portal'), false)
})
