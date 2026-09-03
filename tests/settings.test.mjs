import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeOperationalPreferences, validatePasswordChange } from '../src/settings.js'

test('mantém preferências operacionais com valores padrão seguros', () => {
  assert.deepEqual(normalizeOperationalPreferences({ notifyStage: false }), {
    notifyStage: false,
    requireResponsible: true,
    requireFinalPhotos: true,
  })
})

test('valida senha antes de enviar a alteração para a conta', () => {
  assert.equal(validatePasswordChange('1234567', '1234567'), 'A senha deve ter pelo menos 8 caracteres.')
  assert.equal(validatePasswordChange('senha-segura', 'outra-senha'), 'As senhas não conferem.')
  assert.equal(validatePasswordChange('senha-segura', 'senha-segura'), '')
})
