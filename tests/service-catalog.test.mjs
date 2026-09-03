import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { defaultServiceCatalog, removeServiceFromCatalog, totalForCatalogServices, updateServiceInCatalog } from '../src/service-catalog.js'

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8')

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

test('atualiza nome, descrição e preço preservando o identificador do serviço', () => {
  const catalog = [{ id: 'custom-1', name: 'Lavagem', description: 'Externa', price: 90 }]

  const result = updateServiceInCatalog(catalog, 'custom-1', { name: 'Lavagem técnica', description: 'Externa com proteção', price: 140 })

  assert.deepEqual(result, [{ id: 'custom-1', name: 'Lavagem técnica', description: 'Externa com proteção', price: 140 }])
})

test('soma o preço do catálogo para os serviços escolhidos no atendimento', () => {
  assert.equal(totalForCatalogServices(defaultServiceCatalog, ['Detalhamento interno']), 280)
  assert.equal(totalForCatalogServices(defaultServiceCatalog, ['Detalhamento interno', 'Polimento técnico']), 970)
})

test('catálogo abre o mesmo modal com os dados do serviço para edição', () => {
  assert.match(app, /function openServicePriceModal\(service = null\)/)
  assert.match(app, /form\.dataset\.serviceId = service\?\.id \|\| ''/)
  assert.match(app, /if \(globalThis\.__updateServiceInCatalog\) globalThis\.__updateServiceInCatalog\(editingId, changes\)/)
})
