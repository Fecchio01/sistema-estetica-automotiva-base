import test from 'node:test'
import assert from 'node:assert/strict'
import { createNavigationCoordinator } from '../src/navigation.js'

test('apenas a última navegação rápida continua autorizada a renderizar', () => {
  const navigation = createNavigationCoordinator()
  const first = navigation.begin()
  const second = navigation.begin()
  assert.equal(navigation.isCurrent(first), false)
  assert.equal(navigation.isCurrent(second), true)
})
