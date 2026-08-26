export const defaultServiceCatalog = [
  { id: 'detalhamento-interno', name: 'Detalhamento interno', description: 'Limpeza detalhada de painel, bancos e portas', price: 280 },
  { id: 'polimento-tecnico', name: 'Polimento técnico', description: 'Correção de marcas e proteção da pintura', price: 690 },
  { id: 'higienizacao-completa', name: 'Higienização completa', description: 'Estofados, carpetes e teto', price: 420 },
  { id: 'protecao-ceramica', name: 'Proteção cerâmica', description: 'Aplicação e cura com acompanhamento', price: 1280 },
]

export function removeServiceFromCatalog(catalog, serviceId) {
  return catalog.filter((service) => service.id !== serviceId)
}
