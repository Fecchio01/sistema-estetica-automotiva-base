import { isClientPortalPath } from './portal-route.js'
import { PORTAL_STAGES, getPortalStageIndex } from './portal-stages.js'
import { PHOTO_CHECKLIST_STAGES, groupPhotosByChecklistStage } from './photo-checklist.js'

if (isClientPortalPath(window.location.pathname)) {
  const token = decodeURIComponent(window.location.pathname.split('/').filter(Boolean)[1])
  document.body.classList.add('public-portal-mode')
  document.querySelector('#auth-screen')?.classList.add('hidden')
  document.querySelector('#app-shell')?.classList.add('hidden')
  document.querySelector('#role-screen')?.classList.add('hidden')
  document.querySelectorAll('.modal-backdrop').forEach((modal) => modal.classList.add('hidden'))
  const portal = document.createElement('main')
  portal.className = 'public-portal-page'
  portal.innerHTML = '<div class="public-portal-card"><div class="portal-brand"><span class="brand-mark">AO</span><div><b>Atelier OS</b><small>Acompanhamento do veículo</small></div></div><div id="public-portal-content"><p>Carregando o acompanhamento...</p></div></div>'
  document.body.appendChild(portal)
  const content = portal.querySelector('#public-portal-content')
  const endpoint = `https://qqrbfpdenhhellgbgimo.supabase.co/functions/v1/client-portal?token=${encodeURIComponent(token)}`
  fetch(endpoint).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Link inválido.')
    const statusLabel = { scheduled: 'Recebido', in_progress: 'Em andamento', completed: 'Finalizado', cancelled: 'Cancelado' }[data.order.status] || 'Em acompanhamento'
    const vehicle = data.vehicle ? `${data.vehicle.make} ${data.vehicle.model}${data.vehicle.licensePlate ? ` · ${data.vehicle.licensePlate}` : ''}` : 'Veículo não informado'
    const currentStage = getPortalStageIndex(data.order.status)
    const timeline = PORTAL_STAGES.map((stage, index) => {
      const done = index < currentStage
      const current = index === currentStage
      const detail = current
        ? data.order.status === 'completed' ? 'Serviço concluído' : data.order.status === 'scheduled' ? 'Veículo recebido' : 'Serviço em andamento'
        : done ? 'Etapa concluída' : 'Aguardando próxima etapa'
      return `<div class="timeline-item ${done ? 'done' : ''} ${current ? 'current' : ''}"><span>${done ? '✓' : String(index + 1).padStart(2, '0')}</span><div><b>${stage}</b><small>${detail}</small></div></div>`
    }).join('')
    const photos = (data.photos || []).filter((photo) => photo.url)
    const groups = groupPhotosByChecklistStage(photos)
    const photoMarkup = PHOTO_CHECKLIST_STAGES.map(({ id, label, hint }) => `<section class="photo-checklist-stage"><div class="photo-checklist-heading"><div><b>${label}</b><small>${hint}</small></div><span>${groups[id].length} ${groups[id].length === 1 ? 'foto' : 'fotos'}</span></div><div class="photo-grid">${groups[id].map((photo) => `<figure><img src="${photo.url}" alt="Foto do veículo na etapa ${label.toLowerCase()}" /><figcaption>${photo.caption || 'Registro do atendimento'}</figcaption></figure>`).join('') || '<p class="photo-stage-empty">Nenhuma foto registrada nesta etapa.</p>'}</div></section>`).join('') + (groups.general.length ? `<section class="photo-checklist-stage"><div class="photo-checklist-heading"><div><b>Registro geral</b><small>Fotos antigas sem etapa definida.</small></div><span>${groups.general.length} fotos</span></div><div class="photo-grid">${groups.general.map((photo) => `<figure><img src="${photo.url}" alt="Foto adicional do veículo" /><figcaption>${photo.caption || 'Registro do atendimento'}</figcaption></figure>`).join('')}</div></section>` : '')
    content.innerHTML = `<p class="eyebrow">ACOMPANHAMENTO DO VEÍCULO</p><h1>${data.client.name}</h1><p class="public-portal-vehicle">${vehicle}</p><span class="status-pill in-progress">${statusLabel}</span><section class="public-portal-service"><small>Serviço</small><b>${data.order.service}</b>${data.order.scheduledAt ? `<small>Horário: ${new Date(data.order.scheduledAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</small>` : ''}</section><div class="timeline">${timeline}</div><section class="portal-photos public-portal-photos"><div class="portal-section-heading"><div><p class="eyebrow">CHECKLIST VISUAL</p><h3>Fotos por etapa</h3></div><span class="photo-count">${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'}</span></div><div class="photo-checklist">${photoMarkup}</div></section><p class="public-portal-note">Este acompanhamento é atualizado pela equipe da estética.</p>`
  }).catch((error) => { content.innerHTML = `<div class="empty-panel"><h2>Link indisponível</h2><p>${error.message}</p><a href="/">Voltar</a></div>` })
}
