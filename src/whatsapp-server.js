import { buildSendTextRequest, normalizePhoneNumber } from './evolution-api.js'
import { buildEvolutionWebhookConfig } from './whatsapp-inbox.js'

const MAX_MEDIA_BYTES = 10 * 1024 * 1024
const MEDIA_TYPES = new Set(['image', 'video', 'audio', 'document', 'sticker'])

function assertConfig(config) {
  if (!config?.baseUrl || !config.apiKey || !config.instance) throw new Error('Evolution API ainda não configurada.')
}

export function buildConnectionRequest(config) {
  assertConfig(config)
  return { path: `/instance/connectionState/${encodeURIComponent(config.instance)}` }
}

export function buildQrRequest(config) {
  assertConfig(config)
  return { path: `/instance/connect/${encodeURIComponent(config.instance)}` }
}

export function buildLogoutRequest(config) {
  assertConfig(config)
  return { path: `/instance/logout/${encodeURIComponent(config.instance)}` }
}

export function validateMediaPayload(media) {
  if (!media) return { ok: true }
  if (!MEDIA_TYPES.has(String(media.type ?? '').toLowerCase())) return { ok: false, error: 'Tipo de mídia não permitido.' }
  if (!String(media.mimeType ?? '').trim()) return { ok: false, error: 'Informe o tipo MIME da mídia.' }
  if (Number(media.size ?? 0) > MAX_MEDIA_BYTES) return { ok: false, error: 'A mídia deve ter no máximo 10 MB.' }
  if (!String(media.url ?? '').trim()) return { ok: false, error: 'Informe a URL da mídia.' }
  return { ok: true }
}

export function buildManualSendRequest(config, input) {
  assertConfig(config)
  const mediaCheck = validateMediaPayload(input?.media)
  if (!mediaCheck.ok) throw new Error(mediaCheck.error)
  const number = normalizePhoneNumber(input?.number)
  const text = String(input?.text ?? '').trim()
  if (!text && !input?.media) throw new Error('Informe uma mensagem ou mídia.')
  if (!input?.media) {
    const request = buildSendTextRequest(number, text, config)
    return { path: request.path, headers: request.headers, body: { ...request.body, ...(input.quoted ? { quoted: input.quoted } : {}) } }
  }
  const media = input.media
  return {
    path: `/message/sendMedia/${encodeURIComponent(config.instance)}`,
    headers: { apikey: config.apiKey, 'content-type': 'application/json' },
    body: {
      number,
      mediatype: media.type,
      mimetype: media.mimeType,
      media: media.url,
      ...(text ? { caption: text } : {}),
      ...(input.quoted ? { quoted: input.quoted } : {})
    }
  }
}

export function buildReactionRequest(config, input = {}) {
  assertConfig(config)
  const remoteJid = String(input.remoteJid ?? '').trim()
  const id = String(input.id ?? '').trim()
  const reaction = String(input.reaction ?? '').trim()
  if (!remoteJid || !id) throw new Error('Informe a mensagem que receberá a reação.')
  if (!reaction) throw new Error('Informe uma reação.')
  return {
    path: `/message/sendReaction/${encodeURIComponent(config.instance)}`,
    headers: { apikey: config.apiKey, 'content-type': 'application/json' },
    body: { key: { remoteJid, id, fromMe: Boolean(input.fromMe) }, reaction }
  }
}

export function buildDeleteMessageRequest(config, input = {}) {
  assertConfig(config)
  const chat = String(input.chat ?? input.remoteJid ?? '').trim()
  const messageId = String(input.messageId ?? input.id ?? '').trim()
  if (!chat || !messageId) throw new Error('Informe a conversa e a mensagem que será apagada.')
  return {
    path: '/message/delete',
    headers: { apikey: config.apiKey, 'content-type': 'application/json' },
    body: { chat, messageId }
  }
}

export function buildMarkReadRequest(config, messages = []) {
  assertConfig(config)
  return {
    path: `/chat/markMessageAsRead/${encodeURIComponent(config.instance)}`,
    headers: { apikey: config.apiKey, 'content-type': 'application/json' },
    body: { readMessages: messages.filter((message) => message?.remote_message_id && (message?.remote_jid_alt || message?.remote_jid)).map((message) => ({ id: message.remote_message_id, fromMe: false, remoteJid: message.remote_jid_alt || message.remote_jid })) }
  }
}

export function buildWebhookSetupRequest(config, webhookUrl, webhookSecret) {
  return buildEvolutionWebhookConfig(config.baseUrl, config.instance, webhookUrl, config.apiKey, webhookSecret)
}
