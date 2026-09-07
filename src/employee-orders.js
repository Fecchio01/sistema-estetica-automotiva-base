export function getEmployeeOrders(services = [], profile = {}) {
  const identities = [profile?.id, profile?.full_name].filter((value) => typeof value === 'string' && value.trim())
  return services.filter((service) => identities.includes(service.responsibleId))
}
