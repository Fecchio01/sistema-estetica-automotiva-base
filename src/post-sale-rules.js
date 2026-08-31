const DAY = 24 * 60 * 60 * 1000
const steps = [
  ['check_in', 1, 'Check-in', (name, vehicle) => `Olá, ${name}! Tudo certo com o ${vehicle} depois do serviço?`],
  ['care_tip', 7, 'Dica de cuidado', (name, service) => `Olá, ${name}! Uma dica para conservar o resultado do seu ${service}: evite produtos abrasivos e conte com a nossa equipe quando precisar.`],
  ['review', 15, 'Avaliação', (name) => `Olá, ${name}! Como você avalia o atendimento? Sua opinião ajuda muito a nossa equipe.`],
  ['return', 30, 'Lembrete de retorno', (name, vehicle) => `Olá, ${name}! Já faz um tempo desde o cuidado do ${vehicle}. Quer deixar um próximo retorno pré-agendado?`],
]

export const defaultMessageTemplates = Object.freeze([
  { followUpType: 'check_in', name: 'Check-in', message: 'Olá, {{cliente}}! Tudo certo com o {{veiculo}} depois do serviço?' },
  { followUpType: 'care_tip', name: 'Dica de cuidado', message: 'Olá, {{cliente}}! Uma dica para conservar o resultado do seu {{servico}}: evite produtos abrasivos e conte com a nossa equipe quando precisar.' },
  { followUpType: 'review', name: 'Avaliação', message: 'Olá, {{cliente}}! Como você avalia o atendimento? Sua opinião ajuda muito a nossa equipe.' },
  { followUpType: 'return', name: 'Lembrete de retorno', message: 'Olá, {{cliente}}! Já faz um tempo desde o cuidado do {{veiculo}}. Quer deixar um próximo retorno pré-agendado?' },
])

const isoPlusDays = (value, days) => new Date(new Date(value).getTime() + days * DAY).toISOString()

export function renderMessageTemplate(template, variables = {}) {
  return String(template ?? '').replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key) => String(variables[key] ?? ''))
}

export function buildMessageTemplatePreview(template, variables = { cliente: 'Cliente', veiculo: 'seu veículo', servico: 'serviço' }) {
  return { title: template?.name || 'Modelo de mensagem', message: renderMessageTemplate(template?.message, variables) }
}

export function buildFollowUpEvent(event = {}) {
  return {
    company_id: event.companyId,
    follow_up_id: event.followUpId,
    event_type: event.eventType,
    ...(event.channel ? { channel: event.channel } : {}),
    ...(event.message ? { message_snapshot: event.message } : {}),
    ...(event.errorMessage ? { error_message: event.errorMessage } : {}),
    actor_id: event.actorId,
  }
}

export function buildAutomationControlState(item = {}) {
  const enabled = item.auto_send === true
  return { enabled, label: enabled ? 'Envio automático ativo' : 'Ativar envio automático' }
}

export function buildFollowUpHistorySummary(events = []) {
  return { label: 'Ver histórico', count: events.length }
}

export function getDueAutomaticFollowUps(items = [], now = new Date()) {
  const current = new Date(now).getTime()
  return items.filter((item) => item.status === 'pending' && item.auto_send === true && new Date(item.due_at).getTime() <= current)
}

export function buildPostSalePlan(order) {
  if (!order?.id || order.status !== 'completed' || !order.completed_at) return []
  return steps.map(([type, days, label, message]) => ({
    workOrderId: order.id, clientId: order.client_id, vehicleId: order.vehicle_id, type, label,
    dueAt: isoPlusDays(order.completed_at, days), status: 'pending',
    message: message(order.clientName || 'cliente', type === 'care_tip' ? order.serviceDescription || 'veículo' : order.vehicleLabel || 'seu veículo'),
  }))
}

export function classifyFollowUp(followUp, now = new Date()) {
  if (followUp?.status !== 'pending') return 'done'
  const due = new Date(followUp.due_at)
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today.getTime() + DAY)
  if (due < today) return 'overdue'
  if (due < tomorrow) return 'today'
  return 'upcoming'
}

export function groupFollowUps(items = []) {
  const groups = new Map()
  items.forEach((item) => {
    const key = `${item.client_id}:${item.vehicle_id}`
    if (!groups.has(key)) groups.set(key, { key, clientId: item.client_id, vehicleId: item.vehicle_id, items: [], pendingCount: 0 })
    const group = groups.get(key)
    group.items.push(item)
    if (item.status === 'pending') group.pendingCount += 1
  })
  return [...groups.values()]
}

export function summarizePendingFollowUps(items = []) {
  return groupFollowUps(items.filter((item) => item.status === 'pending'))
}

export function buildFollowUpStatusPatch(status, sentAt = new Date().toISOString()) {
  return status === 'sent' ? { status, sent_at: sentAt } : { status, sent_at: null }
}

export function buildFollowUpMessagePatch(message) {
  const normalized = String(message ?? '').trim()
  if (!normalized) throw new Error('Informe uma mensagem para o acompanhamento.')
  return { message: normalized }
}
