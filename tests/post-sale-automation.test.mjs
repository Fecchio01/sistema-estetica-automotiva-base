import test from 'node:test'
import assert from 'node:assert/strict'
import { buildAutomaticClaimPatch, buildAutomaticFailurePatch, buildAutomaticSuccessPatch, createServerSupabaseClient, processDueAutomaticFollowUps } from '../src/post-sale-automation.js'

test('cria uma trava temporária e incrementa as tentativas antes do envio', () => {
  assert.deepEqual(buildAutomaticClaimPatch(new Date('2026-08-31T12:00:00.000Z'), 2, 5), { auto_send_lock_until: '2026-08-31T12:05:00.000Z', attempt_count: 3 })
})

test('libera a trava e preserva a falha para nova tentativa', () => {
  assert.deepEqual(buildAutomaticFailurePatch('Evolution indisponível'), { auto_send_lock_until: null, last_error: 'Evolution indisponível' })
})

test('marca o envio automático como enviado e limpa a falha anterior', () => {
  assert.deepEqual(buildAutomaticSuccessPatch('2026-08-31T12:00:02.000Z'), { status: 'sent', sent_at: '2026-08-31T12:00:02.000Z', auto_send_lock_until: null, last_error: null })
})

test('não cria cliente administrativo sem chave secreta do Supabase', () => {
  assert.equal(createServerSupabaseClient({ SUPABASE_URL: 'https://db.test' }), null)
})

test('cria cliente administrativo somente no processo do servidor', () => {
  const calls = []
  const client = createServerSupabaseClient({ SUPABASE_URL: 'https://db.test', SUPABASE_SECRET_KEY: 'server-secret' }, (...args) => { calls.push(args); return { server: true } })
  assert.deepEqual(client, { server: true })
  assert.deepEqual(calls[0].slice(0, 2), ['https://db.test', 'server-secret'])
})

test('processa um follow-up vencido e registra o envio', async () => {
  const updates = []
  const events = []
  let followUpCall = 0
  const client = {
    from(table) {
      if (table === 'post_sale_followup_events') return { insert(payload) { events.push(payload); return Promise.resolve({ error: null }) } }
      const query = {
        mode: null,
        returned: false,
        select() { this.returned = true; this.mode = this.mode || 'select'; return this },
        update(payload) { updates.push(payload); this.mode = 'update'; return this },
        eq() { return this },
        lte() { return this },
        or() { return this },
        then(resolve, reject) {
          const result = this.mode === 'select' && followUpCall++ === 0
            ? { data: [{ id: 'follow-1', message: 'Olá, Jorge!', attempt_count: 0, clients: { phone: '71999990000' } }], error: null }
            : this.returned
              ? { data: [{ id: 'follow-1', message: 'Olá, Jorge!', clients: { phone: '71999990000' } }], error: null }
              : { data: null, error: null }
          return Promise.resolve(result).then(resolve, reject)
        },
      }
      return query
    },
  }
  const fetchImpl = async (url) => ({ ok: true, text: async () => url.includes('connectionState') ? JSON.stringify({ state: 'open' }) : '{}' })
  const result = await processDueAutomaticFollowUps({ client, companyId: 'company-1', config: { baseUrl: 'https://evolution.test', apiKey: 'secret', instance: 'atelier' }, now: new Date('2026-08-31T12:00:00.000Z'), fetchImpl })
  assert.deepEqual(result, { status: 'processed', sent: 1, failed: 0, skipped: 0 })
  assert.equal(updates.at(-1).status, 'sent')
  assert.equal(events.at(-1).event_type, 'sent')
})
