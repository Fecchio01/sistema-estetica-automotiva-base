import test from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { resolvePublicFile } from '../src/local-server-path.js'

test('servidor entrega assets públicos mas bloqueia segredos, git e caminhos externos', () => {
  const root = resolve('fixture')
  for (const path of ['.env.local', '.git/config', '../fixture-other/private', '..\\private', 'supabase/functions/private.ts', 'dev-server.mjs']) {
    assert.equal(resolvePublicFile(root, path), null, path)
  }
  for (const path of ['index.html', 'app.js', 'src/config.js', 'styles.css']) {
    assert.equal(resolvePublicFile(root, path), resolve(root, path))
  }
})
