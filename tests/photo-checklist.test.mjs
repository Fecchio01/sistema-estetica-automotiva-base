import test from 'node:test'
import assert from 'node:assert/strict'
import { PHOTO_CHECKLIST_STAGES, groupPhotosByChecklistStage } from '../src/photo-checklist.js'

test('define o checklist visual nas cinco etapas do atendimento', () => {
  assert.deepEqual(PHOTO_CHECKLIST_STAGES.map(({ id }) => id), ['received', 'assessment', 'execution', 'inspection', 'delivery'])
})

test('agrupa fotos por etapa e preserva fotos antigas como registro geral', () => {
  const photos = [{ name: 'entrada.jpg', stage: 'received' }, { name: 'antes.jpg' }, { name: 'final.jpg', stage: 'delivery' }]
  const groups = groupPhotosByChecklistStage(photos)
  assert.deepEqual(groups.received.map(({ name }) => name), ['entrada.jpg'])
  assert.deepEqual(groups.delivery.map(({ name }) => name), ['final.jpg'])
  assert.deepEqual(groups.general.map(({ name }) => name), ['antes.jpg'])
})
