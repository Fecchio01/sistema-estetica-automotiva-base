import { orderDraftKey, repeatOrderValues, validOrderDraft, findTodayBooking } from './order-assistant.js'
import { checkInBooking } from './workflow-data.js'
import { totalForCatalogServices } from './service-catalog.js'

const selectedServices = (form) => [...form.querySelectorAll('[name="services"]:checked')].map((item) => item.value)
const draftKey = () => orderDraftKey(globalThis.__sessionProfile)
const recordFor = (form) => (globalThis.__clientRecords || []).find((item) => item.id === form.elements.clientId.value)

export function clearOrderDraft() {
  try { const key = draftKey(); if (key) localStorage.removeItem(key) } catch {}
}

function saveDraft(form) {
  const key = draftKey()
  if (!key) return
  if (!form.elements.clientId.value) { clearOrderDraft(); return }
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), requestId: form.dataset.requestId, clientId: form.elements.clientId.value, vehicleId: form.elements.vehicleId.value, responsibleId: form.elements.responsibleId.value, services: selectedServices(form) }))
    form.querySelector('[data-draft-status]').textContent = 'Rascunho salvo neste navegador.'
  } catch { form.querySelector('[data-draft-status]').textContent = 'Não foi possível salvar o rascunho neste navegador.' }
}

export function refreshOrderAssistant(form) {
  if (!form) return
  let panel = form.querySelector('[data-order-assistant]')
  if (!panel) {
    panel = document.createElement('div')
    panel.dataset.orderAssistant = ''
    panel.className = 'order-assistant'
    panel.innerHTML = '<strong data-order-total></strong><small data-order-help></small><div class="form-actions"><button type="button" class="outline-button" data-repeat-order>Repetir último serviço</button><button type="button" class="text-button" data-discard-draft>Limpar rascunho</button></div><small data-draft-status aria-live="polite"></small>'
    form.querySelector('#service-message').before(panel)
    panel.querySelector('[data-repeat-order]').addEventListener('click', () => {
      const values = repeatOrderValues(recordFor(form), globalThis.__serviceCatalog || [])
      if (!values) return
      form.elements.vehicleId.value = values.vehicleId
      form.querySelectorAll('[name="services"][type="checkbox"]').forEach((input) => { input.checked = values.services.includes(input.value) })
      refreshOrderAssistant(form)
      saveDraft(form)
    })
    panel.querySelector('[data-discard-draft]').addEventListener('click', () => {
      clearOrderDraft(); form.reset(); form.dataset.requestId = crypto.randomUUID()
      delete form.elements.responsibleId.dataset.manuallySelected
      globalThis.__refreshServiceOptions?.()
      panel.querySelector('[data-draft-status]').textContent = 'Rascunho limpo.'
    })
  }
  const names = selectedServices(form)
  let bookingButton=panel.querySelector('[data-use-booking]')
  if(!bookingButton){
    bookingButton=document.createElement('button');bookingButton.type='button';bookingButton.className='outline-button';bookingButton.dataset.useBooking=''
    panel.prepend(bookingButton)
    bookingButton.addEventListener('click',async()=>{
      const booking=findTodayBooking(globalThis.__liveServices || [],form.elements.clientId.value,form.elements.vehicleId.value)
      if(!booking)return
      bookingButton.disabled=true
      try{
        const order=await checkInBooking(booking.orderId)
        clearOrderDraft();form.reset();document.querySelector('#service-modal').classList.add('hidden')
        globalThis.__addLiveWorkOrder?.(order)
        document.dispatchEvent(new CustomEvent('live-data-refresh-requested'))
      }catch(error){panel.querySelector('[data-draft-status]').textContent=error.message}
      finally{bookingButton.disabled=false}
    })
  }
  const booking=findTodayBooking(globalThis.__liveServices || [],form.elements.clientId.value,form.elements.vehicleId.value)
  bookingButton.hidden=!booking
  if(booking)bookingButton.textContent=`Reserva de hoje: ${booking.service}. Registrar chegada usando esta ordem`
  panel.querySelector('[data-order-total]').textContent = `Total: ${totalForCatalogServices(globalThis.__serviceCatalog || [], names).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
  panel.querySelector('[data-order-help]').textContent = 'Valor calculado pelo catálogo atual. O responsável é sugerido pela quantidade de ordens abertas; você pode trocar.'
  panel.querySelector('[data-repeat-order]').disabled = !repeatOrderValues(recordFor(form), globalThis.__serviceCatalog || [])
}

export function restoreOrderDraft(form) {
  refreshOrderAssistant(form)
  let draft
  try { draft = validOrderDraft(JSON.parse(localStorage.getItem(draftKey()) || 'null'), globalThis.__clientRecords || [], globalThis.__serviceCatalog || [], globalThis.__teamProfiles || []) } catch {}
  if (!draft) return
  form.elements.clientId.value = draft.clientId
  // Populate the vehicle options before restoring the selection.
  globalThis.__refreshServiceOptions?.()
  form.elements.vehicleId.value = draft.vehicleId
  if (draft.responsibleId) { form.elements.responsibleId.value = draft.responsibleId; form.elements.responsibleId.dataset.manuallySelected = 'true' }
  if (draft.requestId) form.dataset.requestId = draft.requestId
  form.querySelectorAll('[name="services"][type="checkbox"]').forEach((input) => { input.checked = draft.services.includes(input.value) })
  refreshOrderAssistant(form)
  form.querySelector('[data-draft-status]').textContent = 'Rascunho recuperado. Confira os dados antes de criar.'
}

document.addEventListener('change', (event) => {
  const form = event.target.closest('#service-form')
  if (!form) return
  // The client/vehicle handler runs in the same event; save its final values.
  queueMicrotask(() => { refreshOrderAssistant(form); saveDraft(form) })
})
