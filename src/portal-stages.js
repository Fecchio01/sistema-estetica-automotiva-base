export const PORTAL_STAGES = [
  'Veículo recebido',
  'Avaliação inicial',
  'Detalhamento interno',
  'Inspeção e acabamento',
  'Pronto para retirada',
]

const STAGE_BY_STATUS = {
  scheduled: 0,
  in_progress: 2,
  completed: 4,
  cancelled: 0,
}

export function getPortalStageIndex(status) {
  return STAGE_BY_STATUS[status] ?? 0
}
