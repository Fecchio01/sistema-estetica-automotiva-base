async function resolveClient(client) {
  if (client) return client
  const module = await import('./supabase-client.js')
  return module.supabase
}

export function normalizeServiceNames(input) {
  const values = Array.isArray(input?.services) ? input.services : [input?.service]
  return values.map((value) => String(value ?? '').trim()).filter(Boolean)
}

export async function loadClientRecords(profile, client) {
  if (!profile?.company_id) return []
  client = await resolveClient(client)
  const [clientsResult, vehiclesResult, ordersResult] = await Promise.all([
    client.from('clients').select('id, full_name, phone, created_at').eq('company_id', profile.company_id).eq('active', true).order('created_at', { ascending: false }),
    client.from('vehicles').select('id, client_id, make, model, license_plate').eq('company_id', profile.company_id),
    client.from('work_orders').select('id, client_id, vehicle_id, status, current_stage, payment_status, scheduled_at, service_description, total_amount, completed_at, created_at').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
  ])
  if (clientsResult.error || vehiclesResult.error || ordersResult.error) throw new Error('Não foi possível carregar os clientes cadastrados.')
  return (clientsResult.data ?? []).map((clientRecord) => {
    const vehicles = (vehiclesResult.data ?? []).filter((vehicle) => vehicle.client_id === clientRecord.id)
    const orders = (ordersResult.data ?? []).filter((order) => order.client_id === clientRecord.id)
    const latest = orders[0]
    return { id: clientRecord.id, name: clientRecord.full_name, phone: clientRecord.phone || '', createdAt: clientRecord.created_at, vehicles, orders, orderCount: orders.length, latestService: latest?.service_description || 'Sem histórico', latestStatus: latest?.status || 'Sem atendimento' }
  })
}

export async function createClient(profile, input, client) {
  client = await resolveClient(client)
  if (!profile?.company_id || !input?.name?.trim()) throw new Error('Informe o nome do cliente.')
  const { data: clientRecord, error: clientError } = await client.from('clients').insert({ company_id: profile.company_id, full_name: input.name.trim(), phone: input.phone?.trim() || null }).select('id, full_name, phone, created_at').single()
  if (clientError) throw new Error('Não foi possível cadastrar o cliente.')
  const parts = String(input.vehicle || '').split('·').map((part) => part.trim()).filter(Boolean)
  const make = parts[0] || 'Veículo'
  const model = parts[1] || parts[0] || 'Não informado'
  const licensePlate = parts[2] || null
  const { error: vehicleError } = await client.from('vehicles').insert({ company_id: profile.company_id, client_id: clientRecord.id, make, model, license_plate: licensePlate })
  if (vehicleError) throw new Error('Cliente criado, mas não foi possível salvar o veículo.')
  return clientRecord
}

export async function createVehicle(profile, clientId, input, client) {
  client = await resolveClient(client)
  const make = String(input?.make || '').trim()
  const model = String(input?.model || '').trim()
  const licensePlate = String(input?.licensePlate || '').trim() || null
  if (!profile?.company_id || !clientId || !make || !model) throw new Error('Informe marca e modelo do veículo.')
  const { data, error } = await client.from('vehicles').insert({ company_id: profile.company_id, client_id: clientId, make, model, license_plate: licensePlate }).select('id, client_id, make, model, license_plate').single()
  if (error) throw new Error('Não foi possível cadastrar o veículo.')
  return data
}

export async function archiveClient(profile, clientId, client) {
  client = await resolveClient(client)
  if (!profile?.company_id || !clientId) throw new Error('Cliente inválido.')
  const { error } = await client.from('clients').update({ active: false }).eq('id', clientId).eq('company_id', profile.company_id)
  if (error) throw new Error('Não foi possível arquivar o cliente.')
}

export async function createWorkOrder(profile, input, client) {
  client = await resolveClient(client)
  const services = normalizeServiceNames(input)
  if (!profile?.company_id || !input?.clientId || !input?.vehicleId || !input?.responsibleId || !services.length) throw new Error('Preencha cliente, veículo, responsável e pelo menos um serviço.')
  const scheduledAt = Object.prototype.hasOwnProperty.call(input, 'scheduledAt') ? input.scheduledAt : null
  const payload = { ...(input.id ? { id: input.id } : {}), company_id: profile.company_id, client_id: input.clientId, vehicle_id: input.vehicleId, responsible_id: input.responsibleId, status: input.status || 'scheduled', current_stage: Number.isInteger(Number(input.currentStage)) ? Number(input.currentStage) : 0, scheduled_at: scheduledAt, service_description: services.join(', '), total_amount: Number(input.totalAmount || 0) }
  const fields = 'id, client_id, vehicle_id, responsible_id, status, current_stage, payment_status, scheduled_at, created_at, completed_at, service_description, total_amount'
  const { data, error } = await client.from('work_orders').insert(payload).select(fields).single()
  if (error && input.id && error.code === '23505') {
    const { data: existing, error: lookupError } = await client.from('work_orders').select(fields).eq('id', input.id).maybeSingle()
    if (!lookupError && existing) return existing
  }
  if (error) throw new Error(error.message || 'Não foi possível criar o atendimento.')
  return data
}
