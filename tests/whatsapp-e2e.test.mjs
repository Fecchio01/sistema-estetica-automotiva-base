import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeEvolutionEvent, buildEvolutionWebhookConfig, buildManualMessage } from '../src/whatsapp-inbox.js'
import { validateWebhookRequest, buildConversationUpsert, buildMessageInsert } from '../src/whatsapp-webhook.js'
import { buildConnectionRequest, buildQrRequest, buildManualSendRequest, validateMediaPayload } from '../src/whatsapp-server.js'
import { canUseWhatsAppInbox, escapeWhatsAppHtml, sortConversations } from '../src/whatsapp-inbox-ui.js'

const config = { baseUrl: 'https://evolution.test', apiKey: 'private', instance: 'atelier' }
const incoming = { event: 'MESSAGES_UPSERT', instance: 'atelier', data: { key: { id: 'e2e-1', remoteJid: '5511999998888@s.whatsapp.net', fromMe: false }, message: { conversation: 'Olá' }, messageTimestamp: 1724000000 } }

test('E2E 01: configuração de conexão monta rota correta', () => assert.equal(buildConnectionRequest(config).path, '/instance/connectionState/atelier'))
test('E2E 02: QR Code monta rota correta', () => assert.equal(buildQrRequest(config).path, '/instance/connect/atelier'))
test('E2E 03: webhook válido é autenticado', () => assert.equal(validateWebhookRequest({ headers: { 'x-evolution-webhook-secret': 's' }, payload: incoming }, { secret: 's', instance: 'atelier' }).ok, true))
test('E2E 04: webhook de instância errada é bloqueado', () => assert.equal(validateWebhookRequest({ headers: { 'x-evolution-webhook-secret': 's' }, payload: { ...incoming, instance: 'other' } }, { secret: 's', instance: 'atelier' }).ok, false))
test('E2E 05: mensagem recebida vira evento normalizado', () => assert.equal(normalizeEvolutionEvent(incoming, 'atelier').direction, 'incoming'))
test('E2E 06: mensagem enviada mantém direção outgoing', () => assert.equal(normalizeEvolutionEvent({ ...incoming, data: { ...incoming.data, key: { ...incoming.data.key, fromMe: true } } }, 'atelier').direction, 'outgoing'))
test('E2E 07: conversa recebe incremento de não lidas', () => assert.equal(buildConversationUpsert({ remoteJid: '5511', text: 'Oi', media: null, direction: 'incoming', sentAt: '2026-08-19T10:00:00Z' }, 'company').unread_count_increment, 1))
test('E2E 08: mensagem é vinculada à conversa e empresa', () => assert.deepEqual(Object.keys(buildMessageInsert({ remoteId: 'm', remoteJid: '5511', direction: 'incoming', text: 'Oi', media: null, sentAt: '2026-08-19T10:00:00Z', status: 'received' }, 'company', 'conversation')).slice(0, 3), ['company_id', 'conversation_id', 'remote_message_id']))
test('E2E 09: duplicação usa id remoto estável', () => assert.equal(buildMessageInsert({ remoteId: 'same', remoteJid: '5511', direction: 'incoming', text: '', media: null, sentAt: '2026-08-19T10:00:00Z', status: 'received' }, 'company', 'conversation').remote_message_id, 'same'))
test('E2E 10: texto manual normaliza telefone', () => assert.equal(buildManualMessage('(11) 99999-8888', 'Oi', null).number, '5511999998888'))
test('E2E 11: envio manual monta endpoint de texto', () => assert.equal(buildManualSendRequest(config, { number: '5511999998888', text: 'Oi' }).path, '/message/sendText/atelier'))
test('E2E 12: envio manual monta endpoint de mídia', () => assert.equal(buildManualSendRequest(config, { number: '5511999998888', media: { url: 'data:image/jpeg;base64,AA==', type: 'image', mimeType: 'image/jpeg', size: 2 } }).path, '/message/sendMedia/atelier'))
test('E2E 13: mídia válida passa limite', () => assert.equal(validateMediaPayload({ url: 'https://cdn.test/a.jpg', type: 'image', mimeType: 'image/jpeg', size: 100 }).ok, true))
test('E2E 14: funcionário não acessa inbox', () => assert.equal(canUseWhatsAppInbox({ role: 'employee', active: true }), false))
test('E2E 15: texto recebido é escapado e conversas ordenadas', () => assert.deepEqual([escapeWhatsAppHtml('<b>Oi</b>'), ...sortConversations([{ id: 'a', last_message_at: '2026-08-18' }, { id: 'b', last_message_at: '2026-08-19' }]).map((item) => item.id)], ['&lt;b&gt;Oi&lt;/b&gt;', 'b', 'a']))
