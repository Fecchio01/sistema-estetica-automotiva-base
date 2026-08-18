import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Sessão inválida.' }, 401)
  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY')
  if (!serviceKey) return json({ error: 'Função não configurada.' }, 500)
  const admin = createClient(url, serviceKey)
  const { data: caller, error: callerError } = await admin.auth.getUser(authHeader.slice(7))
  if (callerError || !caller.user) return json({ error: 'Sessão inválida.' }, 401)
  let input: { fullName?: string }
  try { input = await req.json() } catch { return json({ error: 'Dados inválidos.' }, 400) }
  const fullName = input.fullName?.trim() ?? ''
  if (fullName.length < 2 || fullName.length > 160) return json({ error: 'Informe um nome entre 2 e 160 caracteres.' }, 400)
  const { data: profile, error } = await admin.from('profiles').update({ full_name: fullName }).eq('id', caller.user.id).select('id, company_id, full_name, role, active').single()
  if (error || !profile) return json({ error: 'Não foi possível atualizar o perfil.' }, 500)
  return json({ profile })
})
