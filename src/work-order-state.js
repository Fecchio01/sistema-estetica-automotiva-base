export function statusForStage(stage) {
  if (Number(stage) === 0) return 'scheduled'
  if (Number(stage) >= 4) return 'ready_for_pickup'
  return 'in_progress'
}

export function stageForStatus(status) {
  if (status === 'scheduled') return 0
  if (status === 'ready_for_pickup' || status === 'completed') return 4
  return 2
}

export function canConfirmDelivery(role) {
  return role === 'administrator' || role === 'reception'
}
