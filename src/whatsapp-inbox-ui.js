const state = { profile: null, conversations: [], messages: [], messageCache: new Map(), selectedId: null, selectionVersion: 0, channel: null, loading: false, messageLoading: false, localMode: false, connectionOnly: false, refreshTimer: null, connectionTimer: null, actionBusy: false, polling: false, readAt: new Map(), quotedMessage: null, hiddenMessageIds: new Set() }

export function canUseWhatsAppInbox(profile) {
  return Boolean(profile?.active && ['administrator', 'reception'].includes(profile.role))
}

export function escapeWhatsAppHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]))
}

export function formatWhatsAppMessage(message) {
  const date = new Date(message?.sent_at ?? message?.last_message_at ?? Date.now())
  if (Number.isNaN(date.getTime())) return ''
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date)
  const today = new Date()
  const isToday = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
  return isToday ? time : `${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date)} ${time}`
}

export function sortConversations(conversations) {
  return [...(conversations ?? [])].sort((a, b) => new Date(b.last_message_at ?? 0) - new Date(a.last_message_at ?? 0))
}

export function messageTypeLabel(type) {
  return ({ image: 'Imagem', video: 'Vídeo', audio: 'Áudio', document: 'Documento', sticker: 'Figurinha', reaction: 'Reação', conversation: '' })[String(type ?? '').toLowerCase()] ?? ''
}

export function messageStatusLabel(message) {
  if (message.direction !== 'outgoing') return ''
  return ({ read: '✓✓', delivered: '✓✓', sent: '✓', failed: '!' })[message.status] ?? '✓'
}

export function messageStatusClass(message) {
  if (message.direction !== 'outgoing') return ''
  if (message.status === 'read') return 'is-read'
  if (message.status === 'delivered') return 'is-delivered'
  if (message.status === 'failed') return 'is-failed'
  return 'is-sent'
}

export function connectionPresentation(data = {}) {
  const connected = ['open', 'connected'].includes(String(data.state ?? '').toLowerCase())
  if (connected) return { connected: true, message: 'Conectado · sessão preservada no servidor local.' }
  if (data.state === 'not_configured') return { connected: false, message: 'Evolution API ainda não configurada.' }
  if (data.state === 'error' || data.message) return { connected: false, message: 'Sem conexão com a Evolution API. Gere um novo QR Code quando o serviço estiver disponível.' }
  const deviceRemoved = String(data.disconnectReason || '').includes('device_removed')
  return { connected: false, message: deviceRemoved ? 'O WhatsApp removeu este dispositivo. Gere um novo QR Code para reconectar.' : `Conexão: ${data.state || 'indisponível'}. Gere um novo QR Code para reconectar.` }
}

function readStateKey() {
  return state.profile?.company_id ? `atelier-whatsapp-read-${state.profile.company_id}` : ''
}

function hiddenMessageStateKey() {
  return state.profile?.company_id ? `atelier-whatsapp-hidden-${state.profile.company_id}` : ''
}

function loadHiddenMessageState() {
  state.hiddenMessageIds = new Set()
  try {
    const raw = hiddenMessageStateKey() ? JSON.parse(localStorage.getItem(hiddenMessageStateKey()) || '[]') : []
    state.hiddenMessageIds = new Set(Array.isArray(raw) ? raw.map(String) : [])
  } catch { state.hiddenMessageIds = new Set() }
}

function hideMessageForMe(messageId) {
  const id = String(messageId || '').trim()
  if (!id) return
  state.hiddenMessageIds.add(id)
  try { localStorage.setItem(hiddenMessageStateKey(), JSON.stringify([...state.hiddenMessageIds])) } catch {}
  state.messages = state.messages.filter((message) => String(message.id) !== id)
}

function loadReadState() {
  state.readAt = new Map()
  try {
    const raw = readStateKey() ? JSON.parse(localStorage.getItem(readStateKey()) || '{}') : {}
    for (const [id, timestamp] of Object.entries(raw)) if (timestamp) state.readAt.set(id, timestamp)
  } catch { state.readAt = new Map() }
}

function rememberConversationRead(conversation) {
  if (!conversation?.id) return
  const timestamp = conversation.last_message_at || new Date().toISOString()
  state.readAt.set(conversation.id, timestamp)
  try { localStorage.setItem(readStateKey(), JSON.stringify(Object.fromEntries(state.readAt))) } catch {}
  conversation.unread_count = 0
}

function applyReadState(conversations) {
  return conversations.map((conversation) => {
    const readAt = state.readAt.get(conversation.id)
    return readAt && new Date(conversation.last_message_at || 0) <= new Date(readAt) ? { ...conversation, unread_count: 0 } : conversation
  })
}

export function conversationDisplayName(conversation = {}) {
  return String(conversation.contact_name || conversation.phone || conversation.remote_jid || 'Contato').trim() || 'Contato'
}

function safeAvatarUrl(value) {
  const url = String(value ?? '')
  return /^https:\/\//i.test(url) ? url : ''
}

function messageSignature(messages = []) {
  return messages.map((message) => [message.id, message.sent_at, message.edited, message.message_type, message.body, message.media_url, JSON.stringify(message.reactions ?? [])].join(':')).join('|')
}

function syncMessageStatuses(container) {
  for (const message of state.messages) {
    const status = container.querySelector(`[data-whatsapp-status="${CSS.escape(message.id)}"]`)
    if (!status) continue
    status.textContent = messageStatusLabel(message)
    status.className = `whatsapp-message-status ${messageStatusClass(message)}`
  }
}

export function messageScrollMode({ scrollHeight = 0, scrollTop = 0, clientHeight = 0, threshold = 48 } = {}) {
  return scrollHeight - scrollTop - clientHeight < threshold ? 'bottom' : 'preserve'
}

function conversationSignature(conversations = []) {
  return conversations.map((conversation) => [conversation.id, conversation.last_message_at, conversation.unread_count, conversation.contact_name, conversation.profile_pic_url, conversation.last_message_preview].join(':')).join('|')
}

function safeMediaUrl(value) {
  const url = String(value ?? '')
  return /^(https?:\/\/|\/api\/whatsapp\/media\?|data:(?:image|audio|video|application\/[a-z0-9.+-]+)(?:;|,))/i.test(url) ? url : ''
}

function applyConversationSearch(container, query = '') {
  const normalized = String(query).trim().toLocaleLowerCase('pt-BR')
  container.querySelectorAll('.whatsapp-conversation').forEach((item) => item.classList.toggle('filtered-out', Boolean(normalized) && !item.textContent.toLocaleLowerCase('pt-BR').includes(normalized)))
}

export function mediaMarkup(message) {
  const mediaUrl = safeMediaUrl(message?.media_proxy_url) || safeMediaUrl(message?.media_url)
  if (!mediaUrl) return messageTypeLabel(message?.message_type) ? `<span class="whatsapp-media-placeholder">${escapeWhatsAppHtml(messageTypeLabel(message?.message_type))}</span>` : ''
  const escapedUrl = escapeWhatsAppHtml(mediaUrl)
  const type = String(message?.message_type ?? '').toLowerCase()
  if (type === 'image' || type === 'sticker') return `<img class="whatsapp-message-media ${type === 'sticker' ? 'whatsapp-sticker-media' : ''}" data-whatsapp-image="${escapeWhatsAppHtml(message.id)}" src="${escapedUrl}" alt="${type === 'sticker' ? 'Figurinha recebida pelo WhatsApp' : 'Imagem recebida pelo WhatsApp'}" loading="eager" />`
  if (type === 'video') return `<video class="whatsapp-message-video" src="${escapedUrl}" controls preload="metadata"></video>`
  if (type === 'audio') return `<div class="whatsapp-audio-card"><span class="whatsapp-audio-icon" aria-hidden="true">♫</span><div class="whatsapp-audio-content"><span>Áudio</span><audio class="whatsapp-message-audio" src="${escapedUrl}" controls preload="metadata" aria-label="Áudio recebido pelo WhatsApp"></audio></div></div>`
  if (type === 'document') return `<a class="whatsapp-message-document" href="${escapedUrl}" target="_blank" rel="noreferrer" download><span class="whatsapp-document-icon" aria-hidden="true">▣</span><span><b>Documento recebido</b><small>Abrir ou baixar arquivo</small></span></a>`
  return ''
}

function conversationMarkup(conversation) {
  const name = conversationDisplayName(conversation)
  const preview = conversation.last_message_preview || 'Nenhuma mensagem ainda.'
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  const avatarUrl = safeAvatarUrl(conversation.profile_pic_url)
  const avatar = avatarUrl ? `<img src="${escapeWhatsAppHtml(avatarUrl)}" alt="" loading="lazy" />` : escapeWhatsAppHtml(initials)
  return `<button class="whatsapp-conversation ${state.selectedId === conversation.id ? 'active' : ''}" data-whatsapp-conversation="${escapeWhatsAppHtml(conversation.id)}"><span class="whatsapp-avatar">${avatar}</span><span class="whatsapp-conversation-copy"><b>${escapeWhatsAppHtml(name)}</b><small>${escapeWhatsAppHtml(conversation.phone || conversation.remote_jid || '')} · ${escapeWhatsAppHtml(preview)}</small></span>${conversation.unread_count ? `<span class="whatsapp-unread">${conversation.unread_count}</span>` : ''}</button>`
}

function captureScrollAnchor(list, selector, getId) {
  if (!list) return null
  const top = list.getBoundingClientRect().top
  const item = [...list.querySelectorAll(selector)].find((candidate) => candidate.getBoundingClientRect().bottom > top)
  return item ? { id: getId(item), offset: item.getBoundingClientRect().top - top } : null
}

function restoreScrollAnchor(list, selector, anchor, getId) {
  if (!list || !anchor) return
  const item = [...list.querySelectorAll(selector)].find((candidate) => getId(candidate) === anchor.id)
  if (!item) return
  const top = list.getBoundingClientRect().top
  list.scrollTop += item.getBoundingClientRect().top - top - anchor.offset
}

function reactionMarkup(message) {
  if (!Array.isArray(message.reactions) || !message.reactions.length) return ''
  return `<div class="whatsapp-message-reactions">${message.reactions.map((reaction) => `<span title="Reação">${escapeWhatsAppHtml(reaction.emoji)}</span>`).join('')}</div>`
}

export function messageMarkup(message) {
  const id = escapeWhatsAppHtml(message.id)
  const picker = ['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => `<button type="button" data-whatsapp-reaction="${id}" data-reaction="${emoji}" aria-label="Reagir com ${emoji}">${emoji}</button>`).join('')
  return `<article class="whatsapp-message ${message.direction === 'outgoing' ? 'outgoing' : 'incoming'}" data-message-id="${id}"><div class="whatsapp-message-bubble">${mediaMarkup(message)}${message.body ? `<p>${escapeWhatsAppHtml(message.body)}</p>` : ''}${reactionMarkup(message)}<small>${message.edited ? '<span class="whatsapp-edited-label">editada</span> · ' : ''}${formatWhatsAppMessage(message)} <b data-whatsapp-status="${id}" class="whatsapp-message-status ${messageStatusClass(message)}">${messageStatusLabel(message)}</b></small><div class="whatsapp-message-actions"><button type="button" data-whatsapp-reply="${id}" title="Responder">↩</button><button type="button" data-whatsapp-reaction-toggle="${id}" title="Reagir">☺</button><button type="button" data-whatsapp-delete-toggle="${id}" title="Apagar mensagem">⌫</button><div class="whatsapp-reaction-picker" data-whatsapp-reaction-picker="${id}">${picker}</div><div class="whatsapp-delete-picker" data-whatsapp-delete-picker="${id}"><button type="button" data-whatsapp-delete-me="${id}">Apagar para mim</button><button type="button" data-whatsapp-delete-everyone="${id}">Apagar para todos</button></div></div></div></article>`
}

function inboxMarkup() {
  const selected = state.conversations.find((item) => item.id === state.selectedId)
  const title = conversationDisplayName(selected || {})
  const messages = state.messages.filter((message) => !state.hiddenMessageIds.has(String(message.id))).map(messageMarkup).join('') || `<div class="whatsapp-empty">${state.messageLoading ? 'Sincronizando mensagens da Evolution...' : 'Nenhuma mensagem nesta conversa.'}</div>`
  const quote = state.quotedMessage
  return `<div class="whatsapp-inbox"><aside class="whatsapp-inbox-list"><div class="whatsapp-inbox-list-heading"><div><p class="eyebrow">ATENDIMENTO MANUAL</p><h2>Conversas</h2><small class="whatsapp-live-note">Sincronização automática</small></div><span class="status-pill ${state.loading ? 'waiting' : 'ready'}">${state.loading ? 'Atualizando' : state.localMode ? 'Evolution local' : 'Ao vivo'}</span></div><input class="whatsapp-search" id="whatsapp-search" placeholder="Buscar nome ou número" aria-label="Buscar conversa" /><div class="whatsapp-conversation-list">${state.conversations.map(conversationMarkup).join('') || '<div class="whatsapp-empty">Nenhuma conversa recebida ainda.</div>'}</div></aside><section class="whatsapp-chat"><header class="whatsapp-chat-header"><div><p class="eyebrow">WHATSAPP DA EMPRESA</p><h2>${escapeWhatsAppHtml(title)}</h2><small>${selected ? escapeWhatsAppHtml(selected.phone || selected.remote_jid || 'Número não disponível') : 'Escolha uma conversa para começar'}</small></div><button class="outline-button" id="whatsapp-refresh-connection">Ver conexão</button></header><div class="whatsapp-message-list">${messages}</div>${selected ? `<form class="whatsapp-composer" id="whatsapp-composer">${quote ? `<div class="whatsapp-reply-preview"><span>Respondendo</span><b>${escapeWhatsAppHtml(quote.body || messageTypeLabel(quote.message_type) || 'Mensagem')}</b><button type="button" id="whatsapp-cancel-reply" aria-label="Cancelar resposta">×</button></div>` : ''}<label class="whatsapp-attachment" title="Anexar imagem">＋<input type="file" id="whatsapp-attachment-input" accept="image/*,video/*,audio/*,application/pdf" hidden /></label><textarea name="text" rows="2" placeholder="Escreva uma resposta manual..." aria-label="Mensagem"></textarea><button class="primary-button" type="submit">Enviar</button><p class="auth-message" id="whatsapp-composer-status" role="status"></p></form>` : '<div class="whatsapp-empty whatsapp-chat-empty">As conversas recebidas aparecerão aqui.</div>'}</section></div><div class="whatsapp-connection-bar"><span class="status-dot" id="whatsapp-inbox-status-dot"></span><span id="whatsapp-inbox-status">Verificando conexão com a Evolution API...</span><button class="text-button" id="whatsapp-show-qr">Conectar por QR Code</button></div>`
}

function connectionOnlyMarkup() {
  return '<div class="module-panel whatsapp-connection-only"><p class="eyebrow">WHATSAPP DA EMPRESA</p><h2>Conexão por QR Code</h2><p class="muted">O WhatsApp está desconectado. Nesta demonstração, as conversas ficam ocultas; use o botão abaixo apenas para mostrar como uma empresa conectaria a própria conta.</p><div class="whatsapp-connection-bar"><span class="status-dot" id="whatsapp-inbox-status-dot"></span><span id="whatsapp-inbox-status">WhatsApp desconectado</span><button class="primary-button" id="whatsapp-show-qr">Mostrar QR Code</button></div></div>'
}

async function getSupabase() {
  return (await import('./supabase-client.js')).supabase
}

async function loadLocalMessages(conversation, markRead = false) {
  if (!conversation) { state.messages = []; return }
  state.messageLoading = true
  try {
    const response = await fetch('/api/whatsapp/chat-messages', { method: 'POST', cache: 'no-store', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ remoteJid: conversation.remote_jid, remoteJids: conversation.remote_jids }) })
    if (!response.ok) throw new Error('Não foi possível sincronizar esta conversa agora.')
    const localData = await response.json()
    const messages = Array.isArray(localData.messages) ? localData.messages : []
    state.messageCache.set(conversation.id, [...messages])
    if (state.selectedId === conversation.id) state.messages = messages
    if (markRead && messages.some((message) => message.direction === 'incoming')) {
      await fetch('/api/whatsapp/mark-read', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: messages.filter((message) => message.direction === 'incoming') }) }).catch(() => {})
    }
    return messages
  } finally { state.messageLoading = false }
}

async function loadState({ loadMessages = true } = {}) {
  if (!state.profile?.company_id) return
  state.loading = true
  const supabase = await getSupabase()
  let localData = null
  try {
    const response = await fetch('/api/whatsapp/chats', { cache: 'no-store' })
    localData = response.ok ? await response.json() : null
  } catch {}
  if (Array.isArray(localData?.chats)) {
    state.conversations = applyReadState(sortConversations(localData.chats))
    state.localMode = true
  } else {
    const { data } = await supabase.from('whatsapp_conversations').select('*').eq('company_id', state.profile.company_id).order('last_message_at', { ascending: false })
    state.conversations = applyReadState(sortConversations(data ?? []))
    state.localMode = false
  }
  if (state.selectedId && !state.conversations.some((item) => item.id === state.selectedId)) state.selectedId = null
  if (!state.selectedId && state.conversations[0]) state.selectedId = state.conversations[0].id
  if (!loadMessages) {
    state.messages = state.messageCache.get(state.selectedId) ? [...state.messageCache.get(state.selectedId)] : []
  } else if (state.selectedId && state.localMode) {
    const conversation = state.conversations.find((item) => item.id === state.selectedId)
    const hadUnread = Boolean(conversation?.unread_count)
    await loadLocalMessages(conversation, true)
    if (conversation && hadUnread) rememberConversationRead(conversation)
  } else if (state.selectedId) {
    const result = await supabase.from('whatsapp_messages').select('*').eq('company_id', state.profile.company_id).eq('conversation_id', state.selectedId).order('sent_at', { ascending: true })
    state.messages = result.data ?? []
    for (const message of state.messages) {
      if (!message.media_path) continue
      const signed = await supabase.storage.from('whatsapp-media').createSignedUrl(message.media_path, 3600)
      message.media_url = signed.data?.signedUrl ?? ''
    }
  } else state.messages = []
  state.loading = false
}

async function refreshConnection(container) {
  const status = container.querySelector('#whatsapp-inbox-status')
  const dot = container.querySelector('#whatsapp-inbox-status-dot')
  const qrButton = container.querySelector('#whatsapp-show-qr')
  try {
    const response = await fetch('/api/whatsapp/connection')
    const data = await response.json()
    const presentation = connectionPresentation(data)
    if (dot) dot.className = `status-dot ${presentation.connected ? 'green' : ''}`
    status.textContent = presentation.message
    if (qrButton) { qrButton.disabled = presentation.connected; qrButton.textContent = presentation.connected ? 'WhatsApp conectado' : 'Gerar novo QR Code' }
  } catch { if (dot) dot.className = 'status-dot'; status.textContent = 'Sem conexão com a Evolution API. Gere um novo QR Code quando o serviço estiver disponível.'; if (qrButton) { qrButton.disabled = false; qrButton.textContent = 'Gerar novo QR Code' } }
}

async function showQr(container) {
  const status = container.querySelector('#whatsapp-inbox-status')
  try {
    const response = await fetch('/api/whatsapp/qr', { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok || data.state === 'error') throw new Error('A Evolution API está indisponível. Inicie o serviço e tente gerar o QR Code novamente.')
    const base64 = data.data?.base64 ?? data.data?.qrcode?.base64 ?? data.data?.code
    if (!base64) throw new Error(data.message || (data.state === 'open' ? 'O WhatsApp já está conectado nesta instância.' : 'QR Code indisponível.'))
    let box = container.querySelector('.whatsapp-qr-box')
    if (!box) { box = document.createElement('div'); box.className = 'whatsapp-qr-box'; container.appendChild(box) }
    box.innerHTML = `<button class="whatsapp-qr-close" type="button" aria-label="Fechar QR Code">×</button><p>Escaneie no WhatsApp em Aparelhos conectados.</p><img src="${escapeWhatsAppHtml(base64)}" alt="QR Code para conectar o WhatsApp" />`
  } catch (error) { status.textContent = error.message || 'Não foi possível gerar o QR Code. Verifique a Evolution API e tente novamente.'; container.querySelector('#whatsapp-show-qr')?.removeAttribute('disabled') }
}

function closeQr(container) {
  container.querySelector('.whatsapp-qr-box')?.remove()
}

async function sendMessage(container, event) {
  event.preventDefault()
  if (state.actionBusy) return
  const form = event.currentTarget
  const message = container.querySelector('#whatsapp-composer-status')
  const submit = form.querySelector('button[type="submit"]')
  const text = form.elements.text.value.trim()
  const file = container.querySelector('#whatsapp-attachment-input').files[0]
  const conversation = state.conversations.find((item) => item.id === state.selectedId)
  if (!conversation || (!text && !file)) { message.textContent = 'Escreva uma mensagem ou anexe uma imagem.'; return }
  state.actionBusy = true
  if (submit) submit.disabled = true
  message.textContent = 'Enviando...'
  try {
    let media = null
    if (file) {
      if (file.size > 10 * 1024 * 1024) throw new Error('A mídia deve ter no máximo 10 MB.')
      media = { url: await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file) }), type: file.type.split('/')[0], mimeType: file.type, size: file.size }
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)
    let response
    try {
      response = await fetch('/api/whatsapp/messages', { method: 'POST', signal: controller.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ number: conversation.phone || conversation.remote_jid, text, media, quoted: state.quotedMessage ? { messageId: state.quotedMessage.remote_message_id, participant: state.quotedMessage.remote_jid } : null }) })
    } catch (error) {
      if (controller.signal.aborted) throw new Error('O envio demorou mais que o esperado. Verifique a conexão da Evolution API.')
      throw error
    } finally { clearTimeout(timeout) }
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Não foi possível enviar a mensagem.')
    form.reset(); state.quotedMessage = null; message.textContent = 'Mensagem enviada.'; await loadLocalMessages(conversation, false); await renderInbox(container)
  } catch (error) { message.textContent = `Falha no envio: ${error.message}`
  } finally { state.actionBusy = false; if (submit) submit.disabled = false }
}

function bindConversationButtons(container) {
  container.querySelectorAll('[data-whatsapp-conversation]').forEach((button) => button.addEventListener('click', async () => {
    if (state.actionBusy) return
      state.actionBusy = true
      const conversationList = container.querySelector('.whatsapp-conversation-list')
    const conversationAnchor = captureScrollAnchor(conversationList, '[data-whatsapp-conversation]', (item) => item.dataset.whatsappConversation)
      const selected = state.conversations.find((item) => item.id === button.dataset.whatsappConversation)
      const hadUnread = Boolean(selected?.unread_count)
      state.selectedId = button.dataset.whatsappConversation
      const selectionVersion = ++state.selectionVersion
      if (selected) rememberConversationRead(selected)
      container.querySelector(`[data-whatsapp-conversation="${CSS.escape(state.selectedId)}"] .whatsapp-unread`)?.remove()
      try {
      if (!state.localMode) {
        await loadState({ loadMessages: true })
        await renderInbox(container)
        const refreshedConversationList = container.querySelector('.whatsapp-conversation-list')
        restoreScrollAnchor(refreshedConversationList, '[data-whatsapp-conversation]', conversationAnchor, (item) => item.dataset.whatsappConversation)
        return
      }
      const cachedMessages = state.messageCache.get(state.selectedId)
      state.messages = cachedMessages ? [...cachedMessages] : []
      await renderInbox(container)
      const refreshedConversationList = container.querySelector('.whatsapp-conversation-list')
      restoreScrollAnchor(refreshedConversationList, '[data-whatsapp-conversation]', conversationAnchor, (item) => item.dataset.whatsappConversation)
      state.actionBusy = false
      void loadLocalMessages(selected, true).then(async () => {
        if (state.selectedId !== selected?.id || state.selectionVersion !== selectionVersion) return
        const refreshedList = container.querySelector('.whatsapp-message-list')
        const messageAnchor = captureScrollAnchor(refreshedList, '[data-message-id]', (item) => item.dataset.messageId)
        const scrollMode = !refreshedList ? 'bottom' : messageScrollMode({ scrollHeight: refreshedList.scrollHeight, scrollTop: refreshedList.scrollTop, clientHeight: refreshedList.clientHeight })
        await renderInbox(container)
        const latestConversationList = container.querySelector('.whatsapp-conversation-list')
        restoreScrollAnchor(latestConversationList, '[data-whatsapp-conversation]', conversationAnchor, (item) => item.dataset.whatsappConversation)
        const latestMessageList = container.querySelector('.whatsapp-message-list')
        if (latestMessageList && scrollMode === 'bottom') latestMessageList.scrollTop = latestMessageList.scrollHeight
        else restoreScrollAnchor(latestMessageList, '[data-message-id]', messageAnchor, (item) => item.dataset.messageId)
      }).catch(() => {})
      return
    } finally { state.actionBusy = false }
  }))
}

function restoreMessagePosition(container, messageAnchor, scrollMode) {
  const messageList = container.querySelector('.whatsapp-message-list')
  if (messageList && scrollMode === 'bottom') messageList.scrollTop = messageList.scrollHeight
  else restoreScrollAnchor(messageList, '[data-message-id]', messageAnchor, (item) => item.dataset.messageId)
}

function bindMessageActions(container) {
  container.querySelectorAll('[data-whatsapp-reply]').forEach((button) => button.addEventListener('click', async () => {
    state.quotedMessage = state.messages.find((message) => message.id === button.dataset.whatsappReply) || null
    await renderInbox(container)
    container.querySelector('#whatsapp-composer textarea')?.focus()
  }))
  container.querySelectorAll('[data-whatsapp-reaction-toggle]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation()
    const picker = container.querySelector(`[data-whatsapp-reaction-picker="${CSS.escape(button.dataset.whatsappReactionToggle)}"]`)
    picker?.classList.toggle('is-open')
  }))
  container.querySelectorAll('[data-whatsapp-reaction]').forEach((button) => button.addEventListener('click', async (event) => {
    event.stopPropagation()
    const target = state.messages.find((message) => message.id === button.dataset.whatsappReaction)
    if (!target) return
    const status = container.querySelector('#whatsapp-composer-status')
    const messageListBefore = container.querySelector('.whatsapp-message-list')
    const messageAnchor = captureScrollAnchor(messageListBefore, '[data-message-id]', (item) => item.dataset.messageId)
    const scrollMode = messageListBefore ? messageScrollMode({ scrollHeight: messageListBefore.scrollHeight, scrollTop: messageListBefore.scrollTop, clientHeight: messageListBefore.clientHeight }) : 'bottom'
    status.textContent = 'Enviando reação...'
    try {
      const response = await fetch('/api/whatsapp/reaction', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ remoteJid: target.remote_jid, id: target.remote_message_id, fromMe: target.direction === 'outgoing', reaction: button.dataset.reaction }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Não foi possível reagir.')
      status.textContent = 'Reação enviada.'
      const conversation = state.conversations.find((item) => item.id === state.selectedId)
      if (conversation) await loadLocalMessages(conversation, false)
      await renderInbox(container)
      restoreMessagePosition(container, messageAnchor, scrollMode)
    } catch (error) { status.textContent = `Falha na reação: ${error.message}` }
  }))
  container.querySelectorAll('[data-whatsapp-delete-toggle]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation()
    const picker = container.querySelector(`[data-whatsapp-delete-picker="${CSS.escape(button.dataset.whatsappDeleteToggle)}"]`)
    picker?.classList.toggle('is-open')
  }))
  container.querySelectorAll('[data-whatsapp-delete-me]').forEach((button) => button.addEventListener('click', async (event) => {
    event.stopPropagation()
    const target = state.messages.find((message) => message.id === button.dataset.whatsappDeleteMe)
    if (!target || !(await globalThis.__requestConfirmation?.('unknown'))) return
    hideMessageForMe(target.id)
    await renderInbox(container)
  }))
  container.querySelectorAll('[data-whatsapp-delete-everyone]').forEach((button) => button.addEventListener('click', async (event) => {
    event.stopPropagation()
    const target = state.messages.find((message) => message.id === button.dataset.whatsappDeleteEveryone)
    if (!target || !(await globalThis.__requestConfirmation?.('unknown'))) return
    const messageListBefore = container.querySelector('.whatsapp-message-list')
    const messageAnchor = captureScrollAnchor(messageListBefore, '[data-message-id]', (item) => item.dataset.messageId)
    const scrollMode = messageListBefore ? messageScrollMode({ scrollHeight: messageListBefore.scrollHeight, scrollTop: messageListBefore.scrollTop, clientHeight: messageListBefore.clientHeight }) : 'bottom'
    const status = container.querySelector('#whatsapp-composer-status')
    status.textContent = 'Apagando para todos...'
    try {
      const response = await fetch('/api/whatsapp/delete-message', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat: target.remote_jid, messageId: target.remote_message_id }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Não foi possível apagar a mensagem para todos.')
      const conversation = state.conversations.find((item) => item.id === state.selectedId)
      if (conversation) await loadLocalMessages(conversation, false)
      status.textContent = 'Mensagem apagada para todos.'
      await renderInbox(container)
      restoreMessagePosition(container, messageAnchor, scrollMode)
    } catch (error) { status.textContent = `Falha ao apagar: ${error.message}` }
  }))
  container.querySelectorAll('[data-whatsapp-image]').forEach((image) => image.addEventListener('click', () => {
    let lightbox = container.querySelector('.whatsapp-image-lightbox')
    if (!lightbox) { lightbox = document.createElement('div'); lightbox.className = 'whatsapp-image-lightbox'; lightbox.innerHTML = '<button type="button" aria-label="Fechar foto">×</button><img alt="Imagem ampliada do WhatsApp" />'; container.appendChild(lightbox); lightbox.addEventListener('click', (event) => { if (event.target === lightbox || event.target.tagName === 'BUTTON') lightbox.remove() }) }
    lightbox.querySelector('img').src = image.currentSrc || image.src
  }))
}

function bindInbox(container) {
  bindConversationButtons(container)
  bindMessageActions(container)
  container.querySelector('#whatsapp-refresh-connection')?.addEventListener('click', () => refreshConnection(container))
  container.querySelector('#whatsapp-show-qr')?.addEventListener('click', () => showQr(container))
  if (container.dataset.whatsappInboxBound !== 'true') {
    container.addEventListener('click', (event) => { if (!event.target.closest('.whatsapp-qr-box') && !event.target.closest('#whatsapp-show-qr')) closeQr(container); if (event.target.closest('.whatsapp-qr-close')) closeQr(container) })
    container.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeQr(container) })
    container.dataset.whatsappInboxBound = 'true'
  }
  container.querySelector('#whatsapp-composer')?.addEventListener('submit', (event) => sendMessage(container, event))
  container.querySelector('#whatsapp-cancel-reply')?.addEventListener('click', async () => { state.quotedMessage = null; await renderInbox(container); container.querySelector('#whatsapp-composer textarea')?.focus() })
  const search = container.querySelector('#whatsapp-search')
  search?.addEventListener('input', (event) => applyConversationSearch(container, event.target.value))
  applyConversationSearch(container, search?.value || '')
  refreshConnection(container)
  if (state.connectionTimer) clearInterval(state.connectionTimer)
  state.connectionTimer = setInterval(() => refreshConnection(container), 5000)
}

async function refreshLocalInbox(container) {
  if (state.polling || state.actionBusy) return
  state.polling = true
  const messageList = container.querySelector('.whatsapp-message-list')
  const messageAnchor = captureScrollAnchor(messageList, '[data-message-id]', (item) => item.dataset.messageId)
  const conversationListBeforeRefresh = container.querySelector('.whatsapp-conversation-list')
  const conversationAnchor = captureScrollAnchor(conversationListBeforeRefresh, '[data-whatsapp-conversation]', (item) => item.dataset.whatsappConversation)
  const searchQuery = container.querySelector('#whatsapp-search')?.value || ''
  const scrollMode = messageList ? messageScrollMode({ scrollHeight: messageList.scrollHeight, scrollTop: messageList.scrollTop, clientHeight: messageList.clientHeight, threshold: 32 }) : 'bottom'
  const selectedIdAtStart = state.selectedId
  const selectionVersionAtStart = state.selectionVersion
  try {
    await loadState({ loadMessages: false })
    if (state.selectedId !== selectedIdAtStart || state.selectionVersion !== selectionVersionAtStart) return
    const selected = state.conversations.find((item) => item.id === state.selectedId)
    if (selected) await loadLocalMessages(selected, false)
    if (state.selectedId !== selectedIdAtStart || state.selectionVersion !== selectionVersionAtStart) return
    const refreshedList = container.querySelector('.whatsapp-message-list')
    const nextMessageSignature = messageSignature(state.messages)
    if (refreshedList && refreshedList.dataset.messageSignature !== nextMessageSignature) {
      refreshedList.innerHTML = state.messages.filter((message) => !state.hiddenMessageIds.has(String(message.id))).map(messageMarkup).join('') || '<div class="whatsapp-empty">Nenhuma mensagem nesta conversa.</div>'
      refreshedList.dataset.messageSignature = nextMessageSignature
      bindMessageActions(container)
      if (scrollMode === 'bottom') refreshedList.scrollTop = refreshedList.scrollHeight
      else restoreScrollAnchor(refreshedList, '[data-message-id]', messageAnchor, (item) => item.dataset.messageId)
    }
    syncMessageStatuses(container)
    const conversationList = container.querySelector('.whatsapp-conversation-list')
    const nextConversationSignature = conversationSignature(state.conversations)
    if (conversationList && conversationList.dataset.conversationSignature !== nextConversationSignature) {
      conversationList.innerHTML = state.conversations.map(conversationMarkup).join('') || '<div class="whatsapp-empty">Nenhuma conversa recebida ainda.</div>'
      conversationList.dataset.conversationSignature = nextConversationSignature
      restoreScrollAnchor(conversationList, '[data-whatsapp-conversation]', conversationAnchor, (item) => item.dataset.whatsappConversation)
      const search = container.querySelector('#whatsapp-search')
      if (search) { search.value = searchQuery; applyConversationSearch(container, searchQuery) }
      bindConversationButtons(container)
    }
  } finally { state.polling = false }
}

async function renderInbox(container, isCurrent = () => true) {
  if (!isCurrent()) return
  const searchQuery = container.querySelector('#whatsapp-search')?.value || ''
  if (!canUseWhatsAppInbox(state.profile)) { container.innerHTML = '<div class="module-panel"><p class="dashboard-empty">A central de conversas está disponível somente para administradora e recepção.</p></div>'; return }
  container.innerHTML = state.connectionOnly ? connectionOnlyMarkup() : inboxMarkup()
  bindInbox(container)
  const messageList = container.querySelector('.whatsapp-message-list')
  if (messageList) { messageList.dataset.messageSignature = messageSignature(state.messages); messageList.scrollTop = messageList.scrollHeight }
  const conversationList = container.querySelector('.whatsapp-conversation-list')
  if (conversationList) conversationList.dataset.conversationSignature = conversationSignature(state.conversations)
  const search = container.querySelector('#whatsapp-search')
  if (search) { search.value = searchQuery; applyConversationSearch(container, searchQuery) }
}

export async function renderWhatsAppInbox(container, isCurrent = () => true) {
  const nextProfile = globalThis.__sessionProfile
  if (state.profile?.company_id !== nextProfile?.company_id) state.messageCache.clear()
  state.profile = nextProfile
  try { const connectionResponse = await fetch('/api/whatsapp/connection', { cache: 'no-store' }); const connection = await connectionResponse.json(); state.connectionOnly = !['open', 'connected'].includes(String(connection.state || '').toLowerCase()) } catch { state.connectionOnly = true }
  loadReadState()
  loadHiddenMessageState()
  if (state.connectionOnly) { state.conversations = []; state.messages = []; state.selectedId = null; if (state.refreshTimer) clearInterval(state.refreshTimer); if (state.channel) { const supabase = await getSupabase(); await supabase.removeChannel(state.channel); state.channel = null }; await renderInbox(container, isCurrent); return }
  await loadState({ loadMessages: false })
  if (!isCurrent()) return
  const selected = state.conversations.find((item) => item.id === state.selectedId)
  if (state.localMode && selected) state.messageLoading = true
  await renderInbox(container, isCurrent)
  if (state.localMode && selected) {
    await loadLocalMessages(selected, true).catch(() => {})
    if (state.selectedId === selected.id && isCurrent()) await renderInbox(container, isCurrent)
  }
  if (!isCurrent()) return
  if (state.channel) { const supabase = await getSupabase(); await supabase.removeChannel(state.channel) }
  if (state.profile?.company_id) {
    const supabase = await getSupabase()
    state.channel = supabase.channel(`whatsapp-inbox-${state.profile.company_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations', filter: `company_id=eq.${state.profile.company_id}` }, async () => {
        if (state.localMode) return refreshLocalInbox(container)
        if (state.actionBusy || state.polling) return
        state.polling = true
        try { await loadState(); await renderInbox(container) } finally { state.polling = false }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages', filter: `company_id=eq.${state.profile.company_id}` }, async () => {
        if (state.localMode) return refreshLocalInbox(container)
        if (state.actionBusy || state.polling) return
        state.polling = true
        try { await loadState(); await renderInbox(container) } finally { state.polling = false }
      })
      .subscribe()
    if (state.refreshTimer) clearInterval(state.refreshTimer)
    state.refreshTimer = setInterval(async () => {
      if (!state.localMode) return
      await refreshLocalInbox(container)
    }, 2000)
}
}

globalThis.__renderWhatsAppInbox = renderWhatsAppInbox
