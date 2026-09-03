import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('migração persiste a etapa detalhada da ordem e protege o intervalo válido', async () => {
  const sql = await readFile(new URL('../supabase/migrations/20260903_persist_work_order_stage.sql', import.meta.url), 'utf8')
  assert.match(sql, /add column if not exists current_stage integer not null default 0/i)
  assert.match(sql, /current_stage between 0 and 4/i)
  assert.match(sql, /work_orders_company_stage_idx/i)
})
