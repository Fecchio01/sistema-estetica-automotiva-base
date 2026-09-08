import test from 'node:test'
import assert from 'node:assert/strict'
import {durationForServices,approveQuote,checkInBooking} from '../src/workflow-data.js'
import {buildOperationalAutomationModel} from '../src/operational-automation.js'

test('prazo só usa duração quando todos os serviços possuem tempo válido',()=>{
  const catalog=[{name:'A',durationMinutes:60},{name:'B',durationMinutes:30},{name:'C'}]
  assert.equal(durationForServices(catalog,['A','B']),90)
  assert.equal(durationForServices(catalog,['A','C']),null)
  assert.equal(durationForServices(catalog,['removido']),null)
  assert.equal(durationForServices(catalog,[]),null)
})
test('operações retornam a ordem persistida e expõem falhas sem simular sucesso',async()=>{
  const db={rpc:async(name,args)=>({data:{id:'existing-order',name,args},error:null})}
  assert.equal((await approveQuote('q',db)).id,'existing-order')
  assert.equal((await checkInBooking('o',db)).id,'existing-order')
  await assert.rejects(approveQuote('q',{rpc:async()=>({error:{message:'Sem permissão'}})}),/Sem permissão/)
})
test('pendências consideram mudança de etapa, previsão e reservas futuras',()=>{
  const now=new Date('2026-09-07T12:00:00Z')
  const alerts=buildOperationalAutomationModel({services:[
    {orderId:'future',orderStatus:'scheduled',scheduledAt:'2026-09-08T10:00:00Z',createdAt:'2026-09-01',responsibleId:'p'},
    {orderId:'recent',orderStatus:'in_progress',createdAt:'2026-09-01',lastStageChangedAt:'2026-09-07T11:59:00Z',responsibleId:'p'},
    {orderId:'late',orderStatus:'in_progress',expectedCompletionAt:'2026-09-07T11:00:00Z',responsibleId:'p'},
    {orderId:'pickup',orderStatus:'ready_for_pickup',createdAt:'2026-09-01',readyAt:'2026-09-07T11:00:00Z',responsibleId:'p'},
  ]},now).alerts
  assert.equal(alerts.some(a=>a.type==='stale'),false)
  assert.equal(alerts.some(a=>a.type==='pickup_waiting'),false)
  assert.deepEqual(alerts.filter(a=>a.type==='estimate_overdue').map(a=>a.orderId),['late'])
})
