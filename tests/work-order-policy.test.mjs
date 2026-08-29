import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

test('migration avoids recursive client and vehicle policy checks on order updates', () => {
  const sql = fs.readFileSync(new URL('../supabase/migrations/20260829_post_sale_followups.sql', import.meta.url), 'utf8')
  assert.match(sql, /drop policy if exists orders_update_admin_reception/i)
  assert.match(sql, /private\.order_refs_belong_to_company\(company_id, client_id, vehicle_id\)/i)
})
