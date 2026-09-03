import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPostSaleData } from '../src/post-sale-loading.js'

test('inicia acompanhamentos e modelos em paralelo antes de carregar o histórico', async () => {
  const started = []
  let resolveItems
  let resolveTemplates
  const itemsPromise = new Promise((resolve) => { resolveItems = resolve })
  const templatesPromise = new Promise((resolve) => { resolveTemplates = resolve })
  const postSale = {
    loadPostSaleFollowUps: () => { started.push('items'); return itemsPromise },
    ensureDefaultMessageTemplates: () => { started.push('templates'); return templatesPromise },
    loadPostSaleFollowUpEvents: async (_profile, ids) => { started.push(`events:${ids.join(',')}`); return [{ follow_up_id: ids[0] }] },
  }

  const loading = loadPostSaleData({ company_id: 'company-1' }, postSale)
  await new Promise((resolve) => setImmediate(resolve))
  assert.deepEqual(started, ['items', 'templates'])

  resolveItems([{ id: 'follow-up-1' }])
  resolveTemplates([{ id: 'template-1' }])
  assert.deepEqual(await loading, {
    items: [{ id: 'follow-up-1' }],
    templates: [{ id: 'template-1' }],
    events: [{ follow_up_id: 'follow-up-1' }],
  })
  assert.deepEqual(started, ['items', 'templates', 'events:follow-up-1'])
})
