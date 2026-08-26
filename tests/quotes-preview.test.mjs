import test from 'node:test'
import assert from 'node:assert/strict'
import { buildQuotePreviewModel, buildQuotePreviewDialogMarkup, buildQuoteServiceOptionMarkup, buildQuoteCardMarkup, QUOTE_STATUSES } from '../src/quotes-preview.js'
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

test('novo orçamento usa uma janela flutuante sem expandir a página', () => {
  const markup = buildQuotePreviewDialogMarkup()

  assert.match(markup, /class="quote-preview-modal-backdrop"/)
  assert.match(markup, /role="dialog"/)
  assert.match(markup, /data-quote-modal-close/)
})

test('serviço do orçamento é apresentado como cartão selecionável', () => {
  const markup = buildQuoteServiceOptionMarkup({ name: 'Polimento técnico', price: 690 }, 1)

  assert.match(markup, /class="quote-service-card"/)
  assert.match(markup, /data-quote-service="1"/)
  assert.match(markup, /R\$\s*690,00/)
})

test('card de orçamento destaca cliente, total e etapa comercial', () => {
  const markup = buildQuoteCardMarkup(buildQuotePreviewModel({
    client: 'Arthur',
    vehicle: 'Honda Civic GRT',
    items: [{ name: 'Polimento técnico', price: 690 }],
    status: QUOTE_STATUSES.sent,
  }), 0)

  assert.match(markup, /class="quote-sales-card"/)
  assert.match(markup, /quote-sales-stage/)
  assert.match(markup, /R\$\s*690,00/)
})

test('formulário de orçamento usa campos comerciais estilizados', () => {
  const markup = buildQuotePreviewDialogMarkup()

  assert.match(markup, /class="quote-form-field"/)
  assert.match(markup, /class="quote-form-select"/)
  assert.match(markup, /class="quote-preview-modal quote-preview-modal-wide"/)
})
