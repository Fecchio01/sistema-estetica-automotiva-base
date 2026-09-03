export const defaultOperationalPreferences = Object.freeze({
  notifyStage: true,
  requireResponsible: true,
  requireFinalPhotos: true,
})

export function normalizeOperationalPreferences(input = {}) {
  return Object.fromEntries(Object.entries(defaultOperationalPreferences).map(([key, fallback]) => [key, typeof input[key] === 'boolean' ? input[key] : fallback]))
}

export function validatePasswordChange(password, confirmation) {
  if (String(password || '').length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
  if (password !== confirmation) return 'As senhas não conferem.'
  return ''
}
