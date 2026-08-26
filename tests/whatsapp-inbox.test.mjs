import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeRemoteJid,
  normalizeEvolutionEvent,
  buildEvolutionWebhookConfig,
  buildManualMessage
} from '../src/whatsapp-inbox.js'

test('normaliza JID de contato removendo o sufixo do WhatsApp', () => {
  assert.equal(normalizeRemoteJid('5511999998888@s.whatsapp.net'), '5511999998888')
})

test('normaliza mensagem recebida do evento messages.upsert', () => {
  assert.deepEqual(normalizeEvolutionEvent({
    event: 'messages.upsert',
    instance: 'atelier',
    data: {
      key: { id: 'remote-1', remoteJid: '5511999998888@s.whatsapp.net', fromMe: false },
      message: { conversation: 'Olá, gostaria de agendar.' },
      messageTimestamp: 1724000000
    }
  }, 'atelier'), {
    kind: 'message',
    remoteId: 'remote-1',
    remoteJid: '5511999998888',
    direction: 'incoming',
    text: 'Olá, gostaria de agendar.',
    media: null,
    sentAt: '2024-08-18T16:53:20.000Z',
    status: 'received'
  })
})

test('normaliza imagem e mensagem enviada sem perder metadados', () => {
  const result = normalizeEvolutionEvent({
    event: 'MESSAGES_UPSERT',
    instance: 'atelier',
    data: {
      key: { id: 'remote-2', remoteJid: '5511888777666@s.whatsapp.net', fromMe: true },
      message: { imageMessage: { mimetype: 'image/jpeg', caption: 'Antes do serviço', fileLength: 1234 } },
      messageTimestamp: 1724000001,
      status: 'SERVER_ACK'
    }
  }, 'atelier')

  assert.equal(result.direction, 'outgoing')
  assert.equal(result.text, 'Antes do serviço')
  assert.deepEqual(result.media, { type: 'image', mimeType: 'image/jpeg', size: 1234 })
  assert.equal(result.status, 'sent')
})

test('rejeita evento de outra instância e payload sem id', () => {
  assert.throws(() => normalizeEvolutionEvent({ event: 'MESSAGES_UPSERT', instance: 'other', data: {} }, 'atelier'), /instância/i)
  assert.throws(() => normalizeEvolutionEvent({ event: 'MESSAGES_UPSERT', instance: 'atelier', data: { key: {} } }, 'atelier'), /id/i)
})

test('monta configuração do webhook com segredo apenas no cabeçalho', () => {
  assert.deepEqual(buildEvolutionWebhookConfig('https://evo.test', 'atelier', 'https://app.test/functions/v1/evolution-webhook', 'api-key', 'hook-secret'), {
    path: '/webhook/set/atelier',
    headers: { apikey: 'api-key', 'content-type': 'application/json' },
    body: {
      webhook: {
        enabled: true,
        url: 'https://app.test/functions/v1/evolution-webhook',
        webhook_by_events: false,
        webhook_base64: true,
        headers: { 'x-evolution-webhook-secret': 'hook-secret' },
        events: ['QRCODE_UPDATED', 'CONNECTION_UPDATE', 'MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'MESSAGES_DELETE', 'SEND_MESSAGE', 'CHATS_SET', 'CHATS_UPDATE', 'CHATS_UPSERT']
      }
    }
  })
})

test('monta mensagem manual e valida texto ou mídia', () => {
  assert.deepEqual(buildManualMessage('(11) 99999-8888', 'Oi!', null), { number: '5511999998888', text: 'Oi!' })
  assert.deepEqual(buildManualMessage('5511999998888', '', { url: 'https://cdn.test/foto.jpg', type: 'image', caption: 'Foto' }), {
    number: '5511999998888',
    media: { url: 'https://cdn.test/foto.jpg', type: 'image', caption: 'Foto' }
  })
  assert.throws(() => buildManualMessage('5511999998888', '', null), /mensagem|mídia/i)
})
