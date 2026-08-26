import test from 'node:test'
import assert from 'node:assert/strict'
import { buildAutomaticReply } from '../src/whatsapp-auto-reply.js'

test('apresenta o assistente na primeira mensagem sem emojis', () => {
  const result = buildAutomaticReply('Oi, tudo bem?', { introduced: false })

  assert.equal(result.shouldReply, true)
  assert.equal(result.text, 'Olá, Luna. Sou o assistente do Sr. Fecchio. O que você gostaria de conversar?')
  assert.equal(/\p{Extended_Pictographic}/u.test(result.text), false)
})

test('responde de forma contextual e puxa assunto depois da apresentação', () => {
  const result = buildAutomaticReply('Estou bem, e você?', { introduced: true })

  assert.equal(result.shouldReply, true)
  assert.equal(result.text, 'Estou bem também. Como foi seu dia?')
})

test('não responde assuntos sensíveis automaticamente', () => {
  const result = buildAutomaticReply('Preciso falar sobre dinheiro e um contrato', { introduced: true })

  assert.equal(result.shouldReply, false)
  assert.equal(result.reason, 'manual_review')
})

test('ignora mensagens vazias', () => {
  assert.deepEqual(buildAutomaticReply('   ', { introduced: true }), { shouldReply: false, reason: 'empty' })
})
