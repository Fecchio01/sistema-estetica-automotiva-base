import { supabase } from './supabase-client.js'
import { buildPostSalePlan, buildFollowUpStatusPatch, classifyFollowUp } from './post-sale-rules.js'
export { buildPostSalePlan, buildFollowUpStatusPatch, classifyFollowUp }

export async function syncPostSalePlans(profile, services = [], clientRecords = [], client = supabase) {
  if (!profile?.company_id) return
  const records = new Map(clientRecords.map((item) => [item.id, item]))
  const plans = services.flatMap((service) => buildPostSalePlan({
    id: service.orderId,
    status: service.orderStatus,
    completed_at: service.completedAt,
    client_id: service.clientId,
    vehicle_id: service.vehicleId,
    clientName: service.client || records.get(service.clientId)?.name,
    vehicleLabel: service.vehicle,
    serviceDescription: service.service,
  }))
  if (!plans.length) return
  const payload = plans.map((item) => ({
    company_id: profile.company_id,
    work_order_id: item.workOrderId,
    client_id: item.clientId,
    vehicle_id: item.vehicleId,
    follow_up_type: item.type,
    due_at: item.dueAt,
    message: item.message,
    status: item.status,
    created_by: profile.id,
  }))
  const { error } = await client.from('post_sale_followups').upsert(payload, { onConflict: 'work_order_id,follow_up_type', ignoreDuplicates: true })
  if (error) throw new Error(error.message || 'Não foi possível preparar o pós-venda.')
}

export async function loadPostSaleFollowUps(profile, client = supabase) {
  if (!profile?.company_id) return []
  const { data, error } = await client.from('post_sale_followups').select('id, work_order_id, client_id, vehicle_id, follow_up_type, due_at, status, message, sent_at, clients(full_name), vehicles(make, model, license_plate), work_orders(service_description)').eq('company_id', profile.company_id).order('due_at', { ascending: true })
  if (error) throw new Error(error.message || 'Não foi possível carregar o pós-venda.')
  return data || []
}

export async function updateFollowUp(profile, id, status, client = supabase) {
  const patch = buildFollowUpStatusPatch(status)
  const { error } = await client.from('post_sale_followups').update(patch).eq('id', id).eq('company_id', profile.company_id)
  if (error) throw new Error(error.message || 'Não foi possível atualizar o acompanhamento.')
}

globalThis.__postSale = { loadPostSaleFollowUps, syncPostSalePlans, updateFollowUp, classifyFollowUp }
