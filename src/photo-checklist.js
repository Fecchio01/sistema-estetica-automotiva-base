export const PHOTO_CHECKLIST_STAGES = [
  { id: 'received', label: 'Entrada', hint: 'Registre o estado do veículo ao chegar.' },
  { id: 'assessment', label: 'Avaliação', hint: 'Documente avarias e pontos identificados.' },
  { id: 'execution', label: 'Execução', hint: 'Acompanhe o serviço durante a realização.' },
  { id: 'inspection', label: 'Inspeção', hint: 'Confira o acabamento antes da entrega.' },
  { id: 'delivery', label: 'Entrega', hint: 'Registre o resultado final do veículo.' },
]

export function groupPhotosByChecklistStage(photos = []) {
  const groups = Object.fromEntries(PHOTO_CHECKLIST_STAGES.map(({ id }) => [id, []]))
  groups.general = []
  for (const photo of photos) {
    const stage = PHOTO_CHECKLIST_STAGES.some(({ id }) => id === photo?.stage) ? photo.stage : 'general'
    groups[stage].push(photo)
  }
  return groups
}
