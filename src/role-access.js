import { canCreateSection, canViewSection } from './permissions.js'

globalThis.__canViewSection = canViewSection
globalThis.__canCreateSection = canCreateSection

const applyRoleAccess = (profile) => {
  const role = profile?.role
  if (!role) return
  globalThis.__activeRole = role
  document.querySelectorAll('.nav-item').forEach((item) => { item.classList.toggle('hidden', !canViewSection(role, item.dataset.section)) })
  const employeePreview = document.querySelector('#employee-preview')
  if (role === 'employee') employeePreview?.click()
  employeePreview?.classList.add('hidden')
  document.querySelector('#client-preview')?.classList.add('hidden')
  const returnButton = document.querySelector('#return-admin')
  returnButton?.classList.remove('hidden')
  if (role === 'employee' && returnButton) {
    returnButton.textContent = 'Sair do sistema'
    returnButton.onclick = () => document.querySelector('#logout-button')?.click()
  }
  if (role === 'employee') {
    document.dispatchEvent(new CustomEvent('role-screen-request', { detail: 'employee' }))
  } else {
    document.querySelector('#role-screen')?.classList.add('hidden')
    document.dispatchEvent(new CustomEvent('section-request', { detail: 'visao-geral' }))
  }
}

document.addEventListener('auth-ready', (event) => applyRoleAccess(event.detail))
