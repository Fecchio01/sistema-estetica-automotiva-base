import { buildBookingPayload } from './agenda-utils.js'

async function resolveClient(client) {
  if (client) return client
  const module = await import('./supabase-client.js')
  return module.supabase
}

export async function loadAgendaData(profile, rangeStart, rangeEnd, client) {
  if (!profile?.company_id) return { orders: [], clients: [], vehicles: [], people: [] }
  client = await resolveClient(client)
  const [ordersResult, clientsResult, vehiclesResult, peopleResult] = await Promise.all([
    client.from('work_orders').select('id, client_id, vehicle_id, responsible_id, status, scheduled_at, service_description, total_amount').eq('company_id', profile.company_id).gte('scheduled_at', rangeStart.toISOString()).lt('scheduled_at', rangeEnd.toISOString()).order('scheduled_at', { ascending: true }),
    client.from('clients').select('id, full_name, phone').eq('company_id', profile.company_id).eq('active', true).order('full_name', { ascending: true }),
    client.from('vehicles').select('id, client_id, make, model, license_plate').eq('company_id', profile.company_id).order('model', { ascending: true }),
    client.from('profiles').select('id, full_name, role, active').eq('company_id', profile.company_id).eq('active', true).order('full_name', { ascending: true }),
  ])
  const error = ordersResult.error || clientsResult.error || vehiclesResult.error || peopleResult.error
  if (error) throw new Error('Não foi possível carregar a agenda agora.')
  return { orders: ordersResult.data ?? [], clients: clientsResult.data ?? [], vehicles: vehiclesResult.data ?? [], people: peopleResult.data ?? [] }
}

export async function createBooking(profile, input, client) {
  client = await resolveClient(client)
  const payload = buildBookingPayload(input, profile)
  const { data, error } = await client.from('work_orders').insert(payload).select('id, client_id, vehicle_id, responsible_id, status, scheduled_at, service_description, total_amount').single()
  if (error) throw new Error(error.message?.includes('work_orders') ? 'Não foi possível reservar esse horário.' : 'Não foi possível salvar a reserva.')
  return data
}

export async function deleteBooking(profile, orderId, client) {
  client = await resolveClient(client)
  if (!profile?.company_id || !orderId) throw new Error('Agendamento inválido.')
  const { error } = await client.from('work_orders').delete().eq('id', orderId).eq('company_id', profile.company_id)
  if (error) throw new Error('Não foi possível apagar o agendamento.')
}
