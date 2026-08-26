import { normalizeEvolutionEvent } from './whatsapp-inbox.js'

const headerValue = (headers, name) => {
  const target = name.toLowerCase()
  return Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === target)?.[1] ?? ''
}

export function validateWebhookRequest(request, config) {
  const secret = String(config?.secret ?? '')
  const payload = request?.payload ?? {}
  const provided = String(headerValue(request?.headers, 'x-evolution-webhook-secret'))
  if (!secret || provided !== secret) return { ok: false, error: 'Webhook não autenticado.' }
  if (String(payload.instance ?? payload.instanceName ?? '') !== String(config?.instance ?? '')) return { ok: false, error: 'Instância não autorizada.' }
  return { ok: true }
}

export function buildConversationUpsert(normalized, companyId) {
  return {
    company_id: companyId,
    remote_jid: normalized.remoteJid,
    last_message_preview: normalized.text || `[${normalized.media?.type ?? 'mídia'}]`,
    last_message_type: normalized.media?.type ?? 'text',
    unread_count_increment: normalized.direction === 'incoming' ? 1 : 0,
    last_message_at: normalized.sentAt
  }
}

export function buildMessageInsert(normalized, companyId, conversationId) {
  return {
    company_id: companyId,
    conversation_id: conversationId,
    remote_message_id: normalized.remoteId,
    remote_jid: normalized.remoteJid,
    direction: normalized.direction,
    message_type: normalized.media?.type ?? 'text',
    body: normalized.text ?? '',
    status: normalized.status,
    sent_at: normalized.sentAt,
    ...(normalized.media ? {
      media_mime_type: normalized.media.mimeType,
      media_size: normalized.media.size
    } : {})
  }
}

export function buildConnectionUpdate(payload, companyId, instance) {
  const data = payload?.data ?? payload ?? {}
  return { company_id: companyId, instance, state: data.state ?? data.status ?? 'unknown' }
}

export function normalizeWebhookMessage(payload, instance) {
  return normalizeEvolutionEvent(payload, instance)
}
