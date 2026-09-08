export function chooseVehicle(vehicles = [], selectedId = '') {
  if (vehicles.some((vehicle) => vehicle.id === selectedId)) return selectedId
  return vehicles.length === 1 ? vehicles[0].id : ''
}

export function findTodayBooking(services = [], clientId, vehicleId, now = new Date()) {
  if (!clientId || !vehicleId) return null
  const day = value => new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value))
  const today=day(now)
  const candidates=services.filter(order=>order.clientId===clientId && order.vehicleId===vehicleId && order.orderStatus==='scheduled' && !order.receivedAt && order.scheduledAt && Number.isFinite(new Date(order.scheduledAt).getTime()) && day(order.scheduledAt)===today)
  return candidates.length===1 ? candidates[0] : null
}

export function repeatOrderValues(record, catalog = []) {
  const vehicles = record?.vehicles || []
  const latest = [...(record?.orders || [])]
    .filter((order) => !['cancelled', 'scheduled'].includes(order.orderStatus || order.status))
    .sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0))[0]
  if (!latest) return null
  const description = latest.service || latest.service_description || ''
  // Match complete catalog names, including names containing commas.
  let remaining = description
  const services = []
  const names = catalog.map((item) => item.name).sort((a, b) => b.length - a.length)
  while (remaining) {
    const name = names.find((name) => remaining === name || remaining.startsWith(name + ', '))
    if (!name) return null
    services.push(name)
    remaining = remaining.slice(name.length).replace(/^,\s*/, '')
  }
  if (!services.length) return null
  return { vehicleId: chooseVehicle(vehicles, latest.vehicleId || latest.vehicle_id), services }
}

export function orderDraftKey(profile) {
  return profile?.company_id && profile?.id ? `atelier-order-draft:${profile.company_id}:${profile.id}` : null
}

export function validOrderDraft(draft, records = [], catalog = [], people = [], now = Date.now()) {
  if (!draft || !Number.isFinite(draft.savedAt) || now - draft.savedAt > 7 * 86400000) return null
  const record = records.find((item) => item.id === draft.clientId)
  if (!record) return null
  return {
    clientId: record.id,
    vehicleId: chooseVehicle(record.vehicles, draft.vehicleId),
    responsibleId: people.some((person) => person.id === draft.responsibleId) ? draft.responsibleId : '',
    services: (Array.isArray(draft.services) ? draft.services : []).filter((name) => catalog.some((item) => item.name === name)),
    requestId: typeof draft.requestId === 'string' && /^[0-9a-f-]{36}$/i.test(draft.requestId) ? draft.requestId : null,
  }
}
