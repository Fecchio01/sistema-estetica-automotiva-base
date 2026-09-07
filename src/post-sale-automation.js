import { createClient } from '@supabase/supabase-js'
import { buildEvolutionConfig, evolutionRequest, findEvolutionConnectionState, sendEvolutionText } from './evolution-api.js'

const LOCK_MINUTES = 5

export function buildAutomaticClaimPatch(now = new Date(), attemptCount = 0, lockMinutes = LOCK_MINUTES) {
  const nextAttemptCount = Number.isFinite(Number(attemptCount)) ? Number(attemptCount) + 1 : 1
  return { auto_send_lock_until: new Date(new Date(now).getTime() + lockMinutes * 60_000).toISOString(), attempt_count: nextAttemptCount }
}

export function buildAutomaticFailurePatch(error) {
  return { auto_send_lock_until: null, last_error: String(error?.message || error || 'Falha no envio automático.').trim() }
}

export function buildAutomaticSuccessPatch(sentAt = new Date().toISOString()) {
  return { status: 'sent', sent_at: sentAt, auto_send_lock_until: null, last_error: null }
}

export function createServerSupabaseClient(env = process.env, createClientFactory = createClient) {
  const url = String(env.SUPABASE_URL || '').trim()
  const key = String(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!url || !key) return null
  return createClientFactory(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
}

async function recordAutomaticEvent(client, companyId, followUpId, eventType, message, errorMessage = null) {
  const { error } = await client.from('post_sale_followup_events').insert({ company_id: companyId, follow_up_id: followUpId, event_type: eventType, channel: 'whatsapp', message_snapshot: message, error_message: errorMessage, actor_id: null })
  if (error) throw new Error(error.message || 'Não foi possível registrar o envio automático.')
}

async function updateFollowUp(client, companyId, id, patch, table = 'post_sale_followups') {
  const { error } = await client.from(table).update(patch).eq('id', id).eq('company_id', companyId)
  if (error) throw new Error(error.message || 'Não foi possível atualizar o follow-up automático.')
}

export async function processDueAutomaticFollowUps({ client, config, companyId, now = new Date(), fetchImpl = fetch, queueTable = 'post_sale_followups' } = {}) {
  if (!client || !config?.baseUrl || !config.apiKey || !config.instance || !companyId) return { status: 'disabled', sent: 0, failed: 0, skipped: 0 }
  if (!['post_sale_followups', 'order_notifications'].includes(queueTable)) throw new Error('Fila inválida.')
  const update = (id, patch) => updateFollowUp(client, companyId, id, patch, queueTable)
  const record = (id, type, message, error) => queueTable === 'post_sale_followups' ? recordAutomaticEvent(client, companyId, id, type, message, error) : Promise.resolve()
  const nowIso = new Date(now).toISOString()
  const connection = await evolutionRequest(config, `/instance/connectionState/${encodeURIComponent(config.instance)}`, {}, fetchImpl)
  if (!['open', 'connected'].includes(findEvolutionConnectionState(connection))) return { status: 'waiting', sent: 0, failed: 0, skipped: 0 }
  const { data: candidates, error } = await client.from(queueTable).select('id, message, attempt_count, clients(phone)').eq('company_id', companyId).eq('status', 'pending').eq('auto_send', true).lte('due_at', nowIso).or(`auto_send_lock_until.is.null,auto_send_lock_until.lt.${nowIso}`)
  if (error) throw new Error(error.message || 'Não foi possível carregar a fila automática.')
  const result = { status: 'processed', sent: 0, failed: 0, skipped: 0 }
  for (const candidate of candidates || []) {
    // Disarm while sending: a crashed process cannot resend an ambiguous delivery.
    const claim = { ...buildAutomaticClaimPatch(now, candidate.attempt_count), auto_send: false }
    const { data: claimed, error: claimError } = await client.from(queueTable).update(claim).eq('id', candidate.id).eq('company_id', companyId).eq('status', 'pending').eq('auto_send', true).lte('due_at', nowIso).or(`auto_send_lock_until.is.null,auto_send_lock_until.lt.${nowIso}`).select('id, message, clients(phone)')
    if (claimError) throw new Error(claimError.message || 'Não foi possível reservar o follow-up automático.')
    const item = claimed?.[0]
    if (!item) { result.skipped += 1; continue }
    const phone = item.clients?.phone
    if (!phone) {
      const failure = 'Este cliente não possui WhatsApp cadastrado.'
      await update(item.id, buildAutomaticFailurePatch(failure))
      await record(item.id, 'send_failed', item.message, failure)
      result.failed += 1
      continue
    }
    try {
      await sendEvolutionText(config, phone, item.message, fetchImpl)
    } catch (sendError) {
      const failure = buildAutomaticFailurePatch(`Envio pausado para conferência: ${sendError.message || sendError}`)
      await update(item.id, failure)
      await record(item.id, 'send_failed', item.message, failure.last_error)
      result.failed += 1
      continue
    }
    // An audit/storage failure after delivery must never requeue the message.
    await update(item.id, buildAutomaticSuccessPatch(new Date(now).toISOString()))
    await record(item.id, 'sent', item.message)
    result.sent += 1
  }
  return result
}

export async function runPostSaleAutomation(env = process.env, dependencies = {}) {
  const client = dependencies.client || createServerSupabaseClient(env)
  const config = dependencies.config || buildEvolutionConfig(env)
  const companyId = String(env.EVOLUTION_COMPANY_ID || '').trim()
  if (!client || !companyId || !config.baseUrl || !config.apiKey || !config.instance) return { status: 'disabled', sent: 0, failed: 0, skipped: 0 }
  const { data: settings, error } = await client.from('company_automation_settings').select('post_sale_enabled').eq('company_id', companyId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!settings?.post_sale_enabled) return { status: 'paused', sent: 0, failed: 0, skipped: 0 }
  const args = { client, config, companyId, fetchImpl: dependencies.fetchImpl || fetch }
  const notices = await processDueAutomaticFollowUps({ ...args, queueTable: 'order_notifications' })
  const followUps = await processDueAutomaticFollowUps(args)
  return { status: followUps.status, sent: notices.sent + followUps.sent, failed: notices.failed + followUps.failed, skipped: notices.skipped + followUps.skipped }
}
