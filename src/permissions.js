const matrix = {
  administrator: new Set([
    'manageUsers',
    'manageSettings',
    'manageClients',
    'manageVehicles',
    'manageOrders',
    'manageAgenda',
    'manageConversations',
    'manageAssignedOrders',
    'managePhotos',
    'manageInternalNotes',
    'manageDelivery',
  ]),
  reception: new Set([
    'manageClients',
    'manageVehicles',
    'manageOrders',
    'manageAgenda',
    'manageConversations',
    'manageDelivery',
  ]),
  employee: new Set([
    'manageAssignedOrders',
    'managePhotos',
    'manageInternalNotes',
    'manageDelivery',
  ]),
}

const sectionMatrix = {
  administrator: new Set(['visao-geral', 'atendimentos', 'orcamentos', 'agenda', 'clientes', 'servicos', 'equipe', 'conversas', 'pos-venda', 'relatorios', 'configuracoes', 'faturamento']),
  reception: new Set(['visao-geral', 'atendimentos', 'orcamentos', 'agenda', 'clientes', 'conversas', 'pos-venda', 'relatorios']),
  employee: new Set(),
}

export function can(role, capability) {
  return matrix[role]?.has(capability) === true
}

export function getPermissions(role) {
  return Object.fromEntries(
    [...new Set([...matrix.administrator])].map((capability) => [capability, can(role, capability)]),
  )
}

export function canViewSection(role, section) {
  return sectionMatrix[role]?.has(section) === true
}

export function canCreateSection(role, section) {
  const capability = { atendimentos: 'manageOrders', agenda: 'manageAgenda' }[section]
  return capability ? can(role, capability) : false
}
