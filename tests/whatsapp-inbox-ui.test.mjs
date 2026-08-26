import test from 'node:test'
import assert from 'node:assert/strict'
import { canUseWhatsAppInbox, connectionPresentation, conversationDisplayName, escapeWhatsAppHtml, formatWhatsAppMessage, mediaMarkup, messageMarkup, messageScrollMode, messageStatusClass, messageStatusLabel, sortConversations } from '../src/whatsapp-inbox-ui.js'
import { summarizeWhatsAppNotifications } from '../src/whatsapp-notifications.js'

test('somente administradora e recepção podem abrir a inbox', () => {
  assert.equal(canUseWhatsAppInbox({ role: 'administrator', active: true }), true)
  assert.equal(canUseWhatsAppInbox({ role: 'reception', active: true }), true)
  assert.equal(canUseWhatsAppInbox({ role: 'employee', active: true }), false)
  assert.equal(canUseWhatsAppInbox({ role: 'reception', active: false }), false)
})

test('escapa texto recebido antes de renderizar no painel', () => {
  assert.equal(escapeWhatsAppHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;')
})

test('formata horário e ordena conversas pela atividade mais recente', () => {
  assert.equal(formatWhatsAppMessage({ sent_at: '2026-08-19T13:45:00.000Z' }).length > 0, true)
  const sorted = sortConversations([
    { id: 'old', last_message_at: '2026-08-18T10:00:00Z' },
    { id: 'new', last_message_at: '2026-08-19T10:00:00Z' }
  ])
  assert.deepEqual(sorted.map((item) => item.id), ['new', 'old'])
})

test('só colore de azul a confirmação real de leitura', () => {
  assert.equal(messageStatusLabel({ direction: 'outgoing', status: 'sent' }), '✓')
  assert.equal(messageStatusClass({ direction: 'outgoing', status: 'sent' }), 'is-sent')
  assert.equal(messageStatusLabel({ direction: 'outgoing', status: 'delivered' }), '✓✓')
  assert.equal(messageStatusClass({ direction: 'outgoing', status: 'delivered' }), 'is-delivered')
  assert.equal(messageStatusLabel({ direction: 'outgoing', status: 'read' }), '✓✓')
  assert.equal(messageStatusClass({ direction: 'outgoing', status: 'read' }), 'is-read')
})

test('não apresenta erro de conexão como WhatsApp conectado', () => {
  assert.deepEqual(connectionPresentation({ state: 'error', message: 'fetch failed' }), { connected: false, message: 'Sem conexão com a Evolution API. Gere um novo QR Code quando o serviço estiver disponível.' })
  assert.equal(connectionPresentation({ state: 'open' }).connected, true)
})

test('renderiza foto e áudio com controles próprios', () => {
  assert.match(mediaMarkup({ message_type: 'image', media_url: 'https://example.com/photo.jpg' }), /<img/)
  assert.match(mediaMarkup({ message_type: 'audio', media_url: 'https://example.com/audio.ogg' }), /<audio[^>]+controls/)
})

test('renderiza figurinha menor que uma foto comum', () => {
  assert.match(mediaMarkup({ message_type: 'sticker', media_url: 'https://example.com/sticker.webp' }), /whatsapp-sticker-media/)
})

test('não força o histórico para o fim quando o usuário está lendo mensagens antigas', () => {
  assert.equal(messageScrollMode({ scrollHeight: 1200, scrollTop: 300, clientHeight: 500 }), 'preserve')
  assert.equal(messageScrollMode({ scrollHeight: 1200, scrollTop: 680, clientHeight: 500 }), 'bottom')
})

test('oferece resposta e reação sem inserir o rótulo artificial Mensagem', () => {
  const markup = messageMarkup({ id: 'm1', direction: 'incoming', body: 'Oi', sent_at: '2026-08-21T12:00:00Z', status: 'received' })
  assert.match(markup, /data-whatsapp-reply="m1"/)
  assert.match(markup, /data-whatsapp-reaction="m1"/)
  assert.match(markup, /data-whatsapp-delete-toggle="m1"/)
  assert.doesNotMatch(markup, />Mensagem</)
})

test('oferece abrir foto e as duas formas de apagar uma mensagem', () => {
  const markup = messageMarkup({ id: 'm2', direction: 'incoming', message_type: 'image', media_url: 'https://example.com/photo.jpg', sent_at: '2026-08-21T12:00:00Z' })
  assert.match(markup, /data-whatsapp-image="m2"/)
  assert.match(markup, /data-whatsapp-delete-me="m2"/)
  assert.match(markup, /data-whatsapp-delete-everyone="m2"/)
})

test('mantém reação vinculada ao balão original', () => {
  const markup = messageMarkup({ id: 'm1', direction: 'incoming', body: 'Oi', reactions: [{ emoji: '❤️', fromMe: false }], sent_at: '2026-08-21T12:00:00Z' })
  assert.match(markup, /whatsapp-message-reactions/)
  assert.match(markup, /❤️/)
})

test('resume notificações novas da inbox', () => {
  assert.deepEqual(summarizeWhatsAppNotifications([{ unread_count: 2, contact_name: 'Luna', last_message_at: '2026-08-21T12:00:00Z' }, { unread_count: 1, contact_name: 'Tiago', last_message_at: '2026-08-20T12:00:00Z' }]), { unread: 3, conversations: 2, latestName: 'Luna' })
})

test('renderiza documento protegido como cartão abrível', () => {
  assert.match(mediaMarkup({ message_type: 'document', media_url: 'data:application/pdf;base64,AA==' }), /whatsapp-message-document/)
  assert.match(mediaMarkup({ message_type: 'document', media_url: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,AA==' }), /Abrir ou baixar arquivo/)
})

test('prioriza o proxy local quando a URL criptografada do WhatsApp expirou', () => {
  assert.match(mediaMarkup({ message_type: 'image', media_url: 'https://mmg.whatsapp.net/photo.enc', media_proxy_url: '/api/whatsapp/media?messageId=m1' }), /src="\/api\/whatsapp\/media\?messageId=m1"/)
})

test('não exibe contato sem nome quando existe um identificador disponível', () => {
  assert.equal(conversationDisplayName({ contact_name: '', phone: '5511999999999' }), '5511999999999')
  assert.equal(conversationDisplayName({ contact_name: 'Thiago', phone: '5511999999999' }), 'Thiago')
})
