const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]))

let timer

function connectionCopy(data = {}) {
  const state = String(data.state || '').toLowerCase()
  if (['open', 'connected'].includes(state)) return { label: 'Sessão conectada', detail: 'A sessão está ativa no servidor local.', connected: true }
  if (state === 'not_configured') return { label: 'Evolution API não configurada', detail: 'Confira a URL, a chave e o nome da instância.', connected: false }
  return { label: 'Pronto para conectar', detail: 'Gere um QR Code para demonstrar a conexão sem abrir as conversas.', connected: false }
}

async function refresh(container) {
  if (!container) return
  try {
    const response = await fetch('/api/whatsapp/connection', { cache: 'no-store' })
    const data = await response.json()
    const copy = connectionCopy(data)
    const status = container.querySelector('[data-whatsapp-qr-status]')
    const detail = container.querySelector('[data-whatsapp-qr-detail]')
    const button = container.querySelector('[data-whatsapp-show-qr]')
    if (status) status.textContent = copy.label
    if (detail) detail.textContent = copy.detail
    if (button) button.textContent = copy.connected ? 'Sessão conectada' : 'Mostrar QR Code'
  } catch {
    const status = container.querySelector('[data-whatsapp-qr-status]')
    const detail = container.querySelector('[data-whatsapp-qr-detail]')
    if (status) status.textContent = 'Evolution API indisponível'
    if (detail) detail.textContent = 'Inicie a Evolution API e tente mostrar o QR Code novamente.'
  }
}

async function showQr(container) {
  const status = container.querySelector('[data-whatsapp-qr-detail]')
  try {
    const response = await fetch('/api/whatsapp/qr', { cache: 'no-store' })
    const data = await response.json()
    if (!response.ok || data.state === 'error') throw new Error('A Evolution API não respondeu. Inicie o serviço e tente novamente.')
    const base64 = data.data?.base64 ?? data.data?.qrcode?.base64 ?? data.data?.code
    if (!base64) throw new Error(data.message || 'QR Code indisponível no momento.')
    let box = container.querySelector('[data-whatsapp-qr-box]')
    if (!box) { box = document.createElement('div'); box.dataset.whatsappQrBox = 'true'; box.className = 'whatsapp-qr-box'; container.appendChild(box) }
    box.innerHTML = `<button class="whatsapp-qr-close" type="button" aria-label="Fechar QR Code">×</button><p>Escaneie no WhatsApp em Aparelhos conectados.</p><img src="${escapeHtml(base64)}" alt="QR Code para conectar o WhatsApp" />`
  } catch (error) { if (status) status.textContent = error.message }
}

async function disconnect(container) {
  const detail = container.querySelector('[data-whatsapp-qr-detail]')
  try {
    const response = await fetch('/api/whatsapp/disconnect', { method: 'POST' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Não foi possível desconectar a instância.')
    if (detail) detail.textContent = 'WhatsApp desconectado. O QR Code continua disponível para um novo teste.'
    container.querySelector('[data-whatsapp-qr-box]')?.remove()
    await refresh(container)
  } catch (error) { if (detail) detail.textContent = error.message }
}

function render(container) {
  if (!container) return
  container.innerHTML = '<div class="whatsapp-qr-card"><div class="whatsapp-qr-copy"><span class="status-dot" aria-hidden="true"></span><div><p class="eyebrow">INTEGRAÇÃO OPCIONAL</p><h2>WhatsApp da empresa</h2><b data-whatsapp-qr-status>Verificando conexão...</b><small data-whatsapp-qr-detail>O painel de conversas fica oculto nesta demonstração.</small></div></div><div class="whatsapp-qr-actions"><button class="outline-button" type="button" data-whatsapp-show-qr>Mostrar QR Code</button><button class="text-button" type="button" data-whatsapp-disconnect>Desconectar</button></div></div>'
  container.querySelector('[data-whatsapp-show-qr]').addEventListener('click', () => showQr(container))
  container.querySelector('[data-whatsapp-disconnect]').addEventListener('click', () => disconnect(container))
  container.addEventListener('click', (event) => { if (!event.target.closest('[data-whatsapp-qr-box]') && !event.target.closest('[data-whatsapp-show-qr]')) container.querySelector('[data-whatsapp-qr-box]')?.remove(); if (event.target.closest('.whatsapp-qr-close')) container.querySelector('[data-whatsapp-qr-box]')?.remove() })
  refresh(container)
  if (timer) clearInterval(timer)
  timer = setInterval(() => refresh(container), 10000)
}

document.addEventListener('auth-ready', () => render(document.querySelector('#whatsapp-dashboard-notifications')))
