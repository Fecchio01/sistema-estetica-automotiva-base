const sensitiveTopic = /\b(dinheiro|pix|pagamento|contrato|senha|código|codigo|documento|endereço|endereco|encontro|briga|processo|emergência|emergencia)\b/i
const greeting = /\b(oi|olá|ola|bom dia|boa tarde|boa noite|tudo bem)\b/i

export function buildAutomaticReply(message, options = {}) {
  const text = String(message ?? '').trim()
  if (!text) return { shouldReply: false, reason: 'empty' }
  if (sensitiveTopic.test(text)) return { shouldReply: false, reason: 'manual_review' }
  if (!options.introduced) {
    return {
      shouldReply: true,
      text: 'Olá, Luna. Sou o assistente do Sr. Fecchio. O que você gostaria de conversar?'
    }
  }
  if (greeting.test(text) || /\bbem\b/i.test(text)) {
    return { shouldReply: true, text: 'Estou bem também. Como foi seu dia?' }
  }
  return { shouldReply: true, text: 'Entendi. Me conta mais sobre isso.' }
}
