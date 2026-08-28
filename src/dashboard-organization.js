const stages = Object.freeze({
  received: { label: 'Aguardando avaliação', tone: 'received' },
  'in-progress': { label: 'Em execução', tone: 'in-progress' },
  ready: { label: 'Pronto para retirada', tone: 'ready' },
})

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])

export function formatElapsedSince(createdAt, now = new Date()) {
  if (!createdAt) return 'tempo não informado'
  const elapsedMinutes = Math.max(0, Math.floor((new Date(now).getTime() - new Date(createdAt).getTime()) / 60000))
  if (elapsedMinutes < 1) return 'agora'
  if (elapsedMinutes < 60) return `há ${elapsedMinutes} min`
  const hours = Math.floor(elapsedMinutes / 60)
  return `há ${hours}h`
}

export function buildDashboardOrganizationModel(services = [], states = [], profiles = [], now = new Date()) {
  const profileNames = new Map(profiles.map((profile) => [profile.id, profile.full_name]))
  const rows = services.map((service, index) => {
    const state = states[index] || {}
    const stage = stages[state.status] || stages[service.tone] || stages.received
    return {
      ...service,
      orderIndex: index,
      stageLabel: stage.label,
      stageTone: stage.tone,
      responsible: profileNames.get(state.responsible || service.responsibleId) || state.responsible || 'Não atribuído',
      elapsedMinutes: service.createdAt ? Math.max(0, Math.floor((new Date(now).getTime() - new Date(service.createdAt).getTime()) / 60000)) : null,
      elapsed: formatElapsedSince(service.createdAt, now),
    }
  }).filter((row) => row.stageTone !== 'delivered')
  return {
    rows,
    stageCounts: {
      received: rows.filter((row) => row.stageTone === 'received').length,
      inProgress: rows.filter((row) => row.stageTone === 'in-progress').length,
      ready: rows.filter((row) => row.stageTone === 'ready').length,
    },
  }
}

export function buildDashboardPaddockMarkup(model) {
  const rows = model.rows.map((row) => `<button class="dashboard-paddock-row" data-dashboard-order="${row.orderIndex}"><span class="dashboard-paddock-status ${row.stageTone}"></span><div class="dashboard-paddock-main"><b>${escapeHtml(row.client)}</b><small>${escapeHtml(row.vehicle)}</small></div><div class="dashboard-paddock-stage"><b>${escapeHtml(row.stageLabel)}</b><small>${escapeHtml(row.service)}</small></div><div class="dashboard-paddock-responsible"><b>${escapeHtml(row.responsible)}</b><small>Responsável</small></div><div class="dashboard-paddock-elapsed"><b>${escapeHtml(row.elapsed)}</b><small>na operação</small></div><span class="dashboard-arrow">Abrir</span></button>`).join('') || '<p class="dashboard-empty">Nenhum veículo em operação neste momento.</p>'
  const vehicleLabel = model.rows.length === 1 ? 'veículo' : 'veículos'
  return `<section class="dashboard-panel dashboard-paddock-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">PÁTIO AO VIVO</p><h2>Onde estão os veículos</h2></div><span class="dashboard-paddock-total" aria-label="${model.rows.length} ${vehicleLabel} no pátio"><b>${model.rows.length}</b><small>${vehicleLabel} no pátio</small></span></div><p class="muted">Acompanhe cada veículo, etapa, responsável e tempo desde a entrada.</p><div class="dashboard-paddock-list">${rows}</div></section>`
}

export function buildDashboardStageChartMarkup(model) {
  const entries = [
    ['received', 'Aguardando avaliação', model.stageCounts.received],
    ['in-progress', 'Em execução', model.stageCounts.inProgress],
    ['ready', 'Prontos para retirada', model.stageCounts.ready],
  ]
  const maxCount = Math.max(1, ...entries.map(([, , count]) => count))
  const total = entries.reduce((sum, [, , count]) => sum + count, 0)
  const rows = entries.map(([tone, label, count]) => {
    const width = Math.round((count / maxCount) * 100)
    return `<div class="dashboard-chart-row"><div class="dashboard-chart-label"><span><i class="dashboard-stage-dot ${tone}"></i>${label}</span><b>${count}</b></div><div class="dashboard-chart-track"><span class="dashboard-chart-bar ${tone}" style="width:${width}%"></span></div></div>`
  }).join('')
  return `<article class="dashboard-panel dashboard-stage-chart-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">FLUXO DA OPERAÇÃO</p><h2>Distribuição das ordens</h2></div><span class="dashboard-chart-total"><b>${total}</b><small>no período atual</small></span></div><p class="muted">Veja rapidamente em qual etapa está concentrado o movimento da estética.</p><div class="dashboard-chart-list">${rows}</div></article>`
}

export function buildDashboardAttentionMarkup(model) {
  const unassigned = model.rows.filter((row) => row.responsible === 'Não atribuído')
  const stale = model.rows.filter((row) => row.elapsedMinutes !== null && row.elapsedMinutes >= 180).sort((a, b) => b.elapsedMinutes - a.elapsedMinutes)
  const pickups = model.rows.filter((row) => row.stageTone === 'ready')
  const list = (items, empty) => items.length ? items.slice(0, 3).map((row) => `<button class="dashboard-attention-item" data-dashboard-order="${row.orderIndex}"><span><b>${escapeHtml(row.client)}</b><small>${escapeHtml(row.vehicle)}</small></span><strong>${escapeHtml(row.elapsed)}</strong></button>`).join('') : `<p class="dashboard-attention-empty">${empty}</p>`
  return `<section class="dashboard-panel dashboard-attention-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">ACOMPANHAMENTO</p><h2>Atenção operacional</h2></div><span class="dashboard-count">${unassigned.length + stale.length + pickups.length}</span></div><p class="muted">Pontos que merecem uma olhada rápida durante o dia.</p><div class="dashboard-attention-grid"><div class="dashboard-attention-block"><div class="dashboard-attention-heading"><b>Sem responsável</b><span>${unassigned.length}</span></div><div class="dashboard-attention-list">${list(unassigned, 'Todas as ordens têm responsável.')}</div></div><div class="dashboard-attention-block"><div class="dashboard-attention-heading"><b>Veículos parados há mais tempo</b><span>${stale.length}</span></div><div class="dashboard-attention-list">${list(stale, 'Nenhum veículo acima de 3h.')}</div></div><div class="dashboard-attention-block"><div class="dashboard-attention-heading"><b>Próximas retiradas</b><span>${pickups.length}</span></div><div class="dashboard-attention-list">${list(pickups, 'Nenhuma retirada pendente.')}</div></div></div></section>`
}

globalThis.__dashboardOrganization = { buildDashboardAttentionMarkup, buildDashboardOrganizationModel, buildDashboardPaddockMarkup, buildDashboardStageChartMarkup }
