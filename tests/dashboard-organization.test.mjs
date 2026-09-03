import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDashboardAttentionMarkup, buildDashboardFinancialMarkup, buildDashboardOperationSummaryMarkup, buildDashboardOrganizationModel, buildDashboardPaddockMarkup, buildDashboardStageChartMarkup, buildDashboardTodayTimelineMarkup, formatElapsedSince } from '../src/dashboard-organization.js'

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

test('pátio não mostra ordens já entregues', () => {
  const model = buildDashboardOrganizationModel([
    { client: 'Jorge', vehicle: 'BMW 320i', status: 'Finalizado', tone: 'delivered', orderStatus: 'completed', createdAt: '2026-08-27T10:00:00.000Z' },
    { client: 'Artur', vehicle: 'Honda Civic', status: 'Recebido', tone: 'received', orderStatus: 'scheduled', createdAt: '2026-08-27T11:00:00.000Z' },
  ], [
    { status: 'delivered' },
    { status: 'received' },
  ])

  assert.deepEqual(model.rows.map((row) => row.client), ['Artur'])
  assert.deepEqual(model.completedRows.map((row) => row.client), ['Jorge'])
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

test('visão geral mostra faturamento recente e ranking de serviços com dados reais', () => {
  const markup = buildDashboardFinancialMarkup({ rows: [
    { service: 'Detalhamento interno', amount: 280, createdAt: '2026-09-02T10:00:00.000Z' },
    { service: 'Polimento técnico', amount: 690, createdAt: '2026-09-03T10:00:00.000Z' },
  ] }, new Date('2026-09-03T12:00:00.000Z'))

  assert.match(markup, /Financeiro da operação/)
  assert.match(markup, /R\$ 970,00/)
  assert.match(markup, /dashboard-financial-chart/)
  assert.match(markup, /Detalhamento interno/)
  assert.match(markup, /Polimento técnico/)
})

test('pátio resume visualmente a distribuição real dos veículos por etapa', () => {
  const markup = buildDashboardPaddockMarkup({
    rows: [{ orderIndex: 0, client: 'Artur', vehicle: 'Honda Civic', stageTone: 'received', stageLabel: 'Aguardando avaliação', responsible: 'Pedro Lima', service: 'Detalhamento', elapsed: 'há 1h' }],
    stageCounts: { received: 1, inProgress: 2, ready: 1 },
  })

  assert.match(markup, /dashboard-paddock-distribution/)
  assert.match(markup, /dashboard-paddock-distribution-segment received/)
  assert.match(markup, /dashboard-paddock-distribution-segment in-progress/)
  assert.match(markup, /dashboard-paddock-distribution-segment ready/)
  assert.match(markup, /Em execução.*2/)
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
  assert.match(markup, /dashboard-attention-radar/)
  assert.match(markup, /Sem responsável.*1/)
  assert.match(markup, /Parados.*1/)
})

test('atenção operacional agrupa pendências de fotos por atendimento', () => {
  const markup = buildDashboardAttentionMarkup({
    rows: [
      { orderIndex: 0, client: 'Artur', vehicle: 'Honda Civic', responsible: 'Pedro Lima', stageTone: 'in-progress', elapsedMinutes: 40, checklistPhotos: [{ stage: 'received' }, { stage: 'assessment' }] },
      { orderIndex: 1, client: 'Luna', vehicle: 'BMW 320i', responsible: 'Pedro Lima', stageTone: 'received', elapsedMinutes: 20, checklistPhotos: [{ stage: 'received' }, { stage: 'assessment' }, { stage: 'execution' }, { stage: 'inspection' }, { stage: 'delivery' }] },
    ],
  })

  assert.match(markup, /Pendência de fotos/)
  assert.match(markup, /Artur/)
  assert.match(markup, /3 fotos/)
  assert.match(markup, /data-dashboard-order="0"/)
  assert.equal((markup.match(/Artur/g) || []).length, 1)
  assert.doesNotMatch(markup, /Luna.*Pendência de fotos/)
})

test('atenção operacional mostra follow-ups pendentes agrupados por cliente', () => {
  const markup = buildDashboardAttentionMarkup({ rows: [], postSaleFollowUps: [
    { client_id: 'client-1', vehicle_id: 'vehicle-1', status: 'pending', clients: { full_name: 'Artur Silva' }, vehicles: { make: 'Honda', model: 'Civic' } },
    { client_id: 'client-1', vehicle_id: 'vehicle-1', status: 'pending', clients: { full_name: 'Artur Silva' }, vehicles: { make: 'Honda', model: 'Civic' } },
  ] })

  assert.match(markup, /Mensagens de pós-venda/)
  assert.match(markup, /Artur Silva/)
  assert.match(markup, /2 mensagens/)
  assert.equal((markup.match(/Artur Silva/g) || []).length, 1)
  assert.match(markup, /data-dashboard-section="pos-venda"/)
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

test('fluxo mensal apresenta uma leitura visual segmentada das etapas', () => {
  const markup = buildDashboardStageChartMarkup({
    stageCounts: { received: 1, inProgress: 2, ready: 1 },
  })

  assert.match(markup, /dashboard-flow-visual/)
  assert.match(markup, /dashboard-flow-segment received/)
  assert.match(markup, /dashboard-flow-segment in-progress/)
  assert.match(markup, /dashboard-flow-segment ready/)
})

test('panorama semanal organiza cargas e serviços em gráficos independentes', () => {
  const markup = buildDashboardOperationSummaryMarkup({ rows: [
    { client: 'Artur', service: 'Polimento técnico', responsible: 'Pedro Lima', elapsedMinutes: 60, createdAt: '2026-08-27T11:00:00.000Z' },
    { client: 'Luna', service: 'Higienização completa', responsible: 'Luna Martins', elapsedMinutes: 90, createdAt: '2026-08-27T12:00:00.000Z' },
  ] }, new Date('2026-08-28T12:00:00.000Z'))

  assert.match(markup, /dashboard-summary-insights/)
  assert.match(markup, /dashboard-summary-bar-chart/)
  assert.match(markup, /Carga por responsável/)
  assert.match(markup, /Serviços mais solicitados/)
  assert.match(markup, /dashboard-summary-metric-card/)
  assert.match(markup, /Tempo médio em aberto/)
  assert.match(markup, /Ordens concluídas na semana/)
})

test('panorama mostra período legível quando a semana atravessa meses', () => {
  const markup = buildDashboardOperationSummaryMarkup({ rows: [] }, new Date('2026-09-01T12:00:00.000Z'))

  assert.match(markup, /Semana de 30 de agosto a 5 de setembro de 2026/)
})
