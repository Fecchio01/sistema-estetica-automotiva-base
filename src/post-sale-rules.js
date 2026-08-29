const DAY = 24 * 60 * 60 * 1000
const steps = [
  ['check_in', 1, 'Check-in', (name, vehicle) => `Olá, ${name}! Tudo certo com o ${vehicle} depois do serviço?`],
  ['care_tip', 7, 'Dica de cuidado', (name, service) => `Olá, ${name}! Uma dica para conservar o resultado do seu ${service}: evite produtos abrasivos e conte com a nossa equipe quando precisar.`],
  ['review', 15, 'Avaliação', (name) => `Olá, ${name}! Como você avalia o atendimento? Sua opinião ajuda muito a nossa equipe.`],
  ['return', 30, 'Lembrete de retorno', (name, vehicle) => `Olá, ${name}! Já faz um tempo desde o cuidado do ${vehicle}. Quer deixar um próximo retorno pré-agendado?`],
]

const isoPlusDays = (value, days) => new Date(new Date(value).getTime() + days * DAY).toISOString()

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
