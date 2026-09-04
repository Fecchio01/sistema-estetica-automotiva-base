const CHECKLIST_STAGES = ['received', 'assessment', 'execution', 'inspection', 'delivery']
const DAY = 24 * 60 * 60 * 1000
const STALE_MINUTES = 180

const validDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const isActive = (service = {}) => !['completed', 'cancelled'].includes(String(service.orderStatus || service.status || '').toLowerCase())

export function missingChecklistStages(photos = []) {
  const present = new Set((Array.isArray(photos) ? photos : []).map((photo) => photo?.stage))
  return CHECKLIST_STAGES.filter((stage) => !present.has(stage))
}

export function buildWorkloadSuggestion(services = [], profiles = []) {
  const activeServices = (Array.isArray(services) ? services : []).filter(isActive)
  const team = (Array.isArray(profiles) ? profiles : [])
    .filter((profile) => profile?.active !== false && profile?.role === 'employee' && profile?.id)
    .map((profile) => ({
      profileId: profile.id,
      name: String(profile.full_name || '').trim() || 'Funcionário',
      activeOrders: activeServices.filter((service) => service.responsibleId === profile.id).length,
    }))
    .sort((left, right) => left.activeOrders - right.activeOrders || left.name.localeCompare(right.name, 'pt-BR'))
  return { suggestedResponsibleId: team[0]?.profileId || null, workload: team }
}

export function buildOperationalAutomationModel(input = {}, now = new Date()) {
  const services = Array.isArray(input.services) ? input.services : []
  const followUps = Array.isArray(input.postSaleFollowUps) ? input.postSaleFollowUps : []
  const current = validDate(now) || new Date()
  const alerts = []

  services.forEach((service) => {
    if (!isActive(service)) return
    const orderId = service.orderId || service.id || null
    const scheduledAt = validDate(service.scheduledAt)
    const createdAt = validDate(service.createdAt)
    const status = String(service.orderStatus || service.status || '').toLowerCase()
    const base = { orderId, client: service.client || 'Cliente', vehicle: service.vehicle || 'Veículo' }

    if (scheduledAt && scheduledAt >= current && scheduledAt.getTime() - current.getTime() <= DAY) alerts.push({ ...base, type: 'appointment_soon', scheduledAt: scheduledAt.toISOString() })
    if (!service.responsibleId) alerts.push({ ...base, type: 'unassigned' })
    if (createdAt && status !== 'ready_for_pickup' && Math.floor((current.getTime() - createdAt.getTime()) / 60000) >= STALE_MINUTES) alerts.push({ ...base, type: 'stale', openedAt: createdAt.toISOString() })
    if (status === 'ready_for_pickup' && createdAt && current.getTime() - createdAt.getTime() >= DAY) alerts.push({ ...base, type: 'pickup_waiting', readySince: createdAt.toISOString() })

    const missing = missingChecklistStages(service.checklistPhotos)
    if (missing.length) alerts.push({ ...base, type: 'photos_missing', count: missing.length, stages: missing })
  })

  followUps.forEach((followUp) => {
    const dueAt = validDate(followUp?.due_at)
    if (followUp?.status !== 'pending' || !dueAt || dueAt > current) return
    alerts.push({ type: 'post_sale_due', followUpId: followUp.id || null, orderId: followUp.work_order_id || null, client: followUp.clients?.full_name || 'Cliente', dueAt: dueAt.toISOString() })
  })

  return { alerts, ...buildWorkloadSuggestion(services, input.profiles) }
}
