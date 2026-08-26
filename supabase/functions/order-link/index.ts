import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const randomToken = () => { const bytes = crypto.getRandomValues(new Uint8Array(32)); return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '') }
const hashToken = async (token: string) => { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)); return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('') }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)
  const authorization = req.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Sessão inválida.' }, 401)
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY')
  if (!key) return json({ error: 'Função não configurada.' }, 500)
  const admin = createClient(url, key)
  const { data: userData, error: userError } = await admin.auth.getUser(authorization.slice(7))
  if (userError || !userData.user) return json({ error: 'Sessão inválida.' }, 401)
  const input = await req.json().catch(() => ({}))
  const { data: profile } = await admin.from('profiles').select('id, company_id, role, active').eq('id', userData.user.id).single()
  if (!profile?.active || !['administrator', 'reception'].includes(profile.role)) return json({ error: 'Sem permissão para gerar links.' }, 403)
  const { data: order } = await admin.from('work_orders').select('id, company_id, client_id, status').eq('id', input.orderId).eq('company_id', profile.company_id).single()
  if (!order) return json({ error: 'Ordem não encontrada.' }, 404)
  if (!['in_progress', 'completed'].includes(order.status)) return json({ error: 'O link só fica disponível quando o atendimento é iniciado.' }, 409)
  const token = randomToken()
  const tokenHash = await hashToken(token)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
  const { error } = await admin.from('client_order_tokens').insert({ company_id: profile.company_id, client_id: order.client_id, work_order_id: order.id, token_hash: tokenHash, expires_at: expiresAt, created_by: userData.user.id })
  if (error) return json({ error: 'Não foi possível gerar o link.' }, 500)
  return json({ token, expiresAt })
})
