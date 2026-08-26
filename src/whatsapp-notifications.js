export function summarizeWhatsAppNotifications(conversations = []) {
  const unread = conversations.reduce((total, conversation) => total + Math.max(0, Number(conversation?.unread_count) || 0), 0)
  const latest = [...conversations].sort((a, b) => new Date(b?.last_message_at ?? 0) - new Date(a?.last_message_at ?? 0))[0]
  return { unread, conversations: conversations.filter((conversation) => Number(conversation?.unread_count) > 0).length, latestName: latest?.contact_name || latest?.phone || '' }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]))
}

let timer = null

export async function refreshWhatsAppNotification(container) {
  if (!container) return
  try {
    const response = await fetch('/api/whatsapp/chats', { cache: 'no-store' })
    if (!response.ok) throw new Error('offline')
    const data = await response.json()
    const summary = summarizeWhatsAppNotifications(data.chats ?? [])
    container.innerHTML = summary.unread
      ? `<div class="whatsapp-dashboard-notification"><span class="whatsapp-dashboard-notification-icon">●</span><div><b>${summary.unread} nova${summary.unread === 1 ? '' : 's'} mensagem${summary.unread === 1 ? '' : 'ns'}</b><small>${summary.conversations} conversa${summary.conversations === 1 ? '' : 's'} aguardando resposta${summary.latestName ? ` · ${escapeHtml(summary.latestName)}` : ''}</small></div><button type="button" data-open-whatsapp>Ver conversas</button></div>`
      : '<div class="whatsapp-dashboard-notification is-quiet"><span class="whatsapp-dashboard-notification-icon">✓</span><div><b>WhatsApp em dia</b><small>Nenhuma conversa nova aguardando resposta.</small></div><button type="button" data-open-whatsapp>Ver conversas</button></div>'
    container.querySelector('[data-open-whatsapp]')?.addEventListener('click', () => globalThis.__showSection?.('conversas'))
  } catch {
    container.innerHTML = '<div class="whatsapp-dashboard-notification is-error"><span class="whatsapp-dashboard-notification-icon">!</span><div><b>WhatsApp sem conexão</b><small>A Evolution API não respondeu. Gere um novo QR Code na central de conversas.</small></div><button type="button" data-open-whatsapp>Ver conexão</button></div>'
    container.querySelector('[data-open-whatsapp]')?.addEventListener('click', () => globalThis.__showSection?.('conversas'))
  }
}

export function startWhatsAppNotifications(container) {
  if (!container) return
  if (timer) clearInterval(timer)
  refreshWhatsAppNotification(container)
  timer = setInterval(() => refreshWhatsAppNotification(container), 3_000)
}

export function stopWhatsAppNotifications() {
  if (timer) clearInterval(timer)
  timer = null
}

globalThis.__startWhatsAppNotifications = startWhatsAppNotifications
globalThis.__stopWhatsAppNotifications = stopWhatsAppNotifications
