import test from 'node:test'
import assert from 'node:assert/strict'
import { buildQuotePreviewModel, QUOTE_STATUSES } from '../src/quotes-preview.js'
import { canViewSection } from '../src/permissions.js'

test('orçamentos ficam visíveis para administradora e recepção, mas não para funcionário', () => {
  assert.equal(canViewSection('administrator', 'orcamentos'), true)
  assert.equal(canViewSection('reception', 'orcamentos'), true)
  assert.equal(canViewSection('employee', 'orcamentos'), false)
})

test('prévia de orçamento calcula múltiplos serviços e começa como rascunho', () => {
  const quote = buildQuotePreviewModel({
    client: 'Arthur',
    vehicle: 'Honda Civic GRT',
    items: [
      { name: 'Polimento técnico', price: 690 },
      { name: 'Proteção cerâmica', price: 1280 },
    ],
    discount: 70,
  })

  assert.equal(quote.status, QUOTE_STATUSES.draft)
  assert.equal(quote.subtotal, 1970)
  assert.equal(quote.discount, 70)
  assert.equal(quote.total, 1900)
  assert.equal(quote.items.length, 2)
})
