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
  const { data: requester } = await admin.from('profiles').select('company_id, role, active').eq('id', caller.user.id).single()
  if (!requester?.active || requester.role !== 'administrator') return json({ error: 'Apenas o administrador(a) pode cadastrar funcionários.' }, 403)
  let input: { name?: string; email?: string; password?: string; role?: string }
  try { input = await req.json() } catch { return json({ error: 'Dados inválidos.' }, 400) }
  const name = input.name?.trim() ?? ''
  const email = input.email?.trim().toLowerCase() ?? ''
  const password = input.password ?? ''
  const role = input.role ?? ''
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !['reception', 'employee'].includes(role)) return json({ error: 'Informe nome, e-mail, senha de 8 caracteres e função válidos.' }, 400)
  const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (createError || !created.user) return json({ error: createError?.message ?? 'Não foi possível criar o usuário.' }, 400)
  const { error: profileError } = await admin.from('profiles').insert({ id: created.user.id, company_id: requester.company_id, full_name: name, role, active: true })
  if (profileError) { await admin.auth.admin.deleteUser(created.user.id); return json({ error: 'Não foi possível criar o perfil do funcionário.' }, 500) }
  return json({ profileId: created.user.id, email, role })
})
