import { supabase } from './supabase-client.js'

export async function mountAutomationSettings(content) {
  const companyId = globalThis.__sessionProfile?.company_id
  if (!companyId || content.querySelector('[data-automation-settings]')) return
  const panel = document.createElement('section')
  panel.className = 'module-panel'
  panel.dataset.automationSettings = ''
  panel.innerHTML = '<h3>Automação de atendimento e WhatsApp</h3><p>Lembrete 24 horas antes da reserva, aviso de início e de veículo pronto. Após a entrega: acompanhamento em 1, 7, 15 e 30 dias.</p><label><input type="checkbox" data-auto-enabled disabled> Ativar avisos e pós-venda para os próximos atendimentos</label><p data-auto-state role="status">Carregando automações...</p><p data-auto-connection></p><p data-auto-queue></p>'
  content.querySelector('.settings-shell').append(panel)
  const checkbox = panel.querySelector('[data-auto-enabled]')
  const status = panel.querySelector('[data-auto-state]')
  const { data, error } = await supabase.from('company_automation_settings').select('post_sale_enabled').eq('company_id',companyId).maybeSingle()
  if (!panel.isConnected) return
  if (error) { status.textContent = 'Não foi possível carregar a configuração de automações.'; return }
  checkbox.checked = data?.post_sale_enabled === true
  checkbox.disabled = false
  status.textContent = checkbox.checked ? 'Automação ativada. As mensagens aguardam uma conexão disponível.' : 'Automação pausada.'
  checkbox.addEventListener('change', async () => {
    checkbox.disabled = true
    const { error } = await supabase.from('company_automation_settings').upsert({company_id:companyId,post_sale_enabled:checkbox.checked})
    if (error) { checkbox.checked = !checkbox.checked; status.textContent = 'Não foi possível salvar. Tente novamente.' }
    else status.textContent = checkbox.checked ? 'Automação ativada para novos eventos. A fila pendente também será retomada.' : 'Automação pausada. Um envio que já começou pode ser concluído.'
    checkbox.disabled = false
  })
  try {
    const response = await fetch('/api/automations/status')
    const connection = await response.json()
    panel.querySelector('[data-auto-connection]').textContent = connection.configured ? 'Servidor de envio configurado. A conexão do WhatsApp é verificada a cada ciclo; mantenha o servidor em execução.' : 'Envio aguardando configuração: ' + [!connection.whatsappConfigured && 'Evolution API', !connection.databaseConfigured && 'credencial do servidor Supabase', !connection.companyConfigured && 'empresa da instância'].filter(Boolean).join(', ') + '. A fila fica preparada no banco.'
  } catch { panel.querySelector('[data-auto-connection]').textContent = 'Servidor de envio indisponível.' }
  const { data: queue, error: queueError } = await supabase.from('order_notifications').select('id,status,auto_send,message,last_error,auto_send_lock_until').eq('company_id',companyId).eq('status','pending')
  panel.querySelector('[data-auto-queue]').textContent = queueError ? 'Fila de avisos indisponível.' : `${queue.length} aviso(s) pendente(s); ${queue.filter((item) => !item.auto_send).length} pausado(s) para conferência. O pós-venda pode ser acompanhado no menu Pós-venda.`
  for (const item of (queue || []).filter((item) => !item.auto_send && (!item.auto_send_lock_until || new Date(item.auto_send_lock_until) < new Date()))) {
    const row = document.createElement('div')
    const message = document.createElement('p')
    message.textContent = item.message
    const reason = document.createElement('small')
    reason.textContent = item.last_error || 'Confira se esta mensagem já foi entregue antes de reativar.'
    const button = document.createElement('button')
    button.type = 'button'; button.className = 'outline-button'; button.textContent = 'Conferi a conversa: reativar aviso'
    button.addEventListener('click', async () => {
      button.disabled = true
      const { error } = await supabase.from('order_notifications').update({auto_send:true,auto_send_lock_until:null,last_error:null}).eq('id',item.id).eq('company_id',companyId).eq('status','pending').eq('auto_send',false).or(`auto_send_lock_until.is.null,auto_send_lock_until.lt.${new Date().toISOString()}`)
      reason.textContent = error ? 'Não foi possível reativar. Tente novamente.' : 'Aviso devolvido à fila automática.'
      if (error) button.disabled = false
    })
    row.append(message,reason,button);panel.append(row)
  }
}
