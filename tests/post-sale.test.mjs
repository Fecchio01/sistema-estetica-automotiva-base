import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPostSalePlan, classifyFollowUp, groupFollowUps, summarizePendingFollowUps, buildFollowUpStatusPatch, buildFollowUpMessagePatch, renderMessageTemplate, buildMessageTemplatePreview, getDueAutomaticFollowUps } from '../src/post-sale-rules.js'

test('renderiza variáveis no modelo de mensagem', () => {
  assert.equal(renderMessageTemplate('Olá, {{cliente}}! Seu {{veiculo}} está pronto.', { cliente: 'João', veiculo: 'BMW 320i' }), 'Olá, João! Seu BMW 320i está pronto.')
})

test('monta uma prévia contextual para o modelo selecionado', () => {
  assert.deepEqual(buildMessageTemplatePreview({ name: 'Check-in', message: 'Olá, {{cliente}}! Seu {{veiculo}} está pronto.' }), { title: 'Check-in', message: 'Olá, Cliente! Seu seu veículo está pronto.' })
})

test('seleciona somente follow-ups pendentes com automação habilitada e vencidos', () => {
  const due = getDueAutomaticFollowUps([
    { id: '1', status: 'pending', auto_send: true, due_at: '2026-08-31T09:00:00.000Z' },
    { id: '2', status: 'pending', auto_send: false, due_at: '2026-08-31T08:00:00.000Z' },
    { id: '3', status: 'sent', auto_send: true, due_at: '2026-08-31T08:00:00.000Z' },
    { id: '4', status: 'pending', auto_send: true, due_at: '2026-09-01T08:00:00.000Z' },
  ], new Date('2026-08-31T10:00:00.000Z'))
  assert.deepEqual(due.map((item) => item.id), ['1'])
})

test('prepara uma mensagem editada sem aceitar texto vazio', () => {
  assert.deepEqual(buildFollowUpMessagePatch('  Olá, João!  '), { message: 'Olá, João!' })
  assert.throws(() => buildFollowUpMessagePatch('   '), /mensagem/i)
})

test('resume pendências de pós-venda por cliente, sem repetir o mesmo cliente', () => {
  const grouped = summarizePendingFollowUps([
    { id: '1', client_id: 'c1', vehicle_id: 'v1', status: 'pending' },
    { id: '2', client_id: 'c1', vehicle_id: 'v1', status: 'pending' },
    { id: '3', client_id: 'c1', vehicle_id: 'v1', status: 'sent' },
    { id: '4', client_id: 'c2', vehicle_id: 'v2', status: 'sent' },
  ])
  assert.deepEqual(grouped.map(({ clientId, pendingCount }) => ({ clientId, pendingCount })), [{ clientId: 'c1', pendingCount: 2 }])
})

test('desfazer envio retorna o follow-up para pendente e remove sent_at', () => {
  assert.deepEqual(buildFollowUpStatusPatch('pending'), { status: 'pending', sent_at: null })
  assert.deepEqual(buildFollowUpStatusPatch('sent', '2026-08-29T12:00:00.000Z'), { status: 'sent', sent_at: '2026-08-29T12:00:00.000Z' })
})

test('agrupa acompanhamentos do mesmo cliente e veículo em um único card', () => {
  const grouped = groupFollowUps([
    { id: '1', client_id: 'c1', vehicle_id: 'v1', follow_up_type: 'check_in', status: 'pending' },
    { id: '2', client_id: 'c1', vehicle_id: 'v1', follow_up_type: 'review', status: 'pending' },
    { id: '3', client_id: 'c2', vehicle_id: 'v2', follow_up_type: 'return', status: 'sent' },
  ])
  assert.equal(grouped.length, 2)
  assert.equal(grouped[0].items.length, 2)
  assert.equal(grouped[0].pendingCount, 2)
  assert.equal(grouped[1].pendingCount, 0)
})

test('cria uma sequência de pós-venda somente para atendimento concluído', () => {
  const plan = buildPostSalePlan({
    id: 'order-1',
    status: 'completed',
    completed_at: '2026-08-28T15:00:00.000Z',
    client_id: 'client-1',
    vehicle_id: 'vehicle-1',
    clientName: 'João Silva',
    vehicleLabel: 'Honda Civic · ABC-1234',
    serviceDescription: 'Detalhamento interno',
  })

  assert.deepEqual(plan.map((item) => item.type), ['check_in', 'care_tip', 'review', 'return'])
  assert.equal(plan[0].dueAt, '2026-08-29T15:00:00.000Z')
  assert.equal(plan[3].dueAt, '2026-09-27T15:00:00.000Z')
  assert.equal(plan[0].status, 'pending')
  assert.match(plan[0].message, /João Silva/)
})

test('não cria pós-venda para atendimento ainda aberto', () => {
  assert.deepEqual(buildPostSalePlan({ id: 'order-2', status: 'in_progress' }), [])
})

test('classifica a fila por vencimento sem tratar próximos como atrasados', () => {
  const now = new Date('2026-08-29T12:00:00.000Z')
  assert.equal(classifyFollowUp({ due_at: '2026-08-28T12:00:00.000Z', status: 'pending' }, now), 'overdue')
  assert.equal(classifyFollowUp({ due_at: '2026-08-29T12:00:00.000Z', status: 'pending' }, now), 'today')
  assert.equal(classifyFollowUp({ due_at: '2026-09-02T12:00:00.000Z', status: 'pending' }, now), 'upcoming')
  assert.equal(classifyFollowUp({ due_at: '2026-08-28T12:00:00.000Z', status: 'sent' }, now), 'done')
})
