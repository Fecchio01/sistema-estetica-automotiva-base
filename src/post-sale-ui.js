import { classifyFollowUp, groupFollowUps } from './post-sale-rules.js'

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]))
const typeLabel = { check_in: 'Check-in', care_tip: 'Dica de cuidado', review: 'Avaliação', return: 'Lembrete de retorno' }
const statusLabel = { today: 'Hoje', overdue: 'Atrasado', upcoming: 'Próximo', done: 'Concluído' }
const profile = () => globalThis.__sessionProfile

async function render(root) {
  root.innerHTML = '<div class="post-sale-loading">Carregando acompanhamentos…</div>'
  try {
    const items = await globalThis.__postSale.loadPostSaleFollowUps(profile())
    const now = new Date()
    const pending = items.filter((item) => item.status === 'pending')
    const counts = { today: pending.filter((item) => classifyFollowUp(item, now) === 'today').length, overdue: pending.filter((item) => classifyFollowUp(item, now) === 'overdue').length, upcoming: pending.filter((item) => classifyFollowUp(item, now) === 'upcoming').length }
    const metric = (title, value, copy, tone = '') => `<article class="post-sale-metric ${tone}"><span>${title}</span><b>${String(value).padStart(2, '0')}</b><small>${copy}</small></article>`
    const grouped = groupFollowUps(items)
    const cards = grouped.map((group, index) => {
      const first = group.items[0]
      const client = first.clients?.full_name || 'Cliente'
      const vehicle = [first.vehicles?.make, first.vehicles?.model, first.vehicles?.license_plate].filter(Boolean).join(' · ') || 'Veículo não informado'
      const latest = group.items.find((item) => item.status === 'pending') || group.items[0]
      const latestGroup = classifyFollowUp(latest, now)
      const details = group.items.map((item) => { const itemGroup = classifyFollowUp(item, now); return `<div class="post-sale-step"><div><span class="post-sale-step-dot ${itemGroup}"></span><div><b>${escapeHtml(typeLabel[item.follow_up_type] || item.follow_up_type)}</b><small>${new Date(item.due_at).toLocaleDateString('pt-BR')} · ${escapeHtml(item.message)}</small></div></div>${item.status === 'pending' ? `<button class="outline-button" data-post-sale-send="${item.id}">Marcar enviado</button>` : `<button class="outline-button" data-post-sale-undo="${item.id}">Desfazer envio</button>`}</div>` }).join('')
      return `<article class="post-sale-client-card"><button class="post-sale-client-summary" type="button" aria-expanded="false" data-post-sale-toggle="${index}"><span class="post-sale-client-avatar">${escapeHtml(client.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase())}</span><span class="post-sale-client-copy"><b>${escapeHtml(client)}</b><small>${escapeHtml(vehicle)}</small></span><span class="post-sale-client-progress"><strong>${group.pendingCount ? `${group.pendingCount} pendentes` : 'Tudo em dia'}</strong><small>${group.items.length} acompanhamentos · ${statusLabel[latestGroup]}</small></span><span class="post-sale-chevron">⌄</span></button><div class="post-sale-client-details hidden" data-post-sale-details="${index}">${details}</div></article>`
    }).join('') || '<div class="post-sale-empty"><b>Nenhum acompanhamento criado ainda</b><span>Quando um atendimento for concluído, os próximos contatos aparecerão aqui.</span></div>'
    root.innerHTML = `<div class="post-sale-summary">${metric('Para hoje', counts.today, 'contatos prioritários', 'today')}${metric('Atrasados', counts.overdue, 'precisam de retorno', 'overdue')}${metric('Próximos', counts.upcoming, 'já programados', 'upcoming')}</div><section class="module-panel post-sale-panel"><div class="module-toolbar"><div><h2>Clientes em acompanhamento</h2><p class="muted">Entre em um cliente para ver todas as próximas ações.</p></div><span class="status-pill in-progress">${grouped.length} clientes</span></div><div class="post-sale-list">${cards}</div></section>`
    root.querySelectorAll('[data-post-sale-toggle]').forEach((button) => button.addEventListener('click', () => { const details = root.querySelector(`[data-post-sale-details="${button.dataset.postSaleToggle}"]`); const expanded = button.getAttribute('aria-expanded') === 'true'; button.setAttribute('aria-expanded', String(!expanded)); details.classList.toggle('hidden', expanded) }))
    const updateLocalFollowUp = (id, status) => { const current = items.find((item) => item.id === id); if (current) { current.status = status; current.sent_at = status === 'sent' ? new Date().toISOString() : null } globalThis.__postSaleFollowUps = items; document.dispatchEvent(new CustomEvent('post-sale-data-ready')) }
    root.querySelectorAll('[data-post-sale-send]').forEach((button) => button.addEventListener('click', async (event) => { event.stopPropagation(); button.disabled = true; try { await globalThis.__postSale.updateFollowUp(profile(), button.dataset.postSaleSend, 'sent'); updateLocalFollowUp(button.dataset.postSaleSend, 'sent'); globalThis.showToast?.('Contato marcado como enviado.'); await render(root) } catch (error) { button.disabled = false; globalThis.showToast?.(error.message) } }))
    root.querySelectorAll('[data-post-sale-undo]').forEach((button) => button.addEventListener('click', async (event) => { event.stopPropagation(); if (!(await globalThis.__requestConfirmation?.('post-sale'))) return; button.disabled = true; try { await globalThis.__postSale.updateFollowUp(profile(), button.dataset.postSaleUndo, 'pending'); updateLocalFollowUp(button.dataset.postSaleUndo, 'pending'); globalThis.showToast?.('Envio cancelado. O acompanhamento voltou para pendente.'); await render(root) } catch (error) { button.disabled = false; globalThis.showToast?.(error.message) } }))
  } catch (error) { root.innerHTML = `<div class="post-sale-empty"><b>Não foi possível carregar o pós-venda</b><span>${escapeHtml(error.message)}</span></div>` }
}

globalThis.__renderPostSale = (root) => render(root)
