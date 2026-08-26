export function isClientPortalPath(pathname = '') {
  const parts = String(pathname).split('/').filter(Boolean)
  return parts[0] === 'portal' && Boolean(parts[1])
}
