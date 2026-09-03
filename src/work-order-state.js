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

export function stageForOrder(order = {}) {
  const stage = Number(order.current_stage)
  return Number.isInteger(stage) && stage >= 0 && stage <= 4 ? stage : stageForStatus(order.status)
}

function normalizeStage(stage) {
  const value = Number(stage)
  if (!Number.isInteger(value) || value < 0 || value > 4) throw new Error('Etapa inválida.')
  return value
}

function buildHistory({ companyId, orderId, changedBy, fromStatus, toStatus, comment }) {
  return {
    company_id: companyId,
    work_order_id: orderId,
    changed_by: changedBy,
    from_status: fromStatus || null,
    to_status: toStatus,
    ...(comment ? { comment } : {}),
  }
}

export function buildStageTransition(input = {}) {
  const toStage = normalizeStage(input.toStage)
  const toStatus = statusForStage(toStage)
  return {
    orderPatch: { status: toStatus, current_stage: toStage },
    history: buildHistory({ ...input, toStatus }),
  }
}

export function buildDeliveryTransition(input = {}) {
  if (!input.completedAt) throw new Error('Informe o horário da entrega.')
  return {
    orderPatch: { status: 'completed', current_stage: 4, completed_at: input.completedAt },
    history: buildHistory({ ...input, toStatus: 'completed', comment: 'Entrega confirmada pela recepção.' }),
  }
}

export function canConfirmDelivery(role) {
  return role === 'administrator' || role === 'reception'
}
