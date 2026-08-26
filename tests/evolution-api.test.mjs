import test from 'node:test'
import assert from 'node:assert/strict'
import { buildEvolutionConfig, buildSendTextRequest, evolutionRequest, findEvolutionConnectionState, findEvolutionInstance, normalizePhoneNumber } from '../src/evolution-api.js'

test('normaliza telefone brasileiro para o formato aceito pela Evolution API', () => {
  assert.equal(normalizePhoneNumber('(11) 99999-8888'), '5511999998888')
})

test('monta configuração a partir das variáveis do servidor', () => {
  assert.deepEqual(buildEvolutionConfig({
    EVOLUTION_API_URL: 'http://localhost:8080/',
    EVOLUTION_API_KEY: 'secret',
    EVOLUTION_INSTANCE: 'atelier'
  }), {
    baseUrl: 'http://localhost:8080',
    apiKey: 'secret',
    instance: 'atelier'
  })
})

test('monta requisição de texto sem expor a chave no corpo', () => {
  assert.deepEqual(buildSendTextRequest('5511999998888', 'Olá, seu veículo está pronto.', {
    baseUrl: 'http://localhost:8080',
    apiKey: 'secret',
    instance: 'atelier'
  }), {
    path: '/message/sendText/atelier',
    headers: { apikey: 'secret', 'content-type': 'application/json' },
    body: {
      number: '5511999998888',
      text: 'Olá, seu veículo está pronto.'
    }
  })
})

test('usa connectionStatus do cadastro da instância como estado confiável', () => {
  assert.deepEqual(findEvolutionInstance([{ name: 'atelier', connectionStatus: 'open', disconnectionReasonCode: 401 }], 'atelier'), { state: 'open', disconnectReason: null, disconnectAt: null })
})

test('ignora erro antigo de desconexão quando a instância está aberta', () => {
  assert.deepEqual(findEvolutionInstance([{ name: 'atelier', connectionStatus: 'open', disconnectionObject: '{device_removed}', disconnectionAt: '2026-08-20T00:00:00Z' }], 'atelier'), { state: 'open', disconnectReason: null, disconnectAt: null })
})

test('lê o estado atual da rota connectionState sem usar cadastro antigo', () => {
  assert.equal(findEvolutionConnectionState({ instance: { instanceName: 'atelier', state: 'close' } }), 'close')
})

test('encerra uma chamada travada da Evolution com mensagem recuperável', async () => {
  const fetchImpl = (_url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted')))
  })
  await assert.rejects(
    evolutionRequest({ baseUrl: 'http://localhost:8080', apiKey: 'secret', instance: 'atelier' }, '/message/sendText/atelier', {}, fetchImpl, 5),
    /não respondeu em 20 segundos/
  )
})
