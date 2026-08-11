const services = [
  { initials: 'HN', client: 'Rafael Nogueira', vehicle: 'Honda Civic Touring · RGT-4B21', service: 'Detalhamento interno', status: 'Em andamento', tone: 'in-progress', time: 'Entrada 08:42' },
  { initials: 'TM', client: 'Camila Bittencourt', vehicle: 'Toyota Corolla XEi · FDL-8A06', service: 'Polimento técnico', status: 'Aguardando aprovação', tone: 'waiting', time: 'Entrada 09:18' },
  { initials: 'JV', client: 'João Vitor Mendes', vehicle: 'Jeep Compass Limited · EKW-1C73', service: 'Higienização completa', status: 'Pronto para retirada', tone: 'ready', time: 'Entrada 07:55' },
  { initials: 'MA', client: 'Marina Albuquerque', vehicle: 'BMW 320i M Sport · GHA-5D92', service: 'Proteção cerâmica', status: 'Em andamento', tone: 'in-progress', time: 'Entrada ontem' }
];
const clients = [
  ['Rafael Nogueira', 'Honda Civic Touring · RGT-4B21', 'Detalhamento interno', 'Em andamento', 'in-progress'],
  ['Camila Bittencourt', 'Toyota Corolla XEi · FDL-8A06', 'Polimento técnico', 'Aguardando aprovação', 'waiting'],
  ['João Vitor Mendes', 'Jeep Compass Limited · EKW-1C73', 'Higienização completa', 'Pronto para retirada', 'ready'],
  ['Marina Albuquerque', 'BMW 320i M Sport · GHA-5D92', 'Proteção cerâmica', 'Em andamento', 'in-progress']
];
const stageNames = ['Entrada registrada', 'Avaliação inicial', 'Execução do serviço', 'Inspeção e acabamento', 'Finalização'];
const teamMembers = [
  { name: 'Lucas Sampaio', role: 'Funcionário' },
  { name: 'Fernanda Cardoso', role: 'Atendente' },
  { name: 'Marina Costa', role: 'Administradora' }
];
const serviceCatalogExtras = [];
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
const servicePhotos = services.map(() => []);
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
  if (state.status === 'waiting') return { label: 'Aguardando aprovação', tone: 'waiting', action: 'open', actionLabel: 'Abrir ordem' };
  if (state.status === 'received') return { label: 'Recebido', tone: 'received', action: 'open', actionLabel: 'Abrir ordem' };
  return { label: 'Em andamento', tone: 'in-progress', action: 'open', actionLabel: 'Abrir ordem' };
}
function refreshGlobalCounts() {
  const counts = getServiceCounts();
  const metricValues = document.querySelectorAll('.metric-grid .metric-block strong');
  if (metricValues[0]) metricValues[0].textContent = String(counts.active).padStart(2, '0');
  if (metricValues[1]) metricValues[1].textContent = String(counts.waiting).padStart(2, '0');
  if (metricValues[2]) metricValues[2].textContent = String(counts.ready).padStart(2, '0');
  const metricBlocks = document.querySelectorAll('.metric-grid .metric-block');
  if (metricBlocks[0]) metricBlocks[0].querySelector('small').textContent = `${counts.active} ordem em execução`;
  if (metricBlocks[1]) metricBlocks[1].querySelector('small').textContent = `${counts.waiting} ordem aguardando retorno`;
  if (metricBlocks[2]) metricBlocks[2].querySelector('small').textContent = `${counts.ready} cliente para avisar`;
  if (metricBlocks[3]) {
    metricBlocks[3].querySelector('span').textContent = 'Ordens no mes';
    metricBlocks[3].querySelector('strong').textContent = String(counts.total).padStart(2, '0');
    metricBlocks[3].querySelector('small').textContent = 'registros ativos no prototipo';
  }
  const attendanceValues = document.querySelectorAll('.attendance-summary b');
  [counts.total, counts.active, counts.waiting, counts.ready].forEach((value, index) => { if (attendanceValues[index]) attendanceValues[index].textContent = String(value).padStart(2, '0'); });
  const attendanceFilters = document.querySelectorAll('.attendance-filters .filter-tab span');
  [counts.total, counts.active, counts.waiting, counts.ready].forEach((value, index) => { if (attendanceFilters[index]) attendanceFilters[index].textContent = String(value).padStart(2, '0'); });
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
    const assigned = services.map((item, index) => index).filter((index) => serviceStates[index].responsible === 'Lucas Sampaio');
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
list.innerHTML = services.map((item, index) => `<button class="service-row" data-service-index="${index}">${vehicleVisual(item.vehicle)}<div class="service-main"><b>${item.client}</b><small>${item.vehicle} · ${item.service} · ${item.time}</small></div><span class="status-pill ${item.tone}">${item.status}</span></button>`).join('');
function refreshServiceList() {
  list.innerHTML = services.map((item, index) => `<button class="service-row" data-service-index="${index}">${vehicleVisual(item.vehicle)}<div class="service-main"><b>${item.client}</b><small>${item.vehicle} · ${item.service} · ${item.time}</small></div><span class="status-pill ${item.tone}">${item.status}</span></button>`).join('');
  list.querySelectorAll('.service-row').forEach((row) => {
    const stage = document.createElement('small');
    stage.className = 'service-stage';
    stage.textContent = `Etapa: ${stageNames[serviceStates[Number(row.dataset.serviceIndex)].stage]}`;
    row.querySelector('.service-main').appendChild(stage);
    row.addEventListener('click', () => { activeServiceIndex = Number(row.dataset.serviceIndex); stageIndex = serviceStates[activeServiceIndex].stage; syncStage(); openModal('detail-modal'); });
  });
}
document.querySelector('#client-table').innerHTML = clients.map((item) => `<tr><td><b>${item[0]}</b><small>Cliente desde 2025</small></td><td>${item[1]}</td><td>${item[2]}</td><td><span class="status-pill ${item[4]}">${item[3]}</span></td><td><button class="text-button">Abrir →</button></td></tr>`).join('');

document.querySelectorAll('.service-row').forEach((row) => { const stage = document.createElement('small'); stage.className = 'service-stage'; stage.textContent = `Etapa: ${stageNames[serviceStates[Number(row.dataset.serviceIndex)].stage]}`; row.querySelector('.service-main').appendChild(stage); });
const sections = { 'visao-geral': 'dashboard-section', clientes: 'clients-section' };
const moduleCopy = {
  atendimentos: ['ATENDIMENTOS', 'Atendimentos', 'Ordens de serviço, etapas, fotos e links de acompanhamento.'],
  agenda: ['AGENDA OPERACIONAL', 'Agenda', 'Visualize entradas, retiradas e a carga de trabalho da equipe.'],
  servicos: ['CATÁLOGO DA EMPRESA', 'Serviços e preços', 'Configure os serviços exibidos no orçamento e no atendimento.'],
  equipe: ['ACESSOS E PERMISSÕES', 'Equipe', 'Defina o que cada pessoa pode visualizar e alterar no sistema.'],
  conversas: ['RELACIONAMENTO', 'Conversas', 'Centralize os retornos dos clientes e mantenha cada conversa ligada à ordem certa.'],
  relatorios: ['GESTÃO DA OPERAÇÃO', 'Relatórios', 'Acompanhe volume, status e gargalos com base nos registros atuais.'],
  configuracoes: ['CONFIGURAÇÕES', 'Configurações', 'Ajuste acessos, preferências e regras da operação.']
};
function showSection(section) {
  document.querySelectorAll('.page-section').forEach((el) => el.classList.add('hidden'));
  const target = sections[section] || 'generic-section';
  document.querySelector(`#${target}`).classList.remove('hidden');
  if (section === 'clientes') renderClients();
  if (target === 'generic-section') renderModule(section);
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
  section.innerHTML = `<div class="page-heading"><div><p class="eyebrow">BASE DE RELACIONAMENTO</p><h1>Clientes e veículos</h1><p class="muted">Cadastros, veículos vinculados e histórico de serviços.</p></div><button class="primary-button" id="client-new-record">+ Cadastrar cliente</button></div><div class="client-summary"><div><span>Clientes ativos</span><b>24</b><small>com cadastro completo</small></div><div><span>Veículos registrados</span><b>31</b><small>5 retornaram este mês</small></div><div><span>Retornos previstos</span><b>07</b><small>nos próximos 30 dias</small></div></div><div class="client-directory"><div class="directory-toolbar"><div><h2>Diretório de clientes</h2><p>Use o histórico para consultar rapidamente qualquer veículo.</p></div><input id="client-search" placeholder="Buscar nome, telefone ou placa" /></div><div class="client-directory-heading"><span>CLIENTE</span><span>VEÍCULOS</span><span>ÚLTIMA VISITA</span><span>HISTÓRICO</span><span></span></div>${clients.map((item, index) => `<button class="client-record" data-client-index="${index}"><div class="client-identity"><span class="avatar">${item[0].split(' ').map((name) => name[0]).join('').slice(0,2)}</span><div><b>${item[0]}</b><small>cliente desde 2025 · WhatsApp cadastrado</small></div></div><div><b>1 veículo</b><small>${item[1]}</small></div><div><b>${index === 0 ? 'Hoje' : index === 1 ? '12 jun' : index === 2 ? '28 mai' : '04 mai'}</b><small>${item[2]}</small></div><div><span class="history-count">${index + 2} serviços</span><small>${index === 0 ? 'retorno em 30 dias' : 'último orçamento aprovado'}</small></div><span class="attendance-arrow">→</span></button>`).join('')}</div>`;
  const records = section.querySelectorAll('.client-record');
  refreshGlobalCounts();
  records.forEach((record, index) => { const history = record.querySelector('.history-count'); if (history) history.textContent = `${Math.max(1, clients[index][5] || index + 2)} serviços`; });
  section.querySelectorAll('.client-record .avatar').forEach((avatar) => { avatar.outerHTML = '<span class="person-mark" aria-hidden="true"></span>'; });
  section.querySelector('#client-search').addEventListener('input', (event) => { const query = event.target.value.toLowerCase(); records.forEach((record) => record.classList.toggle('filtered-out', !record.textContent.toLowerCase().includes(query))); });
  records.forEach((record) => record.addEventListener('click', () => openClientFicha(Number(record.dataset.clientIndex))));
  section.querySelector('#client-new-record').addEventListener('click', () => openModal('new-client-modal'));
}
function openServicePriceModal() {
  let modal = document.querySelector('#service-price-modal');
  if (!modal) {
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop hidden" id="service-price-modal"><div class="modal"><button class="close-button" data-close="service-price-modal">×</button><p class="eyebrow">CATÁLOGO DA EMPRESA</p><h2>Novo serviço</h2><p class="muted">Cadastre um serviço para que a equipe possa selecioná-lo nos atendimentos.</p><form id="service-price-form"><label>Nome do serviço<input name="name" required placeholder="Ex.: Lavagem técnica" /></label><label>Descrição<input name="description" required placeholder="Ex.: Limpeza externa e proteção rápida" /></label><label>Preço<input name="price" required placeholder="Ex.: 180" /></label><div class="form-actions"><button type="button" class="outline-button" data-close="service-price-modal">Cancelar</button><button class="primary-button">Salvar serviço</button></div></form></div></div>`);
    modal = document.querySelector('#service-price-modal');
    modal.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
    modal.querySelector('#service-price-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      serviceCatalogExtras.push({ name: data.get('name'), description: data.get('description'), price: `R$ ${data.get('price')}` });
      closeModal('service-price-modal');
      showSection('servicos');
      showToast('Serviço adicionado ao catálogo.');
      event.currentTarget.reset();
    });
  }
  openModal('service-price-modal');
}
function renderModule(section) {
  const copy = moduleCopy[section] || moduleCopy.atendimentos;
  document.querySelector('#generic-eyebrow').textContent = copy[0];
  document.querySelector('#generic-title').textContent = copy[1];
  document.querySelector('#generic-description').textContent = copy[2];
  const genericAction = document.querySelector('#generic-action');
  const actionLabels = { agenda: '+ Reservar horário', equipe: '+ Adicionar membro', servicos: '+ Novo serviço', atendimentos: '+ Novo atendimento', conversas: '+ Nova conversa', relatorios: 'Exportar resumo', configuracoes: 'Salvar configurações' };
  genericAction.textContent = actionLabels[section] || '+ Adicionar registro';
  genericAction.dataset.module = section;
  genericAction.classList.toggle('hidden', section === 'atendimentos');
  const content = document.querySelector('#module-content');
  if (section === 'agenda') {
    content.innerHTML = `<div class="module-panel"><div class="module-toolbar"><h2>Agenda · 07 a 11 de agosto</h2><button class="outline-button" id="new-booking">+ Novo agendamento</button></div><div class="calendar-grid"><div class="calendar-day"><strong>Qui · 07</strong><small>4 horários</small><div class="calendar-event"><b>08:30 · Rafael N.</b>Honda Civic</div><div class="calendar-event"><b>14:00 · Marina A.</b>BMW 320i</div></div><div class="calendar-day"><strong>Sex · 08</strong><small>3 horários</small><div class="calendar-event"><b>09:00 · Bruno S.</b>Jeep Renegade</div></div><div class="calendar-day"><strong>Sáb · 09</strong><small>2 horários</small><div class="calendar-event"><b>10:30 · Ana P.</b>Corolla XEi</div></div><div class="calendar-day"><strong>Dom · 10</strong><small>Fechado</small></div><div class="calendar-day"><strong>Seg · 11</strong><small>5 horários</small><div class="calendar-event"><b>08:00 · Lucas M.</b>Onix Premier</div></div></div></div>`;
    content.querySelector('#new-booking').textContent = '+ Reservar horário';
  } else if (section === 'equipe') {
    content.innerHTML = `<div class="module-grid"><div class="module-panel"><div class="module-toolbar"><h2>Pessoas cadastradas</h2><button class="outline-button" id="new-member">+ Adicionar pessoa</button></div><div class="permission-list"><div class="permission-item"><span class="avatar">MC</span><div><b>Marina Costa</b><small>Acesso completo ao sistema</small></div><span class="role-tag">Administradora</span></div><div class="permission-item"><span class="avatar">LS</span><div><b>Lucas Sampaio</b><small>Atualiza etapas e adiciona fotos</small></div><span class="role-tag">Funcionário</span></div><div class="permission-item"><span class="avatar">FC</span><div><b>Fernanda Cardoso</b><small>Agenda e atendimento</small></div><span class="role-tag">Atendente</span></div></div></div><div class="module-panel"><h2>Permissões por função</h2><div class="data-line"><div><b>Administradora</b><small>Todos os módulos, configurações e faturamento</small></div><span class="status-pill in-progress">Completo</span></div><div class="data-line"><div><b>Funcionário</b><small>Ordens, etapas, fotos e observações</small></div><span class="status-pill ready">Operacional</span></div><div class="data-line"><div><b>Atendente</b><small>Clientes, agenda e orçamentos</small></div><span class="status-pill waiting">Restrito</span></div></div></div>`;
  } else if (section === 'servicos') {
    content.innerHTML = `<div class="module-grid"><div class="module-panel"><div class="module-toolbar"><h2>Serviços oferecidos</h2><button class="outline-button" id="new-price">+ Novo serviço</button></div><div class="service-price"><div><b>Detalhamento interno</b><small>Limpeza detalhada de painel, bancos e portas</small></div><span>R$ 280</span></div><div class="service-price"><div><b>Polimento técnico</b><small>Correção de marcas e proteção da pintura</small></div><span>R$ 690</span></div><div class="service-price"><div><b>Higienização completa</b><small>Estofados, carpetes e teto</small></div><span>R$ 420</span></div><div class="service-price"><div><b>Proteção cerâmica</b><small>Aplicação e cura com acompanhamento</small></div><span>R$ 1.280</span></div></div><div class="module-panel"><h2>Como o catálogo é usado</h2><p class="muted">A equipe seleciona os serviços na criação do orçamento. Os mesmos dados aparecem para o cliente antes da aprovação.</p><div class="mini-notice"><span class="status-dot green"></span><div><b>Catálogo ativo</b><small>Preços podem ser alterados sem mudar o histórico de ordens.</small></div></div></div></div>`;
  } else if (section === 'conversas') {
    content.innerHTML = `<div class="module-grid"><div class="module-panel conversation-panel"><div class="module-toolbar"><h2>Conversas recentes</h2><span class="status-pill in-progress">${getServiceCounts().total} ordens com link</span></div>${services.map((item, index) => `<button class="data-line conversation-row" data-service-index="${index}"><div><b>${item.client}</b><small>${item.vehicle} · ${item.status}</small></div><span class="text-button">Abrir ordem</span></button>`).join('') || '<p class="dashboard-empty">Nenhuma conversa vinculada ainda.</p>'}</div><div class="module-panel"><h2>Fila de retorno</h2><p class="muted">Use o status da ordem para priorizar quem precisa de resposta.</p><div class="data-line"><div><b>${getServiceCounts().waiting}</b><small>Aguardando aprova&ccedil;&atilde;o</small></div><span class="status-pill waiting">Priorizar</span></div><div class="data-line"><div><b>${getServiceCounts().ready}</b><small>Prontos para retirada</small></div><span class="status-pill ready">Avisar</span></div></div></div>`;
  } else if (section === 'relatorios') {
    const reportCounts = getServiceCounts();
    content.innerHTML = `<div class="module-grid"><div class="module-panel"><div class="module-toolbar"><h2>Resumo operacional</h2><button class="outline-button" id="export-report">Exportar CSV</button></div><div class="data-line"><div><b>${reportCounts.total}</b><small>Total de ordens</small></div><span>Base atual</span></div><div class="data-line"><div><b>${reportCounts.active}</b><small>Em opera&ccedil;&atilde;o</small></div><span class="status-pill in-progress">Abertas</span></div><div class="data-line"><div><b>${reportCounts.waiting}</b><small>Aguardando retorno</small></div><span class="status-pill waiting">Aten&ccedil;&atilde;o</span></div><div class="data-line"><div><b>${reportCounts.ready}</b><small>Prontos para retirada</small></div><span class="status-pill ready">Avisar</span></div></div><div class="module-panel"><h2>Leitura da opera&ccedil;&atilde;o</h2><p class="muted">Os n&uacute;meros deste resumo s&atilde;o calculados diretamente das ordens cadastradas, sem metas ou valores fict&iacute;cios.</p><div class="mini-notice"><span class="status-dot green"></span><div><b>Dados atualizados</b><small>O resumo muda quando uma etapa ou entrega &eacute; registrada.</small></div></div></div></div>`;
    content.querySelector('#export-report').addEventListener('click', () => showToast('Resumo pronto para exporta&ccedil;&atilde;o quando o banco de dados estiver conectado.'));
  } else if (section === 'configuracoes') {
    content.innerHTML = `<div class="module-grid"><div class="module-panel"><div class="module-toolbar"><h2>Prefer&ecirc;ncias da opera&ccedil;&atilde;o</h2><button class="outline-button" id="save-settings">Salvar altera&ccedil;&otilde;es</button></div><label class="settings-toggle"><span><b>Avisar cliente ao mudar etapa</b><small>Mostra a atualiza&ccedil;&atilde;o no portal e prepara o envio pelo WhatsApp.</small></span><input type="checkbox" checked /></label><label class="settings-toggle"><span><b>Exigir respons&aacute;vel na ordem</b><small>Evita atendimentos sem algu&eacute;m definido na equipe.</small></span><input type="checkbox" checked /></label><label class="settings-toggle"><span><b>Solicitar fotos na finaliza&ccedil;&atilde;o</b><small>Ajuda a manter o hist&oacute;rico visual do ve&iacute;culo.</small></span><input type="checkbox" checked /></label></div><div class="module-panel"><h2>Perfis de acesso</h2><div class="data-line"><div><b>Administradora</b><small>Todos os dados e configura&ccedil;&otilde;es</small></div><span class="status-pill in-progress">Completo</span></div><div class="data-line"><div><b>Recep&ccedil;&atilde;o</b><small>Clientes, agenda, ordens e entregas</small></div><span class="status-pill waiting">Restrito</span></div><div class="data-line"><div><b>Execu&ccedil;&atilde;o</b><small>Etapas, fotos e observa&ccedil;&otilde;es</small></div><span class="status-pill ready">Operacional</span></div></div></div>`;
    content.querySelector('#save-settings').addEventListener('click', () => showToast('Prefer&ecirc;ncias salvas neste prot&oacute;tipo.'));
  } else if (section === 'atendimentos') {
    content.innerHTML = `<div class="attendances-shell"><div class="attendance-summary"><div><span>Todos</span><b>12</b><small>ordens abertas</small></div><div><span>Em andamento</span><b>08</b><small>na operação</small></div><div><span>Aguardando aprovação</span><b>03</b><small>precisam de retorno</small></div><div><span>Prontos</span><b>04</b><small>para retirada</small></div></div><div class="attendance-toolbar"><div class="attendance-filters"><button class="filter-tab active" data-filter="todos">Todos <span>12</span></button><button class="filter-tab" data-filter="andamento">Em andamento <span>08</span></button><button class="filter-tab" data-filter="aprovacao">Aguardando aprovação <span>03</span></button><button class="filter-tab" data-filter="prontos">Prontos <span>04</span></button></div><div class="attendance-tools"><input id="attendance-search" placeholder="Buscar cliente ou placa" /><button class="primary-button" id="attendance-new">+ Novo atendimento</button></div></div><div class="attendance-list"><div class="attendance-list-heading"><span>ATENDIMENTO</span><span>ETAPA ATUAL</span><span>RESPONSÁVEL</span><span>PREVISÃO</span><span></span></div>${services.map((item, index) => `<button class="attendance-item" data-service-index="${index}" data-status="${item.tone === 'in-progress' ? 'andamento' : item.tone === 'waiting' ? 'aprovacao' : 'prontos'}"><div class="attendance-client"><span class="car-icon">${item.initials}</span><div><b>${item.client}</b><small>${item.vehicle}</small></div></div><div><span class="status-pill ${item.tone}">${item.status}</span><small class="attendance-service">${item.service}</small></div><div class="attendance-person"><span class="avatar">${item.initials[0]}${item.initials[1]}</span><span>Equipe Atelier</span></div><div class="attendance-time"><b>${item.time.replace('Entrada ', '')}</b><small>previsão hoje</small></div><span class="attendance-arrow">→</span></button>`).join('')}</div></div>`;
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
    content.innerHTML = `<div class="module-grid"><div class="module-panel"><div class="module-toolbar"><h2>Ordens de serviço</h2><input placeholder="Buscar cliente ou placa" /></div>${services.map((item, index) => `<button class="data-line" data-service-index="${index}"><div><b>${item.client} · ${item.vehicle}</b><small>${item.service} · ${item.time}</small></div><span class="status-pill ${item.tone}">${item.status}</span></button>`).join('')}</div><div class="module-panel"><h2>Resumo da operação</h2><div class="data-line"><div><b>03</b><small>Aguardando aprovação</small></div><span class="status-pill waiting">R$ 1.840</span></div><div class="data-line"><div><b>08</b><small>Em atendimento</small></div><span class="status-pill in-progress">Hoje</span></div><div class="data-line"><div><b>04</b><small>Prontos para retirada</small></div><span class="status-pill ready">Avisar</span></div></div></div>`;
  }
  if (section === 'conversas') {
    content.querySelector('.conversation-panel')?.insertAdjacentHTML('beforeend', '<div class="whatsapp-connection"><span class="status-dot"></span><div><b>WhatsApp da empresa</b><small>Central pronta para receber a API oficial e os webhooks de mensagens.</small></div><button class="outline-button" id="connect-whatsapp">Configurar</button></div>');
    content.querySelector('#connect-whatsapp')?.addEventListener('click', () => showToast('A conex&atilde;o real exige WhatsApp Cloud API, webhook e credenciais da empresa.'));
  }
  content.querySelectorAll('[data-service-index]').forEach((item) => item.addEventListener('click', () => { activeServiceIndex = Number(item.dataset.serviceIndex); stageIndex = serviceStates[activeServiceIndex].stage; syncStage(); openModal('detail-modal'); }));
  if (section === 'servicos') {
    const catalogPanel = content.querySelector('.service-price')?.parentElement;
    serviceCatalogExtras.forEach((item) => { if (catalogPanel) catalogPanel.insertAdjacentHTML('beforeend', `<div class="service-price"><div><b>${item.name}</b><small>${item.description}</small></div><span>${item.price}</span></div>`); });
    const newPrice = content.querySelector('#new-price');
    if (newPrice) newPrice.addEventListener('click', openServicePriceModal);
  }
  content.querySelectorAll('button[id^="new-"]:not(#new-price)').forEach((item) => item.addEventListener('click', () => showToast('Formulário pronto para cadastrar este registro.')));
}
document.querySelectorAll('[data-section]').forEach((item) => item.addEventListener('click', () => showSection(item.dataset.section)));
const openModal = (id) => document.querySelector(`#${id}`).classList.remove('hidden');
const closeModal = (id) => { const modal = document.querySelector(`#${id}`); if (modal) { modal.classList.add('hidden'); if (id === 'detail-modal') modal.classList.remove('employee-overlay'); } };
document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop hidden" id="new-client-modal"><div class="modal"><button class="close-button" data-close="new-client-modal">×</button><p class="eyebrow">BASE DE CLIENTES</p><h2>Cadastrar cliente</h2><p class="muted">Esse cadastro poderá ser reutilizado em novos atendimentos.</p><form id="new-client-form"><label>Nome completo<input name="name" required placeholder="Ex.: Rafael Nogueira" /></label><label>WhatsApp<input name="phone" required placeholder="(19) 99999-0000" /></label><label>Veículo e placa<input name="vehicle" required placeholder="Ex.: Honda Civic · RGT-4B21" /></label><div class="form-actions"><button type="button" class="outline-button" data-close="new-client-modal">Cancelar</button><button class="primary-button">Salvar cliente</button></div></form></div></div>`);
document.querySelectorAll('#new-client-modal [data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
const serviceForm = document.querySelector('#service-form');
const existingChoice = document.createElement('label');
existingChoice.innerHTML = 'Cliente já cadastrado<select name="existingClient"><option value="new">Novo cliente</option><option value="Rafael Nogueira|Honda Civic Touring · RGT-4B21">Rafael Nogueira · Honda Civic</option><option value="Camila Bittencourt|Toyota Corolla XEi · FDL-8A06">Camila Bittencourt · Toyota Corolla</option><option value="João Vitor Mendes|Jeep Compass Limited · EKW-1C73">João Vitor Mendes · Jeep Compass</option><option value="Marina Albuquerque|BMW 320i M Sport · GHA-5D92">Marina Albuquerque · BMW 320i</option></select><small class="form-helper">Selecione um cadastro para preencher cliente e placa automaticamente.</small>';
serviceForm.insertBefore(existingChoice, serviceForm.firstElementChild);
existingChoice.querySelector('select').innerHTML = `<option value="new">Novo cliente</option>${clients.map((client, index) => `<option value="${index}">${client[0]} · ${vehicleParts(client[1]).model}</option>`).join('')}`;
existingChoice.querySelector('select').addEventListener('change', (event) => { const selected = clients[Number(event.target.value)]; serviceForm.elements.client.value = event.target.value === 'new' || !selected ? '' : selected[0]; serviceForm.elements.vehicle.value = event.target.value === 'new' || !selected ? '' : selected[1]; });
const responsibleChoice = document.createElement('label');
responsibleChoice.innerHTML = `Responsável<select name="responsible">${teamMembers.map((member) => `<option value="${member.name}">${member.name} · ${member.role}</option>`).join('')}</select><small class="form-helper">Escolha quem ficará responsável por acompanhar esta ordem.</small>`;
serviceForm.insertBefore(responsibleChoice, serviceForm.querySelector('.form-actions'));
document.querySelector('#new-client-form').addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); clients.push([data.get('name'), data.get('vehicle'), 'Sem histórico', 'Novo cadastro', 'received', 0, '']); closeModal('new-client-modal'); renderClients(); event.currentTarget.reset(); showToast('Cliente cadastrado e disponível na ficha de clientes.'); });
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
  portal.querySelector('.portal-footer').insertAdjacentHTML('beforebegin', `<section class="portal-photos"><div class="portal-section-heading"><div><p class="eyebrow">REGISTRO VISUAL</p><h3>Fotos do serviço</h3></div><span class="photo-count">3 fotos</span></div><div class="photo-grid"><figure><img src="https://images.squarespace-cdn.com/content/v1/62b21428251d255436cd2356/e61f43e0-c9fb-456a-aeb3-d9621d4291ff/GridArt_20230731_160914788.jpg" alt="Veículo antes e depois do serviço" /><figcaption>Antes e depois · Hoje, 08:45</figcaption></figure><figure><img src="https://images.squarespace-cdn.com/content/v1/62b21428251d255436cd2356/bae8f1fc-35fd-4465-88df-3f9b9fda6096/GridArt_20231204_172529008.jpg" alt="Interior e exterior do veículo em limpeza" /><figcaption>Interior e exterior · Hoje, 11:20</figcaption></figure><figure><img src="https://images.squarespace-cdn.com/content/v1/62b21428251d255436cd2356/793806e4-c939-4f89-96c8-9b7a62011617/GridArt_20231204_165303090.jpg" alt="Resultado final do detalhamento automotivo" /><figcaption>Resultado final · Hoje, 13:05</figcaption></figure></div></section>`);
}
function refreshClientPhotos() {
  document.querySelectorAll('.client-portal').forEach((portal) => {
    const grid = portal.querySelector('.photo-grid');
    if (!grid) return;
    grid.querySelectorAll('[data-uploaded-photo]').forEach((photo) => photo.remove());
    const uploaded = servicePhotos[activeServiceIndex] || [];
    uploaded.forEach((photo) => grid.insertAdjacentHTML('beforeend', `<figure data-uploaded-photo><img src="${photo.url}" alt="Foto adicionada pela equipe" /><figcaption>${photo.name} · Enviado agora</figcaption></figure>`));
    const count = portal.querySelector('.photo-count');
    if (count) count.textContent = `${3 + uploaded.length} fotos`;
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
  detail.querySelector('.detail-actions').insertAdjacentHTML('afterbegin', '<div class="order-management-actions"><button class="outline-button hidden" id="cancel-delivery">Cancelar entrega</button><button class="outline-button danger-button" id="delete-order">Apagar ordem</button></div>');
  detail.querySelector('#cancel-delivery').addEventListener('click', () => { serviceStates[activeServiceIndex].deliveryStatus = null; stageIndex = serviceStates[activeServiceIndex].stage; syncStage(); showToast('Entrega cancelada. O veículo voltou para retirada.'); });
  detail.querySelector('#delete-order').addEventListener('click', () => { if (!window.confirm('Apagar esta ordem? Esta ação remove o atendimento do protótipo.')) return; const deletedClient = services[activeServiceIndex].client; removeService(activeServiceIndex); closeModal('detail-modal'); showToast(`Ordem de ${deletedClient} apagada.`); });
  detail.querySelector('#save-estimate').addEventListener('click', () => {
    const estimate = serviceEstimates[activeServiceIndex];
    estimate.date = detail.querySelector('#estimate-date').value;
    estimate.time = detail.querySelector('#estimate-time').value;
    syncStage();
    showToast(estimate.date && estimate.time ? 'Previsão atualizada e compartilhada com o cliente.' : 'Previsão removida. Defina uma data e um horário quando estiver pronto.');
  });
}
addEstimateEditor();
function syncStage() {
  const names = stageNames;
  const active = services[activeServiceIndex];
  const state = serviceStates[activeServiceIndex];
  state.stage = stageIndex;
  if (state.deliveryStatus === 'delivered') state.status = 'delivered';
  else if (stageIndex === 0) state.status = 'received';
  else if (stageIndex === 4) state.status = 'ready';
  else if (state.status !== 'waiting' || stageIndex !== 1) state.status = 'in-progress';
  active.status = state.status === 'delivered' ? 'Entregue' : state.status === 'received' ? 'Recebido' : state.status === 'ready' ? 'Pronto para retirada' : state.status === 'waiting' ? 'Aguardando aprovação' : 'Em andamento';
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
  if (cancelDelivery) cancelDelivery.classList.toggle('hidden', state.deliveryStatus !== 'delivered');
  document.querySelectorAll('.attendance-item').forEach((row) => { const index = Number(row.dataset.serviceIndex); const item = services[index]; const pill = row.querySelector('.status-pill'); if (pill) { pill.textContent = item.status; pill.className = `status-pill ${item.tone}`; } const stage = row.querySelector('.attendance-stage'); if (stage) stage.textContent = `Etapa: ${stageNames[serviceStates[index].stage]}`; row.dataset.status = item.tone === 'in-progress' ? 'andamento' : item.tone === 'waiting' ? 'aprovacao' : item.tone === 'ready' ? 'prontos' : 'recebido'; });
  document.querySelectorAll('.attendance-item').forEach((row) => { const index = Number(row.dataset.serviceIndex); const responsible = row.querySelector('.attendance-person span:last-child'); if (responsible) responsible.textContent = serviceStates[index].responsible || 'Não atribuído'; });
  document.querySelectorAll('.attendance-item[data-service-index]').forEach((row) => { const index = Number(row.dataset.serviceIndex); const estimate = row.querySelector('.attendance-time b'); const estimateLabel = row.querySelector('.attendance-time small'); if (estimate) estimate.textContent = formatEstimate(index); if (estimateLabel) estimateLabel.textContent = 'previsão de entrega'; });
  document.querySelectorAll('.service-row[data-service-index]').forEach((row) => { const index = Number(row.dataset.serviceIndex); const item = services[index]; const pill = row.querySelector('.status-pill'); if (pill) { pill.textContent = item.status; pill.className = `status-pill ${item.tone}`; } const stage = row.querySelector('.service-stage'); if (stage) stage.textContent = `Etapa: ${stageNames[serviceStates[index].stage]}`; });
  document.querySelectorAll('.employee-job[data-service-index]').forEach((job) => { const item = services[Number(job.dataset.serviceIndex)]; const pill = job.querySelector('.status-pill'); if (pill) { pill.textContent = item.status; pill.className = `status-pill ${item.tone}`; } });
  document.querySelectorAll('.employee-job[data-service-index] .employee-action').forEach((button) => { const presentation = getServicePresentation(Number(button.dataset.serviceIndex)); button.textContent = presentation.actionLabel; button.dataset.employeeAction = presentation.action; button.classList.toggle('secondary-button', presentation.action === 'delivery'); button.classList.toggle('primary-button', presentation.action !== 'delivery'); });
  document.querySelectorAll('.client-portal').forEach((portal) => { const vehicle = portal.querySelector('.portal-vehicle h2'); const identity = portal.querySelector('.portal-vehicle .muted'); if (vehicle) vehicle.textContent = active.vehicle.split(' · ')[0]; if (identity) identity.textContent = `${active.vehicle.split(' · ')[1]} · ${active.client}`; });
  const clientRecord = clients.find((client) => client[0] === active.client);
  if (clientRecord) { clientRecord[2] = active.service; clientRecord[3] = active.status; clientRecord[4] = active.tone; }
  refreshClientPhotos();
  refreshGlobalCounts();
}
function renderEmployeeJobs(portal) {
  const list = portal && portal.querySelector('.employee-list');
  if (!list) return;
  const assigned = services.map((item, index) => ({ item, index })).filter(({ index }) => serviceStates[index].responsible === 'Lucas Sampaio');
  list.innerHTML = assigned.map(({ item, index }) => { const presentation = getServicePresentation(index); return `<div class="employee-job" data-service-index="${index}"><div><b>${item.client}</b><small>${item.vehicle}</small><span class="status-pill ${presentation.tone}">${presentation.label}</span></div><button class="${presentation.action === 'delivery' ? 'secondary-button' : 'primary-button'} employee-action" data-service-index="${index}" data-employee-action="${presentation.action}">${presentation.actionLabel}</button></div>`; }).join('') || '<p class="employee-empty">Nenhuma ordem atribu&iacute;da a este funcion&aacute;rio.</p>';
}
function renderEmployeeOrder(index) {
  const item = services[index];
  const state = serviceStates[index];
  if (!item || !state) return;
  const photos = servicePhotos[index] || [];
  const photoMarkup = photos.map((photo) => `<figure><img src="${photo.url}" alt="Foto adicionada pela equipe" /><figcaption>${photo.name}</figcaption></figure>`).join('') || '<p class="employee-empty">Nenhuma foto adicionada nesta ordem.</p>';
  const vehicle = vehicleParts(item.vehicle);
  const advanceButton = state.stage < 4 ? '<button class="outline-button" id="employee-advance">Avan&ccedil;ar etapa</button>' : '';
  const backButton = state.stage > 0 ? '<button class="outline-button" id="employee-back-stage">Voltar etapa</button>' : '';
  const deliveryButton = state.deliveryStatus === 'delivered' ? '<button class="outline-button" id="employee-cancel-delivery">Cancelar entrega</button>' : '<button class="primary-button" id="employee-delivery" disabled>Registrar entrega</button>';
  const deliveryAction = state.status === 'ready' ? '<button class="primary-button" id="employee-delivery">Registrar entrega</button>' : deliveryButton;
  roleScreenContent.innerHTML = `<section class="employee-order-screen"><div class="employee-order-heading"><div><p class="eyebrow">ORDEM OPERACIONAL</p><h1>${vehicle.model}</h1><p class="muted">${item.client} · ${vehicle.plate}</p></div><button class="outline-button" id="employee-back">Voltar para minhas ordens</button></div><div class="employee-order-grid"><article class="employee-order-main"><div class="employee-order-status"><div><span class="status-pill ${item.tone}">${item.status}</span><b>${stageNames[state.stage]}</b></div><small>Respons&aacute;vel: ${state.responsible}</small></div><div class="employee-stage-strip"><span class="completed">Entrada</span><span class="${state.stage >= 1 ? 'completed' : ''}">Avalia&ccedil;&atilde;o</span><span class="${state.stage >= 2 ? 'completed' : 'current'}">Execu&ccedil;&atilde;o</span><span class="${state.stage >= 3 ? 'completed' : ''}">Inspe&ccedil;&atilde;o</span><span class="${state.stage >= 4 ? 'completed' : ''}">Retirada</span></div><div class="employee-order-actions"><button class="secondary-button" id="employee-add-photo">Adicionar foto</button>${backButton}${advanceButton}${deliveryAction}<input id="employee-photo-input" type="file" accept="image/*" multiple hidden /></div><section class="employee-photo-board"><div class="employee-section-heading"><div><p class="eyebrow">REGISTRO VISUAL</p><h2>Fotos do atendimento</h2></div><span>${photos.length} foto${photos.length === 1 ? '' : 's'}</span></div><div class="employee-photo-grid">${photoMarkup}</div></section><section class="employee-observation"><label>Observa&ccedil;&atilde;o interna<textarea id="employee-observation" rows="3" placeholder="Registre um detalhe importante para a equipe.">${state.note || ''}</textarea><small class="form-helper">Vis&iacute;vel somente para a equipe da opera&ccedil;&atilde;o; n&atilde;o aparece para o cliente.</small></label><button class="outline-button" id="employee-save-note">Salvar observa&ccedil;&atilde;o</button></section></article><aside class="employee-order-aside"><div><span>Servi&ccedil;o</span><b>${item.service}</b></div><div><span>Entrada</span><b>${serviceMilestones[index]?.received || item.time}</b></div><div><span>Previs&atilde;o</span><b>${formatEstimate(index)}</b></div><div><span>Cliente</span><b>${item.client}</b><button class="text-button" id="employee-client-ficha">Ver ficha do cliente</button></div></aside></div></section>`;
  roleScreenContent.querySelector('#employee-back').addEventListener('click', () => showRoleScreen('employee'));
  roleScreenContent.querySelector('#employee-add-photo').addEventListener('click', () => roleScreenContent.querySelector('#employee-photo-input').click());
  roleScreenContent.querySelector('#employee-photo-input').addEventListener('change', (event) => { servicePhotos[index].push(...Array.from(event.target.files).map((file) => ({ url: URL.createObjectURL(file), name: file.name }))); refreshClientPhotos(); renderEmployeeOrder(index); showToast('Foto adicionada ao atendimento e portal do cliente.'); });
  const advance = roleScreenContent.querySelector('#employee-advance');
  if (advance) advance.addEventListener('click', () => { activeServiceIndex = index; stageIndex = Math.min(4, state.stage + 1); syncStage(); renderEmployeeOrder(index); showToast('Etapa atualizada para toda a equipe.'); });
  const backStage = roleScreenContent.querySelector('#employee-back-stage');
  if (backStage) backStage.addEventListener('click', () => { activeServiceIndex = index; stageIndex = Math.max(0, state.stage - 1); state.deliveryStatus = null; syncStage(); renderEmployeeOrder(index); showToast('Etapa anterior restaurada.'); });
  const delivery = roleScreenContent.querySelector('#employee-delivery');
  if (delivery) delivery.addEventListener('click', () => { if (state.status !== 'ready') return; state.deliveryStatus = 'delivered'; state.deliveryAt = getCurrentEntryData().received; activeServiceIndex = index; stageIndex = 4; syncStage(); renderEmployeeOrder(index); showToast('Entrega registrada às ' + state.deliveryAt + '.'); });
  const cancelDelivery = roleScreenContent.querySelector('#employee-cancel-delivery');
  if (cancelDelivery) cancelDelivery.addEventListener('click', () => { state.deliveryStatus = null; state.deliveryAt = ''; activeServiceIndex = index; stageIndex = state.stage; syncStage(); renderEmployeeOrder(index); showToast('Entrega cancelada. O veículo voltou para retirada.'); });
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
}
const employeePortal = document.querySelector('.employee-portal');
if (employeePortal) {
  const role = employeePortal.querySelector('.role-tag');
  if (role) role.textContent = 'Recepção + Operacional';
  const receptionActions = document.createElement('div');
  receptionActions.className = 'reception-actions';
  receptionActions.innerHTML = `<div class="reception-actions-heading"><div><p class="eyebrow">ROTINA DA RECEPÇÃO</p><b>Registrar novos atendimentos</b><small>Cadastre o cliente, o veículo e reserve um horário.</small></div></div><div class="reception-buttons"><button class="primary-button" id="reception-new-service">+ Novo atendimento</button><button class="outline-button" id="reception-new-client">Cadastrar cliente</button><button class="outline-button" id="reception-new-booking">Marcar na agenda</button></div>`;
  const list = employeePortal.querySelector('.employee-list');
  employeePortal.insertBefore(receptionActions, list);
  renderEmployeeJobs(employeePortal);
  bindEmployeeOrderActions(employeePortal);
  receptionActions.querySelector('#reception-new-service').addEventListener('click', () => renderEmployeeForm('attendance'));
  receptionActions.querySelector('#reception-new-client').addEventListener('click', () => renderEmployeeForm('client'));
  receptionActions.querySelector('#reception-new-booking').addEventListener('click', () => { closeModal('employee-modal'); showSection('agenda'); showToast('Agenda aberta para marcar um novo horário.'); });
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
function showRoleScreen(role) {
  const isEmployee = role === 'employee';
  document.querySelector('#role-screen-title').textContent = isEmployee ? 'Painel do funcionário' : 'Portal do cliente';
  document.querySelector('#role-screen-subtitle').textContent = isEmployee ? 'Recepção e operação' : 'Acompanhamento do veículo';
  const source = document.querySelector(isEmployee ? '.employee-portal' : '.client-portal').cloneNode(true);
  source.querySelectorAll('.close-button').forEach((button) => button.remove());
  roleScreenContent.innerHTML = '';
  roleScreenContent.appendChild(source);
  if (isEmployee) { renderEmployeeJobs(source); bindEmployeeOrderActions(source); }
  if (!isEmployee) addClientPhotos(source);
  syncStage();
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
document.querySelector('#return-admin').addEventListener('click', () => { roleScreen.classList.add('hidden'); roleScreenContent.innerHTML = ''; });
document.querySelector('#new-service').addEventListener('click', () => openModal('service-modal'));
document.querySelector('#employee-preview').addEventListener('click', () => showRoleScreen('employee'));
document.querySelector('#client-preview').addEventListener('click', () => showRoleScreen('client'));
document.querySelector('#open-client-link').addEventListener('click', () => showRoleScreen('client'));
document.querySelectorAll('#service-list .service-row').forEach((item) => item.addEventListener('click', () => { activeServiceIndex = Number(item.dataset.serviceIndex); stageIndex = serviceStates[activeServiceIndex].stage; syncStage(); openModal('detail-modal'); }));
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
document.querySelector('#service-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
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
document.querySelector('#generic-action').addEventListener('click', () => { const module = document.querySelector('#generic-action').dataset.module; if (module === 'servicos') { openServicePriceModal(); return; } const actions = { agenda: 'Formulário de novo agendamento aberto para a recepção.', equipe: 'Cadastro de novo membro aberto para a administradora.', atendimentos: 'Formulário de novo atendimento aberto.', conversas: 'Nova conversa vinculada à ordem selecionada.', relatorios: 'Resumo preparado para exportação.', configuracoes: 'Preferências salvas neste protótipo.' }; showToast(actions[module] || 'Ação disponível neste módulo.'); });
document.querySelector('#copy-link').addEventListener('click', () => showToast('Link copiado: atelier-os.com/acompanhamento/ao-2048'));
document.querySelector('#add-photo').addEventListener('click', () => { addClientPhotos(document.querySelector('.client-portal')); showToast('Área de fotos aberta para a equipe.'); });
document.querySelector('#advance-stage').addEventListener('click', () => { if (stageIndex < 4) stageIndex += 1; syncStage(); showToast(stageIndex === 4 ? 'Veículo marcado como pronto e cliente notificado.' : 'Etapa atualizada e cliente notificado.'); });
const backStageButton = document.createElement('button');
backStageButton.className = 'outline-button';
backStageButton.textContent = '← Voltar etapa';
backStageButton.title = 'Retornar o veículo para a etapa anterior.';
document.querySelector('#advance-stage').parentElement.insertBefore(backStageButton, document.querySelector('#add-photo'));
backStageButton.addEventListener('click', () => { if (stageIndex > 0) stageIndex -= 1; syncStage(); showToast('Veículo retornou para a etapa anterior.'); });
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
    workspace.className = 'dashboard-organization';
    dashboard.appendChild(workspace);
  }
  const counts = getServiceCounts();
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
  workspace.innerHTML = `<div class="dashboard-work-grid"><article class="dashboard-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">ORGANIZA&Ccedil;&Atilde;O</p><h2>Pend&ecirc;ncias de hoje</h2></div><span class="dashboard-count">${tasks.length}</span></div><p class="muted">Pr&oacute;ximas a&ccedil;&otilde;es para a equipe n&atilde;o perder nenhum retorno.</p><div class="dashboard-task-list">${taskMarkup}</div></article><article class="dashboard-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">VIS&Atilde;O R&Aacute;PIDA</p><h2>Ordens em acompanhamento</h2></div><span class="dashboard-count">${counts.total}</span></div><p class="muted">Acesse uma ordem diretamente sem procurar na listagem.</p><div class="dashboard-agenda-list">${agendaMarkup}</div></article></div><article class="dashboard-panel dashboard-shortcuts-panel"><div class="dashboard-panel-heading"><div><p class="eyebrow">ROTINA DA OPERA&Ccedil;&Atilde;O</p><h2>Atalhos de organiza&ccedil;&atilde;o</h2></div></div><div class="dashboard-shortcuts"><button class="dashboard-shortcut" data-dashboard-modal="service-modal"><span>01</span><b>Registrar atendimento</b><small>Abra uma nova ordem e atribua um respons&aacute;vel.</small></button><button class="dashboard-shortcut" data-dashboard-modal="new-client-modal"><span>02</span><b>Cadastrar cliente</b><small>Adicione cliente e ve&iacute;culo para a pr&oacute;xima entrada.</small></button><button class="dashboard-shortcut" data-dashboard-section="agenda"><span>03</span><b>Ver agenda</b><small>Confira entradas e retiradas previstas.</small></button><button class="dashboard-shortcut" data-dashboard-role="employee"><span>04</span><b>Abrir painel da equipe</b><small>Veja tarefas da recep&ccedil;&atilde;o e registre uma entrega.</small></button></div></article></section>`;
  workspace.querySelectorAll('[data-dashboard-order]').forEach((button) => button.addEventListener('click', () => openDashboardOrder(Number(button.dataset.dashboardOrder))));
  workspace.querySelectorAll('[data-dashboard-modal]').forEach((button) => button.addEventListener('click', () => openModal(button.dataset.dashboardModal)));
  workspace.querySelectorAll('[data-dashboard-section]').forEach((button) => button.addEventListener('click', () => showSection(button.dataset.dashboardSection)));
  workspace.querySelectorAll('[data-dashboard-role]').forEach((button) => button.addEventListener('click', () => showRoleScreen(button.dataset.dashboardRole)));
}
syncStage();
function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.remove('hidden'); toast.classList.add('show'); setTimeout(() => toast.classList.add('hidden'), 3200); }
document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.addEventListener('click', (event) => { if (event.target === backdrop) backdrop.classList.add('hidden'); }));
