export const defaultServiceCatalog = [
  { id: 'detalhamento-interno', name: 'Detalhamento interno', description: 'Limpeza detalhada de painel, bancos e portas', price: 280 },
  { id: 'polimento-tecnico', name: 'Polimento técnico', description: 'Correção de marcas e proteção da pintura', price: 690 },
  { id: 'higienizacao-completa', name: 'Higienização completa', description: 'Estofados, carpetes e teto', price: 420 },
  { id: 'protecao-ceramica', name: 'Proteção cerâmica', description: 'Aplicação e cura com acompanhamento', price: 1280 },
]

export function removeServiceFromCatalog(catalog, serviceId) {
  return catalog.filter((service) => service.id !== serviceId)
}

export function updateServiceInCatalog(catalog, serviceId, changes) {
  return catalog.map((service) => service.id === serviceId ? { ...service, ...changes, id: service.id } : service)
}

export function totalForCatalogServices(catalog = [], serviceNames = []) {
  const prices = new Map(catalog.map((service) => [String(service.name || '').trim(), Number(service.price) || 0]))
  return serviceNames.reduce((total, serviceName) => total + (prices.get(String(serviceName || '').trim()) || 0), 0)
}
