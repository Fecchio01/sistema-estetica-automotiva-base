import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseVehicle, repeatOrderValues, orderDraftKey, validOrderDraft, findTodayBooking } from '../src/order-assistant.js'
import { buildBookingPayload } from '../src/agenda-utils.js'

test('reaproveita só reserva única do cliente e veículo no dia local, sem adivinhar entre duas',()=>{
  const now=new Date('2026-09-08T01:00:00Z') // ainda dia 7 em São Paulo
  const booking={orderId:'one',clientId:'c',vehicleId:'v',orderStatus:'scheduled',scheduledAt:'2026-09-07T20:00:00Z'}
  assert.equal(findTodayBooking([booking],'c','v',now)?.orderId,'one')
  assert.equal(findTodayBooking([booking],'c','outro',now),null)
  assert.equal(findTodayBooking([booking,{...booking,orderId:'two'}],'c','v',now),null)
  assert.equal(findTodayBooking([{...booking,receivedAt:'2026-09-07T20:00:00Z'}],'c','v',now),null)
  assert.equal(findTodayBooking([{...booking,scheduledAt:'2026-09-08T12:00:00Z'}],'c','v',now),null)
})

test('seleciona veículo único e preserva escolha explícita sem adivinhar entre vários', () => {
  assert.equal(chooseVehicle([{id:'a'}]),'a')
  assert.equal(chooseVehicle([{id:'a'},{id:'b'}]),'')
  assert.equal(chooseVehicle([{id:'a'},{id:'b'}],'b'),'b')
})
test('retorno usa último atendimento válido e catálogo atual, inclusive nome com vírgula', () => {
  const record = {vehicles:[{id:'v'}],orders:[
    {status:'cancelled',created_at:'2026-09-06',service_description:'Removido'},
    {orderStatus:'completed',createdAt:'2026-09-05',service:'Lavagem, cera, Polimento',vehicleId:'v'},
  ]}
  assert.deepEqual(repeatOrderValues(record,[{name:'Lavagem, cera'},{name:'Polimento'}]),{vehicleId:'v',services:['Lavagem, cera','Polimento']})
  assert.equal(repeatOrderValues(record,[{name:'Polimento'}]),null)
})
test('repetir serviço aceita ordens reais normalizadas ou vindas diretamente do banco', () => {
  const record = { vehicles: [{ id: 'v' }], orders: [{ status: 'completed', created_at: '2026-09-07', service_description: 'Lavagem', vehicle_id: 'v' }] }
  assert.deepEqual(repeatOrderValues(record, [{ name: 'Lavagem' }]), { vehicleId: 'v', services: ['Lavagem'] })
})
test('rascunho é isolado por empresa e usuário e rejeita dados obsoletos', () => {
  assert.notEqual(orderDraftKey({company_id:'a',id:'x'}),orderDraftKey({company_id:'b',id:'x'}))
  assert.equal(orderDraftKey({}),null)
  const records=[{id:'c',vehicles:[{id:'v'}]}]
  const draft={savedAt:100,clientId:'c',vehicleId:'removed',responsibleId:'removed',services:['Active','Old']}
  assert.deepEqual(validOrderDraft(draft,records,[{name:'Active'}],[],101),{clientId:'c',vehicleId:'v',responsibleId:'',services:['Active'],requestId:null})
  assert.equal(validOrderDraft(draft,records,[],[],8*86400000),null)
  assert.equal(validOrderDraft({...draft,clientId:'other'},records,[],[],101),null)
})
test('agenda leva o valor calculado do catálogo para a ordem', () => {
  const payload=buildBookingPayload({clientId:'c',vehicleId:'v',responsibleId:'p',service:'Lavagem',scheduledAt:'2099-01-01',totalAmount:120},{company_id:'a'})
  assert.equal(payload.total_amount,120)
})
