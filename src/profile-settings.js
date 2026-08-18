import { supabase } from './supabase-client.js'

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char])

function mountProfileSettings() {
  const action = document.querySelector('#generic-action')
  const content = document.querySelector('#module-content')
  if (!action || !content || action.dataset.module !== 'configuracoes' || content.querySelector('#profile-settings-panel')) return
  const currentName = globalThis.__sessionProfile?.full_name || document.querySelector('#profile-name')?.textContent || ''
  content.insertAdjacentHTML('beforeend', `<section class="module-panel" id="profile-settings-panel"><div class="module-toolbar"><div><h2>Configurações do perfil</h2><p class="muted">Altere o nome que aparece para a equipe.</p></div></div><form id="profile-settings-form" class="profile-settings-form"><label>Nome de exibição<input name="fullName" required minlength="2" maxlength="160" value="${escapeHtml(currentName)}" /></label><div class="form-actions"><button class="primary-button" type="submit">Salvar nome</button></div><p class="auth-message" id="profile-settings-message" role="alert"></p></form></section>`)
  content.querySelector('#profile-settings-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const button = form.querySelector('button[type=submit]')
    const message = form.querySelector('#profile-settings-message')
    button.disabled = true
    message.textContent = 'Salvando…'
    const fullName = new FormData(form).get('fullName')
    const { data, error } = await supabase.functions.invoke('profile-update', { body: { fullName } })
    if (error) {
      let detail = ''
      try { detail = (await error.context?.json())?.error ?? '' } catch {}
      message.textContent = detail || 'Não foi possível atualizar o perfil.'
    } else {
      const profile = data.profile
      globalThis.__sessionProfile = { ...globalThis.__sessionProfile, ...profile }
      document.querySelector('#profile-name').textContent = profile.full_name
      document.querySelector('#profile-avatar').textContent = profile.full_name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
      document.querySelectorAll('.avatar-small').forEach((avatar) => { avatar.textContent = profile.full_name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() })
      const dashboardTitle = document.querySelector('#dashboard-section .page-heading h1')
      if (dashboardTitle) dashboardTitle.textContent = `Bom dia, ${profile.full_name}.`
      message.textContent = 'Nome atualizado com sucesso.'
    }
    button.disabled = false
  })
}

const observer = new MutationObserver(mountProfileSettings)
observer.observe(document.body, { childList: true, subtree: true })
mountProfileSettings()
