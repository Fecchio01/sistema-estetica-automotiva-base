import { supabase } from './supabase-client.js'

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('Não foi possível entrar. Confira seu e-mail e sua senha.')
  const { data: profile, error: profileError } = await supabase.from('profiles').select('id, company_id, full_name, role, active').eq('id', data.user.id).single()
  if (profileError || !profile?.active) {
    await supabase.auth.signOut()
    throw new Error('Seu acesso ainda não está liberado. Fale com a administradora.')
  }
  return { user: data.user, profile }
}

export async function loadSession() {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) return null
  const { data: profile } = await supabase.from('profiles').select('id, company_id, full_name, role, active').eq('id', sessionData.session.user.id).single()
  if (!profile?.active) return null
  return { user: sessionData.session.user, profile }
}

export async function signOut() { await supabase.auth.signOut() }
