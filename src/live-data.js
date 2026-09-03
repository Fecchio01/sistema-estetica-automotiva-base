import { supabase } from './supabase-client.js'
import { ensureDefaultMessageTemplates, loadPostSaleFollowUps, syncPostSalePlans } from './post-sale.js'
import { buildDeliveryTransition, buildStageTransition, stageForOrder } from './work-order-state.js'
import { findMissingOrderAmounts, findOrdersAwaitingPaymentMigration } from './order-pricing.js'

const statusMap = {
  scheduled: { label: 'Recebido', tone: 'received', state: 'received' },
  in_progress: { label: 'Em andamento', tone: 'in-progress', state: 'in-progress' },
  awaiting_approval: { label: 'Em andamento', tone: 'in-progress', state: 'in-progress' },
  ready_for_pickup: { label: 'Pronto para retirada', tone: 'ready', state: 'ready' },
  completed: { label: 'Finalizado', tone: 'delivered', state: 'delivered' },
  cancelled: { label: 'Cancelado', tone: 'received', state: 'delivered' },
}

const initials = (name) => String(name || 'Cliente').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
const vehicleLabel = (vehicle) => [vehicle?.make, vehicle?.model, vehicle?.license_plate].filter(Boolean).join(' · ') || 'Veículo não informado'
let realtimeChannel

export function buildLiveService(order, clientRecords = []) {
  const record = clientRecords.find((item) => item.id === order?.client_id)
  const vehicle = record?.vehicles?.find((item) => item.id === order?.vehicle_id)
  const status = statusMap[order?.status] ?? statusMap.scheduled
  const createdAt = order?.created_at || new Date().toISOString()
  return { initials: initials(record?.name), clientId: order.client_id, client: record?.name || 'Cliente', vehicle: vehicleLabel(vehicle), vehicleId: order.vehicle_id, service: order.service_description || 'Serviço não informado', status: status.label, tone: status.tone, orderStatus: order.status || 'scheduled', currentStage: stageForOrder(order), paymentStatus: order.payment_status || 'paid', time: order.scheduled_at ? `Entrada ${new Date(order.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : `Criado ${new Date(createdAt).toLocaleDateString('pt-BR')}`, scheduledAt: order.scheduled_at, completedAt: order.completed_at, createdAt, amount: Number(order.total_amount || 0), orderId: order.id, responsibleId: order.responsible_id }
}

function publishLiveData(services, clientRecords, postSaleFollowUps = globalThis.__postSaleFollowUps || []) {
  const liveClients = clientRecords.map((client) => [client.name, client.vehicleLabel, client.latestService, client.latestStatus, client.latestTone, client.orderCount, client.createdAt])
  const states = services.map((service) => ({ stage: service.currentStage, status: statusMap[service.orderStatus]?.state || 'received', deliveryStatus: service.orderStatus === 'completed' ? 'delivered' : null, responsible: service.responsibleId || '' }))
  globalThis.__liveServices = services
  globalThis.__liveStates = states
  globalThis.__clientRecords = clientRecords
  document.dispatchEvent(new CustomEvent('live-data-ready', { detail: { services, clients: liveClients, clientRecords, states, postSaleFollowUps } }))
}

async function loadLiveData(profile) {
  if (!profile?.company_id) return
  const [clientsResult, vehiclesResult, ordersResult] = await Promise.all([
    supabase.from('clients').select('id, full_name, phone, created_at').eq('company_id', profile.company_id).eq('active', true).order('created_at', { ascending: false }),
    supabase.from('vehicles').select('id, client_id, make, model, license_plate').eq('company_id', profile.company_id),
    supabase.from('work_orders').select('id, client_id, vehicle_id, responsible_id, status, current_stage, payment_status, scheduled_at, created_at, completed_at, service_description, total_amount').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
  ])
  if (clientsResult.error || vehiclesResult.error || ordersResult.error) return
  const missingAmounts = findMissingOrderAmounts(ordersResult.data ?? [], globalThis.__serviceCatalog || [])
  if (missingAmounts.length) {
    await Promise.all(missingAmounts.map(({ id, totalAmount }) => supabase.from('work_orders').update({ total_amount: totalAmount }).eq('id', id).eq('company_id', profile.company_id)))
    ;(ordersResult.data ?? []).forEach((order) => { const match = missingAmounts.find((item) => item.id === order.id); if (match) order.total_amount = match.totalAmount })
  }
  const awaitingPaymentMigration = findOrdersAwaitingPaymentMigration(ordersResult.data ?? [])
  if (awaitingPaymentMigration.length) {
    await Promise.all(awaitingPaymentMigration.map((id) => supabase.from('work_orders').update({ payment_status: 'paid' }).eq('id', id).eq('company_id', profile.company_id)))
    ;(ordersResult.data ?? []).forEach((order) => { if (awaitingPaymentMigration.includes(order.id)) order.payment_status = 'paid' })
  }
  const clientsById = new Map((clientsResult.data ?? []).map((client) => [client.id, client]))
  const vehiclesById = new Map((vehiclesResult.data ?? []).map((vehicle) => [vehicle.id, vehicle]))
  const services = (ordersResult.data ?? []).map((order) => {
    const client = clientsById.get(order.client_id)
    const vehicle = vehiclesById.get(order.vehicle_id)
    const status = statusMap[order.status] ?? statusMap.scheduled
    const vehicleText = vehicleLabel(vehicle)
    return { initials: initials(client?.full_name), clientId: order.client_id, client: client?.full_name || 'Cliente', vehicle: vehicleText, vehicleId: order.vehicle_id, service: order.service_description || 'Serviço não informado', status: status.label, tone: status.tone, orderStatus: order.status, currentStage: stageForOrder(order), paymentStatus: order.payment_status || 'paid', time: order.scheduled_at ? `Entrada ${new Date(order.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : `Criado ${new Date(order.created_at).toLocaleDateString('pt-BR')}`, scheduledAt: order.scheduled_at, completedAt: order.completed_at, createdAt: order.created_at, amount: Number(order.total_amount || 0), orderId: order.id, responsibleId: order.responsible_id }
  })
  const clientRecords = (clientsResult.data ?? []).map((client) => {
    const vehicle = (vehiclesResult.data ?? []).find((item) => item.client_id === client.id)
    const clientOrders = services.filter((item) => item.clientId === client.id)
    const latest = clientOrders[0]
    return { id: client.id, name: client.full_name, phone: client.phone || '', createdAt: client.created_at, vehicles: (vehiclesResult.data ?? []).filter((item) => item.client_id === client.id), orders: clientOrders, vehicleLabel: vehicleLabel(vehicle), latestService: latest?.service || 'Sem histórico', latestStatus: latest?.status || 'Sem atendimento', latestTone: latest?.tone || 'received', orderCount: clientOrders.length }
  })
  const liveClients = clientRecords.map((client) => [client.name, client.vehicleLabel, client.latestService, client.latestStatus, client.latestTone, client.orderCount, client.createdAt])
  const states = services.map((service) => ({ stage: service.currentStage, status: statusMap[service.orderStatus]?.state || 'received', deliveryStatus: service.orderStatus === 'completed' ? 'delivered' : null, responsible: service.responsibleId || '' }))
  ensureDefaultMessageTemplates(profile).catch((error) => console.warn('Modelos de pós-venda ainda não carregados:', error.message))
  try { await syncPostSalePlans(profile, services, clientRecords) } catch (error) { console.warn('Pós-venda ainda não sincronizado:', error.message) }
  let postSaleFollowUps = []
  try { postSaleFollowUps = await loadPostSaleFollowUps(profile) } catch (error) { console.warn('Pós-venda ainda não carregado:', error.message) }
  globalThis.__postSaleFollowUps = postSaleFollowUps
  publishLiveData(services, clientRecords, postSaleFollowUps)
}

globalThis.__reloadLiveData = () => { if (globalThis.__sessionProfile) loadLiveData(globalThis.__sessionProfile) }
globalThis.__deleteLiveWorkOrder = async (orderId) => {
  const profile = globalThis.__sessionProfile
  if (!profile?.company_id || !orderId) throw new Error('Ordem inválida.')
  const { error } = await supabase.from('work_orders').delete().eq('id', orderId).eq('company_id', profile.company_id)
  if (error) throw new Error(error.message || 'Não foi possível apagar a ordem.')
  await loadLiveData(profile)
}
globalThis.__updateLiveWorkOrder = async (orderId, status, options = {}) => {
  const profile = globalThis.__sessionProfile
  if (!profile?.company_id || !orderId) throw new Error('Ordem inválida.')
  const current = (globalThis.__liveServices || []).find((item) => item.orderId === orderId)
  const transition = status === 'completed'
    ? buildDeliveryTransition({ companyId: profile.company_id, orderId, changedBy: profile.id, fromStatus: current?.orderStatus, completedAt: options.completedAt || new Date().toISOString() })
    : buildStageTransition({ companyId: profile.company_id, orderId, changedBy: profile.id, fromStatus: current?.orderStatus, fromStage: current?.currentStage, toStage: options.stage ?? stageForOrder({ status, current_stage: current?.currentStage }), comment: options.comment })
  const { error } = await supabase.from('work_orders').update(transition.orderPatch).eq('id', orderId).eq('company_id', profile.company_id)
  if (error) throw new Error(error.message || 'Não foi possível atualizar a etapa da ordem.')
  const { error: historyError } = await supabase.from('work_order_stage_history').insert(transition.history)
  if (historyError) throw new Error(historyError.message || 'A etapa foi atualizada, mas o histórico não pôde ser registrado.')
  await loadLiveData(profile)
}
globalThis.__addLiveWorkOrder = (order) => {
  if (!order?.id) return
  const currentServices = Array.isArray(globalThis.__liveServices) ? globalThis.__liveServices : []
  const records = Array.isArray(globalThis.__clientRecords) ? globalThis.__clientRecords : []
  const service = buildLiveService(order, records)
  const services = [service, ...currentServices.filter((item) => item.orderId !== service.orderId)]
  const clientRecords = records.map((record) => record.id === order.client_id ? { ...record, orders: [service, ...(record.orders || []).filter((item) => item.orderId !== service.orderId)], orderCount: (record.orderCount || 0) + (record.orders?.some((item) => item.orderId === service.orderId) ? 0 : 1), latestService: service.service, latestStatus: service.status, latestTone: service.tone } : record)
  publishLiveData(services, clientRecords)
}
function subscribeToLiveData(profile) {
  if (!profile?.company_id) return
  if (realtimeChannel) supabase.removeChannel(realtimeChannel)
  realtimeChannel = supabase.channel(`atelier-live-${profile.company_id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders', filter: `company_id=eq.${profile.company_id}` }, () => loadLiveData(profile))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'clients', filter: `company_id=eq.${profile.company_id}` }, () => loadLiveData(profile))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles', filter: `company_id=eq.${profile.company_id}` }, () => loadLiveData(profile))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'post_sale_followups', filter: `company_id=eq.${profile.company_id}` }, () => loadLiveData(profile))
    .subscribe()
}

document.addEventListener('auth-ready', (event) => { loadLiveData(event.detail); subscribeToLiveData(event.detail) })
document.addEventListener('live-data-refresh-requested', () => globalThis.__reloadLiveData?.())
