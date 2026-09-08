async function database(client) { return client || (await import('./supabase-client.js')).supabase }
export function durationForServices(catalog = [], names = []) {
  if (!names.length) return null
  const durations = names.map(name => Number(catalog.find(item => item.name === name)?.durationMinutes))
  return durations.every(value => Number.isInteger(value) && value > 0) ? durations.reduce((a,b)=>a+b,0) : null
}
export async function loadQuotes(profile, client) {
  if (!profile?.company_id) return []
  const db = await database(client)
  const {data,error} = await db.from('sales_quotes').select('*').eq('company_id',profile.company_id).eq('archived',false).neq('status','approved').order('created_at',{ascending:false})
  if (error) throw Error(error.message)
  return data || []
}
export async function saveQuote(profile, quote, client) {
  if (!profile?.company_id) throw Error('Faça login novamente.')
  const db = await database(client)
  const {data,error} = await db.from('sales_quotes').upsert({...quote,company_id:profile.company_id}).select().single()
  if (error) throw Error(error.message)
  return data
}
export async function patchQuote(profile,id,patch,client) {
  const db=await database(client)
  const {data,error}=await db.from('sales_quotes').update(patch).eq('id',id).eq('company_id',profile.company_id).neq('status','approved').select('id').maybeSingle()
  if(error || !data) throw Error(error?.message || 'Esta proposta já foi aprovada ou não está disponível. Atualize a lista.')
}
export async function approveQuote(id,client) {
  const db=await database(client)
  const {data,error}=await db.rpc('approve_sales_quote',{quote_id:id})
  if(error) throw Error(error.message)
  return data
}
export async function checkInBooking(id,client) {
  const db=await database(client)
  const {data,error}=await db.rpc('check_in_booking',{order_id:id})
  if(error) throw Error(error.message)
  return data
}
