import { supabase } from './supabase-client.js'
import { loadSession, signIn, signOut } from './auth.js'
import { isClientPortalPath } from './portal-route.js'

const authScreen = document.querySelector('#auth-screen')
const appShell = document.querySelector('#app-shell')
const form = document.querySelector('#login-form')
const message = document.querySelector('#auth-message')
const publicPortal = isClientPortalPath(window.location.pathname)

if (publicPortal) {
  authScreen.classList.add('hidden')
  appShell.classList.add('hidden')
}

if (window.location.search) window.history.replaceState({}, document.title, window.location.pathname)

function roleLabel(role) { return { administrator: 'Administrador(a)', reception: 'Recepção', employee: 'Funcionário' }[role] ?? role }
function timeGreeting(date = new Date()) { return date.getHours() >= 18 || date.getHours() < 6 ? 'Boa noite' : 'Bom dia' }
globalThis.__timeGreeting = timeGreeting
function showApp(session) {
  if (publicPortal) return
  authScreen.classList.add('hidden'); appShell.classList.remove('hidden')
  globalThis.__sessionProfile = session.profile
  const name = session.profile.full_name || session.user.email
  document.querySelector('#profile-name').textContent = name
  document.querySelector('#profile-role').textContent = roleLabel(session.profile.role)
  document.querySelector('#profile-avatar').textContent = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  document.querySelectorAll('.avatar-small').forEach((avatar) => { avatar.textContent = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() })
  const dashboardTitle = document.querySelector('#dashboard-section .page-heading h1')
  if (dashboardTitle) dashboardTitle.textContent = `${timeGreeting()}, ${name}.`
  document.dispatchEvent(new CustomEvent('auth-ready', { detail: session.profile }))
}
function showLogin(error = '') { if (publicPortal) return; appShell.classList.add('hidden'); authScreen.classList.remove('hidden'); message.textContent = error }

if (!publicPortal) form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const button = form.querySelector('button[type=submit]'); button.disabled = true; message.textContent = 'Validando acesso…'
  const values = new FormData(form)
  try { const session = await signIn(values.get('email'), values.get('password')); form.reset(); showApp(session) }
  catch (error) { showLogin(error.message) }
  finally { button.disabled = false }
})
if (!publicPortal) document.querySelector('#logout-button').addEventListener('click', async () => { await signOut(); showLogin('Você saiu do sistema.') })
supabase.auth.onAuthStateChange((_event, session) => { if (!session) showLogin() })
if (!publicPortal) {
  try { const session = await loadSession(); if (session) showApp(session); else showLogin() }
  catch { showLogin('Não foi possível validar sua sessão.') }
}
