import { supabase } from './supabase-client.js'

const statusMap = {
  scheduled: { label: 'Agendado', tone: 'received', state: 'received' },
  in_progress: { label: 'Em andamento', tone: 'in-progress', state: 'in-progress' },
  awaiting_approval: { label: 'Em andamento', tone: 'in-progress', state: 'in-progress' },
  completed: { label: 'Finalizado', tone: 'delivered', state: 'delivered' },
  cancelled: { label: 'Cancelado', tone: 'received', state: 'delivered' },
}

const initials = (name) => String(name || 'Cliente').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
const vehicleLabel = (vehicle) => [vehicle?.make, vehicle?.model, vehicle?.license_plate].filter(Boolean).join(' · ') || 'Veículo não informado'
let realtimeChannel

async function loadLiveData(profile) {
  if (!profile?.company_id) return
  const [clientsResult, vehiclesResult, ordersResult] = await Promise.all([
    supabase.from('clients').select('id, full_name, phone, created_at').eq('company_id', profile.company_id).eq('active', true).order('created_at', { ascending: false }),
    supabase.from('vehicles').select('id, client_id, make, model, license_plate').eq('company_id', profile.company_id),
    supabase.from('work_orders').select('id, client_id, vehicle_id, responsible_id, status, payment_status, scheduled_at, created_at, completed_at, service_description, total_amount').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
  ])
  if (clientsResult.error || vehiclesResult.error || ordersResult.error) return
  const clientsById = new Map((clientsResult.data ?? []).map((client) => [client.id, client]))
  const vehiclesById = new Map((vehiclesResult.data ?? []).map((vehicle) => [vehicle.id, vehicle]))
  const services = (ordersResult.data ?? []).map((order) => {
    const client = clientsById.get(order.client_id)
    const vehicle = vehiclesById.get(order.vehicle_id)
    const status = statusMap[order.status] ?? statusMap.scheduled
    const vehicleText = vehicleLabel(vehicle)
    return { initials: initials(client?.full_name), client: client?.full_name || 'Cliente', vehicle: vehicleText, service: order.service_description || 'Serviço não informado', status: status.label, tone: status.tone, orderStatus: order.status, paymentStatus: order.payment_status || 'pending', time: order.scheduled_at ? `Entrada ${new Date(order.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : `Criado ${new Date(order.created_at).toLocaleDateString('pt-BR')}`, scheduledAt: order.scheduled_at, completedAt: order.completed_at, createdAt: order.created_at, amount: Number(order.total_amount || 0), orderId: order.id, responsibleId: order.responsible_id }
  })
  const clientRecords = (clientsResult.data ?? []).map((client) => {
    const vehicle = (vehiclesResult.data ?? []).find((item) => item.client_id === client.id)
    const clientOrders = services.filter((item) => item.client === client.full_name)
    const latest = clientOrders[0]
    return { id: client.id, name: client.full_name, phone: client.phone || '', createdAt: client.created_at, vehicles: (vehiclesResult.data ?? []).filter((item) => item.client_id === client.id), orders: clientOrders, vehicleLabel: vehicleLabel(vehicle), latestService: latest?.service || 'Sem histórico', latestStatus: latest?.status || 'Sem atendimento', latestTone: latest?.tone || 'received', orderCount: clientOrders.length }
  })
  const liveClients = clientRecords.map((client) => [client.name, client.vehicleLabel, client.latestService, client.latestStatus, client.latestTone, client.orderCount, client.createdAt])
  const states = services.map((service) => ({ stage: service.tone === 'delivered' ? 4 : service.tone === 'in-progress' ? 2 : 0, status: statusMap[ordersResult.data.find((order) => order.id === service.orderId)?.status]?.state || 'received', responsible: service.responsibleId || '' }))
  globalThis.__liveServices = services
  globalThis.__liveStates = states
  globalThis.__clientRecords = clientRecords
  document.dispatchEvent(new CustomEvent('live-data-ready', { detail: { services, clients: liveClients, clientRecords, states } }))
}

globalThis.__reloadLiveData = () => { if (globalThis.__sessionProfile) loadLiveData(globalThis.__sessionProfile) }
function subscribeToLiveData(profile) {
  if (!profile?.company_id) return
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
  realtimeChannel = supabase.channel(`atelier-live-${profile.company_id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders', filter: `company_id=eq.${profile.company_id}` }, () => loadLiveData(profile))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `company_id=eq.${profile.company_id}` }, () => loadLiveData(profile))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles', filter: `company_id=eq.${profile.company_id}` }, () => loadLiveData(profile))
    .subscribe()
}

document.addEventListener('auth-ready', (event) => { loadLiveData(event.detail); subscribeToLiveData(event.detail) })
document.addEventListener('live-data-refresh-requested', () => globalThis.__reloadLiveData?.())
