export const QUOTE_STATUSES = Object.freeze({
  draft: 'Rascunho',
  sent: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Recusado',
})

export function buildQuotePreviewModel(input = {}) {
  const items = (input.items || []).map((item) => ({
    name: String(item.name || 'Serviço'),
    price: Number(item.price) || 0,
  }))
  const subtotal = items.reduce((total, item) => total + item.price, 0)
  const discount = Math.max(0, Number(input.discount) || 0)

  return {
    client: String(input.client || 'Cliente não informado'),
    vehicle: String(input.vehicle || 'Veículo não informado'),
    items,
    subtotal,
    discount: Math.min(discount, subtotal),
    total: Math.max(0, subtotal - Math.min(discount, subtotal)),
    status: input.status || QUOTE_STATUSES.draft,
  }
}

const serviceOptions = [
  { name: 'Detalhamento interno', price: 280 },
  { name: 'Polimento técnico', price: 690 },
  { name: 'Higienização completa', price: 420 },
  { name: 'Proteção cerâmica', price: 1280 },
]

export function buildQuoteServiceOptionMarkup(item, index) {
  return `<label class="quote-service-card" data-quote-service="${index}"><input type="checkbox" name="service-${index}" value="${index}"><span class="quote-service-card-check" aria-hidden="true">✓</span><span class="quote-service-card-copy"><b>${escapeHtml(item.name)}</b><small>Serviço disponível</small></span><strong>${money(item.price)}</strong><span class="quote-service-card-action">Adicionar</span></label>`
}

const demoQuotes = [
  buildQuotePreviewModel({
    client: 'Arthur',
    vehicle: 'Honda Civic GRT',
    items: [serviceOptions[1], serviceOptions[3]],
    discount: 70,
    status: QUOTE_STATUSES.sent,
  }),
]

let quotes = [...demoQuotes]

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
}

export function buildQuoteCardMarkup(quote, index) {
  const statusClass = Object.entries(QUOTE_STATUSES).find(([, label]) => label === quote.status)?.[0] || 'draft'
  const stages = Object.values(QUOTE_STATUSES).map((stage) => `<span class="${stage === quote.status ? 'is-current' : ''}">${escapeHtml(stage)}</span>`).join('')
  const statusOptions = Object.values(QUOTE_STATUSES).map((stage) => `<option value="${escapeHtml(stage)}" ${stage === quote.status ? 'selected' : ''}>${escapeHtml(stage)}</option>`).join('')
  return `<article class="quote-sales-card"><div class="quote-sales-card-header"><div><span class="eyebrow">PROPOSTA ${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(quote.client)}</h3><p>${escapeHtml(quote.vehicle)}</p></div><span class="quote-status quote-status-${statusClass}">${escapeHtml(quote.status)}</span></div><div class="quote-sales-stage" aria-label="Etapa do orçamento">${stages}</div><div class="quote-sales-card-body"><div><span class="quote-sales-label">Serviços incluídos</span><div class="quote-sales-services">${quote.items.map((item) => `<span>${escapeHtml(item.name)}</span>`).join('')}</div></div><div class="quote-sales-value"><span class="quote-sales-label">Total da proposta</span><strong>${money(quote.total)}</strong>${quote.discount ? `<small>Desconto de ${money(quote.discount)}</small>` : ''}</div></div><div class="quote-sales-card-footer"><span>${quote.items.length} ${quote.items.length === 1 ? 'serviço' : 'serviços'}</span><div class="quote-card-actions"><label class="quote-status-control"><span>Status</span><select class="quote-status-select" data-quote-action="status" data-quote-index="${index}">${statusOptions}</select></label><button class="text-button" type="button" data-quote-action="edit" data-quote-index="${index}">Editar</button><button class="outline-button" type="button" data-quote-action="approve" data-quote-index="${index}">Aprovar</button><button class="quote-delete-button" type="button" data-quote-action="delete" data-quote-index="${index}">Apagar</button></div></div></article>`
}

export function buildQuotePreviewDialogMarkup() {
  return `<div class="quote-preview-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="quote-preview-modal-title"><div class="quote-preview-modal quote-preview-modal-wide"><button type="button" class="quote-preview-modal-close" data-quote-modal-close aria-label="Fechar">×</button><div class="quote-preview-modal-heading"><p class="eyebrow">NOVA PROPOSTA</p><h2 id="quote-preview-modal-title">Criar orçamento</h2><p>Selecione os serviços e veja o total antes de enviar ao cliente.</p></div>${formMarkup()}</div></div>`
}

function formMarkup() {
  return `<form class="quote-preview-form" id="quote-preview-form"><div class="quote-form-layout"><div class="quote-form-main"><div class="quote-form-grid"><label class="quote-form-field"><span>Cliente</span><select class="quote-form-select" name="client" required><option value="Arthur">Arthur</option></select></label><label class="quote-form-field"><span>Veículo</span><select class="quote-form-select" name="vehicle" required><option>Honda Civic GRT</option><option>Honda Civic Touring</option></select></label></div><fieldset><legend>Escolha os serviços</legend><p class="quote-form-helper">Selecione um ou mais serviços para montar a proposta.</p><div class="quote-service-grid">${serviceOptions.map(buildQuoteServiceOptionMarkup).join('')}</div></fieldset><label class="quote-form-field"><span>Desconto</span><input name="discount" type="number" min="0" step="0.01" value="0"></label></div><aside class="quote-form-summary"><span class="eyebrow">RESUMO</span><h3>Sua proposta</h3><div class="quote-summary-items" id="quote-summary-items"><span>Nenhum serviço selecionado</span></div><div class="quote-summary-total"><span>Total</span><strong id="quote-preview-form-total">R$ 0,00</strong></div></aside></div><p class="quote-preview-note">Ao aprovar, a proposta será registrada como atendimento no sistema.</p><div class="form-actions"><button type="button" class="outline-button" id="quote-preview-cancel">Cancelar</button><button class="primary-button" type="submit">Salvar rascunho</button></div></form>`
}

export function resolveApprovedWorkOrderInput(quote, profile, clientRecords = []) {
  if (!profile?.id || !profile?.company_id) throw new Error('Faça login para aprovar este orçamento.')
  const clientName = String(quote?.client || '').trim().toLowerCase()
  const client = clientRecords.find((record) => String(record.name || '').trim().toLowerCase() === clientName)
  if (!client) throw new Error('Cliente do orçamento não está cadastrado no sistema.')
  const vehicleText = String(quote?.vehicle || '').trim().toLowerCase()
  const vehicle = (client.vehicles || []).find((item) => {
    const label = [item.make, item.model, item.license_plate].filter(Boolean).join(' ').toLowerCase()
    return label.includes(vehicleText) || vehicleText.includes(label)
  }) || client.vehicles?.[0]
  if (!vehicle) throw new Error('Veículo do orçamento não está cadastrado para este cliente.')
  return { clientId: client.id, vehicleId: vehicle.id, responsibleId: profile.id, status: 'scheduled', scheduledAt: null, services: (quote.items || []).map((item) => item.name), totalAmount: quote.total }
}

function render(root) {
  root.innerHTML = `<div class="quotes-preview-shell"><div class="quotes-preview-intro"><div><p class="eyebrow">FLUXO COMERCIAL</p><h2>Orçamentos</h2><p>Monte propostas com vários serviços e transforme uma aprovação em atendimento.</p></div><span class="quote-preview-badge">Conectado ao atendimento</span></div><div class="quote-preview-metrics"><div><span>Rascunhos</span><strong>${quotes.filter((quote) => quote.status === QUOTE_STATUSES.draft).length}</strong><small>em preparação</small></div><div><span>Enviados</span><strong>${quotes.filter((quote) => quote.status === QUOTE_STATUSES.sent).length}</strong><small>aguardando cliente</small></div><div><span>Valor em propostas</span><strong>${money(quotes.reduce((total, quote) => total + quote.total, 0))}</strong><small>somatório da prévia</small></div></div><div class="quote-preview-toolbar"><div><h3>Propostas recentes</h3><p>A aprovação cria um atendimento recebido e remove a proposta desta lista.</p></div><button class="primary-button" type="button" id="quote-preview-new">+ Novo orçamento</button></div><div class="quote-sales-list">${quotes.map(buildQuoteCardMarkup).join('')}</div><div class="quote-preview-form-host hidden" id="quote-preview-form-host">${buildQuotePreviewDialogMarkup()}</div></div>`

  const formHost = root.querySelector('#quote-preview-form-host')
  const newButton = root.querySelector('#quote-preview-new')
  const form = root.querySelector('#quote-preview-form')
  const totalElement = root.querySelector('#quote-preview-form-total')
  const summaryItems = root.querySelector('#quote-summary-items')
  const updateTotal = () => {
    const items = [...form.querySelectorAll('input[type="checkbox"]:checked')].map((input) => serviceOptions[Number(input.value)])
    const discount = Number(form.elements.discount.value) || 0
    summaryItems.innerHTML = items.length ? items.map((item) => `<span><span>${escapeHtml(item.name)}</span><b>${money(item.price)}</b></span>`).join('') : '<span>Nenhum serviço selecionado</span>'
    totalElement.textContent = money(buildQuotePreviewModel({ items, discount }).total)
  }
  const closeForm = () => { formHost.classList.add('hidden'); newButton.disabled = false; form.reset(); updateTotal() }
  newButton.addEventListener('click', () => { formHost.classList.remove('hidden'); newButton.disabled = true; form.querySelector('input[type="checkbox"]').focus() })
  root.querySelectorAll('#quote-preview-cancel, [data-quote-modal-close]').forEach((button) => button.addEventListener('click', closeForm))
  root.querySelector('.quote-preview-modal-backdrop').addEventListener('click', (event) => { if (event.target === event.currentTarget) closeForm() })
  root.querySelector('.quote-preview-modal').addEventListener('click', (event) => event.stopPropagation())
  form.querySelectorAll('input').forEach((input) => input.addEventListener('input', updateTotal))
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const items = [...form.querySelectorAll('input[type="checkbox"]:checked')].map((input) => serviceOptions[Number(input.value)])
    if (!items.length) return
    quotes = [buildQuotePreviewModel({ client: form.elements.client.value, vehicle: form.elements.vehicle.value, items, discount: form.elements.discount.value }), ...quotes]
    render(root)
  })
  const approveQuote = async (index, trigger) => {
    if (trigger?.dataset.pending === 'true') return
    const quote = quotes[index]
    if (!quote) return
    trigger?.setAttribute('disabled', 'true')
    if (trigger) { trigger.dataset.pending = 'true'; trigger.textContent = 'Aprovando…' }
    try {
      const input = resolveApprovedWorkOrderInput(quote, globalThis.__sessionProfile, globalThis.__clientRecords || [])
      const { createWorkOrder } = await import('./clients-data.js')
      const createdOrder = await createWorkOrder(globalThis.__sessionProfile, input)
      quotes.splice(index, 1)
      globalThis.__addLiveWorkOrder?.(createdOrder)
      document.dispatchEvent(new CustomEvent('live-data-refresh-requested'))
      render(root)
    } catch (error) {
      if (trigger) { trigger.removeAttribute('disabled'); trigger.dataset.pending = 'false'; trigger.textContent = 'Aprovar' }
      const message = document.createElement('p')
      message.className = 'quote-preview-feedback'
      message.textContent = error.message || 'Não foi possível aprovar o orçamento.'
      root.querySelector('.quote-preview-toolbar')?.append(message)
    }
  }
  root.querySelectorAll('[data-quote-action="approve"]').forEach((button) => button.addEventListener('click', () => approveQuote(Number(button.dataset.quoteIndex), button)))
  root.querySelectorAll('[data-quote-action="status"]').forEach((select) => select.addEventListener('change', () => { const index = Number(select.dataset.quoteIndex); if (select.value === QUOTE_STATUSES.approved) { approveQuote(index, root.querySelector(`[data-quote-action="approve"][data-quote-index="${index}"]`)); return } quotes[index] = { ...quotes[index], status: select.value }; render(root) }))
  root.querySelectorAll('[data-quote-action="delete"]').forEach((button) => button.addEventListener('click', async () => { const confirmed = await globalThis.__requestConfirmation?.('quote'); if (!confirmed) return; quotes.splice(Number(button.dataset.quoteIndex), 1); render(root) }))
  root.querySelectorAll('[data-quote-action="edit"]').forEach((button) => button.addEventListener('click', () => { formHost.classList.remove('hidden'); newButton.disabled = true; form.elements.client.value = quotes[Number(button.dataset.quoteIndex)].client; form.elements.vehicle.value = quotes[Number(button.dataset.quoteIndex)].vehicle }))
}

globalThis.__renderQuotesPreview = render
