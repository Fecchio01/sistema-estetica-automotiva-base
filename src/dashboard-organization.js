const stages = Object.freeze({
  received: { label: 'Aguardando avaliação', tone: 'received' },
  'in-progress': { label: 'Em execução', tone: 'in-progress' },
  ready: { label: 'Pronto para retirada', tone: 'ready' },
  delivered: { label: 'Finalizado', tone: 'delivered' },
  cancelled: { label: 'Cancelado', tone: 'cancelled' },
})

const checklistStages = Object.freeze([
  { id: 'received', label: 'Entrada' },
  { id: 'assessment', label: 'Avaliação' },
  { id: 'execution', label: 'Execução' },
  { id: 'inspection', label: 'Inspeção' },
  { id: 'delivery', label: 'Entrega' },
])

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])

export function formatElapsedSince(createdAt, now = new Date()) {
  if (!createdAt) return 'tempo não informado'
  const elapsedMinutes = Math.max(0, Math.floor((new Date(now).getTime() - new Date(createdAt).getTime()) / 60000))
  if (elapsedMinutes < 1) return 'agora'
  if (elapsedMinutes < 60) return `há ${elapsedMinutes} min`
  const hours = Math.floor(elapsedMinutes / 60)
  return `há ${hours}h`
}

export function buildDashboardOrganizationModel(services = [], states = [], profiles = [], now = new Date(), photos = [], postSaleFollowUps = []) {
  const profileNames = new Map(profiles.map((profile) => [profile.id, profile.full_name]))
  const allRows = services.map((service, index) => {
    const state = states[index] || {}
    const stage = stages[state.status] || stages[service.tone] || stages.received
    return {
      ...service,
      orderIndex: index,
      stageLabel: stage.label,
      stageTone: stage.tone,
      responsible: profileNames.get(state.responsible || service.responsibleId) || state.responsible || 'Não atribuído',
      checklistPhotos: photos[index] || service.checklistPhotos || [],
      elapsedMinutes: service.createdAt ? Math.max(0, Math.floor((new Date(now).getTime() - new Date(service.createdAt).getTime()) / 60000)) : null,
      elapsed: formatElapsedSince(service.createdAt, now),
    }
  })
  const rows = allRows.filter((row) => row.stageTone !== 'delivered')
  return {
    rows,
    completedRows: allRows.filter((row) => row.stageTone === 'delivered'),
    postSaleFollowUps,
    stageCounts: {
      received: rows.filter((row) => row.stageTone === 'received').length,
      inProgress: rows.filter((row) => row.stageTone === 'in-progress').length,
      ready: rows.filter((row) => row.stageTone === 'ready').length,
    },
  }
}

export function buildDashboardPaddockMarkup(model) {
  const rows = model.rows.map((row) => `<button class="dashboard-paddock-row ${row.stageTone}" data-dashboard-order="${row.orderIndex}"><span class="dashboard-paddock-status ${row.stageTone}"></span><div class="dashboard-paddock-main"><b>${escapeHtml(row.client)}</b><small>${escapeHtml(row.vehicle)}</small></div><div class="dashboard-paddock-stage"><b>${escapeHtml(row.stageLabel)}</b><small>${escapeHtml(row.service)}</small></div><div class="dashboard-paddock-responsible"><b>${escapeHtml(row.responsible)}</b><small>Responsável</small></div><div class="dashboard-paddock-elapsed"><b>${escapeHtml(row.elapsed)}</b><small>na operação</small></div><span class="dashboard-arrow">Abrir</span></button>`).join('') || '<p class="dashboard-empty">Nenhum veículo em operação neste momento.</p>'
  const vehicleLabel = model.rows.length === 1 ? 'veículo' : 'veículos'
  const entries = [
    ['received', 'Avaliação', model.stageCounts?.received || 0],
    ['in-progress', 'Em execução', model.stageCounts?.inProgress || 0],
    ['ready', 'Retirada', model.stageCounts?.ready || 0],
  ]
  const total = entries.reduce((sum, [, , count]) => sum + count, 0)
  const segments = entries.map(([tone, label, count]) => `<span class="dashboard-paddock-distribution-segment ${tone}" style="width:${total ? Math.round((count / total) * 100) : 0}%" aria-label="${label}: ${count}"></span>`).join('')
  const legend = entries.map(([tone, label, count]) => `<span><i class="dashboard-stage-dot ${tone}"></i><b>${label}</b><strong>${count}</strong></span>`).join('')
  return `<section class="dashboard-panel dashboard-paddock-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">PÁTIO AO VIVO</p><h2>Onde estão os veículos</h2></div><span class="dashboard-paddock-total" aria-label="${model.rows.length} ${vehicleLabel} no pátio"><b>${model.rows.length}</b><small>${vehicleLabel} no pátio</small></span></div><p class="muted">Acompanhe cada veículo, etapa, responsável e tempo desde a entrada.</p><div class="dashboard-paddock-distribution" role="img" aria-label="Distribuição atual do pátio por etapa"><div class="dashboard-paddock-distribution-visual">${segments}</div><div class="dashboard-paddock-distribution-legend">${legend}</div></div><div class="dashboard-paddock-list">${rows}</div></section>`
}

export function buildDashboardStageChartMarkup(model, now = new Date()) {
  const entries = [
    ['received', 'Aguardando avaliação', model.rows?.filter((row) => row.createdAt && new Date(row.createdAt).getUTCMonth() === new Date(now).getUTCMonth() && new Date(row.createdAt).getUTCFullYear() === new Date(now).getUTCFullYear() && row.stageTone === 'received').length ?? model.stageCounts.received],
    ['in-progress', 'Em execução', model.rows?.filter((row) => row.createdAt && new Date(row.createdAt).getUTCMonth() === new Date(now).getUTCMonth() && new Date(row.createdAt).getUTCFullYear() === new Date(now).getUTCFullYear() && row.stageTone === 'in-progress').length ?? model.stageCounts.inProgress],
    ['ready', 'Prontos para retirada', model.rows?.filter((row) => row.createdAt && new Date(row.createdAt).getUTCMonth() === new Date(now).getUTCMonth() && new Date(row.createdAt).getUTCFullYear() === new Date(now).getUTCFullYear() && row.stageTone === 'ready').length ?? model.stageCounts.ready],
  ]
  const maxCount = Math.max(1, ...entries.map(([, , count]) => count))
  const total = entries.reduce((sum, [, , count]) => sum + count, 0)
  const stages = entries.map(([tone, label, count]) => ({
    tone,
    label,
    count,
    width: total ? Math.round((count / total) * 100) : 0,
  }))
  const segments = stages.map(({ tone, label, count, width }) => `<span class="dashboard-flow-segment ${tone}" style="width:${width}%" aria-label="${label}: ${count}">${count ? `<b>${count}</b>` : ''}</span>`).join('')
  const rows = stages.map(({ tone, label, count }) => {
    const width = Math.round((count / maxCount) * 100)
    return `<div class="dashboard-chart-row"><div class="dashboard-chart-label"><span><i class="dashboard-stage-dot ${tone}"></i>${label}</span><b>${count}</b></div><div class="dashboard-chart-track"><span class="dashboard-chart-bar ${tone}" style="width:${width}%"></span></div></div>`
  }).join('')
  return `<article class="dashboard-panel dashboard-stage-chart-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">FLUXO DA OPERAÇÃO</p><h2>Fluxo mensal</h2></div><span class="dashboard-chart-total"><b>${total}</b><small>ordens criadas neste mês</small></span></div><p class="muted">Distribuição das ordens para acompanhar o fluxo da estética no mês.</p><div class="dashboard-flow-visual" role="img" aria-label="${total} ordens distribuídas por etapa">${segments}</div><div class="dashboard-chart-list">${rows}</div></article>`
}

export function buildDashboardFinancialMarkup(model, now = new Date()) {
  const end = new Date(now)
  end.setUTCHours(23, 59, 59, 999)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 6)
  start.setUTCHours(0, 0, 0, 0)
  const rows = [...(model.rows || []), ...(model.completedRows || [])]
  const daily = new Map()
  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(start)
    day.setUTCDate(start.getUTCDate() + offset)
    daily.set(day.toISOString().slice(0, 10), 0)
  }
  const serviceTotals = new Map()
  rows.forEach((row) => {
    const amount = Math.max(0, Number(row.amount || 0))
    const date = new Date(row.createdAt || row.scheduledAt || 0)
    if (amount && !Number.isNaN(date.getTime())) {
      const key = date.toISOString().slice(0, 10)
      if (daily.has(key)) daily.set(key, daily.get(key) + amount)
    }
    if (amount) serviceTotals.set(row.service || 'Serviço não informado', (serviceTotals.get(row.service || 'Serviço não informado') || 0) + amount)
  })
  const trend = [...daily.entries()].map(([key, amount]) => ({ label: `${key.slice(8, 10)}/${key.slice(5, 7)}`, amount }))
  const total = trend.reduce((sum, item) => sum + item.amount, 0)
  const maxTrend = Math.max(1, ...trend.map((item) => item.amount))
  const bars = trend.map((item) => `<div class="dashboard-financial-column"><span style="height:${Math.max(item.amount ? 10 : 3, Math.round((item.amount / maxTrend) * 100))}%" title="R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}"></span><small>${item.label}</small></div>`).join('')
  const topServices = [...serviceTotals.entries()].sort((left, right) => right[1] - left[1]).slice(0, 3)
  const maxService = Math.max(1, ...topServices.map(([, amount]) => amount))
  const serviceMarkup = topServices.map(([service, amount]) => `<div class="dashboard-financial-service"><div><b>${escapeHtml(service)}</b><small>R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</small></div><i><span style="width:${Math.round((amount / maxService) * 100)}%"></span></i></div>`).join('') || '<p class="dashboard-summary-empty">Nenhum serviço com valor registrado.</p>'
  return `<section class="dashboard-panel dashboard-financial-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">RESULTADO EM TEMPO REAL</p><h2>Financeiro da operação</h2></div><span class="dashboard-financial-total"><b>R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b><small>últimos 7 dias</small></span></div><p class="muted">Entradas registradas nas ordens e os serviços que mais movimentaram o período.</p><div class="dashboard-financial-grid"><div><div class="dashboard-financial-heading"><b>Evolução diária</b><small>faturamento por dia</small></div><div class="dashboard-financial-chart" role="img" aria-label="Faturamento dos últimos 7 dias">${bars}</div></div><div><div class="dashboard-financial-heading"><b>Serviços que mais faturam</b><small>por valor registrado</small></div><div class="dashboard-financial-services">${serviceMarkup}</div></div></div></section>`
}

export function buildDashboardAttentionMarkup(model) {
  const unassigned = model.rows.filter((row) => row.responsible === 'Não atribuído')
  const stale = model.rows.filter((row) => row.elapsedMinutes !== null && row.elapsedMinutes >= 180).sort((a, b) => b.elapsedMinutes - a.elapsedMinutes)
  const pickups = model.rows.filter((row) => row.stageTone === 'ready')
  const photoPending = model.rows.map((row) => ({ row, missing: checklistStages.filter(({ id }) => !(row.checklistPhotos || []).some((photo) => photo?.stage === id)).length })).filter(({ missing }) => missing > 0)
  const postSalePending = summarizePendingFollowUps(model.postSaleFollowUps || [])
  const list = (items, empty) => items.length ? items.slice(0, 3).map((row) => `<button class="dashboard-attention-item" data-dashboard-order="${row.orderIndex}"><span><b>${escapeHtml(row.client)}</b><small>${escapeHtml(row.vehicle)}</small></span><strong>${escapeHtml(row.elapsed)}</strong></button>`).join('') : `<p class="dashboard-attention-empty">${empty}</p>`
  const photoList = photoPending.length ? photoPending.slice(0, 3).map(({ row, missing }) => `<button class="dashboard-attention-item" data-dashboard-order="${row.orderIndex}"><span><b>${escapeHtml(row.client)}</b><small>${escapeHtml(row.vehicle)} · Pendência de fotos</small></span><strong>${missing} ${missing === 1 ? 'foto' : 'fotos'}</strong></button>`).join('') : '<p class="dashboard-attention-empty">Todas as etapas têm foto.</p>'
  const postSaleList = postSalePending.length ? postSalePending.slice(0, 3).map((group) => { const item = group.items[0]; const client = item.clients?.full_name || 'Cliente'; const vehicle = [item.vehicles?.make, item.vehicles?.model, item.vehicles?.license_plate].filter(Boolean).join(' · ') || 'Veículo não informado'; return `<button class="dashboard-attention-item" data-dashboard-section="pos-venda"><span><b>${escapeHtml(client)}</b><small>${escapeHtml(vehicle)} · Follow-ups pendentes</small></span><strong>${group.pendingCount} ${group.pendingCount === 1 ? 'mensagem' : 'mensagens'}</strong></button>` }).join('') : '<p class="dashboard-attention-empty">Nenhum envio pendente.</p>'
  const attentionCount = unassigned.length + stale.length + pickups.length + photoPending.length + postSalePending.length
  return `<section class="dashboard-panel dashboard-attention-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">ACOMPANHAMENTO</p><h2>Atenção operacional</h2></div><span class="dashboard-count">${attentionCount}</span></div><p class="muted">Pontos que merecem uma olhada rápida durante o dia.</p><div class="dashboard-attention-grid"><div class="dashboard-attention-block"><div class="dashboard-attention-heading"><b>Sem responsável</b><span>${unassigned.length}</span></div><div class="dashboard-attention-list">${list(unassigned, 'Todas as ordens têm responsável.')}</div></div><div class="dashboard-attention-block"><div class="dashboard-attention-heading"><b>Veículos parados há mais tempo</b><span>${stale.length}</span></div><div class="dashboard-attention-list">${list(stale, 'Nenhum veículo acima de 3h.')}</div></div><div class="dashboard-attention-block"><div class="dashboard-attention-heading"><b>Próximas retiradas</b><span>${pickups.length}</span></div><div class="dashboard-attention-list">${list(pickups, 'Nenhuma retirada pendente.')}</div></div><div class="dashboard-attention-block"><div class="dashboard-attention-heading"><b>Pendência de fotos</b><span>${photoPending.length}</span></div><div class="dashboard-attention-list">${photoList}</div></div><div class="dashboard-attention-block"><div class="dashboard-attention-heading"><b>Mensagens de pós-venda</b><span>${postSalePending.length}</span></div><div class="dashboard-attention-list">${postSaleList}</div></div></div></section>`
}

export function buildDashboardTodayTimelineMarkup(model, now = new Date()) {
  const dayKey = new Date(now).toISOString().slice(0, 10)
  const todayRows = model.rows.filter((row) => (row.scheduledAt || row.createdAt) && new Date(row.scheduledAt || row.createdAt).toISOString().slice(0, 10) === dayKey).sort((a, b) => new Date(a.scheduledAt || a.createdAt) - new Date(b.scheduledAt || b.createdAt))
  const stageLabel = { received: 'Entrada recebida', 'in-progress': 'Serviço em execução', ready: 'Retirada prevista' }
  const rows = todayRows.map((row) => `<button class="dashboard-timeline-item" data-dashboard-order="${row.orderIndex}"><span class="dashboard-timeline-line"><i class="dashboard-stage-dot ${row.stageTone}"></i></span><span class="dashboard-timeline-copy"><b>${escapeHtml(row.client)}</b><small>${escapeHtml(row.vehicle)}</small></span><span class="dashboard-timeline-stage"><b>${stageLabel[row.stageTone] || 'Em acompanhamento'}</b><small>${escapeHtml(row.service)}</small></span><strong>${escapeHtml(row.elapsed)}</strong></button>`).join('') || '<p class="dashboard-empty">Nenhuma entrada ou retirada prevista para hoje.</p>'
  return `<article class="dashboard-panel dashboard-timeline-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">ROTINA DO DIA</p><h2>Operação de hoje</h2></div><span class="dashboard-count">${todayRows.length}</span></div><p class="muted">Entradas, execução e retiradas organizadas em uma sequência diária.</p><div class="dashboard-timeline-list">${rows}</div></article>`
}

export function buildDashboardOperationSummaryMarkup(model, now = new Date()) {
  const dayKey = new Date(now).toISOString().slice(0, 10)
  const weekStart = new Date(now)
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay())
  const weeklyRows = model.rows.filter((row) => {
    if (!row.createdAt) return false
    const createdKey = new Date(row.createdAt).toISOString().slice(0, 10)
    return createdKey >= weekStart.toISOString().slice(0, 10) && createdKey <= dayKey
  })
  const activeRows = weeklyRows.length || model.rows.some((row) => row.createdAt) ? weeklyRows : model.rows.filter((row) => row.stageTone !== 'delivered')
  const weekStartKey = weekStart.toISOString().slice(0, 10)
  const completedThisWeek = (model.completedRows || []).filter((row) => {
    const completedAt = row.completedAt || row.createdAt
    if (!completedAt) return false
    const completedKey = new Date(completedAt).toISOString().slice(0, 10)
    return completedKey >= weekStartKey && completedKey <= dayKey
  }).length
  const responsibleCounts = new Map()
  const serviceCounts = new Map()
  activeRows.forEach((row) => {
    responsibleCounts.set(row.responsible, (responsibleCounts.get(row.responsible) || 0) + 1)
    serviceCounts.set(row.service, (serviceCounts.get(row.service) || 0) + 1)
  })
  const workload = [...responsibleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  const popularServices = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  const knownDurations = activeRows.filter((row) => Number.isFinite(row.elapsedMinutes))
  const averageMinutes = knownDurations.length ? Math.round(knownDurations.reduce((total, row) => total + row.elapsedMinutes, 0) / knownDurations.length) : null
  const averageLabel = averageMinutes === null ? 'sem dados' : averageMinutes >= 60 ? `${Math.floor(averageMinutes / 60)}h${String(averageMinutes % 60).padStart(2, '0')}` : `${averageMinutes} min`
  const maxWorkload = Math.max(1, ...workload.map(([, count]) => count))
  const workloadMarkup = workload.map(([name, count]) => `<div class="dashboard-summary-bar" role="listitem"><div class="dashboard-summary-bar-label"><span>${escapeHtml(name)}</span><b>${count} ${count === 1 ? 'ordem' : 'ordens'}</b></div><div class="dashboard-summary-bar-track"><i style="width:${Math.round((count / maxWorkload) * 100)}%"></i></div></div>`).join('') || '<p class="dashboard-summary-empty">Nenhuma ordem ativa.</p>'
  const maxServices = Math.max(1, ...popularServices.map(([, count]) => count))
  const servicesMarkup = popularServices.map(([name, count]) => `<div class="dashboard-summary-bar" role="listitem"><div class="dashboard-summary-bar-label"><span>${escapeHtml(name)}</span><b>${count}x</b></div><div class="dashboard-summary-bar-track"><i style="width:${Math.round((count / maxServices) * 100)}%"></i></div></div>`).join('') || '<p class="dashboard-summary-empty">Nenhum serviço registrado.</p>'
  const unassigned = activeRows.filter((row) => row.responsible === 'Não atribuído').length
  const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)
  const startDateLabel = `${weekStart.getUTCDate()} de ${monthNames[weekStart.getUTCMonth()]}`
  const endDateLabel = `${weekEnd.getUTCDate()} de ${monthNames[weekEnd.getUTCMonth()]}`
  const periodLabel = weekStart.getUTCMonth() === weekEnd.getUTCMonth()
    ? `Semana de ${weekStart.getUTCDate()} a ${weekEnd.getUTCDate()} de ${monthNames[weekStart.getUTCMonth()]} de ${weekStart.getUTCFullYear()}`
    : `Semana de ${startDateLabel} a ${endDateLabel} de ${weekEnd.getUTCFullYear()}`
  return `<section class="dashboard-panel dashboard-operation-summary-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">LEITURA DO NEGÓCIO · SEMANAL</p><h2>Panorama da operação</h2><span class="dashboard-summary-period">${periodLabel}</span></div><span class="dashboard-count">${activeRows.length}</span></div><p class="muted">Uma leitura da semana atual para entender a carga da equipe e o ritmo dos serviços.</p><div class="dashboard-operation-summary-grid dashboard-summary-layout-open"><div class="dashboard-summary-insights"><article class="dashboard-summary-section dashboard-summary-chart-card"><div class="dashboard-summary-heading"><div><b>Carga por responsável</b><small>ordens ativas na semana</small></div><span>${unassigned} sem responsável</span></div><div class="dashboard-summary-bar-chart" role="list" aria-label="Carga por responsável">${workloadMarkup}</div></article><article class="dashboard-summary-section dashboard-summary-chart-card"><div class="dashboard-summary-heading"><div><b>Serviços mais solicitados</b><small>ordens ativas na semana</small></div><span>ranking</span></div><div class="dashboard-summary-bar-chart" role="list" aria-label="Serviços mais solicitados">${servicesMarkup}</div></article></div><div class="dashboard-summary-metrics"><article class="dashboard-summary-metric dashboard-summary-metric-card"><small>Tempo médio em aberto</small><strong>${averageLabel}</strong><span>das ordens da semana</span></article><article class="dashboard-summary-metric dashboard-summary-metric-card"><small>Ordens concluídas na semana</small><strong>${completedThisWeek}</strong><span>finalizadas no período</span></article></div></div></section>`
}

globalThis.__dashboardOrganization = { buildDashboardAttentionMarkup, buildDashboardFinancialMarkup, buildDashboardOperationSummaryMarkup, buildDashboardOrganizationModel, buildDashboardPaddockMarkup, buildDashboardStageChartMarkup, buildDashboardTodayTimelineMarkup }
import { summarizePendingFollowUps } from './post-sale-rules.js'
