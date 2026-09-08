import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('ordem criada por orçamento aprovado pode ser apagada sem apagar o histórico comercial', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20260908_allow_work_order_deletion_after_quote_approval.sql', import.meta.url), 'utf8')
  assert.match(migration, /drop constraint if exists sales_quotes_company_id_work_order_id_fkey/i)
  assert.match(migration, /on delete set null/i)
})
