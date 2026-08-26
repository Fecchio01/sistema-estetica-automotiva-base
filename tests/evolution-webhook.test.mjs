import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validateWebhookRequest,
  buildConversationUpsert,
  buildMessageInsert,
  buildConnectionUpdate
} from '../src/whatsapp-webhook.js'

const event = {
  event: 'MESSAGES_UPSERT',
  instance: 'atelier',
  data: {
    key: { id: 'remote-1', remoteJid: '5511999998888@s.whatsapp.net', fromMe: false },
    message: { conversation: 'Oi, tudo bem?' },
    messageTimestamp: 1724000000
  }
}

test('aceita webhook com segredo e instância conhecidas', () => {
  assert.deepEqual(validateWebhookRequest({
    headers: { 'x-evolution-webhook-secret': 'secret' },
    payload: event
  }, { secret: 'secret', instance: 'atelier' }), { ok: true })
})

test('rejeita webhook sem segredo ou de instância desconhecida', () => {
  assert.equal(validateWebhookRequest({ headers: {}, payload: event }, { secret: 'secret', instance: 'atelier' }).ok, false)
  assert.equal(validateWebhookRequest({ headers: { 'x-evolution-webhook-secret': 'secret' }, payload: { ...event, instance: 'other' } }, { secret: 'secret', instance: 'atelier' }).ok, false)
})

test('monta upsert de conversa e inserção idempotente de mensagem', () => {
  const normalized = { kind: 'message', remoteId: 'remote-1', remoteJid: '5511999998888', direction: 'incoming', text: 'Oi, tudo bem?', media: null, sentAt: '2024-08-18T16:53:20.000Z', status: 'received' }
  assert.deepEqual(buildConversationUpsert(normalized, 'company-1'), {
    company_id: 'company-1',
    remote_jid: '5511999998888',
    last_message_preview: 'Oi, tudo bem?',
    last_message_type: 'text',
    unread_count_increment: 1,
    last_message_at: '2024-08-18T16:53:20.000Z'
  })
  assert.deepEqual(buildMessageInsert(normalized, 'company-1', 'conversation-1'), {
    company_id: 'company-1', conversation_id: 'conversation-1', remote_message_id: 'remote-1', remote_jid: '5511999998888', direction: 'incoming', message_type: 'text', body: 'Oi, tudo bem?', status: 'received', sent_at: '2024-08-18T16:53:20.000Z'
  })
})

test('monta atualização de conexão sem misturar mensagens', () => {
  assert.deepEqual(buildConnectionUpdate({ state: 'open' }, 'company-1', 'atelier'), { company_id: 'company-1', instance: 'atelier', state: 'open' })
})
