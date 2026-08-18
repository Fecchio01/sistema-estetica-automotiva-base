import test from 'node:test'
import assert from 'node:assert/strict'
import { buildBookingPayload, buildScheduledAt, getAgendaReferenceSlots, getWeekDays, getWeekStart } from '../src/agenda-utils.js'

test('fornece várias janelas visuais de referência para cada dia', () => {
  assert.deepEqual(getAgendaReferenceSlots(), ['08:00', '10:00', '13:30', '15:30', '17:00'])
})

test('calcula a semana começando na segunda-feira', () => {
  const start = getWeekStart(new Date('2026-08-16T15:00:00-03:00'))
  assert.equal(start.toISOString(), '2026-08-10T03:00:00.000Z')
  assert.equal(getWeekDays(start).length, 7)
})

test('monta data agendada em ISO e bloqueia datas passadas', () => {
  const result = buildScheduledAt('2099-08-16', '10:30', new Date('2026-08-16T08:00:00-03:00'))
  assert.equal(result, '2099-08-16T13:30:00.000Z')
  assert.throws(() => buildScheduledAt('2020-01-01', '10:30', new Date('2026-08-16T08:00:00-03:00')), /passado/i)
})

test('monta payload da reserva com empresa e responsável', () => {
  const payload = buildBookingPayload({ clientId: 'client-1', vehicleId: 'vehicle-1', responsibleId: 'person-1', service: 'Polimento', scheduledAt: '2099-08-16T13:30:00.000Z' }, { company_id: 'company-1' })
  assert.deepEqual(payload, { company_id: 'company-1', client_id: 'client-1', vehicle_id: 'vehicle-1', responsible_id: 'person-1', status: 'scheduled', scheduled_at: '2099-08-16T13:30:00.000Z', service_description: 'Polimento' })
})
