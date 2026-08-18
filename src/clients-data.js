async function resolveClient(client) {
  if (client) return client
  const module = await import('./supabase-client.js')
  return module.supabase
}

export async function loadClientRecords(profile, client) {
  if (!profile?.company_id) return []
  client = await resolveClient(client)
  const [clientsResult, vehiclesResult, ordersResult] = await Promise.all([
    client.from('clients').select('id, full_name, phone, created_at').eq('company_id', profile.company_id).eq('active', true).order('created_at', { ascending: false }),
    client.from('vehicles').select('id, client_id, make, model, license_plate').eq('company_id', profile.company_id),
    client.from('work_orders').select('id, client_id, status, service_description, created_at').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
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

export async function archiveClient(profile, clientId, client) {
  client = await resolveClient(client)
  if (!profile?.company_id || !clientId) throw new Error('Cliente inválido.')
  const { error } = await client.from('clients').update({ active: false }).eq('id', clientId).eq('company_id', profile.company_id)
  if (error) throw new Error('Não foi possível arquivar o cliente.')
}

export async function createWorkOrder(profile, input, client) {
  client = await resolveClient(client)
  const { data, error } = await client.from('work_orders').insert({ company_id: profile.company_id, client_id: input.clientId, vehicle_id: input.vehicleId, responsible_id: input.responsibleId, status: 'scheduled', scheduled_at: input.scheduledAt || new Date().toISOString(), service_description: input.service, total_amount: Number(input.totalAmount || 0) }).select('id, client_id, vehicle_id, responsible_id, status, scheduled_at, service_description, total_amount').single()
  if (error) throw new Error('Não foi possível criar o atendimento.')
  return data
}
