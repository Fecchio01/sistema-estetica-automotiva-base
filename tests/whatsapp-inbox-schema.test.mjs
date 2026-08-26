import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migrationPath = new URL('../supabase/migrations/20260819_whatsapp_inbox.sql', import.meta.url)

test('migração cria tabelas de conversas, mensagens e mídias com tenant', async () => {
  const sql = await readFile(migrationPath, 'utf8')
  for (const table of ['whatsapp_conversations', 'whatsapp_messages', 'whatsapp_media']) assert.match(sql, new RegExp(`create table[^;]*${table}`, 'is'))
  assert.match(sql, /company_id\s+uuid/i)
  assert.match(sql, /unique\s*\(\s*company_id\s*,\s*remote_jid\s*\)/i)
  assert.match(sql, /unique\s*\(\s*company_id\s*,\s*remote_message_id\s*\)/i)
})

test('migração habilita RLS e políticas para administradora e recepção', async () => {
  const sql = await readFile(migrationPath, 'utf8')
  assert.match(sql, /enable row level security/i)
  assert.match(sql, /administrator|reception/i)
  assert.match(sql, /whatsapp-media/i)
  assert.match(sql, /storage\.objects/i)
})
