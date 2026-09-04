const services = [
  { initials: 'HN', client: 'Rafael Nogueira', vehicle: 'Honda Civic Touring · RGT-4B21', service: 'Detalhamento interno', status: 'Em andamento', tone: 'in-progress', time: 'Entrada 08:42' },
  { initials: 'TM', client: 'Camila Bittencourt', vehicle: 'Toyota Corolla XEi · FDL-8A06', service: 'Polimento técnico', status: 'Em andamento', tone: 'in-progress', time: 'Entrada 09:18' },
  { initials: 'JV', client: 'João Vitor Mendes', vehicle: 'Jeep Compass Limited · EKW-1C73', service: 'Higienização completa', status: 'Pronto para retirada', tone: 'ready', time: 'Entrada 07:55' },
  { initials: 'MA', client: 'Marina Albuquerque', vehicle: 'BMW 320i M Sport · GHA-5D92', service: 'Proteção cerâmica', status: 'Em andamento', tone: 'in-progress', time: 'Entrada ontem' }
];
const clients = [
  ['Rafael Nogueira', 'Honda Civic Touring · RGT-4B21', 'Detalhamento interno', 'Em andamento', 'in-progress'],
  ['Camila Bittencourt', 'Toyota Corolla XEi · FDL-8A06', 'Polimento técnico', 'Em andamento', 'in-progress'],
  ['João Vitor Mendes', 'Jeep Compass Limited · EKW-1C73', 'Higienização completa', 'Pronto para retirada', 'ready'],
  ['Marina Albuquerque', 'BMW 320i M Sport · GHA-5D92', 'Proteção cerâmica', 'Em andamento', 'in-progress']
];
const stageNames = ['Entrada registrada', 'Avaliação inicial', 'Execução do serviço', 'Inspeção e acabamento', 'Finalização'];
const teamMembers = [
  { name: 'Lucas Sampaio', role: 'Funcionário' },
  { name: 'Fernanda Cardoso', role: 'Atendente' },
  { name: 'Marina Costa', role: 'Administrador(a)' }
];
const serviceCatalogExtras = [];
const serviceCatalogFallback = [
  { id: 'detalhamento-interno', name: 'Detalhamento interno', description: 'Limpeza detalhada de painel, bancos e portas', price: 280 },
  { id: 'polimento-tecnico', name: 'Polimento técnico', description: 'Correção de marcas e proteção da pintura', price: 690 },
  { id: 'higienizacao-completa', name: 'Higienização completa', description: 'Estofados, carpetes e teto', price: 420 },
  { id: 'protecao-ceramica', name: 'Proteção cerâmica', description: 'Aplicação e cura com acompanhamento', price: 1280 },
];
const getCatalog = () => globalThis.__serviceCatalog || [...serviceCatalogFallback, ...serviceCatalogExtras];
const serviceStates = services.map((item, index) => ({ stage: index === 0 ? 0 : item.tone === 'waiting' ? 1 : item.tone === 'ready' ? 4 : 2, status: index === 0 ? 'received' : item.tone === 'waiting' ? 'waiting' : item.tone === 'ready' ? 'ready' : 'in-progress', responsible: ['Lucas Sampaio', 'Fernanda Cardoso', 'Lucas Sampaio', 'Lucas Sampaio'][index] || 'Não atribuído' }));
const serviceEstimates = [
  { date: '', time: '' },
  { date: '2026-08-08', time: '16:30' },
  { date: '2026-08-07', time: '15:00' },
  { date: '2026-08-11', time: '17:30' }
];
const serviceMilestones = [
  { received: '08/08/2026 às 08:42', evaluated: '08/08/2026 às 09:05' },
  { received: '08/08/2026 às 09:18', evaluated: '08/08/2026 às 09:35' },
  { received: '08/08/2026 às 07:55', evaluated: '08/08/2026 às 08:20' },
  { received: '07/08/2026 às 14:10', evaluated: '07/08/2026 às 14:30' }
];
const PHOTO_CHECKLIST_STAGES = [
  { id: 'received', label: 'Entrada', hint: 'Estado do veículo ao chegar.' },
  { id: 'assessment', label: 'Avaliação', hint: 'Avarias e pontos identificados.' },
  { id: 'execution', label: 'Execução', hint: 'Acompanhamento do serviço.' },
  { id: 'inspection', label: 'Inspeção', hint: 'Conferência do acabamento.' },
  { id: 'delivery', label: 'Entrega', hint: 'Resultado final do veículo.' }
];
const servicePhotos = services.map(() => []);
function photoGroups(photos = []) {
  const groups = Object.fromEntries(PHOTO_CHECKLIST_STAGES.map(({ id }) => [id, []]));
  groups.general = [];
  photos.forEach((photo) => { const stage = PHOTO_CHECKLIST_STAGES.some(({ id }) => id === photo?.stage) ? photo.stage : 'general'; groups[stage].push(photo); });
  return groups;
}
function vehicleParts(vehicle) {
  const parts = String(vehicle || '').split(String.fromCharCode(183));
  return { model: (parts[0] || '').replace(/Ã‚|Â$/g, '').trim(), plate: (parts[1] || '').trim() };
}
function getCurrentEntryData() {
  const now = new Date();
  return {
    time: `Entrada ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    received: now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  };
}
function upsertClientFromService(clientName, vehicle, service, status, tone) {
  const normalizedName = String(clientName || '').trim().toLowerCase();
  const existing = clients.find((client) => String(client[0]).trim().toLowerCase() === normalizedName);
  if (existing) {
    existing[1] = vehicle;
    existing[2] = service;
    existing[3] = status;
    existing[4] = tone;
    existing[5] = (existing[5] ?? clients.indexOf(existing) + 2) + 1;
    existing[6] = getCurrentEntryData().received;
    return existing;
  }
  const created = [clientName, vehicle, service, status, tone, 1, getCurrentEntryData().received];
  clients.push(created);
  return created;
}
function formatEstimate(index) {
  const estimate = serviceEstimates[index];
  if (!estimate || !estimate.date || !estimate.time) return 'A definir após avaliação';
  const [year, month, day] = estimate.date.split('-');
  return `${day}/${month}/${year} às ${estimate.time}`;
}
function getServiceCounts() {
  return services.reduce((counts, item, index) => {
    const status = serviceStates[index].status;
    counts.total += 1;
    if (status === 'in-progress') counts.active += 1;
    if (status === 'received') counts.received += 1;
    if (status === 'waiting') counts.waiting += 1;
    if (status === 'ready') counts.ready += 1;
    if (status === 'delivered') counts.delivered += 1;
    return counts;
  }, { total: 0, active: 0, received: 0, waiting: 0, ready: 0, delivered: 0 });
}
function getServicePresentation(index) {
  const state = serviceStates[index];
  if (state.status === 'delivered') return { label: 'Entregue', tone: 'delivered', action: 'view', actionLabel: 'Ver entrega' };
  if (state.status === 'ready') return { label: 'Pronto para retirada', tone: 'ready', action: 'delivery', actionLabel: 'Registrar entrega' };
  if (state.status === 'waiting') return { label: 'Em andamento', tone: 'in-progress', action: 'open', actionLabel: 'Abrir ordem' };
  if (state.status === 'received') return { label: 'Recebido', tone: 'received', action: 'open', actionLabel: 'Abrir ordem' };
  return { label: 'Em andamento', tone: 'in-progress', action: 'open', actionLabel: 'Abrir ordem' };
}
function refreshGlobalCounts() {
  const counts = getServiceCounts();
  const metricValues = document.querySelectorAll('.metric-grid .metric-block strong');
  if (metricValues[0]) metricValues[0].textContent = String(counts.active).padStart(2, '0');
  if (metricValues[1]) metricValues[1].textContent = String(counts.ready).padStart(2, '0');
  if (metricValues[2]) metricValues[2].textContent = String(counts.total).padStart(2, '0');
  const metricBlocks = document.querySelectorAll('.metric-grid .metric-block');
  if (metricBlocks[0]) metricBlocks[0].querySelector('small').textContent = `${counts.active} ordem em execução`;
  if (metricBlocks[1]) metricBlocks[1].querySelector('small').textContent = `${counts.ready} cliente para retirada`;
  if (metricBlocks[2]) metricBlocks[2].querySelector('small').textContent = `${counts.total} ordem no mês`;
  if (metricBlocks[3]) {
    const billing = services.reduce((total, item, index) => total + Number(item.amount || 0), 0);
    metricBlocks[3].querySelector('span').textContent = 'Faturamento';
    metricBlocks[3].querySelector('strong').textContent = `R$ ${billing.toLocaleString('pt-BR')}`;
    metricBlocks[3].querySelector('small').textContent = 'valor das ordens cadastradas';
  }
  const attendanceValues = document.querySelectorAll('.attendance-summary b');
  [counts.total, counts.active, counts.ready].forEach((value, index) => { if (attendanceValues[index]) attendanceValues[index].textContent = String(value).padStart(2, '0'); });
  const attendanceFilters = document.querySelectorAll('.attendance-filters .filter-tab span');
  [counts.total, counts.active, counts.ready].forEach((value, index) => { if (attendanceFilters[index]) attendanceFilters[index].textContent = String(value).padStart(2, '0'); });
  const clientValues = document.querySelectorAll('.client-summary b');
  if (clientValues[0]) clientValues[0].textContent = String(clients.length).padStart(2, '0');
  if (clientValues[1]) clientValues[1].textContent = String(services.length).padStart(2, '0');
  if (clientValues[2]) clientValues[2].textContent = String(counts.ready).padStart(2, '0');
  const linkCounter = document.querySelector('.side-panel .counter');
  if (linkCounter) linkCounter.textContent = String(counts.total).padStart(2, '0');
  const linkProgress = document.querySelector('.side-panel .progress-row b');
  if (linkProgress) linkProgress.textContent = `${Math.max(0, counts.total - 1)} de ${counts.total}`;
  const linkProgressBar = document.querySelector('.side-panel .progress-track span');
  if (linkProgressBar) linkProgressBar.style.width = counts.total ? `${(Math.max(0, counts.total - 1) / counts.total) * 100}%` : '0%';
  document.querySelectorAll('.employee-portal').forEach((portal) => {
    const metrics = portal.querySelectorAll('.employee-metrics b');
    const profile = globalThis.__sessionProfile;
    const assigned = services.map((item, index) => index).filter((index) => serviceStates[index].responsible === profile?.id || serviceStates[index].responsible === profile?.full_name || (!profile && serviceStates[index].responsible === 'Lucas Sampaio'));
    const assignedActive = assigned.filter((index) => serviceStates[index].status === 'in-progress').length;
    const assignedWithoutPhotos = assigned.filter((index) => !(servicePhotos[index] || []).length).length;
    const assignedReady = assigned.filter((index) => serviceStates[index].status === 'ready').length;
    if (metrics[0]) metrics[0].textContent = String(assignedActive).padStart(2, '0');
    if (metrics[1]) metrics[1].textContent = String(assignedWithoutPhotos).padStart(2, '0');
    if (metrics[2]) metrics[2].textContent = String(assignedReady).padStart(2, '0');
  });
  renderDashboardOrganization();
}
function vehicleVisual(vehicle) {
  const model = vehicleParts(vehicle).model;
  return `<span class="vehicle-mark" aria-label="${model}" title="${model}"><span></span></span>`;
}
let activeServiceIndex = 0;
const list = document.querySelector('#service-list');
list.innerHTML = services.map((item, index) => `<button class="service-row" data-service-index="${index}"><div class="service-main"><b>${item.client}</b><small>${item.vehicle} · ${item.service} · ${item.time}</small></div><span class="status-pill ${item.tone}">${item.status}</span></button>`).join('');
function refreshDashboardTodaySummary() {
  const summary = document.querySelector('#dashboard-today-summary');
  if (!summary) return;
  const counts = getServiceCounts();
  const entries = [
    ['received', 'Entradas', counts.received],
    ['in-progress', 'Em execução', counts.active + counts.waiting],
    ['ready', 'Retiradas', counts.ready],
  ];
  const total = entries.reduce((sum, [, , count]) => sum + count, 0);
  summary.innerHTML = `<div class="dashboard-today-summary-visual" role="img" aria-label="${total} atendimentos distribuídos por status"><div class="dashboard-today-summary-track">${entries.map(([tone, label, count]) => `<span class="${tone}" style="width:${total ? Math.round((count / total) * 100) : 0}%" aria-label="${label}: ${count}"></span>`).join('')}</div><div class="dashboard-today-summary-legend">${entries.map(([tone, label, count]) => `<span><i class="dashboard-stage-dot ${tone}"></i><b>${label}</b><strong>${count}</strong></span>`).join('')}</div></div>`;
}
refreshDashboardTodaySummary();
function refreshServiceList() {
  list.innerHTML = services.map((item, index) => `<button class="service-row" data-service-index="${index}"><div class="service-main"><b>${item.client}</b><small>${item.vehicle} · ${item.service} · ${item.time}</small></div><span class="status-pill ${item.tone}">${item.status}</span></button>`).join('');
  list.querySelectorAll('.service-row').forEach((row) => {
    const stage = document.createElement('small');
    stage.className = 'service-stage';
    stage.textContent = `Etapa: ${stageNames[serviceStates[Number(row.dataset.serviceIndex)].stage]}`;
    row.querySelector('.service-main').appendChild(stage);
    row.addEventListener('click', () => { activeServiceIndex = Number(row.dataset.serviceIndex); stageIndex = serviceStates[activeServiceIndex].stage; syncStage(); openModal('detail-modal'); });
  });
  refreshDashboardTodaySummary();
}
document.querySelector('#client-table').innerHTML = clients.map((item) => `<tr><td><b>${item[0]}</b><small>Cliente desde 2025</small></td><td>${item[1]}</td><td>${item[2]}</td><td><span class="status-pill ${item[4]}">${item[3]}</span></td><td><button class="text-button">Abrir →</button></td></tr>`).join('');

document.querySelectorAll('.service-row').forEach((row) => { const stage = document.createElement('small'); stage.className = 'service-stage'; stage.textContent = `Etapa: ${stageNames[serviceStates[Number(row.dataset.serviceIndex)].stage]}`; row.querySelector('.service-main').appendChild(stage); });
const sections = { 'visao-geral': 'dashboard-section', clientes: 'clients-section' };
let fallbackNavigationVersion = 0;
let currentNavigationToken = 0;
function beginNavigation() {
  currentNavigationToken = globalThis.__navigationCoordinator?.begin() || ++fallbackNavigationVersion;
  return currentNavigationToken;
}
function isCurrentNavigation(token) {
  return globalThis.__navigationCoordinator?.isCurrent(token) ?? token === fallbackNavigationVersion;
}
function canViewCurrentSection(section) {
  const role = globalThis.__activeRole;
  if (!role || !globalThis.__canViewSection) return true;
  return globalThis.__canViewSection(role, section);
}
function responsibleLabel(item, index) {
  const responsible = serviceStates[index]?.responsible || item?.responsibleId;
  const profile = (globalThis.__teamProfiles || []).find((person) => person.id === responsible || person.full_name === responsible);
  return profile?.full_name || responsible || 'Não atribuído';
}
const moduleCopy = {
  atendimentos: ['ATENDIMENTOS', 'Atendimentos', 'Ordens de serviço, etapas, fotos e links de acompanhamento.'],
  orcamentos: ['PRÉ-VENDAS', 'Orçamentos', 'Monte propostas com vários serviços antes de criar um atendimento.'],
  agenda: ['AGENDA OPERACIONAL', 'Agenda', 'Visualize entradas, retiradas e a carga de trabalho da equipe.'],
  servicos: ['CATÁLOGO DA EMPRESA', 'Serviços e preços', 'Configure os serviços exibidos no orçamento e no atendimento.'],
  equipe: ['ACESSOS E PERMISSÕES', 'Equipe', 'Defina o que cada pessoa pode visualizar e alterar no sistema.'],
  conversas: ['RELACIONAMENTO', 'Conversas', 'Centralize os retornos dos clientes e mantenha cada conversa ligada à ordem certa.'],
  'pos-venda': ['FIDELIZAÇÃO', 'Pós-venda', 'Acompanhe clientes depois da entrega e transforme retornos em relacionamento.'],
  relatorios: ['GESTÃO DA OPERAÇÃO', 'Relatórios', 'Acompanhe volume, status e gargalos com base nos registros atuais.'],
  configuracoes: ['CONFIGURAÇÕES', 'Configurações', 'Ajuste acessos, preferências e regras da operação.'],
  faturamento: ['GESTÃO FINANCEIRA', 'Faturamento', 'Acompanhe receitas, pagamentos, ordens e resultados por período.']
};
function showSection(section) {
  if (!canViewCurrentSection(section)) { showToast('Este mÃ³dulo nÃ£o estÃ¡ disponÃ­vel para o seu perfil.'); return; }
  const navigationToken = beginNavigation();
  document.querySelectorAll('.page-section').forEach((el) => el.classList.add('hidden'));
  const target = sections[section] || 'generic-section';
  document.querySelector(`#${target}`).classList.remove('hidden');
  if (section === 'clientes') renderClients();
  if (target === 'generic-section') renderModule(section, navigationToken);
  if (section === 'agenda') window.dispatchEvent(new CustomEvent('agenda-requested'));
  if (section === 'visao-geral') globalThis.__startWhatsAppNotifications?.(document.querySelector('#whatsapp-dashboard-notifications'));
  else globalThis.__stopWhatsAppNotifications?.();
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.section === section));
}
function openClientFicha(index) {
  const item = clients[index];
  if (!item) return;
  let modal = document.querySelector('#client-ficha-modal');
  if (!modal) {
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop hidden" id="client-ficha-modal"><div class="modal client-ficha"><button class="close-button" data-close="client-ficha-modal">×</button><p class="eyebrow">FICHA DO CLIENTE</p><h2 id="ficha-name"></h2><p class="muted" id="ficha-contact"></p><div class="ficha-grid"><div><span>Veículo</span><b id="ficha-vehicle"></b></div><div><span>Último serviço</span><b id="ficha-service"></b></div><div><span>Status atual</span><b id="ficha-status"></b></div><div><span>Histórico</span><b id="ficha-history"></b></div></div><div class="form-actions"><button class="primary-button" id="ficha-new-attendance">Novo atendimento</button></div></div></div>`);
    modal = document.querySelector('#client-ficha-modal');
    modal.querySelector('[data-close]').addEventListener('click', () => closeModal('client-ficha-modal'));
    modal.querySelector('#ficha-new-attendance').addEventListener('click', () => { closeModal('client-ficha-modal'); openModal('service-modal'); });
  }
  modal.querySelector('#ficha-name').textContent = item[0];
  modal.querySelector('#ficha-contact').textContent = 'WhatsApp cadastrado · cliente desde 2025';
  modal.querySelector('#ficha-vehicle').textContent = item[1];
  modal.querySelector('#ficha-service').textContent = item[2];
  modal.querySelector('#ficha-status').textContent = item[3];
  modal.querySelector('#ficha-history').textContent = `${Math.max(1, item[5] || index + 2)} serviços registrados`;
  openModal('client-ficha-modal');
}
function renderClients() {
  const section = document.querySelector('#clients-section');
  if (globalThis.__renderLiveClients) { globalThis.__renderLiveClients(section); return; }
  section.innerHTML = `<div class="page-heading"><div><p class="eyebrow">BASE DE RELACIONAMENTO</p><h1>Clientes e veículos</h1><p class="muted">Cadastros, veículos vinculados e histórico de serviços.</p></div><button class="primary-button" id="client-new-record">+ Cadastrar cliente</button></div><div class="client-summary"><div><span>Clientes ativos</span><b>24</b><small>com cadastro completo</small></div><div><span>Veículos registrados</span><b>31</b><small>5 retornaram este mês</small></div><div><span>Retornos previstos</span><b>07</b><small>nos próximos 30 dias</small></div></div><div class="client-directory"><div class="directory-toolbar"><div><h2>Diretório de clientes</h2><p>Use o histórico para consultar rapidamente qualquer veículo.</p></div><input id="client-search" placeholder="Buscar nome, telefone ou placa" /></div><div class="client-directory-heading"><span>CLIENTE</span><span>VEÍCULOS</span><span>ÚLTIMA VISITA</span><span>HISTÓRICO</span><span></span></div>${clients.map((item, index) => `<button class="client-record" data-client-index="${index}"><div class="client-identity"><span class="avatar">${item[0].split(' ').map((name) => name[0]).join('').slice(0,2)}</span><div><b>${item[0]}</b><small>cliente desde 2025 · WhatsApp cadastrado</small></div></div><div><b>1 veículo</b><small>${item[1]}</small></div><div><b>${index === 0 ? 'Hoje' : index === 1 ? '12 jun' : index === 2 ? '28 mai' : '04 mai'}</b><small>${item[2]}</small></div><div><span class="history-count">${index + 2} serviços</span><small>${index === 0 ? 'retorno em 30 dias' : 'último orçamento aprovado'}</small></div><span class="attendance-arrow">→</span></button>`).join('')}</div>`;
  section.innerHTML = section.innerHTML.replace('BASE DE RELACIONAMENTO', 'CLIENTES');
  const records = section.querySelectorAll('.client-record');
  refreshGlobalCounts();
  records.forEach((record, index) => { const history = record.querySelector('.history-count'); if (history) history.textContent = `${Math.max(1, clients[index][5] || index + 2)} serviços`; });
  section.querySelectorAll('.client-record .avatar').forEach((avatar) => { avatar.outerHTML = '<span class="person-mark" aria-hidden="true"></span>'; });
  section.querySelector('#client-search').addEventListener('input', (event) => { const query = event.target.value.toLowerCase(); records.forEach((record) => record.classList.toggle('filtered-out', !record.textContent.toLowerCase().includes(query))); });
  records.forEach((record) => record.addEventListener('click', () => openClientFicha(Number(record.dataset.clientIndex))));
  section.querySelector('#client-new-record').addEventListener('click', () => openModal('new-client-modal'));
}
function openServicePriceModal(service = null) {
  let modal = document.querySelector('#service-price-modal');
  if (!modal) {
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop hidden" id="service-price-modal"><div class="modal"><button class="close-button" data-close="service-price-modal">×</button><p class="eyebrow">CATÁLOGO DA EMPRESA</p><h2>Novo serviço</h2><p class="muted">Cadastre um serviço para que a equipe possa selecioná-lo nos atendimentos.</p><form id="service-price-form"><label>Nome do serviço<input name="name" required placeholder="Ex.: Lavagem técnica" /></label><label>Descrição<input name="description" required placeholder="Ex.: Limpeza externa e proteção rápida" /></label><label>Preço<input name="price" required placeholder="Ex.: 180" /></label><div class="form-actions"><button type="button" class="outline-button" data-close="service-price-modal">Cancelar</button><button class="primary-button">Salvar serviço</button></div></form></div></div>`);
    modal = document.querySelector('#service-price-modal');
    modal.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
    modal.querySelector('#service-price-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const price = Number(String(data.get('price') || '').replace(',', '.')) || 0;
      const changes = { name: data.get('name'), description: data.get('description'), price };
      const editingId = event.currentTarget.dataset.serviceId;
      if (editingId) {
        if (globalThis.__updateServiceInCatalog) globalThis.__updateServiceInCatalog(editingId, changes);
        else globalThis.__serviceCatalog = getCatalog().map((item) => item.id === editingId ? { ...item, ...changes } : item);
      } else {
        const newService = { id: `custom-${Date.now()}`, ...changes };
        serviceCatalogExtras.push(newService);
        globalThis.__serviceCatalog = [...getCatalog(), newService].filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index);
      }
      closeModal('service-price-modal');
      showSection('servicos');
      showToast(editingId ? 'Serviço atualizado no catálogo.' : 'Serviço adicionado ao catálogo.');
      event.currentTarget.reset();
    });
  }
  const form = modal.querySelector('#service-price-form');
  form.dataset.serviceId = service?.id || '';
  modal.querySelector('h2').textContent = service ? 'Editar serviço' : 'Novo serviço';
  modal.querySelector('.muted').textContent = service ? 'Atualize o nome, a descrição ou o preço deste serviço.' : 'Cadastre um serviço para que a equipe possa selecioná-lo nos atendimentos.';
  form.elements.name.value = service?.name || '';
  form.elements.description.value = service?.description || '';
  form.elements.price.value = service?.price ?? '';
  form.querySelector('.primary-button').textContent = service ? 'Salvar alterações' : 'Salvar serviço';
  openModal('service-price-modal');
}
function renderModule(section, navigationToken = currentNavigationToken) {
  const copy = moduleCopy[section] || moduleCopy.atendimentos;
  document.querySelector('#generic-eyebrow').textContent = copy[0];
  document.querySelector('#generic-title').textContent = copy[1];
  document.querySelector('#generic-description').textContent = copy[2];
  const genericAction = document.querySelector('#generic-action');
  const actionLabels = { agenda: '+ Reservar horário', equipe: '+ Adicionar membro', servicos: '+ Novo serviço', atendimentos: '+ Novo atendimento', orcamentos: '+ Novo orçamento', relatorios: 'Exportar resumo', faturamento: 'Atualizar faturamento', configuracoes: 'Salvar configurações' };
  genericAction.textContent = actionLabels[section] || '+ Adicionar registro';
  genericAction.dataset.module = section;
  genericAction.classList.toggle('hidden', ['atendimentos', 'orcamentos', 'conversas', 'faturamento', 'pos-venda', 'configuracoes'].includes(section));
  const content = document.querySelector('#module-content');
  content.removeAttribute('data-quotes-preview-root');
  if (section === 'orcamentos') {
    globalThis.__renderQuotesPreview?.(content);
    return;
  }
  if (section === 'pos-venda') {
    globalThis.__renderPostSale?.(content, navigationToken);
    return;
  }
  if (section === 'conversas' && globalThis.__renderWhatsAppInbox) {
    globalThis.__renderWhatsAppInbox(content, () => isCurrentNavigation(navigationToken));
    return;
  }
  if (section === 'agenda') {
    content.innerHTML = '<div id="agenda-root"></div>';
  } else if (section === 'equipe') {
    content.innerHTML = `<div class="module-grid"><div class="module-panel"><div class="module-toolbar"><h2>Pessoas cadastradas</h2><button class="outline-button" id="new-member">+ Adicionar pessoa</button></div><div class="permission-list" aria-live="polite" aria-busy="true"><p class="muted">Carregando equipe…</p></div></div><div class="module-panel"><h2>Permissões por função</h2><div class="data-line"><div><b>Administrador(a)</b><small>Todos os módulos, configurações e faturamento</small></div><span class="status-pill in-progress">Completo</span></div><div class="data-line"><div><b>Funcionário</b><small>Ordens, etapas, fotos e observações</small></div><span class="status-pill ready">Operacional</span></div><div class="data-line"><div><b>Recepção</b><small>Clientes, agenda e orçamentos</small></div><span class="status-pill waiting">Restrito</span></div></div></div>`;
  } else if (section === 'servicos') {
    content.innerHTML = `<div class="module-grid"><div class="module-panel"><div class="module-toolbar"><h2>Serviços oferecidos</h2><button class="outline-button" id="new-price">+ Novo serviço</button></div><div id="service-catalog-list"></div></div><div class="module-panel"><h2>Como o catálogo é usado</h2><p class="muted">A equipe seleciona os serviços na criação do orçamento. Os mesmos dados aparecem para o cliente antes da aprovação.</p><div class="mini-notice"><span class="status-dot green"></span><div><b>Catálogo ativo</b><small>Preços podem ser alterados sem mudar o histórico de ordens.</small></div></div></div></div>`;
    const catalogList = content.querySelector('#service-catalog-list');
    const renderCatalog = () => { catalogList.innerHTML = getCatalog().map((item) => `<div class="service-price" data-service-catalog-id="${item.id}"><div><b>${item.name}</b><small>${item.description}</small></div><div class="service-price-actions"><span>R$ ${Number(item.price).toLocaleString('pt-BR')}</span><button type="button" class="text-button danger-button" data-service-delete="${item.id}">Apagar</button></div></div>`).join('') || '<p class="dashboard-empty">Nenhum serviço cadastrado.</p>'; catalogList.querySelectorAll('.service-price').forEach((row) => row.addEventListener('click', (event) => { if (event.target.closest('[data-service-delete]')) return; openServicePriceModal(getCatalog().find((item) => item.id === row.dataset.serviceCatalogId)); })); catalogList.querySelectorAll('[data-service-delete]').forEach((button) => button.addEventListener('click', async () => { if (!(await globalThis.__requestConfirmation?.('service'))) return; globalThis.__removeServiceFromCatalog?.(button.dataset.serviceDelete); if (!globalThis.__removeServiceFromCatalog) { const index = serviceCatalogExtras.findIndex((item) => item.id === button.dataset.serviceDelete); if (index >= 0) serviceCatalogExtras.splice(index, 1); } renderCatalog(); showToast('Serviço removido do catálogo.'); })); };
    renderCatalog();
  } else if (section === 'conversas') {
    content.innerHTML = `<div class="module-grid"><div class="module-panel conversation-panel"><div class="module-toolbar"><h2>Conversas recentes</h2><span class="status-pill in-progress">${getServiceCounts().total} ordens com link</span></div>${services.map((item, index) => `<button class="data-line conversation-row" data-service-index="${index}"><div><b>${item.client}</b><small>${item.vehicle} · ${item.status}</small></div><span class="text-button">Abrir ordem</span></button>`).join('') || '<p class="dashboard-empty">Nenhuma conversa vinculada ainda.</p>'}</div><div class="module-panel"><h2>Fila de retorno</h2><p class="muted">Use o status da ordem para priorizar quem precisa de resposta.</p><div class="data-line"><div><b>${getServiceCounts().active}</b><small>Em atendimento</small></div><span class="status-pill in-progress">Acompanhar</span></div><div class="data-line"><div><b>${getServiceCounts().ready}</b><small>Prontos para retirada</small></div><span class="status-pill ready">Avisar</span></div></div></div>`;
  } else if (section === 'relatorios') {
    const reportCounts = getServiceCounts();
    const reportOrders = globalThis.__filterBillingOrders ? globalThis.__filterBillingOrders(globalThis.__liveServices || services, 'month') : services;
    const reportBilling = globalThis.__summarizeBilling ? globalThis.__summarizeBilling(reportOrders) : { received: 0, outstanding: 0, orderCount: reportOrders.length, averageTicket: 0 };
    const money = (value) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    content.innerHTML = `<section class="report-dashboard"><header class="report-hero"><div><p class="eyebrow">GESTÃO DA OPERAÇÃO</p><h2>Relatório do mês</h2><p class="muted">Uma leitura direta do faturamento, volume e ritmo da operação atual.</p></div><div class="report-export-actions"><button class="outline-button" id="export-report">Exportar CSV</button></div></header><section class="report-metrics"><article><span>Recebido no mês</span><strong>${money(reportBilling.received)}</strong><small>Ordens registradas como pagas</small></article><article><span>Ordens no período</span><strong>${reportBilling.orderCount}</strong><small>Atendimentos criados neste mês</small></article><article><span>Ticket médio</span><strong>${money(reportBilling.averageTicket)}</strong><small>Média por ordem concluída</small></article></section><div class="report-content-grid"><section class="module-panel report-finance-card"><div class="report-card-heading"><div><p class="eyebrow">FINANCEIRO</p><h3>Resultado da operação</h3></div><span class="status-pill ready">Em tempo real</span></div><div class="report-finance-total"><strong>${money(reportBilling.received)}</strong><span>Faturamento confirmado</span></div><div class="report-finance-breakdown"><div><span>Ordens registradas</span><b>${reportBilling.orderCount}</b></div><div><span>Ticket médio</span><b>${money(reportBilling.averageTicket)}</b></div><div><span>Valores a acompanhar</span><b>${money(reportBilling.outstanding)}</b></div></div></section><section class="module-panel report-operation-card"><div class="report-card-heading"><div><p class="eyebrow">OPERAÇÃO</p><h3>O que pede atenção</h3></div><span class="report-live-dot">Atualizado</span></div><div class="report-status-list"><div><span class="report-status-mark active"></span><div><b>${reportCounts.active} em operação</b><small>Serviços em execução agora</small></div></div><div><span class="report-status-mark ready"></span><div><b>${reportCounts.ready} prontos para retirada</b><small>Clientes que já podem ser avisados</small></div></div></div><p class="report-footnote">Os números mudam quando uma ordem, pagamento ou entrega é registrada.</p></section></div></section>`;
    content.classList.add('report-module');
    const exportRows = reportOrders.map((item) => ({ client: item.client, service: item.service, amount: item.amount, status: item.status }));
    const reportExportButton = content.querySelector('#export-report');
    reportExportButton.insertAdjacentHTML('afterend', '<button class="primary-button" id="export-report-pdf">Salvar PDF</button>');
    reportExportButton.addEventListener('click', () => { const csv = globalThis.__reportRowsToCsv ? globalThis.__reportRowsToCsv(exportRows) : ['Cliente;Serviço;Valor;Status', ...exportRows.map((item) => [item.client, item.service, item.amount, item.status].map((value) => { const text = String(value ?? ''); return /[;",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text }).join(';'))].join('\r\n'); const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `relatorio-operacional-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(link); link.click(); setTimeout(() => { link.remove(); URL.revokeObjectURL(url) }, 0); showToast('CSV do relat&oacute;rio baixado com os dados atuais.'); });
    content.querySelector('#export-report-pdf').addEventListener('click', () => { document.body.classList.add('print-report'); const cleanup = () => document.body.classList.remove('print-report'); window.addEventListener('afterprint', cleanup, { once: true }); window.print(); setTimeout(cleanup, 1500); });
  } else if (section === 'faturamento') {
    const allBillingOrders = globalThis.__liveServices || services;
    const period = globalThis.__billingPeriod || 'month';
    const billingOrders = globalThis.__filterBillingOrders ? globalThis.__filterBillingOrders(allBillingOrders, period) : allBillingOrders;
    const summary = globalThis.__summarizeBilling ? globalThis.__summarizeBilling(billingOrders) : { orderCount: 0, received: 0, outstanding: 0, averageTicket: 0, byService: [], paymentLabels: {} };
    const totalTracked = summary.received + summary.outstanding;
    const receivedPercent = totalTracked ? Math.round((summary.received / totalTracked) * 100) : 0;
    const money = (value) => `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const maxServiceAmount = Math.max(1, ...(summary.byService || []).map((item) => item.amount));
    const serviceBars = (summary.byService || []).map((item) => `<div class="billing-bar-row"><div><b>${item.service}</b><small>${item.orders} ${item.orders === 1 ? 'ordem' : 'ordens'}</small></div><strong>${money(item.amount)}</strong><div class="billing-bar-track"><span style="width:${Math.round((item.amount / maxServiceAmount) * 100)}%"></span></div></div>`).join('') || '<p class="dashboard-empty">Nenhuma ordem financeira registrada.</p>';
    const revenueTrend = globalThis.__buildRevenueTrend ? globalThis.__buildRevenueTrend(billingOrders) : [];
    const maxTrendAmount = Math.max(1, ...revenueTrend.map((item) => item.amount));
    const trendBars = revenueTrend.map((item) => `<div class="billing-trend-column"><span style="height:${Math.max(8, Math.round((item.amount / maxTrendAmount) * 100))}%" title="${money(item.amount)}"></span><small>${item.label}</small></div>`).join('') || '<p class="dashboard-empty">Os lançamentos do período aparecerão aqui.</p>';
    const paymentBreakdown = Object.entries(summary.paymentLabels || {}).map(([label, count]) => `<div class="billing-status-row"><span>${label}</span><b>${count}</b></div>`).join('') || '<p class="dashboard-empty">Sem pagamentos registrados.</p>';
    const orderRows = billingOrders.map((item) => `<div class="data-line"><div><b>${item.client}</b><small>${item.service} · ${item.status} · ${item.paymentStatus === 'paid' ? 'Recebido' : 'Em aberto'}</small></div><span>${money(item.amount)}</span></div>`).join('') || '<p class="dashboard-empty">Nenhuma ordem registrada.</p>';
    const periodLabel = { week: 'Esta semana', month: 'Este m&ecirc;s', year: 'Este ano' }[period] || 'Este m&ecirc;s';
    content.innerHTML = `<div class="billing-dashboard"><div class="billing-period-toolbar"><div><span class="eyebrow">PER&Iacute;ODO DE AN&Aacute;LISE</span><strong>${periodLabel}</strong><small>Atualizado automaticamente conforme a opera&ccedil;&atilde;o muda.</small></div><div class="billing-period-tabs">${[['week', 'Semana'], ['month', 'M&ecirc;s'], ['year', 'Ano']].map(([value, label]) => `<button type="button" class="${period === value ? 'active' : ''}" data-billing-period="${value}">${label}</button>`).join('')}</div></div><section class="billing-collection-card"><div><span>Fluxo de recebimento</span><strong>${money(summary.received)}</strong><small>${receivedPercent}% do valor registrado j&aacute; foi recebido.</small></div><div class="billing-ring" style="--billing-progress:${receivedPercent}%"><b>${receivedPercent}%</b><small>recebido</small></div></section><div class="billing-summary billing-summary-live"><div><span>Recebido</span><b>${money(summary.received)}</b><small>pagamentos marcados como recebidos</small></div><div><span>Em aberto</span><b>${money(summary.outstanding)}</b><small>ordens aguardando pagamento ou com saldo parcial</small></div><div><span>Ticket m&eacute;dio</span><b>${money(summary.averageTicket)}</b><small>valor m&eacute;dio por ordem</small></div><div><span>Ordens no per&iacute;odo</span><b>${summary.orderCount}</b><small>registros atuais da opera&ccedil;&atilde;o</small></div></div><div class="billing-chart-grid"><section class="module-panel"><div class="module-toolbar"><div><h2>Receita por servi&ccedil;o</h2><small>Compara&ccedil;&atilde;o pelo valor total das ordens.</small></div><span class="status-pill in-progress">Dados reais</span></div><div class="billing-bars">${serviceBars}</div></section><section class="module-panel"><div class="module-toolbar"><div><h2>Status dos pagamentos</h2><small>Distribui&ccedil;&atilde;o atual das ordens.</small></div><span class="status-pill ready">Ao vivo</span></div><div class="billing-status-list">${paymentBreakdown}</div></section></div><section class="module-panel"><div class="module-toolbar"><div><h2>Ordens financeiras</h2><small>Valores sincronizados com os registros atuais da opera&ccedil;&atilde;o.</small></div><span class="counter">${summary.orderCount}</span></div>${orderRows}</section></div>`;
    content.querySelector('.billing-chart-grid section:nth-child(2)')?.replaceWith(Object.assign(document.createElement('section'), { className: 'module-panel billing-trend-panel', innerHTML: `<div class="module-toolbar"><div><h2>Ritmo de faturamento</h2><small>Entradas registradas por dia no per&iacute;odo.</small></div><span class="status-pill ready">Ao vivo</span></div><div class="billing-trend-chart">${trendBars}</div>` }));
    content.querySelectorAll('[data-billing-period]').forEach((button) => button.addEventListener('click', () => { globalThis.__billingPeriod = button.dataset.billingPeriod; renderModule('faturamento'); }));
  } else if (section === 'configuracoes') {
    content.innerHTML = `<section class="settings-shell"><header class="settings-hero"><div><p class="eyebrow">CENTRAL DE CONFIGURAÇÕES</p><h2>Controle sua conta e a operação</h2><p class="muted">Preferências práticas para quem organiza a estética todos os dias.</p></div><span class="settings-role-badge">${globalThis.__sessionProfile?.role === 'administrator' ? 'Administrador(a)' : 'Acesso da conta'}</span></header><div class="settings-layout"><section class="module-panel settings-account-card"><div class="settings-section-heading"><div><p class="eyebrow">CONTA E SEGURANÇA</p><h3>Seu acesso</h3><p>Atualize seu nome e proteja sua conta.</p></div></div><form id="settings-profile-form" class="profile-settings-form"><label>Nome de exibição<input name="fullName" required minlength="2" maxlength="160" /></label><button class="outline-button" type="submit">Salvar nome</button></form><form id="settings-password-form" class="settings-password-form"><label>Nova senha<input name="password" type="password" required minlength="8" autocomplete="new-password" /></label><label>Confirmar nova senha<input name="confirmation" type="password" required minlength="8" autocomplete="new-password" /></label><button class="primary-button" type="submit">Alterar senha</button><p class="auth-message" data-settings-password-message role="alert"></p></form></section><section class="module-panel settings-preferences-card"><div class="settings-section-heading"><div><p class="eyebrow">OPERAÇÃO</p><h3>Regras do atendimento</h3><p>Defina o padrão aplicado aos próximos atendimentos.</p></div></div><form id="settings-operational-form"><label class="settings-toggle"><span><b>Avisar cliente ao mudar etapa</b><small>Prepara a atualização para o portal de acompanhamento.</small></span><input name="notifyStage" type="checkbox" /></label><label class="settings-toggle"><span><b>Exigir responsável na ordem</b><small>Evita que um atendimento entre sem alguém da equipe definido.</small></span><input name="requireResponsible" type="checkbox" /></label><label class="settings-toggle"><span><b>Solicitar fotos na finalização</b><small>Mantém o checklist visual completo antes da entrega.</small></span><input name="requireFinalPhotos" type="checkbox" /></label><div class="settings-save-row"><span data-settings-operation-message>Preferências salvas neste navegador.</span><button class="primary-button" type="submit">Salvar preferências</button></div></form></section><section class="module-panel settings-team-card"><div class="settings-section-heading"><div><p class="eyebrow">EQUIPE E ACESSOS</p><h3>Permissões da operação</h3><p>Cadastre pessoas e revise o que cada função pode acessar.</p></div></div><div class="settings-team-summary"><span>Administrador(a)<b>Controle completo</b></span><span>Recepção<b>Clientes, agenda e entregas</b></span><span>Funcionário<b>Etapas, fotos e observações</b></span></div><button class="outline-button" id="settings-team-link" type="button">Gerenciar equipe e permissões</button></section></div></section>`;
    delete content.dataset.settingsBound;
    content.querySelector('#settings-team-link').addEventListener('click', () => showSection('equipe'));
  } else if (section === 'atendimentos') {
     content.innerHTML = `<div class="attendances-shell"><div class="attendance-summary"><div><span>Todos</span><b>00</b><small>ordens abertas</small></div><div><span>Em andamento</span><b>00</b><small>na operação</small></div><div><span>Prontos</span><b>00</b><small>para retirada</small></div></div><div class="attendance-toolbar"><div class="attendance-filters"><button class="filter-tab active" data-filter="todos">Todos <span>00</span></button><button class="filter-tab" data-filter="andamento">Em andamento <span>00</span></button><button class="filter-tab" data-filter="prontos">Prontos <span>00</span></button></div><div class="attendance-tools"><input id="attendance-search" placeholder="Buscar cliente ou placa" /><button class="primary-button" id="attendance-new">+ Novo atendimento</button></div></div><div class="attendance-list"><div class="attendance-list-heading"><span>ATENDIMENTO</span><span>ETAPA ATUAL</span><span>RESPONSÁVEL</span><span>PREVISÃO</span><span></span></div>${services.map((item, index) => `<button class="attendance-item" data-service-index="${index}" data-status="${item.tone === 'in-progress' ? 'andamento' : 'prontos'}"><div class="attendance-client"><span class="car-icon">${item.initials}</span><div><b>${item.client}</b><small>${item.vehicle}</small></div></div><div><span class="status-pill ${item.tone}">${item.status}</span><small class="attendance-service">${item.service}</small></div><div class="attendance-person"><span class="avatar">${item.initials[0]}${item.initials[1]}</span><span>${responsibleLabel(item, index)}</span></div><div class="attendance-time"><b>${item.time.replace('Entrada ', '')}</b><small>previsão hoje</small></div><span class="attendance-arrow">→</span></button>`).join('')}</div></div>`;
    const attendanceHeading = content.querySelector('.attendance-list-heading');
    refreshGlobalCounts();
    content.querySelectorAll('.attendance-item').forEach((row) => { const index = Number(row.dataset.serviceIndex); const vehicleMark = row.querySelector('.attendance-client .car-icon'); if (vehicleMark) vehicleMark.outerHTML = vehicleVisual(services[index].vehicle); const personMark = row.querySelector('.attendance-person .avatar'); if (personMark) personMark.outerHTML = '<span class="person-mark" aria-hidden="true"></span>'; });
    content.querySelectorAll('.attendance-item').forEach((row) => {
      const index = Number(row.dataset.serviceIndex);
      const estimate = row.querySelector('.attendance-time b');
      const estimateLabel = row.querySelector('.attendance-time small');
      if (estimate) estimate.textContent = formatEstimate(index);
      if (estimateLabel) estimateLabel.textContent = 'previsão de entrega';
    });
    attendanceHeading.innerHTML = '<span>ATENDIMENTO</span><span>STATUS</span><span>ETAPA ATUAL</span><span>RESPONSÁVEL</span><span>PREVISÃO</span><span></span>';
    content.querySelectorAll('.attendance-item').forEach((row) => { const detailCell = row.children[1]; const statusCell = document.createElement('div'); statusCell.className = 'attendance-status'; statusCell.appendChild(detailCell.querySelector('.status-pill')); row.insertBefore(statusCell, detailCell); detailCell.className = 'attendance-stage-cell'; const stage = document.createElement('small'); stage.className = 'attendance-stage'; stage.textContent = stageNames[serviceStates[Number(row.dataset.serviceIndex)].stage]; row.querySelector('.attendance-service').before(stage); });
    const filterButtons = content.querySelectorAll('.filter-tab');
    const attendanceItems = content.querySelectorAll('.attendance-item');
    filterButtons.forEach((filter) => filter.addEventListener('click', () => { filterButtons.forEach((button) => button.classList.remove('active')); filter.classList.add('active'); attendanceItems.forEach((item) => { item.classList.toggle('filtered-out', filter.dataset.filter !== 'todos' && item.dataset.status !== filter.dataset.filter); }); }));
    content.querySelector('#attendance-search').addEventListener('input', (event) => { const query = event.target.value.toLowerCase(); attendanceItems.forEach((item) => item.classList.toggle('filtered-out', !item.textContent.toLowerCase().includes(query))); });
    content.querySelector('#attendance-new').addEventListener('click', () => openModal('service-modal'));
  } else {
    content.innerHTML = `<div class="module-grid"><div class="module-panel"><div class="module-toolbar"><h2>Ordens de serviço</h2><input placeholder="Buscar cliente ou placa" /></div>${services.map((item, index) => `<button class="data-line" data-service-index="${index}"><div><b>${item.client} · ${item.vehicle}</b><small>${item.service} · ${item.time}</small></div><span class="status-pill ${item.tone}">${item.status}</span></button>`).join('')}</div><div class="module-panel"><h2>Resumo da operação</h2><div class="data-line"><div><b>${getServiceCounts().active}</b><small>Em atendimento</small></div><span class="status-pill in-progress">Hoje</span></div><div class="data-line"><div><b>${getServiceCounts().ready}</b><small>Prontos para retirada</small></div><span class="status-pill ready">Avisar</span></div></div></div>`;
  }
  if (section === 'conversas') {
    content.querySelector('.conversation-panel')?.insertAdjacentHTML('beforeend', '<div class="whatsapp-connection"><span class="status-dot" id="whatsapp-status-dot"></span><div><b>WhatsApp da empresa</b><small id="whatsapp-status-copy">Verificando a conexão com a Evolution API...</small></div><button class="outline-button" id="connect-whatsapp">Atualizar</button></div><form class="whatsapp-test-form" id="whatsapp-test-form"><div><label for="whatsapp-test-number">Número para teste</label><input id="whatsapp-test-number" name="number" placeholder="(11) 99999-8888" required /></div><div><label for="whatsapp-test-message">Mensagem</label><input id="whatsapp-test-message" name="text" value="Teste do Atelier OS via Evolution API." required /></div><button class="primary-button" type="submit">Enviar teste</button><p class="auth-message" id="whatsapp-test-message-status" role="status"></p></form>');
    const statusDot = content.querySelector('#whatsapp-status-dot');
    const statusCopy = content.querySelector('#whatsapp-status-copy');
    const refreshWhatsAppStatus = async () => {
      try {
        const response = await fetch('/api/whatsapp/status');
        const data = await response.json();
        statusDot.className = `status-dot ${data.state === 'open' || data.state === 'connected' ? 'green' : ''}`;
        statusCopy.textContent = data.state === 'not_configured' ? 'Configure EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE no servidor local.' : `Estado da instância: ${data.state}.`;
      } catch { statusCopy.textContent = 'Não foi possível consultar a Evolution API neste momento.'; }
    };
    content.querySelector('#connect-whatsapp')?.addEventListener('click', refreshWhatsAppStatus);
    content.querySelector('#whatsapp-test-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = content.querySelector('#whatsapp-test-message-status');
      const formData = new FormData(event.currentTarget);
      message.textContent = 'Enviando...';
      try {
        const response = await fetch('/api/whatsapp/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(formData)) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Não foi possível enviar a mensagem.');
        message.textContent = 'Mensagem enviada pela Evolution API.';
      } catch (error) { message.textContent = error.message; }
    });
    refreshWhatsAppStatus();
  }
  content.querySelectorAll('[data-service-index]').forEach((item) => item.addEventListener('click', () => { activeServiceIndex = Number(item.dataset.serviceIndex); stageIndex = serviceStates[activeServiceIndex].stage; syncStage(); openModal('detail-modal'); }));
  if (section === 'servicos') {
    const catalogPanel = content.querySelector('.service-price')?.parentElement;
    const newPrice = content.querySelector('#new-price');
    if (newPrice) newPrice.addEventListener('click', openServicePriceModal);
  }
  content.querySelectorAll('button[id^="new-"]:not(#new-price)').forEach((item) => item.addEventListener('click', () => showToast('Formulário pronto para cadastrar este registro.')));
}
document.querySelectorAll('[data-section]').forEach((item) => item.addEventListener('click', () => { showSection(item.dataset.section); document.querySelector('#sidebar')?.classList.remove('mobile-open'); document.querySelector('#mobile-nav-toggle')?.setAttribute('aria-expanded', 'false'); }));
document.querySelector('#mobile-nav-toggle')?.addEventListener('click', () => { const sidebar = document.querySelector('#sidebar'); const button = document.querySelector('#mobile-nav-toggle'); const isOpen = sidebar?.classList.toggle('mobile-open'); button?.setAttribute('aria-expanded', String(Boolean(isOpen))); });
document.querySelector('#mobile-nav-backdrop')?.addEventListener('click', () => { document.querySelector('#sidebar')?.classList.remove('mobile-open'); document.querySelector('#mobile-nav-toggle')?.setAttribute('aria-expanded', 'false'); });
const openModal = (id) => { document.querySelector(`#${id}`).classList.remove('hidden'); if (id === 'service-modal') globalThis.__prepareServiceSubmission?.(); };
const closeModal = (id) => { const modal = document.querySelector(`#${id}`); if (modal) { modal.classList.add('hidden'); if (id === 'detail-modal') modal.classList.remove('employee-overlay'); } };
document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop hidden" id="new-client-modal"><div class="modal"><button class="close-button" data-close="new-client-modal">×</button><p class="eyebrow">BASE DE CLIENTES</p><h2>Cadastrar cliente</h2><p class="muted">Esse cadastro poderá ser reutilizado em novos atendimentos.</p><form id="new-client-form"><label>Nome completo<input name="name" required placeholder="Ex.: Rafael Nogueira" /></label><label>WhatsApp<input name="phone" required placeholder="(19) 99999-0000" /></label><label>Veículo e placa<input name="vehicle" required placeholder="Ex.: Honda Civic · RGT-4B21" /></label><div class="form-actions"><button type="button" class="outline-button" data-close="new-client-modal">Cancelar</button><button type="submit" class="primary-button">Salvar cliente</button></div></form></div></div>`);
document.querySelectorAll('#new-client-modal [data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
const serviceForm = document.querySelector('#service-form');
serviceForm?.querySelector('.form-actions .primary-button')?.setAttribute('type', 'submit');
const buttonHints = {
  '#new-service': 'Cadastrar cliente, veículo, serviços e gerar o link de acompanhamento.',
  '#open-client-link': 'Abrir uma demonstração do que o cliente verá pelo link.',
  '#employee-preview': 'Visualizar o painel com acesso operacional da equipe.',
  '#client-preview': 'Visualizar o portal externo do cliente.'
};
Object.entries(buttonHints).forEach(([selector, hint]) => { const button = document.querySelector(selector); if (button) button.title = hint; });
const whatsappButton = document.querySelector('.portal-footer .text-button');
if (whatsappButton) {
  whatsappButton.textContent = 'Falar pelo WhatsApp →';
  whatsappButton.title = 'Abrir o WhatsApp com uma mensagem sobre esta ordem de serviço.';
  whatsappButton.addEventListener('click', () => showToast('No sistema real, este botão abrirá o WhatsApp da empresa com a ordem já identificada.'));
}
function addClientPhotos(portal) {
  if (!portal || portal.querySelector('.portal-photos')) return;
  portal.querySelector('.portal-footer').insertAdjacentHTML('beforebegin', `<section class="portal-photos"><div class="portal-section-heading"><div><p class="eyebrow">CHECKLIST VISUAL</p><h3>Fotos por etapa</h3><small class="muted">Acompanhe o estado do veículo do recebimento à entrega.</small></div><span class="photo-count">3 fotos</span></div><div class="photo-checklist" data-client-photo-checklist></div></section>`);
  refreshClientPhotos();
}
function refreshClientPhotos() {
  document.querySelectorAll('.client-portal').forEach((portal) => {
    const checklist = portal.querySelector('[data-client-photo-checklist]');
    if (!checklist) return;
    const seeded = [
      { stage: 'received', url: 'https://images.squarespace-cdn.com/content/v1/62b21428251d255436cd2356/e61f43e0-c9fb-456a-aeb3-d9621d4291ff/GridArt_20230731_160914788.jpg', name: 'Estado inicial · Hoje, 08:45' },
      { stage: 'execution', url: 'https://images.squarespace-cdn.com/content/v1/62b21428251d255436cd2356/bae8f1fc-35fd-4465-88df-3f9b9fda6096/GridArt_20231204_172529008.jpg', name: 'Durante o serviço · Hoje, 11:20' },
      { stage: 'delivery', url: 'https://images.squarespace-cdn.com/content/v1/62b21428251d255436cd2356/793806e4-c939-4f89-96c8-9b7a62011617/GridArt_20231204_165303090.jpg', name: 'Resultado final · Hoje, 13:05' }
    ];
    const allPhotos = [...seeded, ...(servicePhotos[activeServiceIndex] || [])];
    const groups = photoGroups(allPhotos);
    checklist.innerHTML = PHOTO_CHECKLIST_STAGES.map(({ id, label, hint }) => `<section class="photo-checklist-stage"><div class="photo-checklist-heading"><div><b>${label}</b><small>${hint}</small></div><span>${groups[id].length} ${groups[id].length === 1 ? 'foto' : 'fotos'}</span></div><div class="photo-grid">${groups[id].map((photo) => `<figure><img src="${photo.url}" alt="Foto do veículo na etapa ${label.toLowerCase()}" /><figcaption>${photo.name}</figcaption></figure>`).join('') || '<p class="photo-stage-empty">Nenhuma foto registrada nesta etapa.</p>'}</div></section>`).join('') + (groups.general.length ? `<section class="photo-checklist-stage"><div class="photo-checklist-heading"><div><b>Registro geral</b><small>Fotos antigas sem etapa definida.</small></div><span>${groups.general.length} fotos</span></div><div class="photo-grid">${groups.general.map((photo) => `<figure><img src="${photo.url}" alt="Foto adicional do veículo" /><figcaption>${photo.name}</figcaption></figure>`).join('')}</div></section>` : '');
    const count = portal.querySelector('.photo-count');
    if (count) count.textContent = `${allPhotos.length} fotos`;
  });
}
document.querySelectorAll('.client-portal').forEach(addClientPhotos);
let stageIndex = serviceStates[0].stage;
function removeService(index) {
  if (!services[index]) return;
  services.splice(index, 1);
  serviceStates.splice(index, 1);
  serviceEstimates.splice(index, 1);
  serviceMilestones.splice(index, 1);
  servicePhotos.splice(index, 1);
  activeServiceIndex = Math.min(activeServiceIndex, Math.max(0, services.length - 1));
  stageIndex = services.length ? serviceStates[activeServiceIndex].stage : 0;
  refreshServiceList();
  renderModule('atendimentos');
  document.querySelectorAll('.employee-portal').forEach((portal) => { renderEmployeeJobs(portal); bindEmployeeOrderActions(portal); });
  refreshGlobalCounts();
}
function addEstimateEditor() {
  const detail = document.querySelector('#detail-modal');
  const estimate = serviceEstimates[activeServiceIndex] || { date: '', time: '' };
  const estimateText = formatEstimate(activeServiceIndex);
  const estimateLabel = detail.querySelector('#detail-estimate-label');
  const estimateDate = detail.querySelector('#estimate-date');
  const estimateTime = detail.querySelector('#estimate-time');
  if (estimateLabel) estimateLabel.textContent = estimateText;
  if (estimateDate && document.activeElement !== estimateDate) estimateDate.value = estimate.date;
  if (estimateTime && document.activeElement !== estimateTime) estimateTime.value = estimate.time;
  document.querySelectorAll('.client-portal').forEach((portal) => {
    const portalEstimate = portal.querySelector('.portal-estimate') || portal.querySelectorAll('.timeline-item')[4]?.querySelector('small');
    const milestones = serviceMilestones[activeServiceIndex];
    const timelineItems = portal.querySelectorAll('.timeline-item');
    if (portalEstimate) portalEstimate.textContent = serviceStates[activeServiceIndex]?.deliveryStatus === 'delivered' ? `Retirado em ${serviceStates[activeServiceIndex].deliveryAt || 'horário não registrado'}` : `Previsão: ${estimateText}`;
    if (milestones && timelineItems[0]) timelineItems[0].querySelector('small').textContent = `Recebido em ${milestones.received}`;
    if (milestones && timelineItems[1]) timelineItems[1].querySelector('small').textContent = stageIndex === 0 ? 'Aguardando avaliação inicial' : stageIndex === 1 ? 'Avaliação em andamento' : `Concluída em ${milestones.evaluated}`;
  });
  if (!detail || detail.querySelector('.estimate-editor')) return;
  detail.querySelector('.detail-progress').insertAdjacentHTML('afterend', `<section class="estimate-editor"><div><p class="eyebrow">PREVISÃO DE ENTREGA</p><strong id="detail-estimate-label">A definir após avaliação</strong><small>Defina o prazo depois de avaliar o serviço.</small></div><div class="estimate-fields"><label>Data<input id="estimate-date" type="date" /></label><label>Horário<input id="estimate-time" type="time" /></label><button class="outline-button" id="save-estimate">Salvar previsão</button></div></section>`);
  detail.querySelector('.detail-actions').insertAdjacentHTML('afterbegin', '<div class="order-management-actions"><button class="primary-button hidden" id="confirm-delivery">Confirmar entrega</button><button class="outline-button hidden" id="cancel-delivery">Cancelar entrega</button><button class="outline-button danger-button" id="delete-order">Apagar ordem</button></div>');
  detail.querySelector('#confirm-delivery').addEventListener('click', async () => { const state = serviceStates[activeServiceIndex]; if (state.status !== 'ready' || !['administrator', 'reception'].includes(globalThis.__activeRole)) return; state.deliveryStatus = 'delivered'; state.deliveryAt = getCurrentEntryData().received; syncStage(); try { await persistOrderTransition(activeServiceIndex, 'completed', 4); showToast('Entrega confirmada e atendimento finalizado.'); } catch (error) { showToast(error.message || 'Não foi possível confirmar a entrega.'); } });
  detail.querySelector('#cancel-delivery').addEventListener('click', async () => { serviceStates[activeServiceIndex].deliveryStatus = null; stageIndex = serviceStates[activeServiceIndex].stage; syncStage(); try { await persistOrderTransition(activeServiceIndex, 'ready_for_pickup', 4); showToast('Entrega cancelada. O veículo voltou para retirada.'); } catch (error) { showToast(error.message || 'Não foi possível cancelar a entrega.'); } });
  detail.querySelector('#delete-order').addEventListener('click', async () => { if (!(await globalThis.__requestConfirmation?.('order'))) return; const deleted = services[activeServiceIndex]; const deletedClient = deleted.client; try { if (deleted.orderId && globalThis.__deleteLiveWorkOrder) await globalThis.__deleteLiveWorkOrder(deleted.orderId); else removeService(activeServiceIndex); closeModal('detail-modal'); showToast(`Ordem de ${deletedClient} apagada do sistema.`); } catch (error) { showToast(error.message || 'Não foi possível apagar a ordem.'); } });
  detail.querySelector('#save-estimate').addEventListener('click', () => {
    const estimate = serviceEstimates[activeServiceIndex];
    estimate.date = detail.querySelector('#estimate-date').value;
    estimate.time = detail.querySelector('#estimate-time').value;
    syncStage();
    showToast(estimate.date && estimate.time ? 'Previsão atualizada e compartilhada com o cliente.' : 'Previsão removida. Defina uma data e um horário quando estiver pronto.');
  });
}
addEstimateEditor();
async function persistOrderTransition(index, status, stage, comment) {
  const active = services[index]
  if (active?.orderId && globalThis.__updateLiveWorkOrder) await globalThis.__updateLiveWorkOrder(active.orderId, status, { stage, comment })
}
function syncStage() {
  const names = stageNames;
  const active = services[activeServiceIndex];
  const state = serviceStates[activeServiceIndex];
  state.stage = stageIndex;
  active.currentStage = stageIndex;
  if (state.deliveryStatus === 'delivered') state.status = 'delivered';
  else if (stageIndex === 0) state.status = 'received';
  else if (stageIndex === 4) state.status = 'ready';
  else if (state.status !== 'waiting' || stageIndex !== 1) state.status = 'in-progress';
  active.status = state.status === 'delivered' ? 'Entregue' : state.status === 'received' ? 'Recebido' : state.status === 'ready' ? 'Pronto para retirada' : 'Em andamento';
  active.tone = state.status === 'delivered' ? 'delivered' : state.status;
  document.querySelectorAll('.timeline').forEach((timeline) => timeline.querySelectorAll('.timeline-item').forEach((item, index) => { item.classList.toggle('done', index < stageIndex); item.classList.toggle('current', index === stageIndex); item.querySelector('span').textContent = index < stageIndex ? '✓' : `0${index + 1}`; item.querySelector('b').textContent = names[index]; }));
  const detail = document.querySelector('#detail-modal');
  const estimate = serviceEstimates[activeServiceIndex] || { date: '', time: '' };
  const estimateText = formatEstimate(activeServiceIndex);
  const estimateLabel = detail.querySelector('#detail-estimate-label');
  const estimateDate = detail.querySelector('#estimate-date');
  const estimateTime = detail.querySelector('#estimate-time');
  if (estimateLabel) estimateLabel.textContent = estimateText;
  if (estimateDate && document.activeElement !== estimateDate) estimateDate.value = estimate.date;
  if (estimateTime && document.activeElement !== estimateTime) estimateTime.value = estimate.time;
  document.querySelectorAll('.client-portal').forEach((portal) => {
    const portalEstimate = portal.querySelector('.portal-estimate') || portal.querySelectorAll('.timeline-item')[4]?.querySelector('small');
    const milestones = serviceMilestones[activeServiceIndex];
    const timelineItems = portal.querySelectorAll('.timeline-item');
    if (portalEstimate) portalEstimate.textContent = state.deliveryStatus === 'delivered' ? `Retirado em ${state.deliveryAt || 'horário não registrado'}` : `Previsão: ${estimateText}`;
    if (milestones && timelineItems[0]) timelineItems[0].querySelector('small').textContent = `Recebido em ${milestones.received}`;
    if (milestones && timelineItems[1]) timelineItems[1].querySelector('small').textContent = stageIndex === 0 ? 'Aguardando avaliação inicial' : stageIndex === 1 ? 'Avaliação em andamento' : `Concluída em ${milestones.evaluated}`;
  });
  detail.querySelectorAll('#current-stage, .progress-label b').forEach((item) => item.textContent = names[stageIndex]);
  detail.querySelector('.progress-track span').style.width = `${((stageIndex + 1) / 5) * 100}%`;
  detail.querySelector('.progress-label span:last-child').textContent = `${stageIndex + 1} de 5`;
  detail.querySelectorAll('.stage').forEach((item, index) => { item.classList.toggle('active', index === Math.max(0, stageIndex - 2)); const label = item.querySelector('b'); if (label) label.textContent = stageNames[index + 2]; });
  const status = detail.querySelector('.status-pill');
  status.textContent = active.status;
  status.className = `status-pill ${active.tone}`;
  const cancelDelivery = detail.querySelector('#cancel-delivery');
  const confirmDelivery = detail.querySelector('#confirm-delivery');
  if (confirmDelivery) confirmDelivery.classList.toggle('hidden', state.status !== 'ready' || !['administrator', 'reception'].includes(globalThis.__activeRole));
  if (cancelDelivery) cancelDelivery.classList.toggle('hidden', state.deliveryStatus !== 'delivered');
  document.querySelectorAll('.attendance-item').forEach((row) => { const index = Number(row.dataset.serviceIndex); const item = services[index]; const state = serviceStates[index]; if (!item || !state) return; const pill = row.querySelector('.status-pill'); if (pill) { pill.textContent = item.status; pill.className = `status-pill ${item.tone}`; } const stage = row.querySelector('.attendance-stage'); if (stage) stage.textContent = `Etapa: ${stageNames[state.stage]}`; row.dataset.status = item.tone === 'in-progress' ? 'andamento' : item.tone === 'waiting' ? 'aprovacao' : item.tone === 'ready' ? 'prontos' : 'recebido'; });
   document.querySelectorAll('.attendance-item').forEach((row) => { const index = Number(row.dataset.serviceIndex); const state = serviceStates[index]; if (!state) return; const responsible = row.querySelector('.attendance-person span:last-child'); if (responsible) responsible.textContent = responsibleLabel(services[index], index); });
  document.querySelectorAll('.attendance-item[data-service-index]').forEach((row) => { const index = Number(row.dataset.serviceIndex); if (!serviceStates[index]) return; const estimate = row.querySelector('.attendance-time b'); const estimateLabel = row.querySelector('.attendance-time small'); if (estimate) estimate.textContent = formatEstimate(index); if (estimateLabel) estimateLabel.textContent = 'previsão de entrega'; });
  document.querySelectorAll('.service-row[data-service-index]').forEach((row) => { const index = Number(row.dataset.serviceIndex); const item = services[index]; const state = serviceStates[index]; if (!item || !state) return; const pill = row.querySelector('.status-pill'); if (pill) { pill.textContent = item.status; pill.className = `status-pill ${item.tone}`; } const stage = row.querySelector('.service-stage'); if (stage) stage.textContent = `Etapa: ${stageNames[state.stage]}`; });
  document.querySelectorAll('.employee-job[data-service-index]').forEach((job) => { const item = services[Number(job.dataset.serviceIndex)]; if (!item) return; const pill = job.querySelector('.status-pill'); if (pill) { pill.textContent = item.status; pill.className = `status-pill ${item.tone}`; } });
  document.querySelectorAll('.employee-job[data-service-index] .employee-action').forEach((button) => { const index = Number(button.dataset.serviceIndex); if (!services[index] || !serviceStates[index]) return; const presentation = getServicePresentation(index); button.textContent = presentation.actionLabel; button.dataset.employeeAction = presentation.action; button.classList.toggle('secondary-button', presentation.action === 'delivery'); button.classList.toggle('primary-button', presentation.action !== 'delivery'); });
  document.querySelectorAll('.client-portal').forEach((portal) => { const vehicle = portal.querySelector('.portal-vehicle h2'); const identity = portal.querySelector('.portal-vehicle .muted'); if (vehicle) vehicle.textContent = active.vehicle.split(' · ')[0]; if (identity) identity.textContent = `${active.vehicle.split(' · ')[1]} · ${active.client}`; });
  const clientRecord = clients.find((client) => client[0] === active.client);
  if (clientRecord) { clientRecord[2] = active.service; clientRecord[3] = active.status; clientRecord[4] = active.tone; }
  refreshClientPhotos();
  refreshGlobalCounts();
}
function renderEmployeeJobs(portal) {
  const list = portal && portal.querySelector('.employee-list');
  if (!list) return;
  const profile = globalThis.__sessionProfile;
  const liveServices = Array.isArray(globalThis.__liveServices) ? globalThis.__liveServices : null;
  if (profile && liveServices === null) {
    list.innerHTML = '<p class="employee-empty">Carregando as ordens atribu&iacute;das a este funcion&aacute;rio...</p>';
    return;
  }
  if (liveServices) {
    const assigned = (globalThis.__getEmployeeOrders ? globalThis.__getEmployeeOrders(liveServices, profile) : liveServices.filter((item) => item.responsibleId === profile?.id || item.responsibleId === profile?.full_name));
    const active = assigned.filter((item) => item.tone === 'in-progress').length;
    const ready = assigned.filter((item) => item.tone === 'ready' || item.tone === 'delivered').length;
    const metrics = portal.querySelectorAll('.employee-metrics b');
    if (metrics[0]) metrics[0].textContent = String(active).padStart(2, '0');
    if (metrics[1]) metrics[1].textContent = String(assigned.filter((item) => item.tone === 'waiting').length).padStart(2, '0');
    if (metrics[2]) metrics[2].textContent = String(ready).padStart(2, '0');
    portal.querySelector('[data-employee-agenda]')?.remove();
    const agenda = globalThis.__getEmployeeAgenda ? globalThis.__getEmployeeAgenda(liveServices, profile) : assigned.filter((item) => item.scheduledAt).sort((left, right) => new Date(left.scheduledAt) - new Date(right.scheduledAt));
    const agendaSection = document.createElement('section');
    agendaSection.className = 'employee-agenda-readonly';
    agendaSection.dataset.employeeAgenda = 'true';
    const agendaMarkup = agenda.map((item) => `<div class="employee-agenda-item"><time>${new Date(item.scheduledAt).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</time><div><b>${item.client}</b><small>${item.vehicle} · ${item.service}</small></div><span class="status-pill ${item.tone}">${item.status}</span></div>`).join('') || '<p class="employee-empty">Nenhum horário agendado para suas ordens.</p>';
    agendaSection.innerHTML = `<div class="employee-agenda-heading"><div><p class="eyebrow">SUA AGENDA</p><h3>Horários das ordens atribuídas</h3><small>Visualização somente leitura. Novos horários são criados pela recepção.</small></div></div><div class="employee-agenda-list">${agendaMarkup}</div>`;
    list.insertAdjacentElement('afterend', agendaSection);
    list.innerHTML = assigned.map((item) => `<div class="employee-job" data-live-order="${item.orderId}"><div><b>${item.client}</b><small>${item.vehicle}</small><span class="status-pill ${item.tone}">${item.status}</span></div><button class="${item.tone === 'ready' || item.tone === 'delivered' ? 'secondary-button' : 'primary-button'} employee-action" data-live-order="${item.orderId}">${item.tone === 'ready' || item.tone === 'delivered' ? 'Registrar entrega' : 'Abrir ordem'}</button></div>`).join('') || '<p class="employee-empty">Nenhuma ordem atribu&iacute;da a este funcion&aacute;rio.</p>';
    return;
  }
  const assigned = services.map((item, index) => ({ item, index })).filter(({ index }) => serviceStates[index].responsible === profile?.id || serviceStates[index].responsible === profile?.full_name || (!profile && serviceStates[index].responsible === 'Lucas Sampaio'));
  list.innerHTML = assigned.map(({ item, index }) => { const presentation = getServicePresentation(index); return `<div class="employee-job" data-service-index="${index}"><div><b>${item.client}</b><small>${item.vehicle}</small><span class="status-pill ${presentation.tone}">${presentation.label}</span></div><button class="${presentation.action === 'delivery' ? 'secondary-button' : 'primary-button'} employee-action" data-service-index="${index}" data-employee-action="${presentation.action}">${presentation.actionLabel}</button></div>`; }).join('') || '<p class="employee-empty">Nenhuma ordem atribu&iacute;da a este funcion&aacute;rio.</p>';
}
function renderEmployeeOrder(index) {
  const item = services[index];
  const state = serviceStates[index];
  if (!item || !state) return;
  const photos = servicePhotos[index] || [];
  const groups = photoGroups(photos);
  const photoMarkup = PHOTO_CHECKLIST_STAGES.map(({ id, label, hint }, stageIndex) => `<section class="employee-photo-stage"><div class="employee-section-heading"><div><b>${String(stageIndex + 1).padStart(2, '0')} · ${label}</b><small>${hint}</small></div><button class="outline-button employee-stage-photo" data-photo-stage="${id}" type="button">Adicionar foto</button></div><div class="employee-photo-grid">${groups[id].map((photo) => `<figure><img src="${photo.url}" alt="Foto adicionada na etapa ${label.toLowerCase()}" /><figcaption>${photo.name}</figcaption></figure>`).join('') || '<p class="employee-empty">Nenhuma foto adicionada nesta etapa.</p>'}</div></section>`).join('') + (groups.general.length ? `<section class="employee-photo-stage"><div class="employee-section-heading"><div><b>Registro geral</b><small>Fotos antigas sem etapa definida.</small></div></div><div class="employee-photo-grid">${groups.general.map((photo) => `<figure><img src="${photo.url}" alt="Foto adicional do veículo" /><figcaption>${photo.name}</figcaption></figure>`).join('')}</div></section>` : '');
  const vehicle = vehicleParts(item.vehicle);
  const advanceButton = state.stage < 4 ? '<button class="outline-button" id="employee-advance">Avan&ccedil;ar etapa</button>' : '';
  const backButton = state.stage > 0 ? '<button class="outline-button" id="employee-back-stage">Voltar etapa</button>' : '';
  const deliveryButton = state.deliveryStatus === 'delivered' ? '<button class="outline-button" id="employee-cancel-delivery">Cancelar entrega</button>' : '<button class="primary-button" id="employee-delivery" disabled>Registrar entrega</button>';
  const deliveryAction = state.status === 'ready' ? '<button class="primary-button" id="employee-delivery">Registrar entrega</button>' : deliveryButton;
  roleScreenContent.innerHTML = `<section class="employee-order-screen"><div class="employee-order-heading"><div><p class="eyebrow">ORDEM OPERACIONAL</p><h1>${vehicle.model}</h1><p class="muted">${item.client} · ${vehicle.plate}</p></div><button class="outline-button" id="employee-back">Voltar para minhas ordens</button></div><div class="employee-order-grid"><article class="employee-order-main"><div class="employee-order-status"><div><span class="status-pill ${item.tone}">${item.status}</span><b>${stageNames[state.stage]}</b></div><small>Respons&aacute;vel: ${state.responsible}</small></div><div class="employee-stage-strip"><span class="completed">Entrada</span><span class="${state.stage >= 1 ? 'completed' : ''}">Avalia&ccedil;&atilde;o</span><span class="${state.stage >= 2 ? 'completed' : 'current'}">Execu&ccedil;&atilde;o</span><span class="${state.stage >= 3 ? 'completed' : ''}">Inspe&ccedil;&atilde;o</span><span class="${state.stage >= 4 ? 'completed' : ''}">Retirada</span></div><div class="employee-order-actions">${backButton}${advanceButton}${deliveryAction}<input id="employee-photo-input" type="file" accept="image/*" multiple hidden /></div><section class="employee-photo-board"><div class="employee-section-heading"><div><p class="eyebrow">CHECKLIST VISUAL</p><h2>Fotos por etapa</h2><small class="muted">${photos.length} foto${photos.length === 1 ? '' : 's'} registrada${photos.length === 1 ? '' : 's'} neste atendimento.</small></div></div>${photoMarkup}</section><section class="employee-observation"><label>Observa&ccedil;&atilde;o interna<textarea id="employee-observation" rows="3" placeholder="Registre um detalhe importante para a equipe.">${state.note || ''}</textarea><small class="form-helper">Vis&iacute;vel somente para a equipe da opera&ccedil;&atilde;o; n&atilde;o aparece para o cliente.</small></label><button class="outline-button" id="employee-save-note">Salvar observa&ccedil;&atilde;o</button></section></article><aside class="employee-order-aside"><div><span>Servi&ccedil;o</span><b>${item.service}</b></div><div><span>Entrada</span><b>${serviceMilestones[index]?.received || item.time}</b></div><div><span>Previs&atilde;o</span><b>${formatEstimate(index)}</b></div><div><span>Cliente</span><b>${item.client}</b><button class="text-button" id="employee-client-ficha">Ver ficha do cliente</button></div></aside></div></section>`;
  roleScreenContent.querySelector('#employee-back').addEventListener('click', () => showRoleScreen('employee'));
  let selectedPhotoStage = 'received';
  roleScreenContent.querySelectorAll('.employee-stage-photo').forEach((button) => button.addEventListener('click', () => { selectedPhotoStage = button.dataset.photoStage; roleScreenContent.querySelector('#employee-photo-input').click(); }));
  roleScreenContent.querySelector('#employee-photo-input').addEventListener('change', (event) => { servicePhotos[index].push(...Array.from(event.target.files).map((file) => ({ url: URL.createObjectURL(file), name: file.name, stage: selectedPhotoStage }))); refreshClientPhotos(); renderEmployeeOrder(index); showToast('Foto adicionada à etapa e ao portal do cliente.'); });
  const advance = roleScreenContent.querySelector('#employee-advance');
  if (advance) advance.addEventListener('click', async () => { activeServiceIndex = index; stageIndex = Math.min(4, state.stage + 1); syncStage(); try { await persistOrderTransition(index, stageIndex === 4 ? 'ready_for_pickup' : 'in_progress', stageIndex); renderEmployeeOrder(index); showToast('Etapa atualizada para toda a equipe.'); } catch (error) { showToast(error.message || 'Não foi possível salvar a etapa.'); } });
  const backStage = roleScreenContent.querySelector('#employee-back-stage');
  if (backStage) backStage.addEventListener('click', async () => { activeServiceIndex = index; stageIndex = Math.max(0, state.stage - 1); state.deliveryStatus = null; syncStage(); try { await persistOrderTransition(index, stageIndex === 0 ? 'scheduled' : 'in_progress', stageIndex); renderEmployeeOrder(index); showToast('Etapa anterior restaurada.'); } catch (error) { showToast(error.message || 'Não foi possível salvar a etapa.'); } });
  const delivery = roleScreenContent.querySelector('#employee-delivery');
  if (delivery) delivery.addEventListener('click', async () => { if (state.status !== 'ready') return; state.deliveryStatus = 'delivered'; state.deliveryAt = getCurrentEntryData().received; activeServiceIndex = index; stageIndex = 4; syncStage(); try { await persistOrderTransition(index, 'completed', 4); renderEmployeeOrder(index); showToast('Entrega registrada às ' + state.deliveryAt + '.'); } catch (error) { showToast(error.message || 'Não foi possível confirmar a entrega.'); } });
  const cancelDelivery = roleScreenContent.querySelector('#employee-cancel-delivery');
  if (cancelDelivery) cancelDelivery.addEventListener('click', async () => { state.deliveryStatus = null; state.deliveryAt = ''; activeServiceIndex = index; stageIndex = state.stage; syncStage(); try { await persistOrderTransition(index, 'ready_for_pickup', 4); renderEmployeeOrder(index); showToast('Entrega cancelada. O veículo voltou para retirada.'); } catch (error) { showToast(error.message || 'Não foi possível cancelar a entrega.'); } });
  roleScreenContent.querySelector('#employee-save-note').addEventListener('click', (event) => { state.note = roleScreenContent.querySelector('#employee-observation').value.trim(); event.currentTarget.textContent = 'Observa&ccedil;&atilde;o salva'; event.currentTarget.classList.add('saved-action'); showToast('Observa&ccedil;&atilde;o salva para a equipe da opera&ccedil;&atilde;o.'); });
  roleScreenContent.querySelector('#employee-client-ficha').addEventListener('click', () => { const clientIndex = clients.findIndex((client) => client[0] === item.client); if (clientIndex >= 0) openClientFicha(clientIndex); else showToast('Ficha do cliente ainda n&atilde;o foi cadastrada.'); });
}
function bindEmployeeOrderActions(portal) {
  if (!portal) return;
  portal.querySelectorAll('.employee-action[data-service-index]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation();
    const index = Number(button.dataset.serviceIndex);
    activeServiceIndex = index;
    stageIndex = serviceStates[index].stage;
    renderEmployeeOrder(index);
  }));
  portal.querySelectorAll('.employee-action[data-live-order]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation();
    const order = (globalThis.__liveServices || []).find((item) => item.orderId === button.dataset.liveOrder);
    if (!order) return;
    let index = services.findIndex((item) => item.orderId === order.orderId);
    if (index < 0) {
      index = services.push(order) - 1;
      serviceStates.push({ stage: order.tone === 'delivered' || order.tone === 'ready' ? 4 : order.tone === 'in-progress' ? 2 : 0, status: order.tone === 'delivered' ? 'delivered' : order.tone === 'ready' ? 'ready' : order.tone === 'in-progress' ? 'in-progress' : 'received', deliveryStatus: order.tone === 'delivered' ? 'delivered' : null, responsible: order.responsibleId || 'Não atribuído' });
      serviceEstimates.push({ date: order.scheduledAt ? new Date(order.scheduledAt).toISOString().slice(0, 10) : '', time: order.scheduledAt ? new Date(order.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '' });
      serviceMilestones.push({ received: order.time, evaluated: '' });
      servicePhotos.push([]);
    }
    activeServiceIndex = index;
    stageIndex = serviceStates[index].stage;
    renderEmployeeOrder(index);
  }));
}
const employeePortal = document.querySelector('.employee-portal');
if (employeePortal) {
  renderEmployeeJobs(employeePortal);
  bindEmployeeOrderActions(employeePortal);
}
function renderEmployeeForm(type) {
  const isClient = type === 'client';
  roleScreenContent.innerHTML = `<div class="employee-form-screen"><div class="employee-agenda-heading"><div><p class="eyebrow">PAINEL DA RECEPÇÃO</p><h1>${isClient ? 'Cadastrar cliente' : 'Novo atendimento'}</h1><p class="muted">${isClient ? 'Cadastre os dados para reutilizar em próximos atendimentos.' : 'Registre a chegada do veículo sem sair do painel do funcionário.'}</p></div><button class="outline-button" id="back-to-employee-form">← Voltar ao painel</button></div><div class="module-panel"><form id="employee-role-form"><label>Cliente${isClient ? '' : '<select name="existingClient"><option value="new">Novo cliente</option><option>Rafael Nogueira · Honda Civic</option><option>Camila Bittencourt · Toyota Corolla</option><option>João Vitor Mendes · Jeep Compass</option></select>'}<input name="client" required placeholder="Nome completo" /></label><label>WhatsApp<input name="phone" required placeholder="(19) 99999-0000" /></label><label>Veículo e placa<input name="vehicle" required placeholder="Ex.: Honda Civic · RGT-4B21" /></label>${isClient ? '' : '<label>Serviço<select name="service"><option>Detalhamento interno</option><option>Polimento técnico</option><option>Higienização completa</option><option>Proteção cerâmica</option></select></label>'}<div class="form-actions"><button type="button" class="outline-button" id="cancel-employee-form">Cancelar</button><button class="primary-button">${isClient ? 'Salvar cliente' : 'Criar atendimento'}</button></div></form></div></div>`;
  roleScreenContent.querySelector('#back-to-employee-form').addEventListener('click', () => showRoleScreen('employee'));
  roleScreenContent.querySelector('#cancel-employee-form').addEventListener('click', () => showRoleScreen('employee'));
  const existing = roleScreenContent.querySelector('select[name="existingClient"]');
  if (existing) {
    existing.innerHTML = `<option value="new">Novo cliente</option>${clients.map((client, index) => `<option value="${index}">${client[0]} · ${vehicleParts(client[1]).model}</option>`).join('')}`;
    existing.addEventListener('change', (event) => { const selected = clients[Number(event.target.value)]; if (selected) { roleScreenContent.querySelector('input[name="client"]').value = selected[0]; roleScreenContent.querySelector('input[name="vehicle"]').value = selected[1]; } });
  }
  if (existing) existing.addEventListener('change', (event) => { const values = { 'Rafael Nogueira · Honda Civic': ['Rafael Nogueira', 'Honda Civic Touring · RGT-4B21'], 'Camila Bittencourt · Toyota Corolla': ['Camila Bittencourt', 'Toyota Corolla XEi · FDL-8A06'], 'João Vitor Mendes · Jeep Compass': ['João Vitor Mendes', 'Jeep Compass Limited · EKW-1C73'] }; const selected = values[event.target.value]; if (selected) { roleScreenContent.querySelector('input[name="client"]').value = selected[0]; roleScreenContent.querySelector('input[name="vehicle"]').value = selected[1]; } });
  if (!isClient) {
    const responsible = document.createElement('label');
    responsible.innerHTML = `Responsável<select name="responsible">${teamMembers.map((member) => `<option value="${member.name}">${member.name} · ${member.role}</option>`).join('')}</select><small class="form-helper">Escolha quem ficará com esta ordem.</small>`;
    roleScreenContent.querySelector('#employee-role-form .form-actions').before(responsible);
  }
  roleScreenContent.querySelector('#employee-role-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!isClient) {
      const client = data.get('client');
      const vehicle = data.get('vehicle');
      const service = data.get('service');
      const responsible = data.get('responsible') || 'Não atribuído';
      const entry = getCurrentEntryData();
      services.push({ initials: client.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), client, vehicle, service, status: 'Recebido', tone: 'received', time: entry.time });
      serviceStates.push({ stage: 0, status: 'received', responsible });
      serviceEstimates.push({ date: '', time: '' });
      serviceMilestones.push({ received: entry.received, evaluated: '' });
      upsertClientFromService(client, vehicle, service, 'Recebido', 'received');
      servicePhotos.push([]);
      refreshServiceList();
      refreshGlobalCounts();
    } else {
      clients.push([data.get('client'), data.get('vehicle'), 'Sem histórico', 'Novo cadastro', 'received', 0, '']);
      refreshGlobalCounts();
    }
    showRoleScreen('employee');
    showToast(isClient ? 'Cliente cadastrado com sucesso.' : 'Atendimento criado e responsável atribuído.');
  });
}
const roleScreen = document.querySelector('#role-screen');
const roleScreenContent = document.querySelector('#role-screen-content');
function renderEmployeeAgenda() {
  roleScreenContent.innerHTML = `<div class="employee-agenda-screen"><div class="employee-agenda-heading"><div><p class="eyebrow">AGENDA DA RECEPÇÃO</p><h1>Marcar atendimento</h1><p class="muted">Escolha um horário livre para cadastrar a entrada do veículo.</p></div><button class="outline-button" id="back-to-employee">← Voltar ao painel</button></div><div class="module-panel"><div class="module-toolbar"><h2>07 a 11 de agosto</h2><button class="primary-button" id="agenda-new-booking">+ Novo horário</button></div><div class="calendar-grid"><div class="calendar-day"><strong>Qui · 07</strong><small>4 horários</small><div class="calendar-event"><b>08:30 · Rafael N.</b>Honda Civic · Confirmado</div><div class="calendar-event"><b>14:00 · Marina A.</b>BMW 320i · Em andamento</div></div><div class="calendar-day"><strong>Sex · 08</strong><small>3 horários</small><div class="calendar-event"><b>09:00 · Bruno S.</b>Jeep Renegade · Confirmado</div><div class="calendar-event available"><b>11:30 · Horário livre</b>Clique para agendar</div></div><div class="calendar-day"><strong>Sáb · 09</strong><small>2 horários</small><div class="calendar-event"><b>10:30 · Ana P.</b>Corolla XEi · Confirmado</div></div><div class="calendar-day"><strong>Dom · 10</strong><small>Fechado</small></div><div class="calendar-day"><strong>Seg · 11</strong><small>5 horários</small><div class="calendar-event"><b>08:00 · Lucas M.</b>Onix Premier · Confirmado</div></div></div></div></div>`;
  roleScreenContent.querySelector('#back-to-employee').addEventListener('click', () => showRoleScreen('employee'));
  roleScreenContent.querySelector('#agenda-new-booking').addEventListener('click', () => showToast('Formulário de novo agendamento aberto para a recepção.'));
  roleScreenContent.querySelectorAll('.calendar-event.available').forEach((slot) => slot.addEventListener('click', () => showToast('Horário selecionado. Agora cadastre o cliente e o veículo.')));
}
function renderEmployeeDashboard() {
  const profile = globalThis.__sessionProfile || {};
  const liveServices = globalThis.__liveServices;
  const sourceServices = Array.isArray(liveServices) ? liveServices : services;
  const dashboard = globalThis.__getEmployeeDashboardData ? globalThis.__getEmployeeDashboardData(sourceServices, profile) : { orders: sourceServices.filter((item) => item.responsibleId === profile.id || item.responsibleId === profile.full_name), metrics: { active: 0, ready: 0, total: 0 } };
  const safe = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  const agenda = dashboard.orders.filter((item) => item.scheduledAt || item.time).slice().sort((a, b) => String(a.scheduledAt || a.time).localeCompare(String(b.scheduledAt || b.time)));
  const orderMarkup = dashboard.orders.map((item) => `<button type="button" class="employee-dashboard-order" data-live-order="${safe(item.orderId)}"><span class="vehicle-mark" aria-hidden="true"></span><span class="employee-dashboard-order-copy"><b>${safe(item.client)}</b><small>${safe(item.vehicle)} · ${safe(item.service)}</small></span><span class="status-pill ${safe(item.tone)}">${safe(item.status)}</span><span class="dashboard-arrow">→</span></button>`).join('') || '<p class="employee-empty">Nenhuma ordem atribuída a este funcionário.</p>';
  const agendaMarkup = agenda.map((item) => `<div class="employee-dashboard-agenda-item"><span class="employee-dashboard-time">${safe(item.time?.replace('Entrada ', '') || '—')}</span><span><b>${safe(item.client)}</b><small>${safe(item.vehicle)} · ${safe(item.service)}</small></span><span class="status-pill ${safe(item.tone)}">${safe(item.status)}</span></div>`).join('') || '<p class="employee-empty">Nenhum horário previsto para as ordens atribuídas.</p>';
  roleScreenContent.innerHTML = `<section class="employee-dashboard"><div class="employee-dashboard-heading"><div><p class="eyebrow">PAINEL OPERACIONAL</p><h1>${globalThis.__timeGreeting?.() || 'Bom dia'}, ${safe(profile.full_name || 'funcionário')}.</h1><p class="muted">Acompanhe suas ordens, etapas e horários em uma única visão.</p></div><span class="role-tag">Funcionário</span></div><div class="employee-dashboard-metrics"><div><b>${String(dashboard.metrics.active).padStart(2, '0')}</b><small>Em atendimento</small></div><div><b>${String(dashboard.metrics.ready).padStart(2, '0')}</b><small>Prontos para retirada</small></div><div><b>${String(dashboard.metrics.total).padStart(2, '0')}</b><small>Ordens atribuídas</small></div></div><div class="employee-dashboard-grid"><section class="employee-dashboard-panel"><div class="employee-dashboard-panel-heading"><div><p class="eyebrow">OPERAÇÃO</p><h2>Ordens do momento</h2></div><span class="dashboard-count">${String(dashboard.metrics.total).padStart(2, '0')}</span></div><p class="muted">Serviços vinculados ao seu acesso no sistema.</p><div class="employee-dashboard-order-list">${orderMarkup}</div></section><section class="employee-dashboard-panel"><div class="employee-dashboard-panel-heading"><div><p class="eyebrow">AGENDA</p><h2>Hoje</h2></div><span class="dashboard-count">${String(agenda.length).padStart(2, '0')}</span></div><p class="muted">Horários relacionados às suas ordens.</p><div class="employee-dashboard-agenda-list">${agendaMarkup}</div></section></div><div class="employee-dashboard-note"><b>Seu espaço de trabalho</b><span>Abra uma ordem para atualizar etapas, adicionar fotos, registrar observações e marcar a retirada.</span></div></section>`;
  roleScreenContent.querySelectorAll('[data-live-order]').forEach((button) => button.addEventListener('click', () => { const order = dashboard.orders.find((item) => item.orderId === button.dataset.liveOrder); if (order) showToast(`Ordem de ${order.client} selecionada.`); }));
}
function showRoleScreen(role) {
  const isEmployee = role === 'employee';
  document.querySelector('#role-screen-title').textContent = isEmployee ? 'Painel do funcionário' : 'Portal do cliente';
  document.querySelector('#role-screen-subtitle').textContent = isEmployee ? 'Recepção e operação' : 'Acompanhamento do veículo';
  const source = document.querySelector(isEmployee ? '.employee-portal' : '.client-portal').cloneNode(true);
  source.querySelectorAll('.close-button').forEach((button) => button.remove());
  roleScreenContent.innerHTML = '';
  roleScreenContent.appendChild(source);
  if (isEmployee) {
    const employeeName = globalThis.__sessionProfile?.full_name || 'funcionário';
    const heading = source.querySelector('.employee-heading h2');
    if (heading) heading.textContent = `${globalThis.__timeGreeting?.() || 'Bom dia'}, ${employeeName}.`;
    renderEmployeeJobs(source);
    bindEmployeeOrderActions(source);
  }
  if (!isEmployee) addClientPhotos(source);
  if (serviceStates[activeServiceIndex]) syncStage();
  roleScreen.classList.remove('hidden');
  roleScreenContent.querySelectorAll('.employee-action:not([data-service-index])').forEach((button) => button.addEventListener('click', () => showToast(`${button.dataset.action}: ação registrada no sistema.`)));
  const newService = roleScreenContent.querySelector('#reception-new-service');
  if (newService) newService.addEventListener('click', () => renderEmployeeForm('attendance'));
  const newClient = roleScreenContent.querySelector('#reception-new-client');
  if (newClient) newClient.addEventListener('click', () => renderEmployeeForm('client'));
  const newBooking = roleScreenContent.querySelector('#reception-new-booking');
  if (newBooking) newBooking.addEventListener('click', () => renderEmployeeAgenda());
  const whatsapp = roleScreenContent.querySelector('.portal-footer .text-button');
  if (whatsapp) whatsapp.addEventListener('click', () => showToast('No sistema real, este botão abrirá o WhatsApp da empresa com a ordem identificada.'));
}
globalThis.__showRoleScreen = showRoleScreen;
globalThis.__showSection = showSection;
document.addEventListener('role-screen-request', (event) => showRoleScreen(event.detail));
document.addEventListener('section-request', (event) => showSection(event.detail));
document.addEventListener('live-data-ready', () => { if (globalThis.__activeRole === 'employee' && !roleScreen.classList.contains('hidden')) { const currentPortal = roleScreenContent.querySelector('.employee-portal'); if (currentPortal) { renderEmployeeJobs(currentPortal); bindEmployeeOrderActions(currentPortal); } } });
document.querySelector('#return-admin').addEventListener('click', () => { roleScreen.classList.add('hidden'); roleScreenContent.innerHTML = ''; });
document.querySelector('#new-service').addEventListener('click', (event) => { event.preventDefault(); openModal('service-modal'); globalThis.__refreshServiceOptions?.(); });
document.querySelector('#employee-preview').addEventListener('click', () => showRoleScreen('employee'));
document.querySelector('#client-preview').addEventListener('click', () => showRoleScreen('client'));
document.querySelector('#open-client-link').addEventListener('click', () => showRoleScreen('client'));
document.querySelectorAll('#service-list .service-row').forEach((item) => item.addEventListener('click', () => { activeServiceIndex = Number(item.dataset.serviceIndex); stageIndex = serviceStates[activeServiceIndex].stage; syncStage(); openModal('detail-modal'); }));
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
document.querySelector('#service-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  if (data.has('clientId')) return;
  const client = data.get('client');
  const vehicle = data.get('vehicle');
  const service = data.get('service');
  const responsible = data.get('responsible') || 'Não atribuído';
  const entry = getCurrentEntryData();
  services.push({ initials: client.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), client, vehicle, service, status: 'Recebido', tone: 'received', time: entry.time });
  serviceStates.push({ stage: 0, status: 'received', responsible });
  serviceEstimates.push({ date: '', time: '' });
  serviceMilestones.push({ received: entry.received, evaluated: '' });
  upsertClientFromService(client, vehicle, service, 'Recebido', 'received');
  servicePhotos.push([]);
  refreshServiceList();
  refreshGlobalCounts();
  closeModal('service-modal');
  form.reset();
  showToast('Atendimento criado e responsável atribuído. Link do cliente gerado.');
});
document.querySelector('#new-client').addEventListener('click', () => openModal('new-client-modal'));
document.querySelector('#generic-action').addEventListener('click', () => { const module = document.querySelector('#generic-action').dataset.module; if (module === 'agenda' && globalThis.__canCreateSection?.(globalThis.__activeRole, 'agenda')) { window.dispatchEvent(new CustomEvent('agenda-open-booking')); return; } if (module === 'servicos') { openServicePriceModal(); return; } if (module === 'atendimentos' && globalThis.__canCreateSection?.(globalThis.__activeRole, 'atendimentos')) { openModal('service-modal'); globalThis.__refreshServiceOptions?.(); return; } if (['faturamento', 'relatorios'].includes(module)) { const button = document.querySelector('#generic-action'); button.disabled = true; button.textContent = 'Atualizando...'; showToast(module === 'faturamento' ? 'Buscando ordens e pagamentos mais recentes...' : 'Buscando os dados mais recentes do relatório...'); const finish = () => { document.removeEventListener('live-data-ready', finish); button.disabled = false; renderModule(module); showToast(module === 'faturamento' ? 'Faturamento atualizado com os dados atuais.' : 'Relatório atualizado com os dados atuais.'); }; document.addEventListener('live-data-ready', finish, { once: true }); globalThis.__reloadLiveData?.(); setTimeout(() => { if (button.disabled) { document.removeEventListener('live-data-ready', finish); button.disabled = false; button.textContent = module === 'faturamento' ? 'Atualizar faturamento' : 'Exportar resumo'; showToast('Não foi possível atualizar agora. Tente novamente em instantes.'); } }, 2500); return; } const actions = { equipe: 'Cadastro de novo membro aberto para o administrador(a).', atendimentos: 'Formulário de atendimento disponível apenas para a equipe autorizada.', configuracoes: 'Preferências salvas neste protótipo.' }; showToast(actions[module] || 'Ação disponível neste módulo.'); });
document.querySelector('#copy-link').addEventListener('click', async () => {
  const active = services[activeServiceIndex]
  const liveOrder = (globalThis.__liveServices || []).find((item) => item.orderId === active?.orderId)
  if (!liveOrder?.orderId || !['in-progress', 'delivered'].includes(liveOrder.tone)) {
    showToast('O link ficará disponível quando o veículo entrar na estética.')
    return
  }
  try {
    const link = await globalThis.__createClientOrderLink?.(liveOrder.orderId)
    if (!link) throw new Error('Link indisponível')
    await globalThis.__copyClientOrderLink?.(link.url)
    showToast('Link do cliente copiado.')
  } catch (error) {
    showToast(error.message || 'Não foi possível gerar o link do cliente.')
  }
});
document.querySelector('#add-photo').addEventListener('click', () => { addClientPhotos(document.querySelector('.client-portal')); showToast('Área de fotos aberta para a equipe.'); });
document.querySelector('#advance-stage').addEventListener('click', async () => { if (stageIndex < 4) stageIndex += 1; syncStage(); try { await persistOrderTransition(activeServiceIndex, stageIndex === 4 ? 'ready_for_pickup' : stageIndex === 0 ? 'scheduled' : 'in_progress', stageIndex); showToast(stageIndex === 4 ? 'Veículo marcado como pronto e cliente notificado.' : 'Etapa atualizada e cliente notificado.'); } catch (error) { showToast(error.message || 'Não foi possível salvar a etapa.'); } });
const backStageButton = document.createElement('button');
backStageButton.className = 'outline-button';
backStageButton.textContent = '← Voltar etapa';
backStageButton.title = 'Retornar o veículo para a etapa anterior.';
document.querySelector('#advance-stage').parentElement.insertBefore(backStageButton, document.querySelector('#add-photo'));
backStageButton.addEventListener('click', async () => { if (stageIndex > 0) stageIndex -= 1; syncStage(); try { await persistOrderTransition(activeServiceIndex, stageIndex === 0 ? 'scheduled' : 'in_progress', stageIndex); showToast('Veículo retornou para a etapa anterior.'); } catch (error) { showToast(error.message || 'Não foi possível salvar a etapa.'); } });
document.querySelector('#copy-link').title = 'Copiar o link exclusivo desta ordem para enviar ao cliente.';
document.querySelector('#add-photo').title = 'Adicionar fotos do antes, durante ou depois do serviço.';
document.querySelector('#advance-stage').title = 'Concluir a etapa atual e avisar o cliente sobre a mudança.';
document.querySelectorAll('.employee-action:not([data-service-index])').forEach((button) => button.addEventListener('click', () => showToast(`${button.dataset.action}: ação registrada no sistema.`)));
function openDashboardOrder(index) {
  if (!services[index] || !serviceStates[index]) return;
  activeServiceIndex = index;
  stageIndex = serviceStates[index].stage;
  syncStage();
  openModal('detail-modal');
}
function renderDashboardOrganization() {
  const dashboard = document.querySelector('#dashboard-section');
  if (!dashboard) return;
  let workspace = dashboard.querySelector('#dashboard-organization');
  if (!workspace) {
    workspace = document.createElement('section');
    workspace.id = 'dashboard-organization';
    workspace.className = 'dashboard-organization dashboard-live-overview';
    dashboard.appendChild(workspace);
  }
  const counts = getServiceCounts();
  refreshDashboardTodaySummary();
  const tasks = [];
  serviceStates.forEach((state, index) => {
    const item = services[index];
    if (!item || state.status === 'delivered') return;
    if (state.status === 'waiting') tasks.push({ index, tone: 'waiting', title: 'Aprova&ccedil;&atilde;o pendente', detail: `${item.client} · ${item.vehicle.split(' Â· ')[0]}` });
    if (state.status === 'ready') tasks.push({ index, tone: 'ready', title: 'Confirmar retirada', detail: `${item.client} · ${item.vehicle.split(' Â· ')[0]}` });
    if (!serviceEstimates[index] || !serviceEstimates[index].date) tasks.push({ index, tone: 'received', title: 'Definir previs&atilde;o de entrega', detail: `${item.client} · ${item.service}` });
  });
  const taskMarkup = tasks.slice(0, 4).map((task) => `<div class="dashboard-task"><span class="dashboard-task-status ${task.tone}"></span><div class="dashboard-task-copy"><b>${task.title}</b><small>${task.detail}</small></div><button class="dashboard-task-action" data-dashboard-order="${task.index}">Abrir ordem</button></div>`).join('') || '<p class="dashboard-empty">Nenhuma pend&ecirc;ncia operacional agora.</p>';
  const agendaMarkup = services.slice(0, 4).map((item, index) => `<button class="dashboard-agenda-item" data-dashboard-order="${index}"><span class="dashboard-agenda-time">${item.time.replace('Entrada ', '')}</span><span class="dashboard-agenda-copy"><b>${item.client}</b><small>${item.vehicle.split(' Â· ')[0]} · ${getServicePresentation(index).label}</small></span><span class="dashboard-arrow">Abrir</span></button>`).join('') || '<p class="dashboard-empty">Nenhum atendimento cadastrado.</p>';
  const dashboardOrganization = globalThis.__dashboardOrganization;
  const dashboardOrganizationModel = dashboardOrganization ? dashboardOrganization.buildDashboardOrganizationModel(services, serviceStates, globalThis.__teamProfiles || [], new Date(), servicePhotos, globalThis.__postSaleFollowUps || []) : null;
  const paddockMarkup = dashboardOrganizationModel ? dashboardOrganization.buildDashboardPaddockMarkup(dashboardOrganizationModel) : '';
  const financialMarkup = dashboardOrganizationModel ? dashboardOrganization.buildDashboardFinancialMarkup(dashboardOrganizationModel) : '';
  const stageChartMarkup = dashboardOrganizationModel ? dashboardOrganization.buildDashboardStageChartMarkup(dashboardOrganizationModel) : '';
  const attentionMarkup = dashboardOrganizationModel ? dashboardOrganization.buildDashboardAttentionMarkup(dashboardOrganizationModel) : '';
  const operationSummaryMarkup = dashboardOrganizationModel ? dashboardOrganization.buildDashboardOperationSummaryMarkup(dashboardOrganizationModel) : '';
  workspace.innerHTML = `<div class="dashboard-work-grid"><article class="dashboard-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">ORGANIZA&Ccedil;&Atilde;O</p><h2>Pend&ecirc;ncias de hoje</h2></div><span class="dashboard-count">${tasks.length}</span></div><p class="muted">Pr&oacute;ximas a&ccedil;&otilde;es para a equipe n&atilde;o perder nenhum retorno.</p><div class="dashboard-task-list">${taskMarkup}</div></article><article class="dashboard-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">VIS&Atilde;O R&Aacute;PIDA</p><h2>Ordens em acompanhamento</h2></div><span class="dashboard-count">${counts.total}</span></div><p class="muted">Acesse uma ordem diretamente sem procurar na listagem.</p><div class="dashboard-agenda-list">${agendaMarkup}</div></article></div><article class="dashboard-panel dashboard-shortcuts-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">ROTINA DA OPERA&Ccedil;&Atilde;O</p><h2>Atalhos de organiza&ccedil;&atilde;o</h2></div></div><div class="dashboard-shortcuts"><button class="dashboard-shortcut" data-dashboard-modal="service-modal"><span>01</span><b>Registrar atendimento</b><small>Abra uma nova ordem e atribua um respons&aacute;vel.</small></button><button class="dashboard-shortcut" data-dashboard-modal="new-client-modal"><span>02</span><b>Cadastrar cliente</b><small>Adicione cliente e ve&iacute;culo para a pr&oacute;xima entrada.</small></button><button class="dashboard-shortcut" data-dashboard-section="agenda"><span>03</span><b>Ver agenda</b><small>Confira entradas e retiradas previstas.</small></button><button class="dashboard-shortcut" data-dashboard-role="employee"><span>04</span><b>Abrir painel da equipe</b><small>Veja tarefas da recep&ccedil;&atilde;o e registre uma entrega.</small></button></div></article></section>`;
  workspace.querySelector('.dashboard-shortcuts-panel')?.remove();
  if (stageChartMarkup) {
    const chartContainer = document.createElement('div');
    chartContainer.innerHTML = stageChartMarkup;
    workspace.querySelector('.dashboard-work-grid > article:nth-child(2)')?.replaceWith(chartContainer.firstElementChild);
  }
  if (operationSummaryMarkup) {
    const summaryContainer = document.createElement('div');
    summaryContainer.innerHTML = operationSummaryMarkup;
    workspace.querySelector('.dashboard-work-grid > article:first-child')?.replaceWith(summaryContainer.firstElementChild);
  }
  if (paddockMarkup) workspace.insertAdjacentHTML('afterbegin', paddockMarkup);
  if (financialMarkup) workspace.insertAdjacentHTML('beforeend', financialMarkup);
  if (attentionMarkup) workspace.insertAdjacentHTML('beforeend', attentionMarkup);
  workspace.querySelectorAll('[data-dashboard-order]').forEach((button) => button.addEventListener('click', () => openDashboardOrder(Number(button.dataset.dashboardOrder))));
  workspace.querySelectorAll('[data-dashboard-modal]').forEach((button) => button.addEventListener('click', () => openModal(button.dataset.dashboardModal)));
  workspace.querySelectorAll('[data-dashboard-section]').forEach((button) => button.addEventListener('click', () => showSection(button.dataset.dashboardSection)));
  workspace.querySelectorAll('[data-dashboard-role]').forEach((button) => button.addEventListener('click', () => showRoleScreen(button.dataset.dashboardRole)));
}
syncStage();
document.addEventListener('team-data-ready', () => {
  renderDashboardOrganization();
  const genericAction = document.querySelector('#generic-action');
  if (document.querySelector('#generic-section:not(.hidden)') && genericAction?.dataset.module === 'atendimentos') renderModule('atendimentos');
});
document.addEventListener('post-sale-data-ready', renderDashboardOrganization);
function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.remove('hidden'); toast.classList.add('show'); setTimeout(() => toast.classList.add('hidden'), 3200); }
document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.addEventListener('click', (event) => { if (event.target === backdrop) backdrop.classList.add('hidden'); }));
document.addEventListener('live-data-ready', (event) => {
  const { services: liveServices, clients: liveClients, states, postSaleFollowUps } = event.detail;
  if (postSaleFollowUps) globalThis.__postSaleFollowUps = postSaleFollowUps;
  services.splice(0, services.length, ...liveServices);
  clients.splice(0, clients.length, ...liveClients);
  serviceStates.splice(0, serviceStates.length, ...states);
  serviceEstimates.splice(0, serviceEstimates.length, ...liveServices.map(() => ({ date: '', time: '' })));
  serviceMilestones.splice(0, serviceMilestones.length, ...liveServices.map(() => ({ received: '', evaluated: '' })));
  servicePhotos.splice(0, servicePhotos.length, ...liveServices.map(() => []));
  refreshServiceList();
  refreshGlobalCounts();
  renderDashboardOrganization();
  if (document.querySelector('#clients-section:not(.hidden)')) renderClients();
  const genericAction = document.querySelector('#generic-action');
  if (document.querySelector('#generic-section:not(.hidden)') && genericAction?.dataset.module === 'atendimentos') renderModule('atendimentos');
  if (document.querySelector('#generic-section:not(.hidden)') && ['faturamento', 'relatorios'].includes(genericAction?.dataset.module)) renderModule(genericAction.dataset.module);
  if (globalThis.__activeRole === 'employee') showRoleScreen('employee');
});
