export function canCreateClientLink(status) {
  return status === 'in_progress' || status === 'completed'
}
