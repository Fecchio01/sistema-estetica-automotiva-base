import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildEvolutionConfig, evolutionRequest, findEvolutionConnectionState, findEvolutionInstance, sendEvolutionText } from './src/evolution-api.js'
import { buildAutomaticReply } from './src/whatsapp-auto-reply.js'
import { normalizeEvolutionEvent } from './src/whatsapp-inbox.js'
import { buildConnectionRequest, buildQrRequest, buildLogoutRequest, buildManualSendRequest, buildMarkReadRequest, buildReactionRequest, buildDeleteMessageRequest, buildWebhookSetupRequest } from './src/whatsapp-server.js'
import { buildChatsRequest, buildContactsRequest, buildMediaRequest, buildMessagesRequest, findEvolutionContactName, mergeEvolutionChats, mergeEvolutionContacts, normalizeEvolutionChat, normalizeEvolutionMessage, sortEvolutionMessages } from './src/evolution-chats.js'
import { createServerSupabaseClient, runPostSaleAutomation } from './src/post-sale-automation.js'

const root = fileURLToPath(new URL('.', import.meta.url))
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' }
const contactNameCache = new Map()
const autoReplySeen = new Set()
const autoReplyIntroduced = new Set()
const messageStatusCache = new Map()
const mediaDataCache = new Map()
const messagePageCache = new Map()
const chatsCache = new Map()
const forcedDisconnectedInstances = new Set()

function normalizeMessageUpdateStatus(value) {
  if (Number(value) === 3 || Number(value) === 4) return 'read'
  if (Number(value) === 2) return 'delivered'
  if (Number(value) === 5) return 'failed'
  const status = String(value ?? '').toUpperCase()
  if (status.includes('READ') || status.includes('PLAYED')) return 'read'
  if (status.includes('DELIVER')) return 'delivered'
  if (status.includes('ERROR') || status.includes('FAIL')) return 'failed'
  if (status.includes('PENDING') || status.includes('SERVER_ACK') || status.includes('SENT')) return 'sent'
  return null
}

try { process.loadEnvFile?.(join(root, '.env.local')) } catch {}
const postSaleAutomationClient = createServerSupabaseClient(process.env)
let postSaleAutomationRunning = false

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, no-cache, must-revalidate' })
  response.end(JSON.stringify(body))
}

async function runPostSaleAutomationCycle() {
  if (postSaleAutomationRunning) return
  postSaleAutomationRunning = true
  try {
    const result = await runPostSaleAutomation(process.env, { client: postSaleAutomationClient })
    if (result.sent || result.failed) console.log(`Pós-venda automático: ${result.sent} enviado(s), ${result.failed} falha(s), ${result.skipped} ignorado(s).`)
  } catch (error) {
    console.warn(`Pós-venda automático indisponível: ${error.message}`)
  } finally {
    postSaleAutomationRunning = false
  }
}

function startPostSaleAutomation() {
  const timer = setInterval(runPostSaleAutomationCycle, 60_000)
  timer.unref?.()
  runPostSaleAutomationCycle()
}

function recordsFromMessages(data) {
  return data?.messages?.records ?? data?.records ?? data?.messages ?? (Array.isArray(data) ? data : [])
}

function mergeEvolutionEdits(messages) {
  const technical = new Set(['protocolmessage', 'secretencryptedmessage', 'senderkeydistributionmessage', 'messagecontextinfo', 'historysyncnotification', 'appstatesynckeyshare'])
  const regular = messages.filter((message) => !technical.has(String(message.messageType || '').toLowerCase()))
  const byId = new Map(regular.map((message) => [message.id ?? message.key?.id, message]))
  for (const event of messages) {
    if (String(event.messageType || '').toLowerCase() !== 'protocolmessage') continue
    const protocol = event.message?.protocolMessage
    const editedMessage = protocol?.editedMessage
    const targetId = protocol?.key?.id
    if (!editedMessage || !targetId) continue
    const target = byId.get(targetId)
    if (target) {
      target.message = editedMessage
      target.messageType = Object.keys(editedMessage).find((key) => key.endsWith('Message')) || 'conversation'
      target.edited = true
    } else {
      const synthetic = { id: targetId, key: protocol.key, message: editedMessage, messageType: Object.keys(editedMessage).find((key) => key.endsWith('Message')) || 'conversation', messageTimestamp: event.messageTimestamp, edited: true }
      regular.push(synthetic)
      byId.set(targetId, synthetic)
    }
  }
  return regular
}

function mergeEvolutionReactions(messages) {
  const regular = messages.filter((message) => String(message.messageType || '').toLowerCase() !== 'reactionmessage')
  const byId = new Map(regular.map((message) => [message.id ?? message.key?.id, message]))
  for (const reaction of messages) {
    if (String(reaction.messageType || '').toLowerCase() !== 'reactionmessage') continue
    const reactionMessage = reaction.message?.reactionMessage
    const targetId = reactionMessage?.key?.id
    const emoji = String(reactionMessage?.text ?? '').trim()
    const target = byId.get(targetId)
    if (!target || !emoji) continue
    target.reactions = [...(target.reactions ?? []), { emoji, fromMe: Boolean(reaction.key?.fromMe), sender: String(reaction.key?.participant ?? reaction.key?.remoteJid ?? '') }]
  }
  return regular
}

async function loadEvolutionMessages(config, remoteJid, maxPages = 10) {
  const messages = []
  for (let page = 1; page <= maxPages; page += 1) {
    const cacheKey = `${config.instance}:${remoteJid}:${page}`
    const cached = messagePageCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      messages.push(...cached.records)
      if (cached.records.length < 50) break
      continue
    }
    const requestData = buildMessagesRequest(config, remoteJid, page)
    const data = await evolutionRequest(config, requestData.path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(requestData.body) })
    const records = recordsFromMessages(data)
    messagePageCache.set(cacheKey, { records, expiresAt: Date.now() + 2_000 })
    messages.push(...records)
    if (records.length < 50) break
  }
  return messages
}

async function hydrateEvolutionMedia(config, messages) {
  const allMedia = messages.filter((message) => message.media_key?.id && ['audio', 'image', 'video', 'document', 'sticker'].includes(message.message_type))
  allMedia.forEach((message) => { message.media_proxy_url = `/api/whatsapp/media?remoteJid=${encodeURIComponent(message.media_key.remoteJid)}&messageId=${encodeURIComponent(message.remote_message_id)}&fromMe=${message.media_key.fromMe ? 'true' : 'false'}` })
  const mediaMessages = [...new Map([
    ...allMedia.filter((message) => message.message_type === 'document').map((message) => [message.remote_message_id, message]),
    ...allMedia.slice(-30).map((message) => [message.remote_message_id, message])
  ]).values()]
  await Promise.all(mediaMessages.map(async (message) => {
    try {
      const cached = mediaDataCache.get(message.remote_message_id)
      if (cached && cached.expiresAt > Date.now()) { message.media_url = cached.url; return }
      const requestData = buildMediaRequest(config)
      const data = await evolutionRequest(config, requestData.path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: { key: message.media_key } }) }, fetch, 15000)
      const base64 = String(data?.base64 ?? '').trim()
      if (base64) {
        const mime = String(data?.mimetype || message.media_mime_type || 'application/octet-stream').split(';')[0].trim()
        const url = `data:${mime};base64,${base64}`
        message.media_url = url
        mediaDataCache.set(message.remote_message_id, { url, expiresAt: Date.now() + 10 * 60_000 })
      }
    } catch {
      // URLs do WhatsApp expiram; a mensagem sem download continua identificada pelo tipo.
    }
  }))
  return messages
}

async function enrichChatNames(config, chats) {
  const missing = chats.filter((chat) => !chat.contact_name && chat.remote_jid)
  const enriched = await Promise.all(missing.map(async (chat) => {
    const cached = contactNameCache.get(chat.remote_jid)
    if (cached && cached.expiresAt > Date.now()) return [chat.id, cached.name]
    try {
      const messages = await loadEvolutionMessages(config, chat.remote_jid, 1)
      const name = findEvolutionContactName(messages)
      contactNameCache.set(chat.remote_jid, { name, expiresAt: Date.now() + 60_000 })
      return [chat.id, name]
    } catch { return [chat.id, null] }
  }))
  const names = new Map(enriched)
  return chats.map((chat) => ({ ...chat, contact_name: chat.contact_name || names.get(chat.id) || null }))
}

async function readJsonBody(request) {
  let raw = ''
  for await (const chunk of request) {
    raw += chunk
    if (raw.length > 12 * 1024 * 1024) throw new Error('Payload muito grande.')
  }
  if (!raw.trim()) return {}
  return JSON.parse(raw)
}

async function handleAutomaticReplyWebhook(request, response) {
  const secret = String(process.env.EVOLUTION_WEBHOOK_SECRET ?? process.env.EVOLUTION_API_KEY ?? '').trim()
  if (String(request.headers['x-evolution-webhook-secret'] ?? '') !== secret) return sendJson(response, 401, { ok: false, message: 'Webhook não autenticado.' })
  const payload = await readJsonBody(request)
  const event = String(payload?.event ?? payload?.Event ?? '').toUpperCase()
  const eventData = payload?.data ?? payload?.Data ?? {}
  if (event.includes('MESSAGES_UPDATE') || event.includes('SEND_MESSAGE_UPDATE')) {
    const updates = Array.isArray(eventData) ? eventData : [eventData]
    let updated = 0
    for (const update of updates) {
      const key = update?.key ?? update?.message?.key ?? {}
      const remoteMessageId = String(key.id ?? update?.id ?? '').trim()
      const status = normalizeMessageUpdateStatus(update?.update?.status ?? update?.status ?? update?.message?.status)
      if (remoteMessageId && status) { messageStatusCache.set(remoteMessageId, status); updated += 1 }
    }
    return sendJson(response, 200, { ok: true, updated })
  }
  if (!String(process.env.EVOLUTION_AUTO_REPLY_ENABLED).toLowerCase().includes('true')) return sendJson(response, 200, { ok: true, ignored: true })
  const config = buildEvolutionConfig(process.env)
  const normalized = normalizeEvolutionEvent(payload, config.instance)
  if (normalized.kind !== 'message' || normalized.direction !== 'incoming') return sendJson(response, 200, { ok: true, ignored: true })
  if (autoReplySeen.has(normalized.remoteId)) return sendJson(response, 200, { ok: true, duplicate: true })
  autoReplySeen.add(normalized.remoteId)
  const target = String(process.env.EVOLUTION_AUTO_REPLY_PHONE ?? '').replace(/\D/g, '')
  if (String(normalized.remoteJid) !== target || !String(process.env.EVOLUTION_AUTO_REPLY_ENABLED).toLowerCase().includes('true')) return sendJson(response, 200, { ok: true, ignored: true })
  const reply = buildAutomaticReply(normalized.text, { introduced: autoReplyIntroduced.has(target) })
  if (!reply.shouldReply) return sendJson(response, 200, { ok: true, manual_review: true })
  await sendEvolutionText(config, target, reply.text)
  autoReplyIntroduced.add(target)
  return sendJson(response, 200, { ok: true, replied: true })
}

async function handleWhatsApp(request, response, pathname) {
  const config = buildEvolutionConfig(process.env)
  if (request.method === 'POST' && pathname === '/api/whatsapp/webhook') {
    try { return await handleAutomaticReplyWebhook(request, response) } catch (error) { return sendJson(response, 400, { ok: false, message: error.message }) }
  }
  if (request.method === 'GET' && pathname === '/api/whatsapp/connection') {
    if (!config.baseUrl || !config.apiKey || !config.instance) return sendJson(response, 200, { configured: false, state: 'not_configured' })
    if (forcedDisconnectedInstances.has(config.instance)) return sendJson(response, 200, { configured: true, instance: config.instance, state: 'logged_out', disconnectReason: 'manual_demo_disconnect', disconnectAt: new Date().toISOString() })
    try {
      const data = await evolutionRequest(config, '/instance/connectionState/' + encodeURIComponent(config.instance))
      return sendJson(response, 200, { configured: true, instance: config.instance, state: findEvolutionConnectionState(data), disconnectReason: null, disconnectAt: null })
    } catch (error) {
      return sendJson(response, 502, { configured: true, instance: config.instance, state: 'error', message: error.message })
    }
  }
  if (request.method === 'GET' && pathname === '/api/whatsapp/qr') {
    if (!config.baseUrl || !config.apiKey || !config.instance) return sendJson(response, 200, { configured: false, state: 'not_configured' })
    const wasForcedDisconnected = forcedDisconnectedInstances.delete(config.instance)
    try {
      let current = { state: 'unknown' }
      try {
        const instances = await evolutionRequest(config, '/instance/fetchInstances')
        current = findEvolutionInstance(instances, config.instance)
        if (['open', 'connected'].includes(current.state) && !wasForcedDisconnected) return sendJson(response, 200, { configured: true, instance: config.instance, state: current.state, message: 'O WhatsApp já está conectado nesta instância.' })
      } catch {
        // Se a consulta de estado falhar, ainda tentamos renovar o QR diretamente.
      }
      const data = await evolutionRequest(config, buildQrRequest(config).path)
      return sendJson(response, 200, { configured: true, instance: config.instance, state: 'connecting', data })
    } catch {
      return sendJson(response, 502, { configured: true, instance: config.instance, state: 'error', message: 'A Evolution API está indisponível. Inicie o serviço e tente gerar o QR Code novamente.' })
    }
  }
  if (request.method === 'POST' && pathname === '/api/whatsapp/disconnect') {
    if (!config.baseUrl || !config.apiKey || !config.instance) return sendJson(response, 200, { configured: false, state: 'not_configured' })
    try {
      const requestData = buildLogoutRequest(config)
      await evolutionRequest(config, requestData.path, { method: 'DELETE' })
      forcedDisconnectedInstances.add(config.instance)
      return sendJson(response, 200, { ok: true, state: 'logged_out', instance: config.instance })
    } catch (error) {
      try { await evolutionRequest(config, '/instance/disconnect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }); forcedDisconnectedInstances.add(config.instance); return sendJson(response, 200, { ok: true, state: 'disconnect_requested', instance: config.instance, message: 'Desconexão solicitada à Evolution API.' }) } catch {
        try { const current = await evolutionRequest(config, '/instance/connectionState/' + encodeURIComponent(config.instance)); const state = findEvolutionConnectionState(current); if (!['open', 'connected'].includes(state)) return sendJson(response, 200, { ok: true, state: 'logged_out', instance: config.instance }) } catch {}
        return sendJson(response, 502, { ok: false, state: 'error', message: error.message })
      }
    }
  }
  if (request.method === 'GET' && pathname === '/api/whatsapp/status') {
    if (!config.baseUrl || !config.apiKey || !config.instance) return sendJson(response, 200, { configured: false, state: 'not_configured' })
    try {
      const data = await evolutionRequest(config, '/instance/fetchInstances')
      return sendJson(response, 200, { configured: true, ...findEvolutionInstance(data, config.instance) })
    } catch (error) {
      return sendJson(response, 502, { configured: true, state: 'error', message: error.message })
    }
  }
  if (request.method === 'GET' && pathname === '/api/whatsapp/media') {
    try {
      const url = new URL(request.url, 'http://127.0.0.1')
      const remoteJid = String(url.searchParams.get('remoteJid') || '').trim()
      const messageId = String(url.searchParams.get('messageId') || '').trim()
      const fromMe = String(url.searchParams.get('fromMe') || '') === 'true'
      if (!remoteJid || !messageId) return sendJson(response, 400, { ok: false, message: 'Mídia inválida.' })
      const cached = mediaDataCache.get(messageId)
      if (cached && cached.expiresAt > Date.now()) {
        const match = cached.url.match(/^data:([^;]+);base64,(.*)$/s)
        if (match) { response.writeHead(200, { 'Content-Type': match[1], 'Cache-Control': 'private, max-age=600', 'Content-Disposition': 'inline' }); response.end(Buffer.from(match[2], 'base64')); return }
      }
      const requestData = buildMediaRequest(config)
      const data = await evolutionRequest(config, requestData.path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: { key: { id: messageId, remoteJid, fromMe } } }) }, fetch, 15000)
      const base64 = String(data?.base64 || '').trim()
      if (!base64) return sendJson(response, 404, { ok: false, message: 'A mídia não está disponível na Evolution.' })
      const mime = String(data?.mimetype || 'application/octet-stream').split(';')[0].trim()
      mediaDataCache.set(messageId, { url: `data:${mime};base64,${base64}`, expiresAt: Date.now() + 10 * 60_000 })
      response.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'private, max-age=600', 'Content-Disposition': 'inline' })
      response.end(Buffer.from(base64, 'base64'))
    } catch (error) { return sendJson(response, 502, { ok: false, message: error.message }) }
    return true
  }
  if (request.method === 'GET' && pathname === '/api/whatsapp/chats') {
    try {
      const cacheKey = config.instance
      const cached = chatsCache.get(cacheKey)
      if (cached && cached.expiresAt > Date.now()) return sendJson(response, 200, cached.body)
      const requestData = buildChatsRequest(config)
      const contactsRequest = buildContactsRequest(config)
      const [data, contactsData] = await Promise.all([
        evolutionRequest(config, requestData.path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(requestData.body) }),
        evolutionRequest(config, contactsRequest.path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(contactsRequest.body) })
      ])
      const chats = Array.isArray(data) ? data : data?.chats ?? data?.data ?? []
      const contacts = Array.isArray(contactsData) ? contactsData : contactsData?.contacts ?? contactsData?.data ?? []
      const normalizedChats = mergeEvolutionContacts(chats.map(normalizeEvolutionChat), contacts)
      const body = { chats: mergeEvolutionChats(await enrichChatNames(config, normalizedChats)), refreshed_at: new Date().toISOString() }
      chatsCache.set(cacheKey, { body, expiresAt: Date.now() + 2_000 })
      return sendJson(response, 200, body)
    } catch (error) { return sendJson(response, 502, { message: error.message }) }
  }
  if (request.method === 'POST' && pathname === '/api/whatsapp/chat-messages') {
    try {
      const body = await readJsonBody(request)
      const remoteJids = [...new Set((Array.isArray(body.remoteJids) ? body.remoteJids : [body.remoteJid]).filter(Boolean))]
      const results = await Promise.all(remoteJids.map((remoteJid) => loadEvolutionMessages(config, remoteJid)))
      const messages = results.flat()
      const unique = [...new Map(mergeEvolutionReactions(mergeEvolutionEdits(messages)).map((message) => [message.id ?? message.key?.id, message])).values()]
      const normalized = sortEvolutionMessages(unique.map(normalizeEvolutionMessage)).map((message) => ({ ...message, status: messageStatusCache.get(message.remote_message_id) ?? message.status }))
      await hydrateEvolutionMedia(config, normalized)
      normalized.forEach((message) => { delete message.media_key })
      return sendJson(response, 200, { messages: normalized })
    } catch (error) { return sendJson(response, 502, { message: error.message }) }
  }
  if (request.method === 'POST' && pathname === '/api/whatsapp/mark-read') {
    try {
      const body = await readJsonBody(request)
      const requestData = buildMarkReadRequest(config, body.messages ?? [])
      const data = await evolutionRequest(config, requestData.path, { method: 'POST', headers: requestData.headers, body: JSON.stringify(requestData.body) })
      return sendJson(response, 200, { ok: true, data })
    } catch (error) { return sendJson(response, 400, { ok: false, message: error.message }) }
  }
  if (request.method === 'POST' && pathname === '/api/whatsapp/send') {
    try {
      const body = await readJsonBody(request)
      const data = await sendEvolutionText(config, body.number, body.text)
      return sendJson(response, 200, { ok: true, data })
    } catch (error) {
      const notConfigured = error.message.includes('ainda não configurada')
      return sendJson(response, notConfigured ? 503 : 502, { ok: false, message: error.message })
    }
  }
  if (request.method === 'POST' && pathname === '/api/whatsapp/messages') {
    try {
      const body = await readJsonBody(request)
      const requestData = buildManualSendRequest(config, body)
      const data = await evolutionRequest(config, requestData.path, { method: 'POST', headers: requestData.headers, body: JSON.stringify(requestData.body) })
      return sendJson(response, 200, { ok: true, data })
    } catch (error) {
      const notConfigured = error.message.includes('não configurada')
      return sendJson(response, notConfigured ? 503 : 400, { ok: false, message: error.message })
    }
  }
  if (request.method === 'POST' && pathname === '/api/whatsapp/reaction') {
    try {
      const body = await readJsonBody(request)
      const requestData = buildReactionRequest(config, body)
      const data = await evolutionRequest(config, requestData.path, { method: 'POST', headers: requestData.headers, body: JSON.stringify(requestData.body) })
      return sendJson(response, 200, { ok: true, data })
    } catch (error) { return sendJson(response, 400, { ok: false, message: error.message }) }
  }
  if (request.method === 'POST' && pathname === '/api/whatsapp/delete-message') {
    try {
      const body = await readJsonBody(request)
      const requestData = buildDeleteMessageRequest(config, body)
      const data = await evolutionRequest(config, requestData.path, { method: 'POST', headers: requestData.headers, body: JSON.stringify(requestData.body) })
      messagePageCache.clear()
      chatsCache.clear()
      return sendJson(response, 200, { ok: true, data })
    } catch (error) { return sendJson(response, 400, { ok: false, message: error.message }) }
  }
  if (request.method === 'POST' && pathname === '/api/whatsapp/webhook-config') {
    try {
      const body = await readJsonBody(request)
      const requestData = buildWebhookSetupRequest(config, body.url || process.env.EVOLUTION_WEBHOOK_URL, body.secret || process.env.EVOLUTION_WEBHOOK_SECRET)
      const data = await evolutionRequest(config, requestData.path, { method: 'POST', headers: requestData.headers, body: JSON.stringify(requestData.body) })
      return sendJson(response, 200, { ok: true, data })
    } catch (error) {
      const notConfigured = error.message.includes('não configurada')
      return sendJson(response, notConfigured ? 503 : 400, { ok: false, message: error.message })
    }
  }
  return false
}

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
    if (pathname.startsWith('/api/whatsapp/')) {
      const handled = await handleWhatsApp(request, response, pathname)
      if (handled === false) sendJson(response, 404, { message: 'WhatsApp endpoint não encontrado.' })
      return
    }
    const isPortalRoute = pathname.startsWith('/portal/') && pathname.split('/').filter(Boolean).length === 2
    const relative = pathname === '/' || isPortalRoute ? 'index.html' : pathname.replace(/^[/\\]+/, '')
    const filePath = normalize(join(root, relative))
    if (!filePath.startsWith(normalize(root))) throw new Error('forbidden')
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) throw new Error('not found')
    response.writeHead(200, { 'Content-Type': types[extname(filePath)] ?? 'application/octet-stream', 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' })
    response.end(await readFile(filePath))
  } catch { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('not found') }
}).listen(Number(process.env.PORT || 4174), () => { console.log(`Atelier OS local server: http://127.0.0.1:${Number(process.env.PORT || 4174)}/`); startPostSaleAutomation() })
