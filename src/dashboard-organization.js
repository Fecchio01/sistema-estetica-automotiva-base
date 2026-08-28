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
  const stageCards = [
    ['received', 'Aguardando avaliação', model.stageCounts.received],
    ['in-progress', 'Em execução', model.stageCounts.inProgress],
    ['ready', 'Prontos para retirada', model.stageCounts.ready],
  ].map(([tone, label, count]) => `<div class="dashboard-stage-card"><span class="dashboard-stage-dot ${tone}"></span><div><b>${count}</b><small>${label}</small></div></div>`).join('')
  const rows = model.rows.map((row) => `<button class="dashboard-paddock-row" data-dashboard-order="${row.orderIndex}"><span class="dashboard-paddock-status ${row.stageTone}"></span><div class="dashboard-paddock-main"><b>${escapeHtml(row.client)}</b><small>${escapeHtml(row.vehicle)}</small></div><div class="dashboard-paddock-stage"><b>${escapeHtml(row.stageLabel)}</b><small>${escapeHtml(row.service)}</small></div><div class="dashboard-paddock-responsible"><b>${escapeHtml(row.responsible)}</b><small>Responsável</small></div><div class="dashboard-paddock-elapsed"><b>${escapeHtml(row.elapsed)}</b><small>na operação</small></div><span class="dashboard-arrow">Abrir</span></button>`).join('') || '<p class="dashboard-empty">Nenhum veículo em operação neste momento.</p>'
  const vehicleLabel = model.rows.length === 1 ? 'veículo' : 'veículos'
  return `<section class="dashboard-panel dashboard-paddock-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">PÁTIO AO VIVO</p><h2>Onde estão os veículos</h2></div><span class="dashboard-paddock-total" aria-label="${model.rows.length} ${vehicleLabel} no pátio"><b>${model.rows.length}</b><small>${vehicleLabel} no pátio</small></span></div><p class="muted">Acompanhe cada veículo, etapa, responsável e tempo desde a entrada.</p><div class="dashboard-stage-cards">${stageCards}</div><div class="dashboard-paddock-list">${rows}</div></section>`
}

globalThis.__dashboardOrganization = { buildDashboardOrganizationModel, buildDashboardPaddockMarkup }
