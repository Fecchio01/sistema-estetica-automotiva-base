import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultServiceCatalog, removeServiceFromCatalog } from '../src/service-catalog.js'

test('remove um serviço do catálogo pelo id sem alterar os demais', () => {
  const catalog = [
    ...defaultServiceCatalog,
    { id: 'custom-1', name: 'Lavagem técnica', description: 'Lavagem detalhada', price: 180 },
  ]

  const result = removeServiceFromCatalog(catalog, 'custom-1')

  assert.equal(result.some((item) => item.id === 'custom-1'), false)
  assert.equal(result.length, catalog.length - 1)
  assert.equal(result[0].name, defaultServiceCatalog[0].name)
})

test('não altera o catálogo quando o serviço não existe', () => {
  const catalog = [...defaultServiceCatalog]
  const result = removeServiceFromCatalog(catalog, 'missing')

  assert.deepEqual(result, catalog)
})
