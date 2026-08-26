import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const hashToken = async (token: string) => { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)); return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('') }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const requestUrl = new URL(req.url)
  const token = requestUrl.searchParams.get('token') || (await req.json().catch(() => ({}))).token
  if (!token) return json({ error: 'Link inválido.' }, 400)
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY')
  if (!key) return json({ error: 'Função não configurada.' }, 500)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, key)
  const tokenHash = await hashToken(token)
  const { data: tokenRow } = await admin.from('client_order_tokens').select('company_id, client_id, work_order_id, expires_at, revoked_at').eq('token_hash', tokenHash).single()
  if (!tokenRow || tokenRow.revoked_at || new Date(tokenRow.expires_at).getTime() < Date.now()) return json({ error: 'Este link expirou ou não é válido.' }, 404)
  const { data: order } = await admin.from('work_orders').select('status, scheduled_at, service_description').eq('id', tokenRow.work_order_id).eq('company_id', tokenRow.company_id).eq('client_id', tokenRow.client_id).single()
  const { data: client } = await admin.from('clients').select('full_name').eq('id', tokenRow.client_id).eq('company_id', tokenRow.company_id).single()
  const { data: vehicle } = await admin.from('vehicles').select('make, model, license_plate').eq('client_id', tokenRow.client_id).eq('company_id', tokenRow.company_id).limit(1).maybeSingle()
  if (!order || !client) return json({ error: 'Atendimento não encontrado.' }, 404)
  if (order.status === 'scheduled') return json({ error: 'O acompanhamento ficará disponível quando o veículo entrar na estética.' }, 404)
  const { data: photos } = await admin.from('work_order_photos').select('storage_path, caption, created_at').eq('work_order_id', tokenRow.work_order_id).eq('company_id', tokenRow.company_id).order('created_at', { ascending: true })
  return json({ client: { name: client.full_name }, vehicle: vehicle ? { make: vehicle.make, model: vehicle.model, licensePlate: vehicle.license_plate } : null, order: { status: order.status, scheduledAt: order.scheduled_at, service: order.service_description }, photos: (photos || []).map((photo) => ({ url: /^https?:\/\//i.test(photo.storage_path) ? photo.storage_path : null, caption: photo.caption })) })
})
