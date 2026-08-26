import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('o projeto base usa o Supabase principal', async () => {
  const source = await readFile(new URL('../src/config.js', import.meta.url), 'utf8')
  assert.match(source, /qqrbfpdenhhellgbgimo\.supabase\.co/)
  assert.doesNotMatch(source, /mvqmpgkpgvabhsulnqbs\.supabase\.co/)
})
