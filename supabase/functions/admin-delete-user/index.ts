import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)
  const authHeader = req.headers.get('Authorization')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY')
  if (!authHeader?.startsWith('Bearer ') || !serviceKey) return json({ error: 'Sessão inválida.' }, 401)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)
  const { data: caller, error: callerError } = await admin.auth.getUser(authHeader.slice(7))
  if (callerError || !caller.user) return json({ error: 'Sessão inválida.' }, 401)
  const { data: requester } = await admin.from('profiles').select('company_id, role, active').eq('id', caller.user.id).single()
  if (!requester?.active || requester.role !== 'administrator') return json({ error: 'Apenas o administrador(a) pode apagar funcionários.' }, 403)
  let input: { profileId?: string }
  try { input = await req.json() } catch { return json({ error: 'Dados inválidos.' }, 400) }
  if (!input.profileId || input.profileId === caller.user.id) return json({ error: 'Funcionário inválido.' }, 400)
  const { data: target } = await admin.from('profiles').select('id, company_id, role').eq('id', input.profileId).single()
  if (!target || target.company_id !== requester.company_id || target.role === 'administrator') return json({ error: 'Funcionário não encontrado.' }, 404)
  const { error } = await admin.auth.admin.deleteUser(target.id)
  if (error) return json({ error: 'Não foi possível apagar o funcionário.' }, 500)
  return json({ deleted: true, profileId: target.id })
})
