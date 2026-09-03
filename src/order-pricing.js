export function findMissingOrderAmounts(orders = [], catalog = []) {
  const prices = new Map(catalog.map((service) => [String(service.name || '').trim(), Number(service.price) || 0]))
  return orders.flatMap((order) => {
    if (Number(order?.total_amount || 0) !== 0) return []
    const services = String(order?.service_description || '').split(',').map((name) => name.trim()).filter(Boolean)
    if (!services.length || services.some((name) => !prices.has(name))) return []
    const totalAmount = services.reduce((total, name) => total + prices.get(name), 0)
    return totalAmount > 0 ? [{ id: order.id, totalAmount }] : []
  })
}

export function findOrdersAwaitingPaymentMigration(orders = []) {
  return orders.filter((order) => order?.id && order.payment_status !== 'paid').map((order) => order.id)
}
