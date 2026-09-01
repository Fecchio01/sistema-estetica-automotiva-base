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

async function updateFollowUp(client, companyId, id, patch) {
  const { error } = await client.from('post_sale_followups').update(patch).eq('id', id).eq('company_id', companyId)
  if (error) throw new Error(error.message || 'Não foi possível atualizar o follow-up automático.')
}

export async function processDueAutomaticFollowUps({ client, config, companyId, now = new Date(), fetchImpl = fetch } = {}) {
  if (!client || !config?.baseUrl || !config.apiKey || !config.instance || !companyId) return { status: 'disabled', sent: 0, failed: 0, skipped: 0 }
  const nowIso = new Date(now).toISOString()
  const connection = await evolutionRequest(config, `/instance/connectionState/${encodeURIComponent(config.instance)}`, {}, fetchImpl)
  if (!['open', 'connected'].includes(findEvolutionConnectionState(connection))) return { status: 'waiting', sent: 0, failed: 0, skipped: 0 }
  const { data: candidates, error } = await client.from('post_sale_followups').select('id, message, attempt_count, clients(phone)').eq('company_id', companyId).eq('status', 'pending').eq('auto_send', true).lte('due_at', nowIso).or(`auto_send_lock_until.is.null,auto_send_lock_until.lt.${nowIso}`)
  if (error) throw new Error(error.message || 'Não foi possível carregar a fila automática.')
  const result = { status: 'processed', sent: 0, failed: 0, skipped: 0 }
  for (const candidate of candidates || []) {
    const claim = buildAutomaticClaimPatch(now)
    const { data: claimed, error: claimError } = await client.from('post_sale_followups').update(claim).eq('id', candidate.id).eq('company_id', companyId).eq('status', 'pending').eq('auto_send', true).or(`auto_send_lock_until.is.null,auto_send_lock_until.lt.${nowIso}`).select('id, message, clients(phone)')
    if (claimError) throw new Error(claimError.message || 'Não foi possível reservar o follow-up automático.')
    const item = claimed?.[0]
    if (!item) { result.skipped += 1; continue }
    const phone = item.clients?.phone
    if (!phone) {
      const failure = 'Este cliente não possui WhatsApp cadastrado.'
      await updateFollowUp(client, companyId, item.id, buildAutomaticFailurePatch(failure))
      await recordAutomaticEvent(client, companyId, item.id, 'send_failed', item.message, failure)
      result.failed += 1
      continue
    }
    try {
      await sendEvolutionText(config, phone, item.message, fetchImpl)
      await updateFollowUp(client, companyId, item.id, buildAutomaticSuccessPatch(new Date(now).toISOString()))
      await recordAutomaticEvent(client, companyId, item.id, 'sent', item.message)
      result.sent += 1
    } catch (sendError) {
      const failure = buildAutomaticFailurePatch(sendError)
      await updateFollowUp(client, companyId, item.id, failure)
      await recordAutomaticEvent(client, companyId, item.id, 'send_failed', item.message, failure.last_error)
      result.failed += 1
    }
  }
  return result
}

export async function runPostSaleAutomation(env = process.env, dependencies = {}) {
  const client = dependencies.client || createServerSupabaseClient(env)
  const config = dependencies.config || buildEvolutionConfig(env)
  return processDueAutomaticFollowUps({ client, config, companyId: String(env.EVOLUTION_COMPANY_ID || '').trim(), fetchImpl: dependencies.fetchImpl || fetch })
}
