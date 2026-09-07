import { resolve, relative, isAbsolute, sep } from 'node:path'

export function resolvePublicFile(root, pathname) {
  const parts = pathname.replaceAll('\\', '/').split('/').filter(Boolean)
  if (parts.some((part) => part.startsWith('.') || ['supabase', 'tests', 'artifacts'].includes(part))) return null
  const candidate = resolve(root, ...parts)
  const within = relative(root, candidate)
  if (isAbsolute(within) || within === '..' || within.startsWith(`..${sep}`)) return null
  // Server-side sources and dependency manifests are not browser assets.
  if (parts.length === 1 && /(?:\.mjs|package(?:-lock)?\.json)$/.test(parts[0])) return null
  return candidate
}
