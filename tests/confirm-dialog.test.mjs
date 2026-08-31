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

test('confirma o cancelamento de um envio de pós-venda', () => {
  assert.deepEqual(getConfirmationDetails('post-sale'), {
    title: 'Desfazer envio?',
    message: 'Este acompanhamento voltará para pendente e poderá ser enviado novamente.',
    confirmLabel: 'Desfazer envio',
  })
})

test('confirma o envio de um follow-up pelo WhatsApp', () => {
  assert.deepEqual(getConfirmationDetails('post-sale-send'), {
    title: 'Enviar pelo WhatsApp?',
    message: 'A mensagem será enviada para o número cadastrado deste cliente.',
    confirmLabel: 'Enviar mensagem',
  })
})
