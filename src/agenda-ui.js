import { createBooking, deleteBooking, loadAgendaData } from './agenda-data.js'
import { buildScheduledAt, dateKey, getAgendaReferenceSlots, getWeekDays, getWeekStart } from './agenda-utils.js'

const dayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const state = { weekStart: getWeekStart(), data: null, loading: false }
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]))
const currentProfile = () => globalThis.__sessionProfile
const formatDay = (date) => { const value = dayFormatter.format(date); return value.charAt(0).toUpperCase() + value.slice(1).replace('.', '') }
const addDays = (date, days) => { const next = new Date(date); next.setDate(next.getDate() + days); return next }

function rangeEnd() { return addDays(state.weekStart, 7) }
function vehicleLabel(vehicle) { return [vehicle.make, vehicle.model, vehicle.license_plate].filter(Boolean).join(' · ') }
function clientName(data, id) { return data.clients.find((client) => client.id === id)?.full_name || 'Cliente' }
function orderMarkup(order, data) {
  const vehicle = data.vehicles.find((item) => item.id === order.vehicle_id)
  const person = data.people.find((item) => item.id === order.responsible_id)
  const time = new Date(order.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `<article class="calendar-event calendar-event-card"><div class="calendar-event-topline"><time>${time}</time><span class="calendar-event-status">Agendado</span></div><b>${escapeHtml(clientName(data, order.client_id))}</b><span>${escapeHtml(vehicle ? vehicleLabel(vehicle) : 'Veículo')}</span><small>${escapeHtml(order.service_description)} · Responsável: ${escapeHtml(person?.full_name || 'Não atribuído')}</small><button type="button" class="calendar-event-delete" data-delete-order="${escapeHtml(order.id)}">Apagar agendamento</button></article>`
}

function renderGrid(root) {
  const days = getWeekDays(state.weekStart)
  const data = state.data || { orders: [], clients: [], vehicles: [], people: [] }
  const ordersByDay = new Map()
  data.orders.forEach((order) => { const key = dateKey(order.scheduled_at); ordersByDay.set(key, [...(ordersByDay.get(key) || []), order]) })
  const referenceSlots = getAgendaReferenceSlots()
  const heading = `${days[0].getDate()} a ${days[6].getDate()} de ${monthFormatter.format(days[0])}`
  root.innerHTML = `<div class="agenda-live-shell"><div class="agenda-toolbar"><div><p class="eyebrow">AGENDA REAL</p><h2>Semana de ${escapeHtml(heading)}</h2><small class="agenda-sync-status"><span class="sync-dot ${state.loading ? 'is-loading' : ''}"></span>${state.loading ? 'Sincronizando agenda...' : 'Sincronizada em tempo real.'}</small></div><div class="agenda-navigation"><button class="outline-button" data-agenda-nav="previous">← Semana anterior</button><button class="outline-button" data-agenda-nav="today">Hoje</button><button class="outline-button" data-agenda-nav="next">Próxima semana →</button></div></div><div class="calendar-grid agenda-live-grid" data-live-agenda="true">${days.map((day) => { const orders = ordersByDay.get(dateKey(day)) || []; const loadLabel = orders.length ? `${orders.length} ${orders.length === 1 ? 'reserva' : 'reservas'}` : `${referenceSlots.length} janelas`; const slotMarkup = referenceSlots.map((slot) => `<div class="calendar-slot"><time>${slot}</time><span>Disponível</span></div>`).join(''); return `<div class="calendar-day"><div class="calendar-day-heading"><strong>${escapeHtml(formatDay(day))}</strong><small class="calendar-day-load ${orders.length ? 'has-orders' : ''}">${loadLabel}</small></div><div class="calendar-day-body">${orders.map((order) => orderMarkup(order, data)).join('')}${slotMarkup}</div></div>` }).join('')}</div><p class="agenda-empty-state ${data.orders.length ? 'hidden' : ''}"><span class="empty-state-mark">+</span><span><b>Nenhuma reserva nesta semana</b><small>As janelas exibidas são referências; os horários reais dependem da configuração da empresa.</small></span></p></div>`
  root.querySelectorAll('[data-agenda-nav]').forEach((button) => button.addEventListener('click', () => { const action = button.dataset.agendaNav; state.weekStart = action === 'today' ? getWeekStart() : addDays(state.weekStart, action === 'previous' ? -7 : 7); refreshAgenda(root) }))
  root.querySelectorAll('[data-delete-order]').forEach((button) => button.addEventListener('click', async (event) => {
    event.stopPropagation()
    if (!(await globalThis.__requestConfirmation?.('booking'))) return
    button.disabled = true
    try { await deleteBooking(currentProfile(), button.dataset.deleteOrder); await refreshAgenda(root); window.dispatchEvent(new CustomEvent('agenda-booking-deleted')) } catch (error) { button.disabled = false; globalThis.showToast?.(error.message || 'Não foi possível apagar o agendamento.') }
  }))
}

function renderForm(root) {
  const data = state.data || { clients: [], vehicles: [], people: [] }
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const clientOptions = data.clients.map((client) => `<option value="${escapeHtml(client.id)}">${escapeHtml(client.full_name)}</option>`).join('')
  const peopleOptions = data.people.map((person) => `<option value="${escapeHtml(person.id)}" ${person.id === currentProfile()?.id ? 'selected' : ''}>${escapeHtml(person.full_name)} · ${escapeHtml(person.role === 'administrator' ? 'Administrador(a)' : person.role === 'reception' ? 'Recepção' : 'Funcionário')}</option>`).join('')
  root.innerHTML = `<div class="agenda-form-panel"><div class="module-toolbar"><div><p class="eyebrow">NOVA RESERVA</p><h2>Reservar horário</h2><small>Escolha os dados reais da empresa para criar a ordem.</small></div><button class="outline-button" id="agenda-form-close">Cancelar</button></div><form id="agenda-booking-form"><label>Cliente<select name="clientId" required><option value="">Selecione um cliente</option>${clientOptions}</select></label><label>Veículo<select name="vehicleId" required disabled><option value="">Selecione o cliente primeiro</option></select></label><label>Serviço<select name="service" required><option value="">Selecione um serviço</option><option>Detalhamento interno</option><option>Polimento técnico</option><option>Higienização completa</option><option>Proteção cerâmica</option></select></label><label>Responsável<select name="responsibleId" required><option value="">Selecione um responsável</option>${peopleOptions}</select></label><div class="agenda-form-row"><label>Data<input type="date" name="date" min="${today}" required /></label><label>Horário<input type="time" name="time" required /></label></div><p class="auth-message" id="agenda-form-message" role="alert"></p><div class="form-actions"><button type="button" class="outline-button" id="agenda-form-cancel">Cancelar</button><button class="primary-button" type="submit">Salvar reserva</button></div></form></div>`
  const form = root.querySelector('#agenda-booking-form')
  const vehicleSelect = form.querySelector('[name="vehicleId"]')
  form.querySelector('[name="clientId"]').addEventListener('change', (event) => { const vehicles = data.vehicles.filter((vehicle) => vehicle.client_id === event.target.value); vehicleSelect.disabled = !vehicles.length; vehicleSelect.innerHTML = `<option value="">${vehicles.length ? 'Selecione o veículo' : 'Nenhum veículo cadastrado'}</option>${vehicles.map((vehicle) => `<option value="${escapeHtml(vehicle.id)}">${escapeHtml(vehicleLabel(vehicle))}</option>`).join('')}` })
  const close = () => refreshAgenda(root)
  root.querySelectorAll('#agenda-form-close, #agenda-form-cancel').forEach((button) => button.addEventListener('click', close))
  form.addEventListener('submit', async (event) => { event.preventDefault(); const button = form.querySelector('button[type="submit"]'); const message = form.querySelector('#agenda-form-message'); const values = Object.fromEntries(new FormData(form)); message.textContent = ''; button.disabled = true; button.textContent = 'Salvando...'; try { const scheduledAt = buildScheduledAt(values.date, values.time); await createBooking(currentProfile(), { ...values, scheduledAt }); state.weekStart = getWeekStart(new Date(scheduledAt)); await refreshAgenda(root); window.dispatchEvent(new CustomEvent('agenda-booking-created')); } catch (error) { message.textContent = error.message || 'Não foi possível salvar a reserva.'; button.disabled = false; button.textContent = 'Salvar reserva' } })
}

async function refreshAgenda(root) {
  state.loading = true
  renderGrid(root)
  let loaded = false
  try { state.data = await loadAgendaData(currentProfile(), state.weekStart, rangeEnd()); loaded = true } catch (error) { root.innerHTML = `<div class="module-panel"><p class="auth-message">${escapeHtml(error.message)}</p><button class="primary-button" id="agenda-retry">Tentar novamente</button></div>`; root.querySelector('#agenda-retry').addEventListener('click', () => refreshAgenda(root)) } finally { state.loading = false }
  if (loaded) renderGrid(root)
}

export function mountAgenda() {
  const root = document.querySelector('#agenda-root')
  if (!root) return
  refreshAgenda(root)
}

export function openBookingForm() {
  const root = document.querySelector('#agenda-root')
  if (!root) return
  if (!state.data) { refreshAgenda(root).then(() => renderForm(root)); return }
  renderForm(root)
}

window.addEventListener('agenda-requested', mountAgenda)
window.addEventListener('agenda-open-booking', openBookingForm)
