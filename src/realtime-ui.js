const dateFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const shortDayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long' })
const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1)

function now() { return new Date() }
function updateCurrentDate() {
  const current = now()
  const dashboardDate = document.querySelector('#dashboard-section .page-heading .eyebrow')
  const formattedDate = `${capitalize(dateFormatter.format(current))} · ${timeFormatter.format(current)}`
  if (dashboardDate && dashboardDate.textContent !== formattedDate) dashboardDate.textContent = formattedDate
}
function renderAgendaDays(grid) {
  const start = now()
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(start); date.setHours(0, 0, 0, 0); date.setDate(start.getDate() + index); return date })
  grid.innerHTML = days.map((date, index) => `<div class="calendar-day"><strong>${capitalize(shortDayFormatter.format(date))} · ${String(date.getDate()).padStart(2, '0')}</strong><small>${index === 0 ? 'Hoje' : 'Sem agendamentos'}</small><div class="calendar-event available" data-empty-agenda="true"><b>${index === 0 ? 'Nenhum horário ocupado' : 'Horário livre'}</b>${index === 0 ? 'A agenda está livre hoje.' : 'Disponível para agendamento.'}</div></div>`).join('')
  const panel = grid.closest('.module-panel')
  const heading = panel?.querySelector('h2')
  if (heading) heading.textContent = `Agenda · ${days[0].getDate()} a ${days[6].getDate()} de ${monthFormatter.format(days[0])}`
  grid.dataset.liveAgenda = 'true'
}
function refreshRealtimeUi() {
  updateCurrentDate()
  document.querySelectorAll('.calendar-grid:not([data-live-agenda])').forEach(renderAgendaDays)
}
const observer = new MutationObserver(refreshRealtimeUi)
observer.observe(document.body, { childList: true, subtree: true })
refreshRealtimeUi()
setInterval(refreshRealtimeUi, 60_000)
