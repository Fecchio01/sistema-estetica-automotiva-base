import { archiveClient, createClient, createVehicle, createWorkOrder, loadClientRecords } from './clients-data.js'
import { supabase } from './supabase-client.js'

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]))
const roleLabel = (role) => ({ administrator: 'Administrador(a)', reception: 'Recepção', employee: 'Funcionário' }[role] || role)
const announce = (message) => { const toast = document.querySelector('#toast'); if (!toast) return; toast.textContent = message; toast.classList.remove('hidden'); toast.classList.add('show'); setTimeout(() => toast.classList.add('hidden'), 3500) }
const profile = () => globalThis.__sessionProfile

function clientHistoryMarkup(record) {
  const orders = record?.orders || []
  return orders.length ? orders.map((order) => `<div class="client-history-row"><div><b>${escapeHtml(order.service_description || 'Serviço não informado')}</b><small>${order.created_at ? new Date(order.created_at).toLocaleString('pt-BR') : 'Data não informada'} · ${escapeHtml(order.status || 'Agendado')}</small></div><strong>${Number(order.total_amount || 0) ? `R$ ${Number(order.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sem valor'}</strong></div>`).join('') : '<p class="dashboard-empty">Nenhum serviço registrado para este cliente.</p>'
}

function showClientDetails(record) {
  let modal = document.querySelector('#client-details-modal')
  if (!modal) { modal = document.createElement('div'); modal.id = 'client-details-modal'; modal.className = 'modal-backdrop'; document.body.appendChild(modal) }
  modal.dataset.clientId = record.id
  modal.innerHTML = `<div class="modal client-details-modal"><button class="close-button" data-client-details-close>×</button><p class="eyebrow">FICHA DO CLIENTE</p><h2>${escapeHtml(record.name)}</h2><p class="muted">${escapeHtml(record.phone || 'Telefone não informado')} · Cliente desde ${new Date(record.createdAt).toLocaleDateString('pt-BR')}</p><div class="client-details-grid"><section><h3>Veículos</h3>${record.vehicles.length ? record.vehicles.map((vehicle) => `<div class="data-line"><div><b>${escapeHtml([vehicle.make, vehicle.model].filter(Boolean).join(' · ') || 'Veículo')}</b><small>${escapeHtml(vehicle.license_plate || 'Placa não informada')}</small></div></div>`).join('') : '<p class="dashboard-empty">Nenhum veículo cadastrado.</p>'}</section><section><h3>Histórico de serviços</h3><div class="client-history-list">${clientHistoryMarkup(record)}</div></section></div><div class="form-actions"><button class="outline-button" data-client-details-close>Fechar</button><button class="primary-button" data-client-new-order="${escapeHtml(record.id)}">Novo atendimento</button></div></div>`
  const vehicleSection = modal.querySelector('.client-details-grid section')
  vehicleSection?.insertAdjacentHTML('beforeend', `<button type="button" class="outline-button client-add-vehicle" data-add-vehicle>+ Adicionar veículo</button>`)
  modal.classList.remove('hidden')
  modal.querySelectorAll('[data-client-details-close]').forEach((button) => button.addEventListener('click', () => modal.classList.add('hidden')))
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.add('hidden') }, { once: true })
  modal.querySelector('[data-client-new-order]')?.addEventListener('click', () => { modal.classList.add('hidden'); globalThis.__prepareServiceSubmission?.(); document.querySelector('#service-modal')?.classList.remove('hidden'); const select = document.querySelector('#service-form [name="clientId"]'); if (select) { select.value = record.id; select.dispatchEvent(new Event('change', { bubbles: true })) } })
  modal.querySelector('[data-add-vehicle]')?.addEventListener('click', () => { if (modal.querySelector('#new-vehicle-form')) return; vehicleSection?.insertAdjacentHTML('beforeend', '<form id="new-vehicle-form" class="inline-vehicle-form"><label>Marca<input name="make" required placeholder="Ex.: Honda" /></label><label>Modelo<input name="model" required placeholder="Ex.: Civic" /></label><label>Placa<input name="licensePlate" placeholder="Ex.: ABC1D23" /></label><div class="form-actions"><button type="submit" class="primary-button">Salvar veículo</button></div></form>'); modal.querySelector('#new-vehicle-form input')?.focus() })
}

function renderLiveClients(section = document.querySelector('#clients-section')) {
  const records = globalThis.__clientRecords || []
  if (!section) return
  section.innerHTML = `<div class="page-heading"><div><p class="eyebrow">BASE DE RELACIONAMENTO</p><h1>Clientes e veículos</h1><p class="muted">Cadastros, veículos vinculados e histórico de serviços reais.</p></div><button class="primary-button" id="client-new-record">+ Cadastrar cliente</button></div><div class="client-summary"><div><span>Clientes ativos</span><b>${String(records.length).padStart(2, '0')}</b><small>com cadastro completo</small></div><div><span>Veículos registrados</span><b>${String(records.reduce((total, record) => total + record.vehicles.length, 0)).padStart(2, '0')}</b><small>vinculados aos clientes ativos</small></div><div><span>Retornos previstos</span><b>${String(records.reduce((total, record) => total + (record.orders || []).filter((order) => order.status === 'scheduled').length, 0)).padStart(2, '0')}</b><small>ordens agendadas</small></div></div><div class="client-directory"><div class="directory-toolbar"><div><h2>Diretório de clientes</h2><p>Clique em um cadastro para ver dados e histórico em tempo real.</p></div><input id="client-search" placeholder="Buscar nome, telefone ou placa" /></div><div class="client-directory-heading"><span>CLIENTE</span><span>VEÍCULOS</span><span>HISTÓRICO</span><span>CADASTRO</span><span></span></div>${records.map((record) => `<div class="client-record" data-client-id="${escapeHtml(record.id)}" tabindex="0" role="button"><div class="client-identity"><span class="person-mark" aria-hidden="true"></span><div><b>${escapeHtml(record.name)}</b><small>${escapeHtml(record.phone || 'Telefone não informado')}</small></div></div><div><b>${record.vehicles.length} ${record.vehicles.length === 1 ? 'veículo' : 'veículos'}</b><small>${escapeHtml(record.vehicles.map((vehicle) => [vehicle.make, vehicle.model, vehicle.license_plate].filter(Boolean).join(' · ')).join(', ') || 'Nenhum veículo')}</small></div><div><b>${record.orderCount} ${record.orderCount === 1 ? 'serviço' : 'serviços'}</b><small>${escapeHtml(record.latestService)}</small></div><div><b>${new Date(record.createdAt).toLocaleDateString('pt-BR')}</b><small>cadastrado em ${new Date(record.createdAt).toLocaleDateString('pt-BR')}</small></div><button class="text-button danger-button" data-client-delete="${escapeHtml(record.id)}">Apagar</button></div>`).join('') || '<p class="dashboard-empty">Nenhum cliente ativo cadastrado.</p>'}</div>`
  section.innerHTML = section.innerHTML.replace('BASE DE RELACIONAMENTO', 'CLIENTES')
  section.querySelector('#client-new-record')?.addEventListener('click', () => document.querySelector('#new-client-modal')?.classList.remove('hidden'))
  section.querySelector('#client-search')?.addEventListener('input', (event) => section.querySelectorAll('.client-record').forEach((record) => record.classList.toggle('filtered-out', !record.textContent.toLowerCase().includes(event.target.value.toLowerCase()))))
  section.querySelectorAll('.client-record').forEach((element) => { const record = records.find((item) => item.id === element.dataset.clientId); element.addEventListener('click', (event) => { if (event.target.closest('[data-client-delete]')) return; showClientDetails(record) }); element.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showClientDetails(record) } }) })
  section.querySelectorAll('[data-client-delete]').forEach((button) => button.addEventListener('click', async () => { if (!(await globalThis.__requestConfirmation?.('client'))) return; button.disabled = true; try { await archiveClient(profile(), button.dataset.clientDelete); await refreshClientData(); announce('Cliente arquivado e removido das novas operações.') } catch (error) { announce(error.message) } finally { button.disabled = false } }))
}

async function refreshClientData() {
  globalThis.__clientRecords = await loadClientRecords(profile())
  renderLiveClients()
  document.dispatchEvent(new CustomEvent('live-data-refresh-requested'))
  refreshServiceOptions()
}

async function refreshServiceOptions() {
  const form = document.querySelector('#service-form'); if (!form) return
  const legacyServiceSelect = form.querySelector('[name="services"]'); if (legacyServiceSelect && !form.querySelector('[data-service-choices]')) { const choices = document.createElement('div'); choices.className = 'service-choice-grid'; choices.dataset.serviceChoices = 'true'; legacyServiceSelect.required = false; legacyServiceSelect.closest('label')?.after(choices); legacyServiceSelect.closest('label')?.classList.add('hidden') }
  const records = globalThis.__clientRecords || []
  const clientSelect = form.querySelector('[name="clientId"]'); const vehicleSelect = form.querySelector('[name="vehicleId"]')
  if (clientSelect) { const previous = clientSelect.value; clientSelect.innerHTML = `<option value="">${records.length ? 'Selecione um cliente' : 'Nenhum cliente cadastrado'}</option>${records.map((record) => `<option value="${escapeHtml(record.id)}">${escapeHtml(record.name)}</option>`).join('')}`; if (records.some((record) => record.id === previous)) clientSelect.value = previous }
  if (vehicleSelect && clientSelect) { const selected = records.find((record) => record.id === clientSelect.value); vehicleSelect.disabled = !selected?.vehicles.length; vehicleSelect.innerHTML = `<option value="">${selected?.vehicles.length ? 'Selecione o veículo' : 'Nenhum veículo cadastrado'}</option>${(selected?.vehicles || []).map((vehicle) => `<option value="${escapeHtml(vehicle.id)}">${escapeHtml([vehicle.make, vehicle.model, vehicle.license_plate].filter(Boolean).join(' · '))}</option>`).join('')}` }
  const peopleSelect = form.querySelector('[name="responsibleId"]'); if (peopleSelect && profile()?.company_id) { const { data } = await supabase.from('profiles').select('id, full_name, role').eq('company_id', profile().company_id).eq('active', true).order('full_name'); peopleSelect.innerHTML = `<option value="">Selecione um responsável</option>${(data || []).map((person) => `<option value="${escapeHtml(person.id)}" ${person.id === profile().id ? 'selected' : ''}>${escapeHtml(person.full_name)} · ${escapeHtml(roleLabel(person.role))}</option>`).join('')}` }
  const serviceChoices = form.querySelector('[data-service-choices]'); const serviceSelect = form.querySelector('[name="services"]') || form.querySelector('[name="service"]'); const catalog = globalThis.__serviceCatalog || []; if (serviceChoices) { const previousServices = [...form.querySelectorAll('[name="services"]:checked')].map((input) => input.value); serviceChoices.innerHTML = catalog.length ? catalog.map((service) => `<label class="service-choice"><input type="checkbox" name="services" value="${escapeHtml(service.name)}" ${previousServices.includes(service.name) ? 'checked' : ''}><span><b>${escapeHtml(service.name)}</b><small>R$ ${Number(service.price).toLocaleString('pt-BR')}</small></span></label>`).join('') : '<p class="dashboard-empty">Cadastre um serviço no catálogo antes de abrir o atendimento.</p>' } else if (serviceSelect && catalog.length) { const previousServices = [...serviceSelect.selectedOptions].map((option) => option.value); serviceSelect.innerHTML = `${serviceSelect.multiple ? '' : '<option value="">Selecione um serviço</option>'}${catalog.map((service) => `<option value="${escapeHtml(service.name)}">${escapeHtml(service.name)} · R$ ${Number(service.price).toLocaleString('pt-BR')}</option>`).join('')}`; previousServices.forEach((value) => { const option = [...serviceSelect.options].find((item) => item.value === value); if (option) option.selected = true }) }
}

document.addEventListener('change', (event) => { if (event.target.matches('#service-form [name="clientId"]')) { const record = (globalThis.__clientRecords || []).find((item) => item.id === event.target.value); const select = document.querySelector('#service-form [name="vehicleId"]'); if (!select) return; select.disabled = !record?.vehicles.length; select.innerHTML = `<option value="">${record?.vehicles.length ? 'Selecione o veículo' : 'Nenhum veículo cadastrado'}</option>${(record?.vehicles || []).map((vehicle) => `<option value="${escapeHtml(vehicle.id)}">${escapeHtml([vehicle.make, vehicle.model, vehicle.license_plate].filter(Boolean).join(' · '))}</option>`).join('')}` } })

globalThis.__prepareServiceSubmission = () => { const form = document.querySelector('#service-form'); if (!form) return; form.dataset.requestId = crypto.randomUUID(); form.dataset.submitting = 'false'; globalThis.__lastServiceSubmission = null }

document.addEventListener('submit', async (event) => {
  if (event.target.id === 'new-client-form') {
    event.preventDefault(); event.stopImmediatePropagation(); const button = event.target.querySelector('button[type="submit"]'); button.disabled = true
    try { await createClient(profile(), Object.fromEntries(new FormData(event.target))); event.target.reset(); document.querySelector('#new-client-modal').classList.add('hidden'); await refreshClientData(); announce('Cliente cadastrado e disponível nos atendimentos e na agenda.') } catch (error) { announce(error.message) } finally { button.disabled = false }
  }
}, true)

document.addEventListener('submit', async (event) => {
  if (event.target.id !== 'new-vehicle-form') return
  event.preventDefault(); event.stopImmediatePropagation()
  const form = event.target; const button = form.querySelector('button[type="submit"]'); button.disabled = true
  const clientId = document.querySelector('#client-details-modal')?.dataset.clientId
  try { await createVehicle(profile(), clientId, Object.fromEntries(new FormData(form))); await refreshClientData(); const updated = (globalThis.__clientRecords || []).find((record) => record.id === clientId); if (updated) showClientDetails(updated); announce('Veículo adicionado ao cliente.') } catch (error) { announce(error.message); button.disabled = false }
}, true)

document.addEventListener('submit', async (event) => {
  if (event.target.id !== 'service-form') return
  event.preventDefault(); event.stopImmediatePropagation()
  const form = event.target
  if (form.dataset.submitting === 'true' || globalThis.__serviceSubmissionInFlight) return
  const values = Object.fromEntries(new FormData(form))
  const serviceSelect = form.querySelector('[name="services"]') || form.querySelector('[name="service"]'); const services = form.querySelectorAll('[name="services"]:checked').length ? [...form.querySelectorAll('[name="services"]:checked')].map((input) => input.value) : (serviceSelect?.multiple ? [...serviceSelect.selectedOptions].map((option) => option.value) : [values.service]);
  const fingerprint = JSON.stringify({ clientId: values.clientId, vehicleId: values.vehicleId, responsibleId: values.responsibleId, services: services.filter(Boolean).sort() })
  const previous = globalThis.__lastServiceSubmission
  if (previous?.fingerprint === fingerprint && Date.now() - previous.createdAt < 10000) return
  form.dataset.submitting = 'true'
  globalThis.__serviceSubmissionInFlight = true
  const requestId = form.dataset.requestId || crypto.randomUUID()
  form.dataset.requestId = requestId
  const button = form.querySelector('button[type="submit"]'); const message = form.querySelector('#service-message'); button.disabled = true; message.textContent = ''
  try { const createdOrder = await createWorkOrder(profile(), { id: requestId, clientId: values.clientId, vehicleId: values.vehicleId, responsibleId: values.responsibleId, services, status: 'scheduled', scheduledAt: null }); globalThis.__lastServiceSubmission = { fingerprint, createdAt: Date.now() }; globalThis.__addLiveWorkOrder?.(createdOrder); document.querySelector('#service-modal').classList.add('hidden'); form.reset(); button.disabled = false; document.dispatchEvent(new CustomEvent('live-data-refresh-requested')); announce('Atendimento recebido e sincronizando com a operação.') } catch (error) { message.textContent = error.message; button.disabled = false } finally { form.dataset.submitting = 'false'; globalThis.__serviceSubmissionInFlight = false }
}, true)

document.addEventListener('live-data-ready', (event) => { if (event.detail.clientRecords) { globalThis.__clientRecords = event.detail.clientRecords; if (document.querySelector('#clients-section:not(.hidden)')) renderLiveClients(); refreshServiceOptions() } })
document.addEventListener('auth-ready', async () => { try { globalThis.__clientRecords = await loadClientRecords(profile()); refreshServiceOptions() } catch {} })
document.addEventListener('service-catalog-changed', refreshServiceOptions)
globalThis.__renderLiveClients = renderLiveClients
globalThis.__refreshClientData = refreshClientData
globalThis.__refreshServiceOptions = refreshServiceOptions
