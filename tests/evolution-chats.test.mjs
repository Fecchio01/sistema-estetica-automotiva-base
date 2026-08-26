import test from 'node:test'
import assert from 'node:assert/strict'
import { buildChatsRequest, buildContactsRequest, buildMessagesRequest, findEvolutionContactName, mergeEvolutionChats, mergeEvolutionContacts, normalizeEvolutionChat, normalizeEvolutionMessage, sortEvolutionMessages } from '../src/evolution-chats.js'

test('normaliza chat da Evolution para a conversa da inbox', () => {
  const chat = normalizeEvolutionChat({ id: 'chat-1', remoteJid: '5511999999999@s.whatsapp.net', pushName: 'Cliente Teste', updatedAt: '2026-08-19T12:00:00Z', lastMessage: { message: { conversation: 'Olá' }, messageTimestamp: 1787130000 } })
  assert.deepEqual(chat, { id: 'evolution:chat-1', remote_jid: '5511999999999@s.whatsapp.net', phone: '5511999999999', contact_name: 'Cliente Teste', last_message_preview: 'Olá', last_message_at: '2026-08-19T12:00:00.000Z', unread_count: 0 })
})

test('usa o nome da última mensagem recebida quando o chat não traz pushName', () => {
  const chat = normalizeEvolutionChat({ id: 'chat-2', remoteJid: '5511999999999@s.whatsapp.net', lastMessage: { pushName: 'Nome recebido', key: { fromMe: false }, message: { conversation: 'Olá' } } })
  assert.equal(chat.contact_name, 'Nome recebido')
})

test('normaliza mensagem da Evolution para o balão da inbox', () => {
  const message = normalizeEvolutionMessage({ id: 'msg-1', key: { remoteJid: '5511999999999@s.whatsapp.net', fromMe: true }, message: { conversation: 'Resposta' }, messageTimestamp: 1787130000, status: 'READ' })
  assert.equal(message.remote_message_id, 'msg-1')
  assert.equal(message.direction, 'outgoing')
  assert.equal(message.body, 'Resposta')
  assert.equal(message.status, 'read')
})

test('usa o último MessageUpdate para mostrar dois tiques azuis quando lido', () => {
  const message = normalizeEvolutionMessage({
    id: 'msg-read',
    key: { remoteJid: '5511999999999@s.whatsapp.net', fromMe: true },
    messageType: 'conversation',
    message: { conversation: 'Resposta' },
    messageTimestamp: 1787130000,
    MessageUpdate: [{ status: 'SERVER_ACK' }, { status: 'DELIVERY_ACK' }, { status: 'READ' }]
  })
  assert.equal(message.status, 'read')
})

test('normaliza mídia recebida para visualização e reprodução', () => {
  const image = normalizeEvolutionMessage({
    id: 'img-1',
    key: { remoteJid: '5511999999999@s.whatsapp.net', fromMe: false },
    messageType: 'imageMessage',
    message: { imageMessage: { url: 'https://example.com/photo.jpg', caption: 'Antes' } },
    messageTimestamp: 1787130000
  })
  assert.equal(image.message_type, 'image')
  assert.equal(image.media_url, 'https://example.com/photo.jpg')
  assert.equal(image.body, 'Antes')
})

test('preserva a chave da mensagem para baixar mídia protegida do WhatsApp', () => {
  const audio = normalizeEvolutionMessage({
    id: 'audio-1',
    key: { id: 'remote-audio', remoteJid: '5511999999999@lid', fromMe: false },
    messageType: 'audioMessage',
    message: { audioMessage: { url: 'https://mmg.whatsapp.net/audio.enc', mimetype: 'audio/ogg; codecs=opus' } },
    messageTimestamp: 1787130000
  })
  assert.deepEqual(audio.media_key, { id: 'remote-audio', remoteJid: '5511999999999@lid', fromMe: false })
  assert.equal(audio.media_mime_type, 'audio/ogg; codecs=opus')
})

test('desembrulha mídia de visualização única', () => {
  const image = normalizeEvolutionMessage({
    id: 'view-once-1',
    key: { id: 'view-once-1', remoteJid: '5511999999999@lid', fromMe: false },
    messageType: 'viewOnceMessageV2',
    message: { viewOnceMessageV2: { message: { imageMessage: { url: 'https://example.com/once.jpg', caption: 'Foto única' } } } },
    messageTimestamp: 1787130000
  })
  assert.equal(image.message_type, 'image')
  assert.equal(image.body, 'Foto única')
})

test('preserva a marcação de mensagem editada', () => {
  const message = normalizeEvolutionMessage({
    id: 'edited-1', edited: true,
    key: { id: 'edited-1', remoteJid: '5511999999999@s.whatsapp.net', fromMe: true },
    message: { conversation: 'Texto corrigido' }, messageTimestamp: 1787130000
  })
  assert.equal(message.body, 'Texto corrigido')
  assert.equal(message.edited, true)
})

test('monta consultas locais para chats e mensagens', () => {
  assert.deepEqual(buildChatsRequest({ instance: 'atelier' }), { path: '/chat/findChats/atelier', body: {} })
  assert.deepEqual(buildContactsRequest({ instance: 'atelier' }), { path: '/chat/findContacts/atelier', body: {} })
  assert.deepEqual(buildMessagesRequest({ instance: 'atelier' }, '5511999999999@s.whatsapp.net'), { path: '/chat/findMessages/atelier', body: { where: { key: { remoteJid: '5511999999999@s.whatsapp.net' } }, page: 1, limit: 100 } })
  assert.deepEqual(buildMessagesRequest({ instance: 'atelier' }, '5511999999999@s.whatsapp.net', 2).body, { where: { key: { remoteJid: '5511999999999@s.whatsapp.net' } }, page: 2, limit: 100 })
})

test('preenche o nome real usando o catálogo de contatos e a JID alternativa', () => {
  const chats = [normalizeEvolutionChat({ id: 'chat-1', remoteJid: '32448578597065@lid', lastMessage: { key: { remoteJidAlt: '557183915543@s.whatsapp.net' } } })]
  assert.equal(mergeEvolutionContacts(chats, [{ remoteJid: '557183915543@s.whatsapp.net', pushName: 'Cliente Real' }])[0].contact_name, 'Cliente Real')
})

test('prioriza o nome salvo do contato antes do pushName do perfil', () => {
  const chat = normalizeEvolutionChat({ id: 'chat-name', remoteJid: '5511999999999@s.whatsapp.net', name: 'Luna Fecchio', pushName: '𝓛' })
  const merged = mergeEvolutionContacts([chat], [{ remoteJid: '5511999999999@s.whatsapp.net', name: 'Luna Fecchio', pushName: '𝓛' }])
  assert.equal(merged[0].contact_name, 'Luna Fecchio')
})

test('encontra o nome real na mensagem recebida mais recente', () => {
  assert.equal(findEvolutionContactName([{ key: { fromMe: true }, pushName: 'Fecchio Joao', messageTimestamp: 4 }, { key: { fromMe: false }, pushName: '𝓛', messageTimestamp: 5 }]), '𝓛')
  assert.equal(findEvolutionContactName([{ key: { fromMe: true }, pushName: 'Fecchio Joao', messageTimestamp: 5 }]), null)
})

test('une a mesma pessoa entre JID tradicional e identificador LID', () => {
  const chats = mergeEvolutionChats([
    normalizeEvolutionChat({ id: 'lid', remoteJid: '123@lid', lastMessage: { key: { remoteJidAlt: '5511999999999@s.whatsapp.net' }, message: { conversation: 'mais novo' }, messageTimestamp: 20 } }),
    normalizeEvolutionChat({ id: 'phone', remoteJid: '5511999999999@s.whatsapp.net', pushName: 'Nome correto', lastMessage: { message: { conversation: 'antigo' }, messageTimestamp: 10 } })
  ])
  assert.equal(chats.length, 1)
  assert.equal(chats[0].contact_name, 'Nome correto')
  assert.deepEqual(chats[0].remote_jids, ['123@lid', '5511999999999@s.whatsapp.net'])
})

test('mantém mensagens em ordem cronológica crescente', () => {
  assert.deepEqual(sortEvolutionMessages([{ id: 'late', sent_at: '2026-08-20T12:00:00Z' }, { id: 'early', sent_at: '2026-08-20T11:00:00Z' }]).map((item) => item.id), ['early', 'late'])
})
