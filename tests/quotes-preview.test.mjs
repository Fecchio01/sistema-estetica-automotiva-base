import test from 'node:test'
import assert from 'node:assert/strict'
import { buildQuotePreviewModel, buildQuotePreviewDialogMarkup, buildQuoteServiceOptionMarkup, buildQuoteCardMarkup, buildQuoteClientOptionsMarkup, buildQuoteVehicleOptionsMarkup, resolveApprovedWorkOrderInput, shouldRefreshQuotesPreview, QUOTE_STATUSES } from '../src/quotes-preview.js'
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
  assert.match(markup, /data-quote-action="delete"/)
  assert.match(markup, /class="quote-status-select"/)
  assert.match(markup, /value="Recusado"/)
})

test('formulário de orçamento usa campos comerciais estilizados', () => {
  const markup = buildQuotePreviewDialogMarkup()

  assert.match(markup, /class="quote-form-field"/)
  assert.match(markup, /class="quote-form-select"/)
  assert.match(markup, /class="quote-preview-modal quote-preview-modal-wide"/)
})

test('formulário de orçamento usa somente clientes e veículos ativos do Supabase', () => {
  const records = [{
    id: 'client-1',
    name: 'Luna Martins',
    vehicles: [{ id: 'vehicle-1', make: 'Honda', model: 'Civic Touring', license_plate: 'ABC1D23' }],
  }]
  const markup = buildQuotePreviewDialogMarkup(records)

  assert.match(markup, /value="client-1"[^>]*>Luna Martins/)
  assert.match(markup, /value="vehicle-1"[^>]*>Honda · Civic Touring · ABC1D23/)
  assert.doesNotMatch(markup, /Arthur|Rafael Nogueira/)
})

test('opções de cliente e veículo ficam vazias quando não há cadastro ativo', () => {
  assert.match(buildQuoteClientOptionsMarkup([]), /Nenhum cliente ativo cadastrado/)
  assert.match(buildQuoteVehicleOptionsMarkup(null), /Nenhum veículo cadastrado/)
})

test('prévia de orçamento só reage à atualização quando a aba de orçamento está ativa', () => {
  assert.equal(shouldRefreshQuotesPreview('orcamentos'), true)
  assert.equal(shouldRefreshQuotesPreview('atendimentos'), false)
})

test('aprovação mapeia orçamento para atendimento recebido no cliente e veículo corretos', () => {
  const input = resolveApprovedWorkOrderInput({
    client: 'Arthur',
    vehicle: 'Honda Civic GRT',
    items: [{ name: 'Polimento técnico' }, { name: 'Proteção cerâmica' }],
    total: 1900,
  }, { id: 'admin-1', company_id: 'company-1' }, [{
    id: 'client-1',
    name: 'arthur',
    vehicles: [{ id: 'vehicle-1', make: 'Honda', model: 'Civic GRT', license_plate: null }],
  }])

  assert.deepEqual(input, {
    clientId: 'client-1',
    vehicleId: 'vehicle-1',
    responsibleId: 'admin-1',
    status: 'scheduled',
    scheduledAt: null,
    services: ['Polimento técnico', 'Proteção cerâmica'],
    totalAmount: 1900,
  })
})

test('aprovação recusa orçamento sem cliente cadastrado', () => {
  assert.throws(() => resolveApprovedWorkOrderInput({ client: 'Rafael Nogueira', vehicle: 'Honda Civic Touring', items: [] }, { id: 'admin-1', company_id: 'company-1' }, []), /Cliente do orçamento não está cadastrado/)
})
