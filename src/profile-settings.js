import { supabase } from './supabase-client.js'
import { normalizeOperationalPreferences, validatePasswordChange } from './settings.js'

const preferencesKey = 'atelier-operational-preferences'
const notify = (message) => { const toast = document.querySelector('#toast'); if (toast) { toast.textContent = message; toast.classList.remove('hidden'); toast.classList.add('show'); setTimeout(() => toast.classList.add('hidden'), 3200) } }

function readPreferences() {
  try { return normalizeOperationalPreferences(JSON.parse(localStorage.getItem(preferencesKey) || '{}')) } catch { return normalizeOperationalPreferences() }
}

function mountSettings() {
  const content = document.querySelector('#module-content')
  if (!content || !content.querySelector('.settings-shell')) return
  const profileForm = content.querySelector('#settings-profile-form')
  if (!profileForm || profileForm.dataset.bound === 'true') return
  profileForm.dataset.bound = 'true'
  const passwordForm = content.querySelector('#settings-password-form')
  const operationalForm = content.querySelector('#settings-operational-form')
  const profile = globalThis.__sessionProfile || {}
  profileForm.elements.fullName.value = profile.full_name || document.querySelector('#profile-name')?.textContent || ''
  const preferences = readPreferences()
  Object.entries(preferences).forEach(([name, checked]) => { if (operationalForm.elements[name]) operationalForm.elements[name].checked = checked })
  profileForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const button = profileForm.querySelector('button[type=submit]')
    button.disabled = true
    const { data, error } = await supabase.functions.invoke('profile-update', { body: { fullName: new FormData(profileForm).get('fullName') } })
    if (error) { notify('Não foi possível atualizar o nome agora.') } else {
      const updated = data.profile
      globalThis.__sessionProfile = { ...globalThis.__sessionProfile, ...updated }
      document.querySelector('#profile-name').textContent = updated.full_name
      document.querySelector('#profile-avatar').textContent = updated.full_name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
      notify('Nome atualizado com sucesso.')
    }
    button.disabled = false
  })
  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const values = new FormData(passwordForm)
    const message = passwordForm.querySelector('[data-settings-password-message]')
    const validation = validatePasswordChange(values.get('password'), values.get('confirmation'))
    if (validation) { message.textContent = validation; return }
    const button = passwordForm.querySelector('button[type=submit]')
    button.disabled = true
    const { error } = await supabase.auth.updateUser({ password: values.get('password') })
    message.textContent = error ? 'Não foi possível alterar a senha agora.' : 'Senha alterada com sucesso.'
    if (!error) passwordForm.reset()
    button.disabled = false
  })
  operationalForm.addEventListener('submit', (event) => {
    event.preventDefault()
    const saved = normalizeOperationalPreferences({
      notifyStage: operationalForm.elements.notifyStage.checked,
      requireResponsible: operationalForm.elements.requireResponsible.checked,
      requireFinalPhotos: operationalForm.elements.requireFinalPhotos.checked,
    })
    localStorage.setItem(preferencesKey, JSON.stringify(saved))
    globalThis.__operationalPreferences = saved
    content.querySelector('[data-settings-operation-message]').textContent = 'Preferências salvas neste navegador.'
    notify('Preferências operacionais atualizadas.')
  })
}

const observer = new MutationObserver(mountSettings)
observer.observe(document.body, { childList: true, subtree: true })
mountSettings()
