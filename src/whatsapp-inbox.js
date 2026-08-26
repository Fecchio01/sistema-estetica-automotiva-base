import { normalizePhoneNumber } from './evolution-api.js'

const WEBHOOK_EVENTS = [
  'QRCODE_UPDATED',
  'CONNECTION_UPDATE',
  'MESSAGES_UPSERT',
  'MESSAGES_UPDATE',
  'MESSAGES_DELETE',
  'SEND_MESSAGE',
  'CHATS_SET',
  'CHATS_UPDATE',
  'CHATS_UPSERT'
]

function requiredString(value, name) {
  const result = String(value ?? '').trim()
  if (!result) throw new Error(`${name} é obrigatório.`)
  return result
}

export function normalizeRemoteJid(value) {
  const jid = requiredString(value, 'JID')
  return jid.replace(/@(?:s\.whatsapp\.net|g\.us|lid)$/i, '').replace(/\D/g, '') || jid
}

function normalizeMessageType(message = {}) {
  if (message.imageMessage) return { type: 'image', source: message.imageMessage }
  if (message.videoMessage) return { type: 'video', source: message.videoMessage }
  if (message.audioMessage) return { type: 'audio', source: message.audioMessage }
  if (message.documentMessage) return { type: 'document', source: message.documentMessage }
  if (message.stickerMessage) return { type: 'sticker', source: message.stickerMessage }
  return { type: 'text', source: null }
}

function messageText(message = {}, mediaSource) {
  return String(
    message.conversation ??
    message.extendedTextMessage?.text ??
    mediaSource?.caption ??
    ''
  ).trim()
}

function normalizeStatus(value, fromMe) {
  const status = String(value ?? '').toUpperCase()
  if (!fromMe) return 'received'
  if (status.includes('READ') || status.includes('PLAYED')) return 'read'
  if (status.includes('DELIVER')) return 'delivered'
  if (status.includes('ERROR') || status.includes('FAIL')) return 'failed'
  return 'sent'
}

export function normalizeEvolutionEvent(payload, expectedInstance) {
  const event = requiredString(payload?.event ?? payload?.Event, 'Evento')
  const instance = requiredString(payload?.instance ?? payload?.instanceName, 'Instância')
  if (expectedInstance && instance !== expectedInstance) throw new Error('Evento de instância diferente da configurada.')

  const data = payload?.data ?? payload?.Data ?? {}
  if (!event.toUpperCase().includes('MESSAGE') && !event.toUpperCase().includes('SEND_MESSAGE')) {
    return { kind: 'status', event: event.toUpperCase(), state: data.state ?? data.status ?? null }
  }

  const key = data.key ?? data.message?.key ?? {}
  const remoteId = requiredString(key.id ?? data.id, 'Id remoto')
  const remoteJid = normalizeRemoteJid(key.remoteJid ?? data.remoteJid)
  const fromMe = Boolean(key.fromMe ?? data.fromMe)
  const message = data.message ?? {}
  const { type, source } = normalizeMessageType(message)
  const timestamp = Number(data.messageTimestamp ?? data.timestamp ?? Date.now() / 1000)
  const sentAt = new Date(timestamp > 100000000000 ? timestamp : timestamp * 1000).toISOString()
  const media = source ? {
    type,
    mimeType: source.mimetype ?? null,
    size: Number(source.fileLength ?? 0) || null,
    ...(source.fileName ? { fileName: source.fileName } : {})
  } : null

  return {
    kind: 'message',
    remoteId,
    remoteJid,
    direction: fromMe ? 'outgoing' : 'incoming',
    text: messageText(message, source),
    media,
    sentAt,
    status: normalizeStatus(data.status, fromMe)
  }
}

export function buildEvolutionWebhookConfig(baseUrl, instance, webhookUrl, apiKey, webhookSecret = apiKey) {
  requiredString(baseUrl, 'URL da Evolution')
  const safeInstance = requiredString(instance, 'Instância')
  const safeWebhookUrl = requiredString(webhookUrl, 'URL do webhook')
  const secret = requiredString(apiKey, 'Chave da Evolution')
  const outgoingSecret = requiredString(webhookSecret, 'Segredo do webhook')
  return {
    path: `/webhook/set/${encodeURIComponent(safeInstance)}`,
    headers: { apikey: secret, 'content-type': 'application/json' },
    body: {
      webhook: {
        enabled: true,
        url: safeWebhookUrl,
        webhook_by_events: false,
        webhook_base64: true,
        headers: { 'x-evolution-webhook-secret': outgoingSecret },
        events: WEBHOOK_EVENTS
      }
    }
  }
}

export function buildManualMessage(number, text, media) {
  const normalizedNumber = normalizePhoneNumber(number)
  const message = String(text ?? '').trim()
  if (!message && !media) throw new Error('Informe uma mensagem ou mídia.')
  const result = { number: normalizedNumber }
  if (message) result.text = message
  if (media) result.media = media
  return result
}

export { WEBHOOK_EVENTS }
