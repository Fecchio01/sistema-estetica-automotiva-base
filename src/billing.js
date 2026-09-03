const paymentLabel = (status) => ({ paid: 'Recebido', partial: 'Parcial', pending: 'Em aberto', waived: 'Isento' }[status] || 'Em aberto')

export function summarizeBilling(orders = []) {
  const normalized = orders.map((order) => ({
    amount: Math.max(0, Number(order.amount || 0)),
    paymentStatus: order.paymentStatus || 'paid',
    service: order.service || 'Serviço não informado',
  }))
  const received = normalized.filter((order) => order.paymentStatus === 'paid').reduce((total, order) => total + order.amount, 0)
  const outstanding = normalized.filter((order) => ['pending', 'partial'].includes(order.paymentStatus)).reduce((total, order) => total + order.amount, 0)
  const serviceMap = new Map()
  normalized.forEach((order) => {
    const current = serviceMap.get(order.service) || { service: order.service, amount: 0, orders: 0 }
    current.amount += order.amount
    current.orders += 1
    serviceMap.set(order.service, current)
  })
  return {
    orderCount: normalized.length,
    received,
    outstanding,
    averageTicket: normalized.length ? (normalized.reduce((total, order) => total + order.amount, 0) / normalized.length) : 0,
    byService: [...serviceMap.values()].sort((left, right) => right.amount - left.amount || left.service.localeCompare(right.service)),
    paymentLabels: normalized.reduce((summary, order) => { const label = paymentLabel(order.paymentStatus); summary[label] = (summary[label] || 0) + 1; return summary }, {}),
  }
}

export function getBillingPeriodRange(period = 'month', now = new Date()) {
  const current = new Date(now)
  const start = new Date(current)
  start.setHours(0, 0, 0, 0)
  if (period === 'year') {
    start.setMonth(0, 1)
    const end = new Date(start)
    end.setFullYear(end.getFullYear() + 1)
    return { start, end }
  }
  if (period === 'week') {
    const day = start.getDay()
    const daysSinceMonday = (day + 6) % 7
    start.setDate(start.getDate() - daysSinceMonday)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return { start, end }
  }
  start.setDate(1)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  return { start, end }
}

export function filterBillingOrders(orders = [], period = 'month', now = new Date()) {
  const { start, end } = getBillingPeriodRange(period, now)
  return orders.filter((order) => {
    const date = new Date(order.createdAt || order.scheduledAt || 0)
    return !Number.isNaN(date.getTime()) && date >= start && date < end
  })
}

export function buildRevenueTrend(orders = []) {
  const days = new Map()
  orders.forEach((order) => {
    const date = new Date(order.createdAt || order.scheduledAt || 0)
    if (Number.isNaN(date.getTime())) return
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    days.set(key, (days.get(key) || 0) + Math.max(0, Number(order.amount || 0)))
  })
  return [...days.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, amount]) => ({ label: `${key.slice(8, 10)}/${key.slice(5, 7)}`, amount }))
}

globalThis.__summarizeBilling = summarizeBilling
globalThis.__filterBillingOrders = filterBillingOrders
globalThis.__buildRevenueTrend = buildRevenueTrend
