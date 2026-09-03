import { supabase } from './supabase-client.js'
import { buildFollowUpEvent, buildPostSalePlan, buildFollowUpMessagePatch, buildFollowUpStatusPatch, classifyFollowUp, defaultMessageTemplates } from './post-sale-rules.js'
export { buildFollowUpEvent, buildPostSalePlan, buildFollowUpMessagePatch, buildFollowUpStatusPatch, classifyFollowUp, defaultMessageTemplates }

const templateCacheIsFresh = (profile, client) => client === supabase && globalThis.__postSaleTemplatesCompanyId === profile?.company_id && Number(globalThis.__postSaleTemplatesLoadedAt || 0) > Date.now() - 30000

export async function ensureDefaultMessageTemplates(profile, client = supabase) {
  if (!profile?.company_id) return []
  if (templateCacheIsFresh(profile, client)) return globalThis.__postSaleTemplates
  const payload = defaultMessageTemplates.map((template) => ({ company_id: profile.company_id, follow_up_type: template.followUpType, name: template.name, message: template.message, created_by: profile.id }))
  const { error } = await client.from('post_sale_message_templates').upsert(payload, { onConflict: 'company_id,follow_up_type,name', ignoreDuplicates: true })
  if (error) throw new Error(error.message || 'Não foi possível preparar os modelos de mensagem.')
  return loadPostSaleTemplates(profile, client)
}

export async function loadPostSaleTemplates(profile, client = supabase) {
  if (!profile?.company_id) return []
  if (templateCacheIsFresh(profile, client)) return globalThis.__postSaleTemplates
  const { data, error } = await client.from('post_sale_message_templates').select('id, follow_up_type, name, message, active, created_at, updated_at').eq('company_id', profile.company_id).eq('active', true).order('follow_up_type').order('name')
  if (error) throw new Error(error.message || 'Não foi possível carregar os modelos de mensagem.')
  const templates = data || []
  if (client === supabase) {
    globalThis.__postSaleTemplates = templates
    globalThis.__postSaleTemplatesCompanyId = profile.company_id
    globalThis.__postSaleTemplatesLoadedAt = Date.now()
  }
  return templates
}

export async function saveMessageTemplate(profile, template, client = supabase) {
  if (!profile?.company_id || !template?.followUpType || !template?.name) throw new Error('Modelo de mensagem inválido.')
  const payload = { company_id: profile.company_id, follow_up_type: template.followUpType, name: template.name.trim(), message: buildFollowUpMessagePatch(template.message).message, active: true, created_by: profile.id, updated_at: new Date().toISOString() }
  const query = template.id ? client.from('post_sale_message_templates').update(payload).eq('id', template.id).eq('company_id', profile.company_id) : client.from('post_sale_message_templates').insert(payload)
  const { error } = await query
  if (error) throw new Error(error.message || 'Não foi possível salvar o modelo de mensagem.')
  if (client === supabase) globalThis.__postSaleTemplatesLoadedAt = 0
}

export async function setFollowUpAutomation(profile, id, options = {}, client = supabase) {
  const patch = { auto_send: Boolean(options.autoSend), ...(options.templateId ? { template_id: options.templateId } : {}), ...(options.scheduledFor ? { due_at: options.scheduledFor } : {}) }
  const { error } = await client.from('post_sale_followups').update(patch).eq('id', id).eq('company_id', profile.company_id)
  if (error) throw new Error(error.message || 'Não foi possível configurar a automação.')
  await recordFollowUpEvent(profile, { followUpId: id, eventType: options.autoSend ? 'scheduled' : 'automation_disabled', channel: 'system' }, client)
}

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
  const { data, error } = await client.from('post_sale_followups').select('id, work_order_id, client_id, vehicle_id, follow_up_type, template_id, auto_send, due_at, status, message, sent_at, last_error, clients(full_name, phone), vehicles(make, model, license_plate), work_orders(service_description)').eq('company_id', profile.company_id).order('due_at', { ascending: true })
  if (error) throw new Error(error.message || 'Não foi possível carregar o pós-venda.')
  return data || []
}

export async function loadPostSaleFollowUpEvents(profile, followUpIds = [], client = supabase) {
  if (!profile?.company_id || !followUpIds.length) return []
  const { data, error } = await client.from('post_sale_followup_events').select('id, follow_up_id, event_type, channel, message_snapshot, error_message, actor_id, created_at').eq('company_id', profile.company_id).in('follow_up_id', followUpIds).order('created_at', { ascending: false })
  if (error) throw new Error(error.message || 'Não foi possível carregar o histórico do pós-venda.')
  return data || []
}

export async function recordFollowUpEvent(profile, event, client = supabase) {
  if (!profile?.company_id || !event?.followUpId || !event?.eventType) return
  const payload = buildFollowUpEvent({ ...event, companyId: profile.company_id, actorId: profile.id })
  const { error } = await client.from('post_sale_followup_events').insert(payload)
  if (error) throw new Error(error.message || 'Não foi possível registrar o histórico do pós-venda.')
}

export async function updateFollowUp(profile, id, status, client = supabase, message = null) {
  const patch = { ...buildFollowUpStatusPatch(status), ...(message === null ? {} : buildFollowUpMessagePatch(message)) }
  const { error } = await client.from('post_sale_followups').update(patch).eq('id', id).eq('company_id', profile.company_id)
  if (error) throw new Error(error.message || 'Não foi possível atualizar o acompanhamento.')
  await recordFollowUpEvent(profile, { followUpId: id, eventType: status === 'sent' ? 'sent' : message !== null ? 'message_edited' : 'undone', channel: status === 'sent' ? 'whatsapp' : 'system', message }, client)
}

globalThis.__postSale = { ensureDefaultMessageTemplates, loadPostSaleFollowUpEvents, loadPostSaleFollowUps, loadPostSaleTemplates, recordFollowUpEvent, saveMessageTemplate, setFollowUpAutomation, syncPostSalePlans, updateFollowUp, classifyFollowUp }
