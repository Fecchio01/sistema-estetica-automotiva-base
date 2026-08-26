export function normalizePhoneNumber(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) throw new Error('Informe um telefone para o WhatsApp.')
  return digits.startsWith('55') ? digits : `55${digits}`
}

export function buildEvolutionConfig(env = {}) {
  const baseUrl = String(env.EVOLUTION_API_URL ?? '').trim().replace(/\/$/, '')
  const apiKey = String(env.EVOLUTION_API_KEY ?? '').trim()
  const instance = String(env.EVOLUTION_INSTANCE ?? '').trim()
  return { baseUrl, apiKey, instance }
}

export function findEvolutionInstance(data, instanceName) {
  const instances = Array.isArray(data) ? data : data?.instances ?? data?.data ?? []
  const instance = instances.find((item) => item?.name === instanceName || item?.instanceName === instanceName || item?.instance?.instanceName === instanceName)
  const source = instance?.instance ?? instance
  const state = source?.connectionStatus ?? source?.state ?? 'unknown'
  return { state, disconnectReason: ['open', 'connected'].includes(state) ? null : source?.disconnectionObject || null, disconnectAt: ['open', 'connected'].includes(state) ? null : source?.disconnectionAt || null }
}

export function findEvolutionConnectionState(data) {
  const source = data?.instance ?? data?.data?.instance ?? data?.data ?? data
  return String(source?.state ?? source?.connectionStatus ?? 'unknown').trim().toLowerCase() || 'unknown'
}

export function assertEvolutionConfig(config) {
  if (!config?.baseUrl || !config.apiKey || !config.instance) {
    throw new Error('Evolution API ainda não configurada. Defina EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE.')
  }
}

export const EVOLUTION_REQUEST_TIMEOUT_MS = 20000

export function buildSendTextRequest(number, text, config) {
  assertEvolutionConfig(config)
  const normalizedNumber = normalizePhoneNumber(number)
  const message = String(text ?? '').trim()
  if (!message) throw new Error('Informe uma mensagem para enviar.')
  return {
    path: `/message/sendText/${encodeURIComponent(config.instance)}`,
    headers: { apikey: config.apiKey, 'content-type': 'application/json' },
    body: { number: normalizedNumber, text: message }
  }
}

export async function evolutionRequest(config, path, options = {}, fetchImpl = fetch, timeoutMs = EVOLUTION_REQUEST_TIMEOUT_MS) {
  assertEvolutionConfig(config)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(`${config.baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { apikey: config.apiKey, ...(options.headers ?? {}) }
    })
    const raw = await response.text()
    let data = null
    try { data = raw ? JSON.parse(raw) : null } catch { data = { message: raw } }
    if (!response.ok) {
      const detail = data?.message || data?.error || `Evolution API respondeu ${response.status}`
      throw new Error(detail)
    }
    return data
  } catch (error) {
    if (controller.signal.aborted) throw new Error('A Evolution API não respondeu em 20 segundos. Verifique se o Docker e a conexão do WhatsApp estão ativos.')
    throw error
  } finally { clearTimeout(timeout) }
}

export async function sendEvolutionText(config, number, text, fetchImpl = fetch) {
  const request = buildSendTextRequest(number, text, config)
  return evolutionRequest(config, request.path, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(request.body)
  }, fetchImpl)
}
