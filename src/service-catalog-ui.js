import { supabase } from './supabase-client.js'
globalThis.__serviceCatalog = []
async function reloadCatalog() {
  const companyId=globalThis.__sessionProfile?.company_id
  if(!companyId)return
  const {data,error}=await supabase.from('service_catalog').select('id,name,description,price,duration_minutes').eq('company_id',companyId).eq('active',true).order('name')
  if(error)throw Error(error.message)
  if(companyId!==globalThis.__sessionProfile?.company_id)return
  globalThis.__serviceCatalog=(data||[]).map(item=>({...item,price:Number(item.price),durationMinutes:item.duration_minutes}))
  document.dispatchEvent(new CustomEvent('service-catalog-changed'))
}
globalThis.__saveServiceInCatalog=async(id,changes)=>{
  const {error}=await supabase.from('service_catalog').upsert({company_id:globalThis.__sessionProfile.company_id,id:id||crypto.randomUUID(),name:changes.name.trim(),description:changes.description.trim(),price:changes.price,duration_minutes:changes.durationMinutes||null,active:true})
  if(error)throw Error(error.message)
  await reloadCatalog()
}
globalThis.__updateServiceInCatalog=globalThis.__saveServiceInCatalog
globalThis.__removeServiceFromCatalog=async(id)=>{
  const {error}=await supabase.from('service_catalog').update({active:false}).eq('id',id).eq('company_id',globalThis.__sessionProfile.company_id)
  if(error)throw Error(error.message)
  await reloadCatalog()
}
document.addEventListener('auth-ready',()=>{globalThis.__serviceCatalog=[];reloadCatalog().catch(error=>globalThis.showToast?.(error.message))})
