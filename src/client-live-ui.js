import { archiveClient, createClient, createWorkOrder, loadClientRecords } from './clients-data.js'
import { supabase } from './supabase-client.js'

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]))
const roleLabel = (role) => ({ administrator: 'Administrador(a)', reception: 'Recepção', employee: 'Funcionário' }[role] || role)
const announce = (message) => { const toast = document.querySelector('#toast'); if (!toast) return; toast.textContent = message; toast.classList.remove('hidden'); toast.classList.add('show'); setTimeout(() => toast.classList.add('hidden'), 3500) }
const profile = () => globalThis.__sessionProfile

function renderLiveClients(section = document.querySelector('#clients-section')) {
  const records = globalThis.__clientRecords || []
  if (!section) return
  section.innerHTML = `<div class="page-heading"><div><p class="eyebrow">BASE DE RELACIONAMENTO</p><h1>Clientes e veículos</h1><p class="muted">Cadastros, veículos vinculados e histórico de serviços reais.</p></div><button class="primary-button" id="client-new-record">+ Cadastrar cliente</button></div><div class="client-summary"><div><span>Clientes ativos</span><b>${String(records.length).padStart(2, '0')}</b><small>com cadastro completo</small></div><div><span>Veículos registrados</span><b>${String(records.reduce((total, record) => total + record.vehicles.length, 0)).padStart(2, '0')}</b><small>vinculados aos clientes ativos</small></div><div><span>Retornos previstos</span><b>${String(records.reduce((total, record) => total + (record.orders || []).filter((order) => order.status === 'scheduled').length, 0)).padStart(2, '0')}</b><small>ordens agendadas</small></div></div><div class="client-directory"><div class="directory-toolbar"><div><h2>Diretório de clientes</h2><p>Dados carregados diretamente do Supabase.</p></div><input id="client-search" placeholder="Buscar nome, telefone ou placa" /></div><div class="client-directory-heading"><span>CLIENTE</span><span>VEÍCULOS</span><span>HISTÓRICO</span><span>CADASTRO</span><span></span></div>${records.map((record) => `<div class="client-record" data-client-id="${escapeHtml(record.id)}"><div class="client-identity"><span class="person-mark" aria-hidden="true"></span><div><b>${escapeHtml(record.name)}</b><small>${escapeHtml(record.phone || 'Telefone não informado')}</small></div></div><div><b>${record.vehicles.length} ${record.vehicles.length === 1 ? 'veículo' : 'veículos'}</b><small>${escapeHtml(record.vehicles.map((vehicle) => [vehicle.make, vehicle.model, vehicle.license_plate].filter(Boolean).join(' · ')).join(', ') || 'Nenhum veículo')}</small></div><div><b>${record.orderCount} ${record.orderCount === 1 ? 'serviço' : 'serviços'}</b><small>${escapeHtml(record.latestService)}</small></div><div><b>${new Date(record.createdAt).toLocaleDateString('pt-BR')}</b><small>cadastrado em ${new Date(record.createdAt).toLocaleDateString('pt-BR')}</small></div><button class="text-button danger-button" data-client-delete="${escapeHtml(record.id)}">Apagar</button></div>`).join('') || '<p class="dashboard-empty">Nenhum cliente ativo cadastrado.</p>'}</div>`
  section.querySelector('#client-new-record')?.addEventListener('click', () => document.querySelector('#new-client-modal')?.classList.remove('hidden'))
  section.querySelector('#client-search')?.addEventListener('input', (event) => section.querySelectorAll('.client-record').forEach((record) => record.classList.toggle('filtered-out', !record.textContent.toLowerCase().includes(event.target.value.toLowerCase()))))
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
  const records = globalThis.__clientRecords || []
  const clientSelect = form.querySelector('[name="clientId"]'); const vehicleSelect = form.querySelector('[name="vehicleId"]')
  if (clientSelect) { const previous = clientSelect.value; clientSelect.innerHTML = `<option value="">${records.length ? 'Selecione um cliente' : 'Nenhum cliente cadastrado'}</option>${records.map((record) => `<option value="${escapeHtml(record.id)}">${escapeHtml(record.name)}</option>`).join('')}`; if (records.some((record) => record.id === previous)) clientSelect.value = previous }
  if (vehicleSelect && clientSelect) { const selected = records.find((record) => record.id === clientSelect.value); vehicleSelect.disabled = !selected?.vehicles.length; vehicleSelect.innerHTML = `<option value="">${selected?.vehicles.length ? 'Selecione o veículo' : 'Nenhum veículo cadastrado'}</option>${(selected?.vehicles || []).map((vehicle) => `<option value="${escapeHtml(vehicle.id)}">${escapeHtml([vehicle.make, vehicle.model, vehicle.license_plate].filter(Boolean).join(' · '))}</option>`).join('')}` }
  const peopleSelect = form.querySelector('[name="responsibleId"]'); if (peopleSelect && profile()?.company_id) { const { data } = await supabase.from('profiles').select('id, full_name, role').eq('company_id', profile().company_id).eq('active', true).order('full_name'); peopleSelect.innerHTML = `<option value="">Selecione um responsável</option>${(data || []).map((person) => `<option value="${escapeHtml(person.id)}" ${person.id === profile().id ? 'selected' : ''}>${escapeHtml(person.full_name)} · ${escapeHtml(roleLabel(person.role))}</option>`).join('')}` }
  const serviceSelect = form.querySelector('[name="service"]'); const catalog = globalThis.__serviceCatalog || []; if (serviceSelect && catalog.length) { const previousService = serviceSelect.value; serviceSelect.innerHTML = `<option value="">Selecione um serviço</option>${catalog.map((service) => `<option value="${escapeHtml(service.name)}">${escapeHtml(service.name)} · R$ ${Number(service.price).toLocaleString('pt-BR')}</option>`).join('')}`; if (catalog.some((service) => service.name === previousService)) serviceSelect.value = previousService }
}

document.addEventListener('change', (event) => { if (event.target.matches('#service-form [name="clientId"]')) { const record = (globalThis.__clientRecords || []).find((item) => item.id === event.target.value); const select = document.querySelector('#service-form [name="vehicleId"]'); if (!select) return; select.disabled = !record?.vehicles.length; select.innerHTML = `<option value="">${record?.vehicles.length ? 'Selecione o veículo' : 'Nenhum veículo cadastrado'}</option>${(record?.vehicles || []).map((vehicle) => `<option value="${escapeHtml(vehicle.id)}">${escapeHtml([vehicle.make, vehicle.model, vehicle.license_plate].filter(Boolean).join(' · '))}</option>`).join('')}` } })

document.addEventListener('submit', async (event) => {
  if (event.target.id === 'new-client-form') {
    event.preventDefault(); event.stopImmediatePropagation(); const button = event.target.querySelector('button[type="submit"]'); button.disabled = true
    try { await createClient(profile(), Object.fromEntries(new FormData(event.target))); event.target.reset(); document.querySelector('#new-client-modal').classList.add('hidden'); await refreshClientData(); announce('Cliente cadastrado e disponível nos atendimentos e na agenda.') } catch (error) { announce(error.message) } finally { button.disabled = false }
  }
}, true)

document.addEventListener('submit', async (event) => {
  if (event.target.id !== 'service-form') return
  event.preventDefault(); event.stopImmediatePropagation(); const form = event.target; const button = form.querySelector('button[type="submit"]'); const message = form.querySelector('#service-message'); const values = Object.fromEntries(new FormData(form)); button.disabled = true; message.textContent = ''
  try { await createWorkOrder(profile(), { clientId: values.clientId, vehicleId: values.vehicleId, responsibleId: values.responsibleId, service: values.service }); document.querySelector('#service-modal').classList.add('hidden'); form.reset(); document.dispatchEvent(new CustomEvent('live-data-refresh-requested')); announce('Atendimento agendado. O link ficará disponível quando o veículo entrar na estética.') } catch (error) { message.textContent = error.message; button.disabled = false }
}, true)

document.addEventListener('live-data-ready', (event) => { if (event.detail.clientRecords) { globalThis.__clientRecords = event.detail.clientRecords; if (document.querySelector('#clients-section:not(.hidden)')) renderLiveClients(); refreshServiceOptions() } })
document.addEventListener('auth-ready', async () => { try { globalThis.__clientRecords = await loadClientRecords(profile()); refreshServiceOptions() } catch {} })
document.addEventListener('service-catalog-changed', refreshServiceOptions)
globalThis.__renderLiveClients = renderLiveClients
