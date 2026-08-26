const saoPauloFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })

export function getWeekStart(value = new Date()) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  const distance = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - distance)
  return date
}

export function getWeekDays(value = new Date()) {
  const start = getWeekStart(value)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

export function getAgendaReferenceSlots() {
  return ['08:00', '10:00', '13:30', '15:30', '17:00']
}

export function buildScheduledAt(dateValue, timeValue, current = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue)) throw new Error('Informe uma data e um horário válidos.')
  const scheduled = new Date(`${dateValue}T${timeValue}:00-03:00`)
  if (Number.isNaN(scheduled.getTime())) throw new Error('Informe uma data e um horário válidos.')
  if (scheduled.getTime() < new Date(current).getTime()) throw new Error('A reserva não pode ficar no passado.')
  return scheduled.toISOString()
}

export function buildBookingPayload(input, profile) {
  if (!profile?.company_id || !input?.clientId || !input?.vehicleId || !input?.responsibleId || !input?.service || !input?.scheduledAt) throw new Error('Preencha todos os dados da reserva.')
  return { company_id: profile.company_id, client_id: input.clientId, vehicle_id: input.vehicleId, responsible_id: input.responsibleId, status: 'scheduled', scheduled_at: input.scheduledAt, service_description: input.service.trim() }
}

export function dateKey(value) {
  const parts = Object.fromEntries(saoPauloFormatter.formatToParts(new Date(value)).filter(({ type }) => type !== 'literal').map(({ type, value: part }) => [type, part]))
  return `${parts.year}-${parts.month}-${parts.day}`
}
