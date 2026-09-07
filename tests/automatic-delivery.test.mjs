import test from 'node:test'
import assert from 'node:assert/strict'
import { processDueAutomaticFollowUps } from '../src/post-sale-automation.js'

function queueClient({ auditFails = false } = {}) {
  const item = { id:'n',company_id:'company',status:'pending',auto_send:true,attempt_count:2,due_at:'2020-01-01',message:'Teste',clients:{phone:'11999990000'} }
  return { item, from(table) {
    if (table === 'post_sale_followup_events') return {insert: async () => ({error:auditFails ? {message:'Audit offline'} : null})}
    let patch, returns=false
    const filters=[]
    const query={
      select(){returns=true;return this},
      update(value){patch=value;return this},
      eq(key,value){filters.push(row=>row[key]===value);return this},
      lte(key,value){filters.push(row=>new Date(row[key])<=new Date(value));return this},
      or(){return this},
      then(resolve,reject){
        const matched=filters.every(filter=>filter(item))
        if(matched && patch) Object.assign(item,patch)
        return Promise.resolve({data:matched && returns ? [{...item}] : [],error:null}).then(resolve,reject)
      }
    }
    return query
  }}
}
const config={baseUrl:'https://test.invalid',apiKey:'test',instance:'test'}
test('duas execuções enviam uma vez e incrementam tentativas corretamente',async()=>{
  const client=queueClient();let sends=0
  const fetchImpl=async url=>{if(!url.includes('connectionState'))sends++;return {ok:true,text:async()=>'{"state":"open"}'}}
  const args={client,config,companyId:'company',fetchImpl,queueTable:'order_notifications'}
  await processDueAutomaticFollowUps(args);await processDueAutomaticFollowUps(args)
  assert.equal(sends,1);assert.equal(client.item.status,'sent');assert.equal(client.item.attempt_count,3)
})
test('falha do histórico após enviar não volta a mensagem para fila',async()=>{
  const client=queueClient({auditFails:true});let sends=0
  const fetchImpl=async url=>{if(!url.includes('connectionState'))sends++;return {ok:true,text:async()=>'{"state":"open"}'}}
  const args={client,config,companyId:'company',fetchImpl}
  await assert.rejects(processDueAutomaticFollowUps(args),/Audit offline/)
  await processDueAutomaticFollowUps(args)
  assert.equal(sends,1);assert.equal(client.item.status,'sent')
})
test('envio incerto pausa para conferência, conexão offline mantém a fila',async()=>{
  const client=queueClient();let sends=0
  const fetchImpl=async url=>{if(!url.includes('connectionState')){sends++;throw Error('Timeout')}return {ok:true,text:async()=>'{"state":"open"}'}}
  const args={client,config,companyId:'company',fetchImpl}
  await processDueAutomaticFollowUps(args);await processDueAutomaticFollowUps(args)
  assert.equal(sends,1);assert.equal(client.item.auto_send,false);assert.match(client.item.last_error,/conferência/)
  const offline=queueClient()
  const result=await processDueAutomaticFollowUps({...args,client:offline,fetchImpl:async()=>({ok:true,text:async()=>'{"state":"closed"}'})})
  assert.equal(result.status,'waiting');assert.equal(offline.item.auto_send,true);assert.equal(offline.item.attempt_count,2)
})
