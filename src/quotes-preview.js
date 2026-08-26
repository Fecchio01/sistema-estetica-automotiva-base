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

const demoQuotes = [
  buildQuotePreviewModel({
    client: 'Arthur',
    vehicle: 'Honda Civic GRT',
    items: [serviceOptions[1], serviceOptions[3]],
    discount: 70,
    status: QUOTE_STATUSES.sent,
  }),
  buildQuotePreviewModel({
    client: 'Rafael Nogueira',
    vehicle: 'Honda Civic Touring',
    items: [serviceOptions[0]],
    status: QUOTE_STATUSES.draft,
  }),
]

let quotes = [...demoQuotes]

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
}

function quoteCard(quote, index) {
  const statusClass = Object.entries(QUOTE_STATUSES).find(([, label]) => label === quote.status)?.[0] || 'draft'
  return `<article class="quote-preview-card"><div class="quote-preview-card-top"><div><span class="eyebrow">ORÇAMENTO ${String(index + 1).padStart(2, '0')}</span><h3>${escapeHtml(quote.client)}</h3><p>${escapeHtml(quote.vehicle)}</p></div><span class="quote-status quote-status-${statusClass}">${escapeHtml(quote.status)}</span></div><div class="quote-item-list">${quote.items.map((item) => `<div><span>${escapeHtml(item.name)}</span><b>${money(item.price)}</b></div>`).join('')}</div><div class="quote-preview-total"><span>${quote.items.length} ${quote.items.length === 1 ? 'serviço' : 'serviços'}${quote.discount ? ` · desconto de ${money(quote.discount)}` : ''}</span><strong>${money(quote.total)}</strong></div><div class="quote-card-actions"><button class="text-button" type="button" data-quote-action="edit" data-quote-index="${index}">Editar</button><button class="outline-button" type="button" data-quote-action="approve" data-quote-index="${index}">Aprovar</button></div></article>`
}

export function buildQuotePreviewDialogMarkup() {
  return `<div class="quote-preview-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="quote-preview-modal-title"><div class="quote-preview-modal"><button type="button" class="quote-preview-modal-close" data-quote-modal-close aria-label="Fechar">×</button><div class="quote-preview-modal-heading"><p class="eyebrow">NOVA PROPOSTA</p><h2 id="quote-preview-modal-title">Criar orçamento</h2><p>Selecione os serviços e veja o total antes de enviar ao cliente.</p></div>${formMarkup()}</div></div>`
}

function formMarkup() {
  return `<form class="quote-preview-form" id="quote-preview-form"><div class="quote-form-grid"><label>Cliente<select name="client" required><option value="Arthur">Arthur</option><option value="Rafael Nogueira">Rafael Nogueira</option></select></label><label>Veículo<select name="vehicle" required><option>Honda Civic GRT</option><option>Honda Civic Touring</option></select></label></div><fieldset><legend>Serviços</legend>${serviceOptions.map((item, index) => `<label class="quote-service-option"><input type="checkbox" name="service-${index}" value="${index}"><span>${item.name}</span><b>${money(item.price)}</b></label>`).join('')}</fieldset><label>Desconto<input name="discount" type="number" min="0" step="0.01" value="0"></label><div class="quote-preview-form-total"><span>Total da proposta</span><strong id="quote-preview-form-total">R$ 0,00</strong></div><p class="quote-preview-note">Prévia local: nada será salvo no Supabase nesta etapa.</p><div class="form-actions"><button type="button" class="outline-button" id="quote-preview-cancel">Cancelar</button><button class="primary-button" type="submit">Salvar rascunho</button></div></form>`
}

function render(root) {
  root.innerHTML = `<div class="quotes-preview-shell"><div class="quotes-preview-intro"><div><p class="eyebrow">PRÉVIA DO NOVO MÓDULO</p><h2>Orçamentos</h2><p>Monte propostas com vários serviços antes de transformar uma aprovação em atendimento.</p></div><span class="quote-preview-badge">Somente visual</span></div><div class="quote-preview-metrics"><div><span>Rascunhos</span><strong>${quotes.filter((quote) => quote.status === QUOTE_STATUSES.draft).length}</strong><small>em preparação</small></div><div><span>Enviados</span><strong>${quotes.filter((quote) => quote.status === QUOTE_STATUSES.sent).length}</strong><small>aguardando cliente</small></div><div><span>Valor em propostas</span><strong>${money(quotes.reduce((total, quote) => total + quote.total, 0))}</strong><small>somatório da prévia</small></div></div><div class="quote-preview-toolbar"><div><h3>Propostas recentes</h3><p>Fluxo visual: rascunho → enviado → aprovado.</p></div><button class="primary-button" type="button" id="quote-preview-new">+ Novo orçamento</button></div><div class="quote-preview-list">${quotes.map(quoteCard).join('')}</div><div class="quote-preview-form-host hidden" id="quote-preview-form-host">${buildQuotePreviewDialogMarkup()}</div></div>`

  const formHost = root.querySelector('#quote-preview-form-host')
  const newButton = root.querySelector('#quote-preview-new')
  const form = root.querySelector('#quote-preview-form')
  const totalElement = root.querySelector('#quote-preview-form-total')
  const updateTotal = () => {
    const items = [...form.querySelectorAll('input[type="checkbox"]:checked')].map((input) => serviceOptions[Number(input.value)])
    const discount = Number(form.elements.discount.value) || 0
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
  root.querySelectorAll('[data-quote-action="approve"]').forEach((button) => button.addEventListener('click', () => { quotes[Number(button.dataset.quoteIndex)] = { ...quotes[Number(button.dataset.quoteIndex)], status: QUOTE_STATUSES.approved }; render(root) }))
  root.querySelectorAll('[data-quote-action="edit"]').forEach((button) => button.addEventListener('click', () => { formHost.classList.remove('hidden'); newButton.disabled = true; form.elements.client.value = quotes[Number(button.dataset.quoteIndex)].client; form.elements.vehicle.value = quotes[Number(button.dataset.quoteIndex)].vehicle }))
}

globalThis.__renderQuotesPreview = render
