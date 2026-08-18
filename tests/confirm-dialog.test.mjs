import assert from 'node:assert/strict'
import test from 'node:test'
import { getConfirmationDetails } from '../src/confirm-dialog.js'

test('monta confirmação contextual para apagar agendamento', () => {
  assert.deepEqual(getConfirmationDetails('booking'), {
    title: 'Apagar agendamento?',
    message: 'A reserva será removida da agenda.',
    confirmLabel: 'Apagar agendamento',
  })
})

test('usa confirmação segura para tipos desconhecidos', () => {
  assert.deepEqual(getConfirmationDetails('unknown'), {
    title: 'Confirmar exclusão?',
    message: 'Este registro será removido do sistema.',
    confirmLabel: 'Apagar',
  })
})
