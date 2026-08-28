import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDashboardAttentionMarkup, buildDashboardChecklistPendingMarkup, buildDashboardOperationSummaryMarkup, buildDashboardOrganizationModel, buildDashboardPaddockMarkup, buildDashboardStageChartMarkup, buildDashboardTodayTimelineMarkup, formatElapsedSince } from '../src/dashboard-organization.js'

test('painel operacional agrupa ordens por etapa e preserva responsável', () => {
  const model = buildDashboardOrganizationModel([
    { client: 'artur', vehicle: 'Honda Civic GRT', status: 'Recebido', tone: 'received', orderStatus: 'scheduled', createdAt: '2026-08-27T14:00:00.000Z', responsibleId: 'person-1' },
    { client: 'Luna', vehicle: 'BMW 320i', status: 'Em andamento', tone: 'in-progress', orderStatus: 'in_progress', createdAt: '2026-08-27T12:00:00.000Z', responsibleId: 'person-2' },
  ], [
    { status: 'received', responsible: 'person-1' },
    { status: 'in-progress', responsible: 'person-2' },
  ], [{ id: 'person-1', full_name: 'Pedro Lima' }, { id: 'person-2', full_name: 'Luna Martins' }], new Date('2026-08-27T15:00:00.000Z'))

  assert.deepEqual(model.stageCounts, { received: 1, inProgress: 1, ready: 0 })
  assert.equal(model.rows[0].responsible, 'Pedro Lima')
  assert.equal(model.rows[0].stageLabel, 'Aguardando avaliação')
  assert.equal(model.rows[1].stageLabel, 'Em execução')
})

test('tempo parado usa minutos e horas sem inventar uma data', () => {
  assert.equal(formatElapsedSince('2026-08-27T14:45:00.000Z', new Date('2026-08-27T15:00:00.000Z')), 'há 15 min')
  assert.equal(formatElapsedSince('2026-08-27T12:00:00.000Z', new Date('2026-08-27T15:00:00.000Z')), 'há 3h')
  assert.equal(formatElapsedSince(null, new Date('2026-08-27T15:00:00.000Z')), 'tempo não informado')
})

test('pátio usa um contador autoexplicativo em vez de um zero isolado', () => {
  const markup = buildDashboardPaddockMarkup({ rows: [], stageCounts: { received: 0, inProgress: 0, ready: 0 } })

  assert.match(markup, /0 veículos no pátio/)
  assert.match(markup, /dashboard-paddock-total/)
})

test('gráfico de etapas mostra distribuição proporcional das ordens', () => {
  const markup = buildDashboardStageChartMarkup({ stageCounts: { received: 1, inProgress: 2, ready: 1 } })

  assert.match(markup, /Distribuição das ordens/)
  assert.match(markup, /Aguardando avaliação/)
  assert.match(markup, /Em execução/)
  assert.match(markup, /Prontos para retirada/)
  assert.match(markup, /width:50%/)
})

test('painel de atenção reúne alertas diferentes do gráfico e do pátio', () => {
  const markup = buildDashboardAttentionMarkup({
    rows: [
      { client: 'Artur', vehicle: 'Honda Civic', responsible: 'Não atribuído', stageTone: 'received', elapsedMinutes: 310 },
      { client: 'Luna', vehicle: 'BMW 320i', responsible: 'Pedro Lima', stageTone: 'ready', elapsedMinutes: 40 },
    ],
  })

  assert.match(markup, /Atenção operacional/)
  assert.match(markup, /Sem responsável/)
  assert.match(markup, /Veículos parados há mais tempo/)
  assert.match(markup, /Próximas retiradas/)
  assert.match(markup, /Artur/)
})

test('pendências da checklist mostram somente etapas sem foto e abrem o atendimento', () => {
  const model = buildDashboardOrganizationModel([
    { client: 'Artur', vehicle: 'Honda Civic', service: 'Polimento técnico', tone: 'in-progress' },
    { client: 'Luna', vehicle: 'BMW 320i', service: 'Detalhamento interno', tone: 'received' },
  ], [
    { status: 'in-progress' },
    { status: 'received' },
  ], [], new Date('2026-08-28T12:00:00.000Z'), [
    [{ stage: 'received' }, { stage: 'assessment' }, { stage: 'execution' }],
    [{ stage: 'received' }, { stage: 'assessment' }, { stage: 'execution' }, { stage: 'inspection' }, { stage: 'delivery' }],
  ])

  const markup = buildDashboardChecklistPendingMarkup(model)

  assert.match(markup, /Pendências da checklist/)
  assert.match(markup, /Artur/)
  assert.match(markup, /Inspeção/)
  assert.match(markup, /Entrega/)
  assert.match(markup, /data-dashboard-order="0"/)
  assert.doesNotMatch(markup, /Luna/)
})

test('linha do tempo mostra somente a movimentação do dia', () => {
  const markup = buildDashboardTodayTimelineMarkup({ rows: [
    { client: 'Artur', vehicle: 'Honda Civic', stageTone: 'received', createdAt: '2026-08-28T09:00:00.000Z', elapsed: 'há 1h' },
    { client: 'Luna', vehicle: 'BMW 320i', stageTone: 'ready', scheduledAt: '2026-08-29T10:00:00.000Z', createdAt: '2026-08-27T09:00:00.000Z', elapsed: 'há 1d' },
  ] }, new Date('2026-08-28T12:00:00.000Z'))

  assert.match(markup, /Operação de hoje/)
  assert.match(markup, /Entrada recebida/)
  assert.match(markup, /Artur/)
  assert.doesNotMatch(markup, /Luna/)
})

test('panorama da operação mostra indicadores diferentes da rotina diária', () => {
  const markup = buildDashboardOperationSummaryMarkup({ rows: [
    { client: 'Artur', service: 'Polimento técnico', responsible: 'Pedro Lima', elapsedMinutes: 60, createdAt: '2026-08-27T11:00:00.000Z' },
    { client: 'Luna', service: 'Polimento técnico', responsible: 'Pedro Lima', elapsedMinutes: 120, createdAt: '2026-08-24T11:00:00.000Z' },
    { client: 'Maya', service: 'Higienização completa', responsible: 'Não atribuído', elapsedMinutes: null, createdAt: '2026-08-10T11:00:00.000Z' },
    { client: 'Nina', service: 'Proteção cerâmica', responsible: 'Pedro Lima', elapsedMinutes: 120, createdAt: '2026-08-22T11:00:00.000Z' },
  ], completedRows: [{ client: 'João', completedAt: '2026-08-26T11:00:00.000Z' }] }, new Date('2026-08-28T12:00:00.000Z'))

  assert.match(markup, /Panorama da operação/)
  assert.match(markup, /Carga por responsável/)
  assert.match(markup, /Pedro Lima/)
  assert.match(markup, /Polimento técnico/)
  assert.match(markup, /Tempo médio em aberto/)
  assert.match(markup, /1h30/)
  assert.match(markup, /semana atual/)
  assert.match(markup, /Ordens concluídas na semana/)
  assert.match(markup, /dashboard-summary-layout-open/)
  assert.match(markup, /dashboard-summary-section/)
  assert.match(markup, />1</)
  assert.doesNotMatch(markup, /Maya/)
  assert.doesNotMatch(markup, /Nina/)
})

test('gráfico informa que sua leitura é mensal', () => {
  const markup = buildDashboardStageChartMarkup({
    rows: [{ stageTone: 'received', createdAt: '2026-08-10T11:00:00.000Z' }],
    stageCounts: { received: 1, inProgress: 0, ready: 0 },
  }, new Date('2026-08-28T12:00:00.000Z'))

  assert.match(markup, /Fluxo mensal/)
  assert.match(markup, /ordens criadas neste mês/)
})
