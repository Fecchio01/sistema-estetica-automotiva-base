import { supabase } from './supabase-client.js'
import { can } from './permissions.js'

const modal = document.querySelector('#team-modal')
const form = document.querySelector('#team-form')
const message = document.querySelector('#team-message')
const currentRole = () => globalThis.__sessionProfile?.role ?? ({ 'Administrador(a)': 'administrator', Administradora: 'administrator', Recepção: 'reception', Funcionário: 'employee' }[document.querySelector('#profile-role')?.textContent] ?? '')
const open = () => { if (can(currentRole(), 'manageUsers')) modal.classList.remove('hidden') }
document.querySelector('#generic-action')?.addEventListener('click', () => { if (document.querySelector('#generic-action').dataset.module === 'equipe') open() })
document.addEventListener('click', (event) => {
  if (event.target.closest('#new-member')) open()
  const deleteButton = event.target.closest('[data-team-delete]')
  if (deleteButton) { event.preventDefault(); event.stopPropagation(); deleteEmployee(deleteButton.dataset.teamDelete, deleteButton) }
})
document.querySelectorAll('[data-close="team-modal"]').forEach((button) => button.addEventListener('click', () => modal.classList.add('hidden')))
form.addEventListener('submit', async (event) => {
  event.preventDefault(); const button = form.querySelector('button[type=submit]'); button.disabled = true; message.textContent = 'Criando acesso…'
  const data = Object.fromEntries(new FormData(form))
  const { error } = await supabase.functions.invoke('admin-create-user', { body: data })
  if (error) {
    let detail = ''
    try { detail = (await error.context?.json())?.error ?? '' } catch {}
    message.textContent = detail || 'Não foi possível criar o acesso. Tente novamente.'
  }
  else { message.textContent = 'Acesso criado. Entregue a senha ao funcionário com segurança.'; form.reset(); await refreshTeamList(); setTimeout(() => modal.classList.add('hidden'), 1800) }
  button.disabled = false
})

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char])
const roleLabel = (role) => ({ administrator: 'Administrador(a)', reception: 'Recepção', employee: 'Funcionário' }[role] ?? role)
function normalizeAdministratorLabels() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  nodes.forEach((node) => { if (node.nodeValue.includes('Administradora')) node.nodeValue = node.nodeValue.replaceAll('Administradora', 'Administrador(a)') })
}

async function refreshResponsibleOptions() {
  const { data, error } = await supabase.from('profiles').select('full_name, role').eq('active', true).order('full_name')
  if (error || !data?.length) return
  const signature = data.map((profile) => `${profile.full_name}:${profile.role}`).join('|')
  const options = data.map((profile) => `<option value="${escapeHtml(profile.full_name)}">${escapeHtml(profile.full_name)} · ${escapeHtml(roleLabel(profile.role))}</option>`).join('')
  document.querySelectorAll('select[name="responsible"]').forEach((select) => {
    if (select.dataset.teamSignature === signature) return
    const previous = select.value
    select.innerHTML = options
    select.dataset.teamSignature = signature
    if ([...select.options].some((option) => option.value === previous)) select.value = previous
  })
}

async function refreshTeamList() {
  const list = document.querySelector('.permission-list')
  if (!list || !can(currentRole(), 'manageUsers')) return
  const { data, error } = await supabase.from('profiles').select('id, full_name, role, active').order('created_at')
  if (error) return
  list.innerHTML = (data ?? []).map((profile) => `<div class="permission-item"><span class="avatar">${escapeHtml(profile.full_name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase())}</span><div><b>${escapeHtml(profile.full_name)}</b><small>${profile.active ? 'Acesso ativo' : 'Acesso desativado'}</small></div><span class="role-tag">${escapeHtml(roleLabel(profile.role))}</span>${profile.role === 'administrator' ? '' : `<button class="text-button danger-button" data-team-delete="${escapeHtml(profile.id)}">Apagar</button>`}</div>`).join('') || '<p class="muted">Nenhum funcionário cadastrado.</p>'
}

async function deleteEmployee(profileId, button) {
  if (!can(currentRole(), 'manageUsers') || !profileId) { message.textContent = 'Apenas o Administrador(a) pode apagar funcionários.'; return }
  if (!(await globalThis.__requestConfirmation?.('employee'))) return
  if (button) { button.disabled = true; button.textContent = 'Apagando…' }
  try {
    const { data, error } = await supabase.functions.invoke('admin-delete-user', { body: { profileId } })
    if (error) {
      let detail = ''
      try { detail = (await error.context?.json())?.error ?? '' } catch {}
      throw new Error(detail || error.message || 'Não foi possível apagar este funcionário.')
    }
    if (!data?.deleted) throw new Error('O funcionário não foi removido. Tente novamente.')
    await refreshTeamList()
    message.textContent = 'Funcionário removido da equipe.'
  } catch (error) {
    message.textContent = error.message || 'Não foi possível apagar este funcionário.'
  } finally {
    if (button) { button.disabled = false; button.textContent = 'Apagar' }
  }
}

document.querySelectorAll('[data-section="equipe"]').forEach((button) => button.addEventListener('click', () => setTimeout(refreshTeamList, 0)))
setTimeout(refreshTeamList, 0)
document.addEventListener('auth-ready', refreshResponsibleOptions)
document.addEventListener('auth-ready', normalizeAdministratorLabels)
const responsibleObserver = new MutationObserver(() => refreshResponsibleOptions())
responsibleObserver.observe(document.body, { childList: true, subtree: true })
const labelObserver = new MutationObserver(normalizeAdministratorLabels)
labelObserver.observe(document.body, { childList: true, subtree: true })
setTimeout(refreshResponsibleOptions, 0)
setTimeout(normalizeAdministratorLabels, 0)
