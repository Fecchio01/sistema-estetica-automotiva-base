import { supabase } from './supabase-client.js'

export async function createOrderLink(orderId) {
  const { data, error } = await supabase.functions.invoke('order-link', { body: { orderId } })
  if (error || !data?.token) throw new Error('Atendimento criado, mas não foi possível gerar o link do cliente.')
  return { token: data.token, url: `${window.location.origin}/portal/${encodeURIComponent(data.token)}`, expiresAt: data.expiresAt }
}

export async function copyOrderLink(url) {
  await navigator.clipboard.writeText(url)
}

globalThis.__createClientOrderLink = createOrderLink
globalThis.__copyClientOrderLink = copyOrderLink
