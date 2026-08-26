import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildConnectionRequest,
  buildQrRequest,
  buildLogoutRequest,
  buildManualSendRequest,
  buildMarkReadRequest,
  buildReactionRequest,
  buildDeleteMessageRequest,
  validateMediaPayload
} from '../src/whatsapp-server.js'

const config = { baseUrl: 'https://evolution.test', apiKey: 'private-key', instance: 'atelier' }

test('monta consulta de conexão e QR sem colocar a chave no retorno', () => {
  assert.deepEqual(buildConnectionRequest(config), { path: '/instance/connectionState/atelier' })
  assert.deepEqual(buildQrRequest(config), { path: '/instance/connect/atelier' })
})

test('monta a rota de desconexão da instância sem expor a chave', () => {
  assert.deepEqual(buildLogoutRequest(config), { path: '/instance/logout/atelier' })
})

test('monta envio manual de texto sem expor chave no corpo', () => {
  const request = buildManualSendRequest(config, { number: '(11) 99999-8888', text: 'Olá', media: null })
  assert.equal(request.path, '/message/sendText/atelier')
  assert.deepEqual(request.body, { number: '5511999998888', text: 'Olá' })
  assert.equal(JSON.stringify(request.body).includes('private-key'), false)
})

test('monta resposta citada no formato aceito pela Evolution', () => {
  const request = buildManualSendRequest(config, { number: '5511999998888', text: 'Respondendo', quoted: { messageId: 'm1', participant: '5511999998888@s.whatsapp.net' } })
  assert.deepEqual(request.body.quoted, { messageId: 'm1', participant: '5511999998888@s.whatsapp.net' })
})

test('monta reação para uma mensagem existente', () => {
  const request = buildReactionRequest(config, { remoteJid: '5511999998888@s.whatsapp.net', id: 'm1', fromMe: false, reaction: '👍' })
  assert.equal(request.path, '/message/sendReaction/atelier')
  assert.deepEqual(request.body, { key: { remoteJid: '5511999998888@s.whatsapp.net', id: 'm1', fromMe: false }, reaction: '👍' })
})

test('monta exclusão de mensagem para todos', () => {
  const request = buildDeleteMessageRequest(config, { chat: '5511999998888@s.whatsapp.net', messageId: 'm1' })
  assert.equal(request.path, '/message/delete')
  assert.deepEqual(request.body, { chat: '5511999998888@s.whatsapp.net', messageId: 'm1' })
})

test('monta envio manual de imagem e bloqueia mídia inválida ou grande', () => {
  const request = buildManualSendRequest(config, { number: '5511999998888', text: 'Foto', media: { url: 'https://cdn.test/foto.jpg', type: 'image', mimeType: 'image/jpeg', size: 1000 } })
  assert.equal(request.path, '/message/sendMedia/atelier')
  assert.deepEqual(request.body, { number: '5511999998888', mediatype: 'image', mimetype: 'image/jpeg', media: 'https://cdn.test/foto.jpg', caption: 'Foto' })
  assert.deepEqual(validateMediaPayload({ type: 'image', mimeType: 'image/jpeg', size: 1000, url: 'https://cdn.test/foto.jpg' }), { ok: true })
  assert.equal(validateMediaPayload({ type: 'application/x-exe', mimeType: 'application/x-exe', size: 1000 }).ok, false)
  assert.equal(validateMediaPayload({ type: 'image', mimeType: 'image/jpeg', size: 11 * 1024 * 1024 }).ok, false)
})

test('monta marcação de mensagens recebidas como lidas', () => {
  const request = buildMarkReadRequest(config, [{ remote_message_id: 'm1', remote_jid: '5511999999999@s.whatsapp.net' }])
  assert.equal(request.path, '/chat/markMessageAsRead/atelier')
  assert.deepEqual(request.body, { readMessages: [{ id: 'm1', fromMe: false, remoteJid: '5511999999999@s.whatsapp.net' }] })
})
