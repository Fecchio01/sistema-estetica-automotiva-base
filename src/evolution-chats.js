const text = (value) => String(value ?? '').trim()

function normalizeJid(value) {
  return text(value).replace(/@(?:s\.whatsapp\.net|g\.us|lid)$/i, '')
}

function jidKeys(value) {
  const raw = text(value)
  if (!raw) return []
  return [...new Set([raw, normalizeJid(raw), normalizeJid(raw).replace(/\D/g, '')].filter(Boolean))]
}

function toIsoTimestamp(value, fallback = Date.now()) {
  const number = Number(value)
  if (Number.isFinite(number) && number > 0) return new Date(number > 100000000000 ? number : number * 1000).toISOString()
  const parsed = new Date(value || fallback)
  return Number.isNaN(parsed.getTime()) ? new Date(fallback).toISOString() : parsed.toISOString()
}

function messageText(message) {
  const nested = unwrapMessageContent(message)
  return text(nested?.conversation ?? nested?.extendedTextMessage?.text ?? nested?.imageMessage?.caption ?? nested?.videoMessage?.caption ?? nested?.documentMessage?.caption ?? nested?.reactionMessage?.text)
}

function unwrapMessageContent(message = {}) {
  let current = message?.message ?? message
  for (let i = 0; i < 4; i += 1) {
    const wrapper = ['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension', 'ephemeralMessage', 'documentWithCaptionMessage'].find((key) => current?.[key])
    if (!wrapper) break
    current = current[wrapper]?.message ?? current[wrapper] ?? current
  }
  return current
}

function normalizeMessageType(message = {}) {
  const rawType = text(message.messageType)
  const type = rawType.replace(/Message$/i, '').toLowerCase()
  const nested = unwrapMessageContent(message)
  const mediaType = ['image', 'video', 'audio', 'document', 'sticker', 'reaction'].find((candidate) => nested?.[`${candidate}Message`])
  return mediaType || (type && type !== 'conversation' ? type : 'text')
}

function messageUpdateStatuses(message = {}) {
  const updates = message.MessageUpdate ?? message.messageUpdate ?? message.messageUpdates ?? []
  const values = Array.isArray(updates) ? updates : [updates]
  return [message.status, ...values.map((update) => typeof update === 'string' ? update : update?.status)].filter(Boolean).map((value) => text(value).toUpperCase())
}

function statusForMessage(message, fromMe) {
  if (!fromMe) return 'received'
  const statuses = messageUpdateStatuses(message)
  if (statuses.some((status) => status.includes('READ') || status.includes('PLAYED'))) return 'read'
  if (statuses.some((status) => status.includes('DELIVER'))) return 'delivered'
  if (statuses.some((status) => status.includes('ERROR') || status.includes('FAIL'))) return 'failed'
  return 'sent'
}

export function normalizeEvolutionChat(chat = {}) {
  const remoteJid = text(chat.remoteJid ?? chat.id)
  const lastMessage = chat.lastMessage ?? {}
  const preview = messageText(lastMessage.message ?? lastMessage)
  const alternateJid = text(lastMessage.key?.remoteJidAlt)
  return {
    id: `evolution:${text(chat.id ?? remoteJid)}`,
    remote_jid: remoteJid,
    phone: normalizeJid(alternateJid || remoteJid).replace(/\D/g, ''),
    contact_name: text(chat.name ?? chat.notify ?? chat.verifiedName ?? chat.shortName ?? chat.pushName ?? (!lastMessage.key?.fromMe ? lastMessage.pushName : '')) || null,
    last_message_preview: preview || (lastMessage.messageType ? `[${lastMessage.messageType}]` : 'Nenhuma mensagem ainda.'),
    last_message_at: toIsoTimestamp(chat.updatedAt ?? lastMessage.messageTimestamp),
    unread_count: Number(chat.unreadCount ?? 0) || 0,
    ...(text(chat.profilePicUrl) ? { profile_pic_url: text(chat.profilePicUrl) } : {})
  }
}

export function normalizeEvolutionContact(contact = {}) {
  const remoteJid = text(contact.remoteJid ?? contact.id)
  return {
    remote_jid: remoteJid,
    phone: normalizeJid(remoteJid).replace(/\D/g, ''),
    contact_name: text(contact.name ?? contact.notify ?? contact.verifiedName ?? contact.shortName ?? contact.pushName) || null,
    ...(text(contact.profilePicUrl) ? { profile_pic_url: text(contact.profilePicUrl) } : {})
  }
}

export function mergeEvolutionContacts(chats = [], contacts = []) {
  const byJid = new Map()
  for (const contact of contacts.map(normalizeEvolutionContact)) {
    for (const key of jidKeys(contact.remote_jid)) byJid.set(key, contact)
  }
  return chats.map((chat) => {
    const candidates = [chat.remote_jid, chat.phone, chat.last_message_remote_jid_alt]
    const contact = candidates.flatMap(jidKeys).map((key) => byJid.get(key)).find(Boolean)
    return { ...chat, contact_name: contact?.contact_name || chat.contact_name || null, phone: chat.phone || contact?.phone || '', profile_pic_url: chat.profile_pic_url || contact?.profile_pic_url || '' }
  })
}

export function findEvolutionContactName(messages = []) {
  return [...messages]
    .filter((message) => !message?.key?.fromMe && text(message?.pushName) && text(message.pushName).toLowerCase() !== 'você')
    .sort((a, b) => Number(b?.messageTimestamp ?? 0) - Number(a?.messageTimestamp ?? 0))
    .map((message) => text(message.pushName))[0] || null
}

export function mergeEvolutionChats(chats = []) {
  const groups = new Map()
  for (const chat of chats) {
    const isIndividual = !/@(?:g\.us|newsletter)$/i.test(chat.remote_jid || '')
    const key = isIndividual && chat.phone ? `phone:${chat.phone}` : `jid:${chat.remote_jid}`
    const current = groups.get(key)
    const preferred = !current || (chat.contact_name && /@s\.whatsapp\.net$/i.test(chat.remote_jid || '') && !/@s\.whatsapp\.net$/i.test(current.remote_jid || '')) ? chat : current
    const latest = !current || new Date(chat.last_message_at) > new Date(current.last_message_at) ? chat : current
    groups.set(key, {
      ...latest,
      id: current?.id || `evolution:${key}`,
      contact_name: preferred.contact_name || latest.contact_name || current?.contact_name || null,
      profile_pic_url: preferred.profile_pic_url || latest.profile_pic_url || current?.profile_pic_url || '',
      unread_count: (current?.unread_count || 0) + (chat === current ? 0 : (chat.unread_count || 0)),
      remote_jids: [...new Set([...(current?.remote_jids || []), ...(chat.remote_jids || [chat.remote_jid])])]
    })
  }
  return [...groups.values()]
}

export function normalizeEvolutionMessage(message = {}) {
  const key = message.key ?? {}
  const fromMe = Boolean(key.fromMe ?? message.fromMe)
  const status = statusForMessage(message, fromMe)
  const type = normalizeMessageType(message)
  const nested = unwrapMessageContent(message)
  const source = nested?.[`${type}Message`] ?? null
  return {
    id: `evolution:${text(message.id ?? key.id)}`,
    remote_message_id: text(message.id ?? key.id),
    remote_jid: text(key.remoteJid ?? message.remoteJid),
    remote_jid_alt: text(key.remoteJidAlt),
    direction: fromMe ? 'outgoing' : 'incoming',
    message_type: type,
    body: messageText(message.message ?? message) || text(source?.caption),
    edited: Boolean(message.edited),
    status,
    sent_at: toIsoTimestamp(message.messageTimestamp ?? message.timestamp),
    media_url: text(source?.url),
    media_mime_type: text(source?.mimetype),
    media_file_name: text(source?.fileName ?? message.fileName),
    media_key: source ? { id: text(key.id), remoteJid: text(key.remoteJid ?? message.remoteJid), fromMe } : null,
    reaction_target_id: type === 'reaction' ? text(source?.key?.id) : '',
    reaction_emoji: type === 'reaction' ? text(source?.text) : ''
  }
}

export function sortEvolutionMessages(messages = []) {
  return [...messages].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())
}

export function buildChatsRequest(config) {
  return { path: `/chat/findChats/${encodeURIComponent(config.instance)}`, body: {} }
}

export function buildContactsRequest(config) {
  return { path: `/chat/findContacts/${encodeURIComponent(config.instance)}`, body: {} }
}

export function buildMessagesRequest(config, remoteJid, page = 1) {
  return { path: `/chat/findMessages/${encodeURIComponent(config.instance)}`, body: { where: { key: { remoteJid: text(remoteJid) } }, page, limit: 100 } }
}

export function buildMediaRequest(config) {
  return { path: `/chat/getBase64FromMediaMessage/${encodeURIComponent(config.instance)}` }
}
