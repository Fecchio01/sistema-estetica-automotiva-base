import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDashboardOrganizationModel, formatElapsedSince } from '../src/dashboard-organization.js'

test('painel operacional agrupa ordens por etapa e preserva responsável', () => {
  const model = buildDashboardOrganizationModel([
    { client: 'artur', vehicle: 'Honda Civic GRT', status: 'Recebido', tone: 'received', orderStatus: 'scheduled', createdAt: '2026-08-27T14:00:00.000Z', responsibleId: 'person-1' },
    { client: 'Luna', vehicle: 'BMW 320i', status: 'Em andamento', tone: 'in-progress', orderStatus: 'in_progress', createdAt: '2026-08-27T12:00:00.000Z', responsibleId: 'person-2' },
  ], [
    { status: 'received', responsible: 'person-1' },
    { status: 'in-progress', responsible: 'person-2' },
  ], [{ id: 'person-1', full_name: 'Pedro Lima' }, { id: 'person-2', full_name: 'Luna Martins' }], new Date('2026-08-27T15:00:00.000Z'))

  assert.deepEqual(model.stageCounts, { received: 1, inProgress: 1, ready: 0 })
  assert.equal(model.rows[0].responsible, 'Pedro Lima')
  assert.equal(model.rows[0].stageLabel, 'Aguardando avaliação')
  assert.equal(model.rows[1].stageLabel, 'Em execução')
})

test('tempo parado usa minutos e horas sem inventar uma data', () => {
  assert.equal(formatElapsedSince('2026-08-27T14:45:00.000Z', new Date('2026-08-27T15:00:00.000Z')), 'há 15 min')
  assert.equal(formatElapsedSince('2026-08-27T12:00:00.000Z', new Date('2026-08-27T15:00:00.000Z')), 'há 3h')
  assert.equal(formatElapsedSince(null, new Date('2026-08-27T15:00:00.000Z')), 'tempo não informado')
})
