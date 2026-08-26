import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('remove a restrição que bloqueava novos atendimentos do mesmo veículo', async () => {
  const sql = await readFile(new URL('../supabase/migrations/20260825_allow_repeat_work_orders.sql', import.meta.url), 'utf8')
  assert.match(sql, /drop constraint if exists work_orders_company_client_vehicle_key/i)
})
