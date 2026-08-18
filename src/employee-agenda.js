export function getEmployeeAgenda(orders = [], profile = {}) {
  return orders
    .filter((order) => (order.responsibleId === profile.id || order.responsibleId === profile.full_name) && order.scheduledAt)
    .sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt))
}
