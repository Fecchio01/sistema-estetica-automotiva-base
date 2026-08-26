import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const text = (value: unknown) => String(value ?? '').trim()
const normalizeJid = (value: unknown) => text(value).replace(/@(?:s\.whatsapp\.net|g\.us|lid)$/i, '').replace(/\D/g, '')
const readHeader = (req: Request, name: string) => req.headers.get(name) ?? ''
const autoReplyTarget = () => text(Deno.env.get('EVOLUTION_AUTO_REPLY_PHONE')).replace(/\D/g, '')
const autoReplyEnabled = () => text(Deno.env.get('EVOLUTION_AUTO_REPLY_ENABLED')).toLowerCase() === 'true'

function buildAutomaticReply(message: string, introduced: boolean) {
  const body = text(message)
  if (!body) return { shouldReply: false, reason: 'empty' }
  if (/\b(dinheiro|pix|pagamento|contrato|senha|código|codigo|documento|endereço|endereco|encontro|briga|processo|emergência|emergencia)\b/i.test(body)) {
    return { shouldReply: false, reason: 'manual_review' }
  }
  if (!introduced) return { shouldReply: true, text: 'Olá, Luna. Sou o assistente do Sr. Fecchio. O que você gostaria de conversar?' }
  if (/\b(oi|olá|ola|bom dia|boa tarde|boa noite|tudo bem|bem)\b/i.test(body)) {
    return { shouldReply: true, text: 'Estou bem também. Como foi seu dia?' }
  }
  return { shouldReply: true, text: 'Entendi. Me conta mais sobre isso.' }
}

async function sendAutomaticReply(number: string, message: string, instance: string) {
  const baseUrl = text(Deno.env.get('EVOLUTION_API_URL')).replace(/\/$/, '')
  const apiKey = text(Deno.env.get('EVOLUTION_API_KEY'))
  if (!baseUrl || !apiKey) throw new Error('Evolution API não configurada para respostas automáticas.')
  const response = await fetch(`${baseUrl}/message/sendText/${encodeURIComponent(instance)}`, {
    method: 'POST',
    headers: { apikey: apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({ number, text: message })
  })
  if (!response.ok) throw new Error(`Evolution API respondeu ${response.status}.`)
}

function normalizeMessage(payload: Record<string, any>, instance: string) {
  if (text(payload.instance ?? payload.instanceName) !== instance) throw new Error('Instância não autorizada.')
  const data = payload.data ?? {}
  const key = data.key ?? data.message?.key ?? {}
  const remoteId = text(key.id ?? data.id)
  const remoteJid = normalizeJid(key.remoteJid ?? data.remoteJid)
  if (!remoteId || !remoteJid) throw new Error('Mensagem sem identificador remoto.')
  const message = data.message ?? {}
  const source = message.imageMessage ? { type: 'image', data: message.imageMessage } : message.videoMessage ? { type: 'video', data: message.videoMessage } : message.audioMessage ? { type: 'audio', data: message.audioMessage } : message.documentMessage ? { type: 'document', data: message.documentMessage } : message.stickerMessage ? { type: 'sticker', data: message.stickerMessage } : { type: 'text', data: null }
  const body = text(message.conversation ?? message.extendedTextMessage?.text ?? source.data?.caption)
  const timestamp = Number(data.messageTimestamp ?? data.timestamp ?? Date.now() / 1000)
  const sentAt = new Date(timestamp > 100000000000 ? timestamp : timestamp * 1000).toISOString()
  const fromMe = Boolean(key.fromMe ?? data.fromMe)
  const rawStatus = text(data.status).toUpperCase()
  const status = !fromMe ? 'received' : rawStatus.includes('READ') || rawStatus.includes('PLAYED') ? 'read' : rawStatus.includes('DELIVER') ? 'delivered' : rawStatus.includes('ERROR') || rawStatus.includes('FAIL') ? 'failed' : 'sent'
  return {
    remoteId,
    remoteJid,
    direction: fromMe ? 'outgoing' : 'incoming',
    messageType: source.type,
    body,
    status,
    sentAt,
    mediaMimeType: source.data?.mimetype ?? null,
    mediaSize: Number(source.data?.fileLength ?? 0) || null,
    mediaBase64: text(data.message?.base64 ?? data.base64) || null
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)
  const expectedSecret = Deno.env.get('EVOLUTION_WEBHOOK_SECRET') ?? ''
  const expectedInstance = Deno.env.get('EVOLUTION_INSTANCE') ?? ''
  const companyId = Deno.env.get('EVOLUTION_COMPANY_ID') ?? ''
  if (!expectedSecret || !expectedInstance || !companyId) return json({ error: 'Webhook não configurado.' }, 500)
  if (readHeader(req, 'x-evolution-webhook-secret') !== expectedSecret) return json({ error: 'Webhook não autenticado.' }, 401)

  const payload = await req.json().catch(() => null)
  if (!payload || text(payload.instance ?? payload.instanceName) !== expectedInstance) return json({ error: 'Instância não autorizada.' }, 403)
  const event = text(payload.event ?? payload.Event).toUpperCase()
  if (!event.includes('MESSAGE') && !event.includes('CONNECTION')) return json({ ok: true, ignored: true })

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY')
  if (!serviceKey) return json({ error: 'Função não configurada.' }, 500)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)

  if (event.includes('CONNECTION')) {
    return json({ ok: true, connection: payload.data?.state ?? payload.data?.status ?? 'unknown' })
  }

  let normalized: ReturnType<typeof normalizeMessage>
  try { normalized = normalizeMessage(payload, expectedInstance) } catch (error) { return json({ error: error instanceof Error ? error.message : 'Evento inválido.' }, 400) }
  const { data: duplicate } = await admin.from('whatsapp_messages').select('id').eq('company_id', companyId).eq('remote_message_id', normalized.remoteId).maybeSingle()
  if (duplicate) return json({ ok: true, duplicate: true })
  const { data: conversation } = await admin.from('whatsapp_conversations').select('id, unread_count').eq('company_id', companyId).eq('remote_jid', normalized.remoteJid).maybeSingle()
  const conversationPayload = {
    company_id: companyId,
    remote_jid: normalized.remoteJid,
    last_message_preview: normalized.body || `[${normalized.messageType}]`,
    last_message_type: normalized.messageType,
    last_message_at: normalized.sentAt,
    updated_at: new Date().toISOString(),
    unread_count: (conversation?.unread_count ?? 0) + (normalized.direction === 'incoming' ? 1 : 0)
  }
  const conversationResult = conversation
    ? await admin.from('whatsapp_conversations').update(conversationPayload).eq('id', conversation.id).eq('company_id', companyId).select('id').single()
    : await admin.from('whatsapp_conversations').insert(conversationPayload).select('id').single()
  if (conversationResult.error || !conversationResult.data) return json({ error: 'Não foi possível salvar a conversa.' }, 500)
  const conversationId = conversationResult.data.id
  let mediaPath: string | null = null
  if (normalized.mediaBase64 && normalized.mediaMimeType) {
    const base64 = normalized.mediaBase64.replace(/^data:[^;]+;base64,/, '')
    const binary = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0))
    mediaPath = `${companyId}/${normalized.remoteId}`
    const upload = await admin.storage.from('whatsapp-media').upload(mediaPath, binary, { contentType: normalized.mediaMimeType, upsert: true })
    if (upload.error) mediaPath = null
  }
  const { data: insertedMessage, error: messageError } = await admin.from('whatsapp_messages').insert({
    company_id: companyId,
    conversation_id: conversationId,
    remote_message_id: normalized.remoteId,
    remote_jid: normalized.remoteJid,
    direction: normalized.direction,
    message_type: normalized.messageType,
    body: normalized.body,
    status: normalized.status,
    sent_at: normalized.sentAt,
    media_mime_type: normalized.mediaMimeType,
    media_size: normalized.mediaSize,
    media_path: mediaPath
  }).select('id').single()
  if (messageError || !insertedMessage) return json({ error: 'Não foi possível salvar a mensagem.' }, 500)
  if (mediaPath) await admin.from('whatsapp_media').insert({ company_id: companyId, message_id: insertedMessage.id, storage_path: mediaPath, mime_type: normalized.mediaMimeType, file_size: normalized.mediaSize })

  if (autoReplyEnabled() && normalized.direction === 'incoming' && normalized.remoteJid === autoReplyTarget() && normalized.body) {
    const { data: previousOutgoing } = await admin.from('whatsapp_messages').select('id').eq('conversation_id', conversationId).eq('direction', 'outgoing').limit(1).maybeSingle()
    const reply = buildAutomaticReply(normalized.body, Boolean(previousOutgoing))
    if (reply.shouldReply) {
      try {
        await sendAutomaticReply(normalized.remoteJid, reply.text, expectedInstance)
      } catch (error) {
        console.error('Falha ao enviar resposta automática:', error)
      }
    }
  }
  return json({ ok: true, conversationId })
})
