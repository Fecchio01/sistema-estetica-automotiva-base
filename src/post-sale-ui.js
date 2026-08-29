import { classifyFollowUp } from './post-sale-rules.js'

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
    const rows = items.map((item) => {
      const group = classifyFollowUp(item, now)
      const client = item.clients?.full_name || 'Cliente'
      const vehicle = [item.vehicles?.make, item.vehicles?.model, item.vehicles?.license_plate].filter(Boolean).join(' · ') || 'Veículo não informado'
      return `<article class="post-sale-followup ${group}"><div class="post-sale-followup-main"><div class="post-sale-followup-topline"><span class="post-sale-type">${escapeHtml(typeLabel[item.follow_up_type] || item.follow_up_type)}</span><span class="post-sale-due ${group}">${statusLabel[group]}</span></div><h3>${escapeHtml(client)}</h3><p>${escapeHtml(vehicle)} · ${escapeHtml(item.work_orders?.service_description || 'Serviço concluído')}</p><small>${new Date(item.due_at).toLocaleDateString('pt-BR')} · ${escapeHtml(item.message)}</small></div><div class="post-sale-actions">${item.status === 'pending' ? `<button class="outline-button" data-post-sale-send="${item.id}">Marcar como enviado</button>` : `<span class="status-pill ready">${item.sent_at ? 'Enviado' : 'Concluído'}</span>`}</div></article>`
    }).join('') || '<div class="post-sale-empty"><b>Nenhum acompanhamento criado ainda</b><span>Quando um atendimento for concluído, os próximos contatos aparecerão aqui.</span></div>'
    root.innerHTML = `<div class="post-sale-summary">${metric('Para hoje', counts.today, 'contatos prioritários', 'today')}${metric('Atrasados', counts.overdue, 'precisam de retorno', 'overdue')}${metric('Próximos', counts.upcoming, 'já programados', 'upcoming')}</div><section class="module-panel post-sale-panel"><div class="module-toolbar"><div><h2>Fila de pós-venda</h2><p class="muted">Uma sequência criada a partir das ordens entregues.</p></div><span class="status-pill in-progress">${pending.length} pendentes</span></div><div class="post-sale-list">${rows}</div></section>`
    root.querySelectorAll('[data-post-sale-send]').forEach((button) => button.addEventListener('click', async () => { button.disabled = true; try { await globalThis.__postSale.updateFollowUp(profile(), button.dataset.postSaleSend, 'sent'); globalThis.showToast?.('Contato marcado como enviado.'); await render(root) } catch (error) { button.disabled = false; globalThis.showToast?.(error.message) } }))
  } catch (error) { root.innerHTML = `<div class="post-sale-empty"><b>Não foi possível carregar o pós-venda</b><span>${escapeHtml(error.message)}</span></div>` }
}

globalThis.__renderPostSale = (root) => render(root)
