const services = [
  { initials: 'HN', client: 'Rafael Nogueira', vehicle: 'Honda Civic Touring ¬∑ RGT-4B21', service: 'Detalhamento interno', status: 'Em andamento', tone: 'in-progress', time: 'Entrada 08:42' },
  { initials: 'TM', client: 'Camila Bittencourt', vehicle: 'Toyota Corolla XEi ¬∑ FDL-8A06', service: 'Polimento t√©cnico', status: 'Em andamento', tone: 'in-progress', time: 'Entrada 09:18' },
  { initials: 'JV', client: 'Jo√£o Vitor Mendes', vehicle: 'Jeep Compass Limited ¬∑ EKW-1C73', service: 'Higieniza√ß√£o completa', status: 'Pronto para retirada', tone: 'ready', time: 'Entrada 07:55' },
  { initials: 'MA', client: 'Marina Albuquerque', vehicle: 'BMW 320i M Sport ¬∑ GHA-5D92', service: 'Prote√ß√£o cer√¢mica', status: 'Em andamento', tone: 'in-progress', time: 'Entrada ontem' }
];
const clients = [
  ['Rafael Nogueira', 'Honda Civic Touring ¬∑ RGT-4B21', 'Detalhamento interno', 'Em andamento', 'in-progress'],
  ['Camila Bittencourt', 'Toyota Corolla XEi ¬∑ FDL-8A06', 'Polimento t√©cnico', 'Em andamento', 'in-progress'],
  ['Jo√£o Vitor Mendes', 'Jeep Compass Limited ¬∑ EKW-1C73', 'Higieniza√ß√£o completa', 'Pronto para retirada', 'ready'],
  ['Marina Albuquerque', 'BMW 320i M Sport ¬∑ GHA-5D92', 'Prote√ß√£o cer√¢mica', 'Em andamento', 'in-progress']
];
const stageNames = ['Entrada registrada', 'Avalia√ß√£o inicial', 'Execu√ß√£o do servi√ßo', 'Inspe√ß√£o e acabamento', 'Finaliza√ß√£o'];
const teamMembers = [
  { name: 'Lucas Sampaio', role: 'Funcion√°rio' },
  { name: 'Fernanda Cardoso', role: 'Atendente' },
  { name: 'Marina Costa', role: 'Administrador(a)' }
];
const serviceCatalogExtras = [];
const serviceCatalogFallback = [
  { id: 'detalhamento-interno', name: 'Detalhamento interno', description: 'Limpeza detalhada de painel, bancos e portas', price: 280 },
  { id: 'polimento-tecnico', name: 'Polimento t√©cnico', description: 'Corre√ß√£o de marcas e prote√ß√£o da pintura', price: 690 },
  { id: 'higienizacao-completa', name: 'Higieniza√ß√£o completa', description: 'Estofados, carpetes e teto', price: 420 },
  { id: 'protecao-ceramica', name: 'Prote√ß√£o cer√¢mica', description: 'Aplica√ß√£o e cura com acompanhamento', price: 1280 },
];
const getCatalog = () => globalThis.__serviceCatalog || [...serviceCatalogFallback, ...serviceCatalogExtras];
const serviceStates = services.map((item, index) => ({ stage: index === 0 ? 0 : item.tone === 'waiting' ? 1 : item.tone === 'ready' ? 4 : 2, status: index === 0 ? 'received' : item.tone === 'waiting' ? 'waiting' : item.tone === 'ready' ? 'ready' : 'in-progress', responsible: ['Lucas Sampaio', 'Fernanda Cardoso', 'Lucas Sampaio', 'Lucas Sampaio'][index] || 'N√£o atribu√≠do' }));
const serviceEstimates = [
  { date: '', time: '' },
  { date: '2026-08-08', time: '16:30' },
  { date: '2026-08-07', time: '15:00' },
  { date: '2026-08-11', time: '17:30' }
];
const serviceMilestones = [
  { received: '08/08/2026 √†s 08:42', evaluated: '08/08/2026 √†s 09:05' },
  { received: '08/08/2026 √†s 09:18', evaluated: '08/08/2026 √†s 09:35' },
  { received: '08/08/2026 √†s 07:55', evaluated: '08/08/2026 √†s 08:20' },
  { received: '07/08/2026 √†s 14:10', evaluated: '07/08/2026 √†s 14:30' }
];
const servicePhotos = services.map(() => []);
function vehicleParts(vehicle) {
  const parts = String(vehicle || '').split(String.fromCharCode(183));
  return { model: (parts[0] || '').replace(/√É‚Äö|√Ç$/g, '').trim(), plate: (parts[1] || '').trim() };
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
  if (!estimate || !estimate.date || !estimate.time) return 'A definir ap√≥s avalia√ß√£o';
  const [year, month, day] = estimate.date.split('-');
  return `${day}/${month}/${year} √†s ${estimate.time}`;
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
  if (metricBlocks[0]) metricBlocks[0].querySelector('small').textContent = `${counts.active} ordem em execu√ß√£o`;
  if (metricBlocks[1]) metricBlocks[1].querySelector('small').textContent = `${counts.ready} cliente para retirada`;
  if (metricBlocks[2]) metricBlocks[2].querySelector('small').textContent = `${counts.total} ordem no m√™s`;
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
list.innerHTML = services.map((item, index) => `<button class="service-row" data-service-index="${index}">${vehicleVisual(item.vehicle)}<div class="service-main"><b>${item.client}</b><small>${item.vehicle} ¬∑ ${item.service} ¬∑ ${item.time}</small></div><span class="status-pill ${item.tone}">${item.status}</span></button>`).join('');
function refreshServiceList() {
  list.innerHTML = services.map((item, index) => `<button class="service-row" data-service-index="${index}">${vehicleVisual(item.vehicle)}<div class="service-main"><b>${item.client}</b><small>${item.vehicle} ¬∑ ${item.service} ¬∑ ${item.time}</small></div><span class="status-pill ${item.tone}">${item.status}</span></button>`).join('');
  list.querySelectorAll('.service-row').forEach((row) => {
    const stage = document.createElement('small');
    stage.className = 'service-stage';
    stage.textContent = `Etapa: ${stageNames[serviceStates[Number(row.dataset.serviceIndex)].stage]}`;
    row.querySelector('.service-main').appendChild(stage);
    row.addEventListener('click', () => { activeServiceIndex = Number(row.dataset.serviceIndex); stageIndex = serviceStates[activeServiceIndex].stage; syncStage(); openModal('detail-modal'); });
  });
}
document.querySelector('#client-table').innerHTML = clients.map((item) => `<tr><td><b>${item[0]}</b><small>Cliente desde 2025</small></td><td>${item[1]}</td><td>${item[2]}</td><td><span class="status-pill ${item[4]}">${item[3]}</span></td><td><button class="text-button">Abrir ‚Üí</button></td></tr>`).join('');

document.querySelectorAll('.service-row').forEach((row) => { const stage = document.createElement('small'); stage.className = 'service-stage'; stage.textContent = `Etapa: ${stageNames[serviceStates[Number(row.dataset.serviceIndex)].stage]}`; row.querySelector('.service-main').appendChild(stage); });
const sections = { 'visao-geral': 'dashboard-section', clientes: 'clients-section' };
function canViewCurrentSection(section) {
  const role = globalThis.__activeRole;
  if (!role || !globalThis.__canViewSection) return true;
  return globalThis.__canViewSection(role, section);
}
const moduleCopy = {
  atendimentos: ['ATENDIMENTOS', 'Atendimentos', 'Ordens de servi√ßo, etapas, fotos e links de acompanhamento.'],
  agenda: ['AGENDA OPERACIONAL', 'Agenda', 'Visualize entradas, retiradas e a carga de trabalho da equipe.'],
  servicos: ['CAT√ÅLOGO DA EMPRESA', 'Servi√ßos e pre√ßos', 'Configure os servi√ßos exibidos no or√ßamento e no atendimento.'],
  equipe: ['ACESSOS E PERMISS√ïES', 'Equipe', 'Defina o que cada pessoa pode visualizar e alterar no sistema.'],
  conversas: ['RELACIONAMENTO', 'Conversas', 'Centralize os retornos dos clientes e mantenha cada conversa ligada √† ordem certa.'],
  relatorios: ['GEST√ÉO DA OPERA√á√ÉO', 'Relat√≥rios', 'Acompanhe volume, status e gargalos com base nos registros atuais.'],
  configuracoes: ['CONFIGURA√á√ïES', 'Configura√ß√µes', 'Ajuste acessos, prefer√™ncias e regras da opera√ß√£o.'],
  faturamento: ['GEST√ÉO FINANCEIRA', 'Faturamento', 'Acompanhe receitas, pagamentos, ordens e resultados por per√≠odo.']
};
function showSection(section) {
  if (!canViewCurrentSection(section)) { showToast('Este m√É¬≥dulo n√É¬£o est√É¬° dispon√É¬≠vel para o seu perfil.'); return; }
  document.querySelectorAll('.page-section').forEach((el) => el.classList.add('hidden'));
  const target = sections[section] || 'generic-section';
  document.querySelector(`#${target}`).classList.remove('hidden');
  if (section === 'clientes') renderClients();
  if (target === 'generic-section') renderModule(section);
  if (section === 'agenda') window.dispatchEvent(new CustomEvent('agenda-requested'));
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.section === section));
}
function openClientFicha(index) {
  const item = clients[index];
  if (!item) return;
  let modal = document.querySelector('#client-ficha-modal');
  if (!modal) {
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop hidden" id="client-ficha-modal"><div class="modal client-ficha"><button class="close-button" data-close="client-ficha-modal">√ó</button><p class="eyebrow">FICHA DO CLIENTE</p><h2 id="ficha-name"></h2><p class="muted" id="ficha-contact"></p><div class="ficha-grid"><div><span>Ve√≠culo</span><b id="ficha-vehicle"></b></div><div><span>√öltimo servi√ßo</span><b id="ficha-service"></b></div><div><span>Status atual</span><b id="ficha-status"></b></div><div><span>Hist√≥rico</span><b id="ficha-history"></b></div></div><div class="form-actions"><button class="primary-button" id="ficha-new-attendance">Novo atendimento</button></div></div></div>`);
    modal = document.querySelector('#client-ficha-modal');
    modal.querySelector('[data-close]').addEventListener('click', () => closeModal('client-ficha-modal'));
    modal.querySelector('#ficha-new-attendance').addEventListener('click', () => { closeModal('client-ficha-modal'); openModal('service-modal'); });
  }
  modal.querySelector('#ficha-name').textContent = item[0];
  modal.querySelector('#ficha-contact').textContent = 'WhatsApp cadastrado ¬∑ cliente desde 2025';
  modal.querySelector('#ficha-vehicle').textContent = item[1];
  modal.querySelector('#ficha-service').textContent = item[2];
  modal.querySelector('#ficha-status').textContent = item[3];
  modal.querySelector('#ficha-history').textContent = `${Math.max(1, item[5] || index + 2)} servi√ßos registrados`;
  openModal('client-ficha-modal');
}
function renderClients() {
  const section = document.querySelector('#clients-section');
  if (globalThis.__renderLiveClients) { globalThis.__renderLiveClients(section); return; }
  section.innerHTML = `<div class="page-heading"><div><p class="eyebrow">BASE DE RELACIONAMENTO</p><h1>Clientes e ve√≠culos</h1><p class="muted">Cadastros, ve√≠culos vinculados e hist√≥rico de servi√ßos.</p></div><button class="primary-button" id="client-new-record">+ Cadastrar cliente</button></div><div class="client-summary"><div><span>Clientes ativos</span><b>24</b><small>com cadastro completo</small></div><div><span>Ve√≠culos registrados</span><b>31</b><small>5 retornaram este m√™s</small></div><div><span>Retornos previstos</span><b>07</b><small>nos pr√≥ximos 30 dias</small></div></div><div class="client-directory"><div class="directory-toolbar"><div><h2>Diret√≥rio de clientes</h2><p>Use o hist√≥rico para consultar rapidamente qualquer ve√≠culo.</p></div><input id="client-search" placeholder="Buscar nome, telefone ou placa" /></div><div class="client-directory-heading"><span>CLIENTE</span><span>VE√çCULOS</span><span>√öLTIMA VISITA</span><span>HIST√ìRICO</span><span></span></div>${clients.map((item, index) => `<button class="client-record" data-client-index="${index}"><div class="client-identity"><span class="avatar">${item[0].split(' ').map((name) => name[0]).join('').slice(0,2)}</span><div><b>${item[0]}</b><small>cliente desde 2025 ¬∑ WhatsApp cadastrado</small></div></div><div><b>1 ve√≠culo</b><small>${item[1]}</small></div><div><b>${index === 0 ? 'Hoje' : index === 1 ? '12 jun' : index === 2 ? '28 mai' : '04 mai'}</b><small>${item[2]}</small></div><div><span class="history-count">${index + 2} servi√ßos</span><small>${index === 0 ? 'retorno em 30 dias' : '√∫ltimo or√ßamento aprovado'}</small></div><span class="attendance-arrow">‚Üí</span></button>`).join('')}</div>`;
  const records = section.querySelectorAll('.client-record');
  refreshGlobalCounts();
  records.forEach((record, index) => { const history = record.querySelector('.history-count'); if (history) history.textContent = `${Math.max(1, clients[index][5] || index + 2)} servi√ßos`; });
  section.querySelectorAll('.client-record .avatar').forEach((avatar) => { avatar.outerHTML = '<span class="person-mark" aria-hidden="true"></span>'; });
  section.querySelector('#client-search').addEventListener('input', (event) => { const query = event.target.value.toLowerCase(); records.forEach((record) => record.classList.toggle('filtered-out', !record.textContent.toLowerCase().includes(query))); });
  records.forEach((record) => record.addEventListener('click', () => openClientFicha(Number(record.dataset.clientIndex))));
  section.querySelector('#client-new-record').addEventListener('click', () => openModal('new-client-modal'));
}
function openServicePriceModal() {
  let modal = document.querySelector('#service-price-modal');
  if (!modal) {
    document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop hidden" id="service-price-modal"><div class="modal"><button class="close-button" data-close="service-price-modal">√ó</button><p class="eyebrow">CAT√ÅLOGO DA EMPRESA</p><h2>Novo servi√ßo</h2><p class="muted">Cadastre um servi√ßo para que a equipe possa selecion√°-lo nos atendimentos.</p><form id="service-price-form"><label>Nome do servi√ßo<input name="name" required placeholder="Ex.: Lavagem t√©cnica" /></label><label>Descri√ß√£o<input name="description" required placeholder="Ex.: Limpeza externa e prote√ß√£o r√°pida" /></label><label>Pre√ßo<input name="price" required placeholder="Ex.: 180" /></label><div class="form-actions"><button type="button" class="outline-button" data-close="service-price-modal">Cancelar</button><button class="primary-button">Salvar servi√ßo</button></div></form></div></div>`);
    modal = document.querySelector('#service-price-modal');
    modal.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
    modal.querySelector('#service-price-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const price = Number(String(data.get('price') || '').replace(',', '.')) || 0;
      const newService = { id: `custom-${Date.now()}`, name: data.get('name'), description: data.get('description'), price };
      serviceCatalogExtras.push(newService);
      globalThis.__serviceCatalog = [...getCatalog(), newService].filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index);
      closeModal('service-price-modal');
      showSection('servicos');
      showToast('Servi√ßo adicionado ao cat√°logo.');
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
  const actionLabels = { agenda: '+ Reservar hor√°rio', equipe: '+ Adicionar membro', servicos: '+ Novo servi√ßo', atendimentos: '+ Novo atendimento', conversas: '+ Nova conversa', relatorios: 'Exportar resumo', faturamento: 'Atualizar faturamento', configuracoes: 'Salvar configura√ß√µes' };
  genericAction.textContent = actionLabels[section] || '+ Adicionar registro';
  genericAction.dataset.module = section;
  genericAction.classList.toggle('hidden', section === 'atendimentos');
  const content = document.querySelector('#module-content');
  if (section === 'agenda') {
    content.innerHTML = '<div id="agenda-root"></div>';
  } else if (section === 'equipe') {
    content.innerHTML = `<div class="module-grid"><div class="module-panel"><div class="module-toolbar"><h2>Pessoas cadastradas</h2><button class="outline-button" id="new-member">+ Adicionar pessoa</button></div><div class="permission-list"><div class="permission-item"><span class="avatar">MC</span><div><b>Marina Costa</b><small>Acesso completo ao sistema</small></div><span class="role-tag">Administradora</span></div><div class="permission-item"><span class="avatar">LS</span><div><b>Lucas Sampaio</b><small>Atualiza etapas e adiciona fotos</small></div><span class="role-tag">Funcion√°rio</span></div><div class="permission-item"><span class="avatar">FC</span><div><b>Fernanda Cardoso</b><small>Agenda e atendimento</small></div><span class="role-tag">Atendente</span></div></div></div><div class="module-panel"><h2>Permiss√µes por fun√ß√£o</h2><div class="data-line"><div><b>Administradora</b><small>Todos os m√≥dulos, configura√ß√µes e faturamento</small></div><span class◊Ætˆ⁄$z{-ÆÈ‹j◊ùIŒà…–ÿ[Z[Hö][ò€›\ù	À	’ﬁ[›H€‹õ€HZH0≠»ëNLâ◊K	“õË€»ö]‹àY[ô\»0≠»ôY\€€\\‹…Œà…“õË€»ö]‹àY[ô\…À	“ôY\€€\\‹»[Z]Y0≠»R’ÀLPÕÃ…◊HN»€€ú›Ÿ[X›YHò[Y\÷Ÿ]ô[ùù\ôŸ]ùò[YWN»Yà
Ÿ[X›Y
H»õ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ä	⁄[ú]€ò[YOHò€Y[ùóI Kùò[YHHŸ[X›YÃN»õ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ä	⁄[ú]€ò[YOHùôZX€HóI Kùò[YHHŸ[X›YÃWN»HJN√BàYà
Z\–€Y[ù
H√Bà€€ú›ô\‹€ú⁄XõHHÿ›[Y[ùò‹ôX]Q[[Y[ù
	€Xô[	 N√Bàô\‹€ú⁄XõKö[õô\íSHô\‹€úË]ô[Ÿ[X›ò[YOHúô\‹€ú⁄XõHèâ›X[SY[Xô\úÀõX\

Y[Xô\äHOà‹[€àò[YOHâ€Y[Xô\ãõò[Y_Hèâ€Y[Xô\ãõò[Y_H0≠»	€Y[Xô\ãúõ€_O€‹[€èò
Köõ⁄[ä	… _O‹Ÿ[X›è€X[€\‹œHôõ‹õKZ[\àèë\ÿ€€H]Y[HöXÿ\∞ËH€€H\›H‹ô[Kè‹€X[ò√Bàõ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ä	»Ÿ[\ﬁYYK\õ€KYõ‹õHôõ‹õKXX›[€ú… KòôYõ‹ôJô\‹€ú⁄XõJN√BàCBàõ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ä	»Ÿ[\ﬁYYK\õ€KYõ‹õI KòY]ô[ù\›[ô\ä	‹›XõZ]	À
]ô[ù
HOà√Bà]ô[ùúô]ô[ùYò][

N√Bà€€ú›õ‹õHH]ô[ùò›\úô[ù\ôŸ]√Bà€€ú›]HHô]»õ‹õQ]Jõ‹õJN√BàYà
Z\–€Y[ù
H√Bà€€ú›€Y[ùH]KôŸ]
	ÿ€Y[ù	 N√Bà€€ú›ôZX€HH]KôŸ]
	›ôZX€I N√Bà€€ú›Ÿ\ùöXŸHH]KôŸ]
	‹Ÿ\ùöXŸI N√Bà€€ú›ô\‹€ú⁄XõHH]KôŸ]
	‹ô\‹€ú⁄XõI H	”∞Ë€»]öXùpÎY…Œ√Bà€€ú›[ùûHHŸ]›\úô[ù[ùûQ]J
N√BàŸ\ùöXŸ\Àú\⁄
»[ö]X[Œà€Y[ùú‹]
	»	 KõX\

\ù
HOà\ùÃJKöõ⁄[ä	… Kú€XŸJäKù’\\êÿ\ŸJ
K€Y[ùôZX€KŸ\ùöXŸK›]\Œà	‘ôXŸXöY…À€ôNà	‹ôXŸZ]ôY	À[YNà[ùûKù[YHJN√BàŸ\ùöXŸT›]\Àú\⁄
»›YŸNà›]\Œà	‹ôXŸZ]ôY	Àô\‹€ú⁄XõHJN√BàŸ\ùöXŸQ\›[X]\Àú\⁄
»]Nà	…À[YNà	…»JN√BàŸ\ùöXŸSZ[\›€ô\Àú\⁄
»ôXŸZ]ôYà[ùûKúôXŸZ]ôY]ò[X]Yà	…»JN√Bà\Ÿ\ù€Y[ùúõ€TŸ\ùöXŸJ€Y[ùôZX€KŸ\ùöXŸK	‘ôXŸXöY…À	‹ôXŸZ]ôY	 N√BàŸ\ùöXŸT›‹Àú\⁄
◊JN√BàôYúô\⁄Ÿ\ùöXŸS\›

N√BàôYúô\⁄€ÿò[€›[ù 
N√BàH[ŸH√Bà€Y[ùÀú\⁄
Ÿ]KôŸ]
	ÿ€Y[ù	 K]KôŸ]
	›ôZX€I K	‘Ÿ[H\›0Ï‹öX€…À	”õ›õ»ÿY\›õ…À	‹ôXŸZ]ôY	À	…◊JN√BàôYúô\⁄€ÿò[€›[ù 
N√BàCBà⁄›‘õ€Tÿ‹ôY[ä	Ÿ[\ﬁYYI N√Bà⁄›’ÿ\›
\–€Y[ù»	–€Y[ùHÿY\›òY»€€H›XŸ\‹€Àâ»à	–][ô[Y[ù»‹öXY»Hô\‹€úË]ô[]öXùpÎYÀâ N√BàJN√BüCBò€€ú›õ€Tÿ‹ôY[àHÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»‹õ€K\ÿ‹ôY[â N√Bò€€ú›õ€Tÿ‹ôY[ê€€ù[ùHÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»‹õ€K\ÿ‹ôY[ãX€€ù[ù	 N√Bôù[ò›[€àô[ô\ë[\ﬁYYPYŸ[ôJ
H¬àõ€Tÿ‹ôY[ê€€ù[ùö[õô\íSH]à€\‹œHô[\ﬁYYKXYŸ[ôK\ÿ‹ôY[àèè]à€\‹œHô[\ﬁYYKXYŸ[ôKZXY[ô»èè]èè€\‹œHô^YXúõ›»èêQ—SëHHëP—T0·‡”œ‹èOìX\òÿ\à][ô[Y[ùœ⁄Oè€\‹œHõ]]Yèë\ÿ€€H[H‹∞Ë\ö[»]úôH\òHÿY\›ò\àH[ùòYH»ôpÎX›[Àè‹èŸ]èèù]€à€\‹œHõ›][ôKXù]€ààYHòòX⁄À]ÀY[\ﬁYYHè∏°§õ€\à[»Z[ô[ÿù]€èèŸ]èè]à€\‹œHõ[Ÿ[K\[ô[èè]à€\‹œHõ[Ÿ[K]€€ò\àèèèå»HLHHY€‹›œ⁄èèù]€à€\‹œHúö[X\ûKXù]€ààYHòYŸ[ôK[ô]ÀXõ€⁄⁄[ô»èä»õ›õ»‹∞Ë\ö[œÿù]€èèŸ]èè]à€\‹œHòÿ[[ô\ãY‹öYèè]à€\‹œHòÿ[[ô\ãY^Hèè›õ€ôœî]ZH0≠»œ‹›õ€ôœè€X[ç‹∞Ë\ö[‹œ‹€X[è]à€\‹œHòÿ[[ô\ãY]ô[ùèèèååÃ0≠»òYòY[ãèÿèí€ôH⁄]öX»0≠»€€ôö\õXYœŸ]èè]à€\‹œHòÿ[[ô\ãY]ô[ùèèèåMå0≠»X\ö[òHKèÿèêìU»ÃåH0≠»[H[ô[Y[ùœŸ]èèŸ]èè]à€\‹œHòÿ[[ô\ãY^Hèè›õ€ôœîŸ^0≠»‹›õ€ôœè€X[å»‹∞Ë\ö[‹œ‹€X[è]à€\‹œHòÿ[[ô\ãY]ô[ùèèèåNå0≠»úù[õ»ÀèÿèíôY\ô[ôYÿYH0≠»€€ôö\õXYœŸ]èè]à€\‹œHòÿ[[ô\ãY]ô[ù]òZ[XõHèèèåLNåÃ0≠»‹∞Ë\ö[»]úôOÿèê€\]YH\òHYŸ[ô\èŸ]èèŸ]èè]à€\‹œHòÿ[[ô\ãY^Hèè›õ€ôœîËXà0≠»O‹›õ€ôœè€X[åà‹∞Ë\ö[‹œ‹€X[è]à€\‹œHòÿ[[ô\ãY]ô[ùèèèåLåÃ0≠»[òHèÿèê€‹õ€HZH0≠»€€ôö\õXYœŸ]èèŸ]èè]à€\‹œHòÿ[[ô\ãY^Hèè›õ€ôœë€H0≠»L‹›õ€ôœè€X[ëôX⁄Yœ‹€X[èŸ]èè]à€\‹œHòÿ[[ô\ãY^Hèè›õ€ôœîŸY»0≠»LO‹›õ€ôœè€X[çH‹∞Ë\ö[‹œ‹€X[è]à€\‹œHòÿ[[ô\ãY]ô[ùèèèåå0≠»Xÿ\»Kèÿèì€ö^ô[ZY\à0≠»€€ôö\õXYœŸ]èèŸ]èèŸ]èèŸ]èèŸ]èò√Bàõ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ä	»ÿòX⁄À]ÀY[\ﬁYYI KòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà⁄›‘õ€Tÿ‹ôY[ä	Ÿ[\ﬁYYI JN√Bàõ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ä	»ÿYŸ[ôK[ô]ÀXõ€⁄⁄[ô… KòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà⁄›’ÿ\›
	—õ‹õ][0Ë\ö[»Hõ›õ»YŸ[ô[Y[ù»Xô\ù»\òHHôXŸ\0ÈË€Àâ JN√Bàõ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ê[
	Àòÿ[[ô\ãY]ô[ùò]òZ[XõI Kôõ‹ëXX⁄

€›
HOà€›òY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà⁄›’ÿ\›
	“‹∞Ë\ö[»Ÿ[X⁄[€òYÀàY€‹òHÿY\›ôH»€Y[ùHH»ôpÎX›[Àâ JJN√BüBôù[ò›[€àô[ô\ë[\ﬁYYQ\⁄õÿ\ô

H¬à€€ú›õŸö[HH€ÿò[\Àó◊‹Ÿ\‹⁄[€îõŸö[HﬂN¬à€€ú›]ôTŸ\ùöXŸ\»H€ÿò[\Àó◊€]ôTŸ\ùöXŸ\Œ¬à€€ú›€›\òŸTŸ\ùöXŸ\»H\úò^Kö\–\úò^J]ôTŸ\ùöXŸ\ H»]ôTŸ\ùöXŸ\»àŸ\ùöXŸ\Œ¬à€€ú›\⁄õÿ\ôH€ÿò[\Àó◊ŸŸ][\ﬁYYQ\⁄õÿ\ô]H»€ÿò[\Àó◊ŸŸ][\ﬁYYQ\⁄õÿ\ô]J€›\òŸTŸ\ùöXŸ\ÀõŸö[JHà»‹ô\úŒà€›\òŸTŸ\ùöXŸ\Àôö[\ä
][JHOà][Kúô\‹€ú⁄XõRYOOHõŸö[KöY][Kúô\‹€ú⁄XõRYOOHõŸö[Kôù[€ò[YJKY]öX‹Œà»X›]ôNàôXYNà›[àHN¬à€€ú›ÿYôHH
ò[YJHOà›ö[ô ò[YHœ»	… Kúô\XŸJ÷…èâ»óKŸÀ
⁄\òX›\äHOà
»	…âŒà	…ò[\…À	œ	Œà	…õ…À	œâŒà	…ô›…Àâ»éà	…àÃŒN…À	»âŒà	…ú][›…»Vÿ⁄\òX›\óJJN¬à€€ú›YŸ[ôHH\⁄õÿ\ôõ‹ô\úÀôö[\ä
][JHOà][Kúÿ⁄Y[Y]][Kù[YJKú€XŸJ
Kú€‹ù

KäHOà›ö[ô Kúÿ⁄Y[Y]Kù[YJKõÿÿ[P€€\\ôJ›ö[ô ãúÿ⁄Y[Y]ãù[YJJJN¬à€€ú›‹ô\ìX\ö›\H\⁄õÿ\ôõ‹ô\úÀõX\

][JHOàù]€à\OHòù]€àà€\‹œHô[\ﬁYYKY\⁄õÿ\ô[‹ô\àà]K[]ôK[‹ô\èHâ‹ÿYôJ][Kõ‹ô\íY
_Hèè‹[à€\‹œHùôZX€K[X\ö»à\öXKZY[èHùùYHèè‹‹[èè‹[à€\‹œHô[\ﬁYYKY\⁄õÿ\ô[‹ô\ãX€‹Hèèèâ‹ÿYôJ][Kò€Y[ù
_Oÿèè€X[â‹ÿYôJ][KùôZX€J_H0≠»	‹ÿYôJ][KúŸ\ùöXŸJ_O‹€X[è‹‹[èè‹[à€\‹œHú›]\À\[	‹ÿYôJ][Kù€ôJ_Hèâ‹ÿYôJ][Kú›]\ _O‹‹[èè‹[à€\‹œHô\⁄õÿ\ôX\úõ›»è∏°§è‹‹[èèÿù]€èò
Köõ⁄[ä	… H	œ€\‹œHô[\ﬁYYKY[\Hèìô[ö[XH‹ô[H]öXùpÎYHH\›Hù[ò⁄[€∞Ë\ö[Àè‹âŒ¬à€€ú›YŸ[ôSX\ö›\HYŸ[ôKõX\

][JHOà]à€\‹œHô[\ﬁYYKY\⁄õÿ\ôXYŸ[ôKZ][Hèè‹[à€\‹œHô[\ﬁYYKY\⁄õÿ\ô][YHèâ‹ÿYôJ][Kù[YOÀúô\XŸJ	—[ùòYH	À	… H	¯†%	 _O‹‹[èè‹[èèèâ‹ÿYôJ][Kò€Y[ù
_Oÿèè€X[â‹ÿYôJ][KùôZX€J_H0≠»	‹ÿYôJ][KúŸ\ùöXŸJ_O‹€X[è‹‹[èè‹[à€\‹œHú›]\À\[	‹ÿYôJ][Kù€ôJ_Hèâ‹ÿYôJ][Kú›]\ _O‹‹[èèŸ]èò
Köõ⁄[ä	… H	œ€\‹œHô[\ﬁYYKY[\Hèìô[ö[H‹∞Ë\ö[»ô]ö\›»\òH\»‹ô[ú»]öXùpÎY\Àè‹âŒ¬àõ€Tÿ‹ôY[ê€€ù[ùö[õô\íSHŸX›[€à€\‹œHô[\ﬁYYKY\⁄õÿ\ôèè]à€\‹œHô[\ﬁYYKY\⁄õÿ\ôZXY[ô»èè]èè€\‹œHô^YXúõ›»èîRSëS‘TêP“S”êS‹èOêõ€HXK	‹ÿYôJõŸö[Kôù[€ò[YH	Ÿù[ò⁄[€∞Ë\ö[… _Kè⁄Oè€\‹œHõ]]YèêX€€\[öH›X\»‹ô[úÀ]\\»H‹∞Ë\ö[‹»[H[XH0ÓõöXÿHö\Ë€Àè‹èŸ]èè‹[à€\‹œHúõ€K]Y»èëù[ò⁄[€∞Ë\ö[œ‹‹[èèŸ]èè]à€\‹œHô[\ﬁYYKY\⁄õÿ\ô[Y]öX‹»èè]èèèâ‘›ö[ô \⁄õÿ\ôõY]öX‹ÀòX›]ôJKúY›\ù
ã	Ã	 _Oÿèè€X[ë[H][ô[Y[ùœ‹€X[èŸ]èè]èèèâ‘›ö[ô \⁄õÿ\ôõY]öX‹ÀúôXYJKúY›\ù
ã	Ã	 _Oÿèè€X[îõ€ù‹»\òHô]\òYO‹€X[èŸ]èè]èèèâ‘›ö[ô \⁄õÿ\ôõY]öX‹Àù›[
KúY›\ù
ã	Ã	 _Oÿèè€X[ì‹ô[ú»]öXùpÎY\œ‹€X[èŸ]èèŸ]èè]à€\‹œHô[\ﬁYYKY\⁄õÿ\ôY‹öYèèŸX›[€à€\‹œHô[\ﬁYYKY\⁄õÿ\ô\[ô[èè]à€\‹œHô[\ﬁYYKY\⁄õÿ\ô\[ô[ZXY[ô»èè]èè€\‹œHô^YXúõ›»èì‘Têp·‡”œ‹èèì‹ô[ú»»[€Y[ùœ⁄èèŸ]èè‹[à€\‹œHô\⁄õÿ\ôX€›[ùèâ‘›ö[ô \⁄õÿ\ôõY]öX‹Àù›[
KúY›\ù
ã	Ã	 _O‹‹[èèŸ]èè€\‹œHõ]]YèîŸ\ùöpÈ€‹»ö[ò›[Y‹»[»Ÿ]HXŸ\‹€»õ»⁄\›[XKè‹è]à€\‹œHô[\ﬁYYKY\⁄õÿ\ô[‹ô\ã[\›èâ€‹ô\ìX\ö›\OŸ]èè‹ŸX›[€èèŸX›[€à€\‹œHô[\ﬁYYKY\⁄õÿ\ô\[ô[èè]à€\‹œHô[\ﬁYYKY\⁄õÿ\ô\[ô[ZXY[ô»èè]èè€\‹œHô^YXúõ›»èêQ—SëO‹èèí⁄ôO⁄èèŸ]èè‹[à€\‹œHô\⁄õÿ\ôX€›[ùèâ‘›ö[ô YŸ[ôKõ[ô›
KúY›\ù
ã	Ã	 _O‹‹[èèŸ]èè€\‹œHõ]]Yèí‹∞Ë\ö[‹»ô[X⁄[€òY‹»0Ë»›X\»‹ô[úÀè‹è]à€\‹œHô[\ﬁYYKY\⁄õÿ\ôXYŸ[ôK[\›èâÿYŸ[ôSX\ö›\OŸ]èè‹ŸX›[€èèŸ]èè]à€\‹œHô[\ﬁYYKY\⁄õÿ\ô[õ›HèèèîŸ]H\‹pÈ€»HòXò[œÿèè‹[èêXúòH[XH‹ô[H\òH]X[^ò\à]\\ÀYX⁄[€ò\àõ›‹ÀôY⁄\›ò\àÿúŸ\ùòpÈÌY\»HX\òÿ\àHô]\òYKè‹‹[èèŸ]èè‹ŸX›[€èò¬àõ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ê[
	÷Ÿ]K[]ôK[‹ô\óI Kôõ‹ëXX⁄

ù]€äHOàù]€ãòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà»€€ú›‹ô\àH\⁄õÿ\ôõ‹ô\úÀôö[ô

][JHOà][Kõ‹ô\íYOOHù]€ãô]\Ÿ]õ]ôS‹ô\äN»Yà
‹ô\äH⁄›’ÿ\›
‹ô[HH	€‹ô\ãò€Y[ùHŸ[X⁄[€òYKò
N»JJN¬üBôù[ò›[€à⁄›‘õ€Tÿ‹ôY[äõ€JH¬à€€ú›\—[\ﬁYYHHõ€HOOH	Ÿ[\ﬁYYIŒ¬àÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»‹õ€K\ÿ‹ôY[ã]]I Kù^€€ù[ùH\—[\ﬁYYH»	‘Z[ô[»ù[ò⁄[€∞Ë\ö[…»à	‘‹ù[»€Y[ùIŒ¬àÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»‹õ€K\ÿ‹ôY[ã\›Xù]I Kù^€€ù[ùH\—[\ﬁYYH»	‘ôXŸ\0ÈË€»H‹\òpÈË€…»à	–X€€\[ö[Y[ù»»ôpÎX›[…Œ¬à€€ú›€›\òŸHHÿ›[Y[ùú]Y\ûTŸ[X›‹ä\—[\ﬁYYH»	Àô[\ﬁYYK\‹ù[	»à	Àò€Y[ù\‹ù[	 Kò€€ôSõŸJùYJN¬à€›\òŸKú]Y\ûTŸ[X›‹ê[
	Àò€‹ŸKXù]€â Kôõ‹ëXX⁄

ù]€äHOàù]€ãúô[[›ôJ
JN¬àõ€Tÿ‹ôY[ê€€ù[ùö[õô\íSH	…Œ¬àõ€Tÿ‹ôY[ê€€ù[ùò\[ô⁄[
€›\òŸJN¬àYà
\—[\ﬁYYJH¬à€€ú›[\ﬁYYSò[YHH€ÿò[\Àó◊‹Ÿ\‹⁄[€îõŸö[OÀôù[€ò[YH	Ÿù[ò⁄[€∞Ë\ö[…Œ¬à€€ú›XY[ô»H€›\òŸKú]Y\ûTŸ[X›‹ä	Àô[\ﬁYYKZXY[ô»â N¬àYà
XY[ô HXY[ôÀù^€€ù[ùHõ€HXK	Ÿ[\ﬁYYSò[Y_Kò¬àô[ô\ë[\ﬁYYRõÿú €›\òŸJN¬àö[ô[\ﬁYYS‹ô\êX›[€ú €›\òŸJN¬àBàYà
Z\—[\ﬁYYJHY€Y[ù›‹ €›\òŸJN¬àYà
Ÿ\ùöXŸT›]\÷ÿX›]ôTŸ\ùöXŸR[ô^JHﬁ[ò‘›YŸJ
N¬àõ€Tÿ‹ôY[ãò€\‹”\›úô[[›ôJ	⁄Y[â N¬àõ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ê[
	Àô[\ﬁYYKXX›[€éõõ›
Ÿ]K\Ÿ\ùöXŸKZ[ô^JI Kôõ‹ëXX⁄

ù]€äHOàù]€ãòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà⁄›’ÿ\›
	ÿù]€ãô]\Ÿ]òX›[€üNàpÈË€»ôY⁄\›òYHõ»⁄\›[XKò
JJN√Bà€€ú›ô]‘Ÿ\ùöXŸHHõ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ä	»‹ôXŸ\[€ã[ô]À\Ÿ\ùöXŸI N√BàYà
ô]‘Ÿ\ùöXŸJHô]‘Ÿ\ùöXŸKòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOàô[ô\ë[\ﬁYYQõ‹õJ	ÿ][ô[òŸI JN√Bà€€ú›ô]–€Y[ùHõ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ä	»‹ôXŸ\[€ã[ô]ÀX€Y[ù	 N√BàYà
ô]–€Y[ù
Hô]–€Y[ùòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOàô[ô\ë[\ﬁYYQõ‹õJ	ÿ€Y[ù	 JN√Bà€€ú›ô]–õ€⁄⁄[ô»Hõ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ä	»‹ôXŸ\[€ã[ô]ÀXõ€⁄⁄[ô… N√BàYà
ô]–õ€⁄⁄[ô Hô]–õ€⁄⁄[ôÀòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOàô[ô\ë[\ﬁYYPYŸ[ôJ
JN√Bà€€ú›⁄]ÿ\Hõ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ä	Àú‹ù[Yõ€›\àù^Xù]€â N√BàYà
⁄]ÿ\
H⁄]ÿ\òY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà⁄›’ÿ\›
	”õ»⁄\›[XHôX[\›Hõ›0Ë€»Xúö\∞ËH»⁄]–\H[\ô\ÿH€€HH‹ô[HY[ùYöXÿYKâ JN√BüBô€ÿò[\Àó◊‹⁄›‘õ€Tÿ‹ôY[àH⁄›‘õ€Tÿ‹ôY[é¬ô€ÿò[\Àó◊‹⁄›‘ŸX›[€àH⁄›‘ŸX›[€é¬ôÿ›[Y[ùòY]ô[ù\›[ô\ä	‹õ€K\ÿ‹ôY[ã\ô\]Y\›	À
]ô[ù
HOà⁄›‘õ€Tÿ‹ôY[ä]ô[ùô]Z[
JN¬ôÿ›[Y[ùòY]ô[ù\›[ô\ä	‹ŸX›[€ã\ô\]Y\›	À
]ô[ù
HOà⁄›‘ŸX›[€ä]ô[ùô]Z[
JN¬ôÿ›[Y[ùòY]ô[ù\›[ô\ä	€]ôKY]K\ôXYIÀ

HOà»Yà
€ÿò[\Àó◊ÿX›]ôTõ€HOOH	Ÿ[\ﬁYYI»	âà\õ€Tÿ‹ôY[ãò€\‹”\›ò€€ùZ[ú 	⁄Y[â JH»€€ú››\úô[ù‹ù[Hõ€Tÿ‹ôY[ê€€ù[ùú]Y\ûTŸ[X›‹ä	Àô[\ﬁYYK\‹ù[	 N»Yà
›\úô[ù‹ù[
H»ô[ô\ë[\ﬁYYRõÿú ›\úô[ù‹ù[
N»ö[ô[\ﬁYYS‹ô\êX›[€ú ›\úô[ù‹ù[
N»HHJN¬ôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»‹ô]\õãXYZ[â KòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà»õ€Tÿ‹ôY[ãò€\‹”\›òY
	⁄Y[â N»õ€Tÿ‹ôY[ê€€ù[ùö[õô\íSH	…Œ»JN¬ôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»€ô]À\Ÿ\ùöXŸI KòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà‹[ì[Ÿ[
	‹Ÿ\ùöXŸK[[Ÿ[	 JN√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»Ÿ[\ﬁYYK\ô]öY]… KòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà⁄›‘õ€Tÿ‹ôY[ä	Ÿ[\ﬁYYI JN√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ÿ€Y[ù\ô]öY]… KòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà⁄›‘õ€Tÿ‹ôY[ä	ÿ€Y[ù	 JN√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»€‹[ãX€Y[ù[[ö… KòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà⁄›‘õ€Tÿ‹ôY[ä	ÿ€Y[ù	 JN√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ê[
	»‹Ÿ\ùöXŸK[\›úŸ\ùöXŸK\õ›… Kôõ‹ëXX⁄

][JHOà][KòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà»X›]ôTŸ\ùöXŸR[ô^Hù[Xô\ä][Kô]\Ÿ]úŸ\ùöXŸR[ô^
N»›YŸR[ô^HŸ\ùöXŸT›]\÷ÿX›]ôTŸ\ùöXŸR[ô^Kú›YŸN»ﬁ[ò‘›YŸJ
N»‹[ì[Ÿ[
	Ÿ]Z[[[Ÿ[	 N»JJN√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ê[
	÷Ÿ]KX€‹ŸWI Kôõ‹ëXX⁄

ù]€äHOàù]€ãòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà€‹ŸS[Ÿ[
ù]€ãô]\Ÿ]ò€‹ŸJJJN√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»‹Ÿ\ùöXŸKYõ‹õI KòY]ô[ù\›[ô\ä	‹›XõZ]	À
]ô[ù
HOà√Bà]ô[ùúô]ô[ùYò][

N√Bà€€ú›õ‹õHH]ô[ùò›\úô[ù\ôŸ]√Bà€€ú›]HHô]»õ‹õQ]Jõ‹õJN√Bà€€ú›€Y[ùH]KôŸ]
	ÿ€Y[ù	 N√Bà€€ú›ôZX€HH]KôŸ]
	›ôZX€I N√Bà€€ú›Ÿ\ùöXŸHH]KôŸ]
	‹Ÿ\ùöXŸI N√Bà€€ú›ô\‹€ú⁄XõHH]KôŸ]
	‹ô\‹€ú⁄XõI H	”∞Ë€»]öXùpÎY…Œ√Bà€€ú›[ùûHHŸ]›\úô[ù[ùûQ]J
N√BàŸ\ùöXŸ\Àú\⁄
»[ö]X[Œà€Y[ùú‹]
	»	 KõX\

\ù
HOà\ùÃJKöõ⁄[ä	… Kú€XŸJäKù’\\êÿ\ŸJ
K€Y[ùôZX€KŸ\ùöXŸK›]\Œà	‘ôXŸXöY…À€ôNà	‹ôXŸZ]ôY	À[YNà[ùûKù[YHJN√BàŸ\ùöXŸT›]\Àú\⁄
»›YŸNà›]\Œà	‹ôXŸZ]ôY	Àô\‹€ú⁄XõHJN√BàŸ\ùöXŸQ\›[X]\Àú\⁄
»]Nà	…À[YNà	…»JN√BàŸ\ùöXŸSZ[\›€ô\Àú\⁄
»ôXŸZ]ôYà[ùûKúôXŸZ]ôY]ò[X]Yà	…»JN√Bà\Ÿ\ù€Y[ùúõ€TŸ\ùöXŸJ€Y[ùôZX€KŸ\ùöXŸK	‘ôXŸXöY…À	‹ôXŸZ]ôY	 N√BàŸ\ùöXŸT›‹Àú\⁄
◊JN√BàôYúô\⁄Ÿ\ùöXŸS\›

N√BàôYúô\⁄€ÿò[€›[ù 
N√Bà€‹ŸS[Ÿ[
	‹Ÿ\ùöXŸK[[Ÿ[	 N√Bàõ‹õKúô\Ÿ]

N√Bà⁄›’ÿ\›
	–][ô[Y[ù»‹öXY»Hô\‹€úË]ô[]öXùpÎYÀà[ö»»€Y[ùHŸ\òYÀâ N√BüJN√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»€ô]ÀX€Y[ù	 KòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà‹[ì[Ÿ[
	€ô]ÀX€Y[ù[[Ÿ[	 JN√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ŸŸ[ô\öXÀXX›[€â KòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà»€€ú›[Ÿ[HHÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ŸŸ[ô\öXÀXX›[€â Kô]\Ÿ]õ[Ÿ[N»Yà
[Ÿ[HOOH	ÿYŸ[ôI»	âà€ÿò[\Àó◊ÿÿ[ê‹ôX]TŸX›[€èÀä€ÿò[\Àó◊ÿX›]ôTõ€K	ÿYŸ[ôI JH»⁄[ô›Àô\‹]⁄]ô[ù
ô]»›\›€Q]ô[ù
	ÿYŸ[ôK[‹[ãXõ€⁄⁄[ô… JN»ô]\õé»HYà
[Ÿ[HOOH	‹Ÿ\ùöX€‹… H»‹[îŸ\ùöXŸTöXŸS[Ÿ[

N»ô]\õé»HYà
[Ÿ[HOOH	ÿ][ô[Y[ù‹…»	âà€ÿò[\Àó◊ÿÿ[ê‹ôX]TŸX›[€èÀä€ÿò[\Àó◊ÿX›]ôTõ€K	ÿ][ô[Y[ù‹… JH»‹[ì[Ÿ[
	‹Ÿ\ùöXŸK[[Ÿ[	 N»ô]\õé»H€€ú›X›[€ú»H»\]Z\Nà	–ÿY\›õ»Hõ›õ»Y[Xúõ»Xô\ù»\òH»YZ[ö\›òY‹äJKâÀ][ô[Y[ù‹Œà	—õ‹õ][0Ë\ö[»H][ô[Y[ù»\‹€∞Î]ô[\[ò\»\òHH\]Z\H]]‹ö^òYKâÀ€€ùô\úÿ\Œà	”õ›òH€€ùô\úÿHö[ò›[YH0Ë‹ô[HŸ[X⁄[€òYKâÀô[]‹ö[‹Œà	‘ô[]0Ï‹ö[»]X[^òY»€€H‹»ôY⁄\›õ‹»]XZ\ÀâÀ€€ôöY›\òX€Ÿ\Œà	‘ôYô\∞Íõò⁄X\»ÿ[ò\»ô\›Hõ›0Ï›\Àâ»N»⁄›’ÿ\›
X›[€ú÷€[Ÿ[WH	–pÈË€»\‹€∞Î]ô[ô\›HpÏŸ[Àâ N»JN¬ôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ÿ€‹K[[ö… KòY]ô[ù\›[ô\ä	ÿ€X⁄…À\ﬁ[ò»

HOà¬à€€ú›X›]ôHHŸ\ùöXŸ\÷ÿX›]ôTŸ\ùöXŸR[ô^Bà€€ú›]ôS‹ô\àH
€ÿò[\Àó◊€]ôTŸ\ùöXŸ\»◊JKôö[ô

][JHOà][Kõ‹ô\íYOOHX›]ôOÀõ‹ô\íY
BàYà
[]ôS‹ô\èÀõ‹ô\íYV…⁄[ã\õŸ‹ô\‹…À	Ÿ[]ô\ôY	◊Kö[ò€Y\ ]ôS‹ô\ãù€ôJJH¬à⁄›’ÿ\›
	”»[ö»öXÿ\∞ËH\‹€∞Î]ô[]X[ô»»ôpÎX›[»[ùò\àòH\›0Í]XÿKâ Bàô]\õÇàBàûH¬à€€ú›[ö»H]ÿZ]€ÿò[\Àó◊ÿ‹ôX]P€Y[ù‹ô\ì[öœÀä]ôS‹ô\ãõ‹ô\íY
BàYà
[[ö Hõ›»ô]»\úõ‹ä	”[ö»[ô\‹€∞Î]ô[	 Bà]ÿZ]€ÿò[\Àó◊ÿ€‹P€Y[ù‹ô\ì[öœÀä[öÀù\õ
Bà⁄›’ÿ\›
	”[ö»»€Y[ùH€‹XYÀâ BàHÿ]⁄
\úõ‹äH¬à⁄›’ÿ\›
\úõ‹ãõY\‹ÿYŸH	”∞Ë€»õ⁄H‹‹Î]ô[Ÿ\ò\à»[ö»»€Y[ùKâ BàBüJN¬ôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ÿY\›… KòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà»Y€Y[ù›‹ ÿ›[Y[ùú]Y\ûTŸ[X›‹ä	Àò€Y[ù\‹ù[	 JN»⁄›’ÿ\›
	‡\ôXHHõ›‹»Xô\ùH\òHH\]Z\Kâ N»JN√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ÿYò[òŸK\›YŸI KòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà»Yà
›YŸR[ô^
H›YŸR[ô^
œHN»ﬁ[ò‘›YŸJ
N»⁄›’ÿ\›
›YŸR[ô^OOH»	’ôpÎX›[»X\òÿY»€€[»õ€ù»H€Y[ùHõ›YöXÿYÀâ»à	—]\H]X[^òYHH€Y[ùHõ›YöXÿYÀâ N»JN√Bò€€ú›òX⁄‘›YŸPù]€àHÿ›[Y[ùò‹ôX]Q[[Y[ù
	ÿù]€â N√BòòX⁄‘›YŸPù]€ãò€\‹”ò[YHH	€›][ôKXù]€âŒ√BòòX⁄‘›YŸPù]€ãù^€€ù[ùH	¯°§õ€\à]\IŒ√BòòX⁄‘›YŸPù]€ãù]HH	‘ô]‹õò\à»ôpÎX›[»\òHH]\H[ù\ö[‹ãâŒ√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ÿYò[òŸK\›YŸI Kú\ô[ù[[Y[ùö[úŸ\ùôYõ‹ôJòX⁄‘›YŸPù]€ãÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ÿY\›… JN√BòòX⁄‘›YŸPù]€ãòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà»Yà
›YŸR[ô^à
H›YŸR[ô^OHN»ﬁ[ò‘›YŸJ
N»⁄›’ÿ\›
	’ôpÎX›[»ô]‹õõ›H\òHH]\H[ù\ö[‹ãâ N»JN√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ÿ€‹K[[ö… Kù]HH	–€‹X\à»[ö»^€\⁄]õ»\›H‹ô[H\òH[ùöX\à[»€Y[ùKâŒ√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ÿY\›… Kù]HH	–YX⁄[€ò\àõ›‹»»[ù\À\ò[ùH›H\⁄\»»Ÿ\ùöpÈ€ÀâŒ√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ÿYò[òŸK\›YŸI Kù]HH	–€€ò€Z\àH]\H]X[H]ö\ÿ\à»€Y[ùH€ÿúôHH]Y[∞ÈÿKâŒ√Bôÿ›[Y[ùú]Y\ûTŸ[X›‹ê[
	Àô[\ﬁYYKXX›[€éõõ›
Ÿ]K\Ÿ\ùöXŸKZ[ô^JI Kôõ‹ëXX⁄

ù]€äHOàù]€ãòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà⁄›’ÿ\›
	ÿù]€ãô]\Ÿ]òX›[€üNàpÈË€»ôY⁄\›òYHõ»⁄\›[XKò
JJN√Bôù[ò›[€à‹[ë\⁄õÿ\ô‹ô\ä[ô^
H√BàYà
\Ÿ\ùöXŸ\÷⁄[ô^H\Ÿ\ùöXŸT›]\÷⁄[ô^JHô]\õé√BàX›]ôTŸ\ùöXŸR[ô^H[ô^√Bà›YŸR[ô^HŸ\ùöXŸT›]\÷⁄[ô^Kú›YŸN√Bàﬁ[ò‘›YŸJ
N√Bà‹[ì[Ÿ[
	Ÿ]Z[[[Ÿ[	 N√BüCBôù[ò›[€àô[ô\ë\⁄õÿ\ô‹ôÿ[ö^ò][€ä
H√Bà€€ú›\⁄õÿ\ôHÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»Ÿ\⁄õÿ\ô\ŸX›[€â N√BàYà
Y\⁄õÿ\ô
Hô]\õé√Bà]€‹ö‹‹XŸHH\⁄õÿ\ôú]Y\ûTŸ[X›‹ä	»Ÿ\⁄õÿ\ô[‹ôÿ[ö^ò][€â N√BàYà
]€‹ö‹‹XŸJH√Bà€‹ö‹‹XŸHHÿ›[Y[ùò‹ôX]Q[[Y[ù
	‹ŸX›[€â N√Bà€‹ö‹‹XŸKöYH	Ÿ\⁄õÿ\ô[‹ôÿ[ö^ò][€âŒ√Bà€‹ö‹‹XŸKò€\‹”ò[YHH	Ÿ\⁄õÿ\ô[‹ôÿ[ö^ò][€âŒ√Bà\⁄õÿ\ôò\[ô⁄[
€‹ö‹‹XŸJN√BàCBà€€ú›€›[ù»HŸ]Ÿ\ùöXŸP€›[ù 
N√Bà€€ú›\⁄‹»H◊N√BàŸ\ùöXŸT›]\Àôõ‹ëXX⁄

›]K[ô^
HOà√Bà€€ú›][HHŸ\ùöXŸ\÷⁄[ô^N√BàYà
Z][H›]Kú›]\»OOH	Ÿ[]ô\ôY	 Hô]\õé√BàYà
›]Kú›]\»OOH	›ÿZ][ô… H\⁄‹Àú\⁄
»[ô^€ôNà	›ÿZ][ô…À]Nà	–\õ›òIòÿŸY[…ò][N€»[ô[ùIÀ]Z[à	⁄][Kò€Y[ùH0≠»	⁄][KùôZX€Kú‹]
	»0‡∞≠»	 VÃ_XJN√BàYà
›]Kú›]\»OOH	‹ôXYI H\⁄‹Àú\⁄
»[ô^€ôNà	‹ôXYIÀ]Nà	–€€ôö\õX\àô]\òYIÀ]Z[à	⁄][Kò€Y[ùH0≠»	⁄][KùôZX€Kú‹]
	»0‡∞≠»	 VÃ_XJN√BàYà
\Ÿ\ùöXŸQ\›[X]\÷⁄[ô^H\Ÿ\ùöXŸQ\›[X]\÷⁄[ô^Kô]JH\⁄‹Àú\⁄
»[ô^€ôNà	‹ôXŸZ]ôY	À]Nà	—Yö[ö\àô]ö\…ò][N€»H[ùôYÿIÀ]Z[à	⁄][Kò€Y[ùH0≠»	⁄][KúŸ\ùöXŸ_XJN√BàJN√Bà€€ú›\⁄”X\ö›\H\⁄‹Àú€XŸJ
KõX\

\⁄ HOà]à€\‹œHô\⁄õÿ\ô]\⁄»èè‹[à€\‹œHô\⁄õÿ\ô]\⁄À\›]\»	›\⁄Àù€ô_Hèè‹‹[èè]à€\‹œHô\⁄õÿ\ô]\⁄ÀX€‹Hèèèâ›\⁄Àù]_Oÿèè€X[â›\⁄Àô]Z[O‹€X[èŸ]èèù]€à€\‹œHô\⁄õÿ\ô]\⁄ÀXX›[€àà]KY\⁄õÿ\ô[‹ô\èHâ›\⁄Àö[ô^HèêXúö\à‹ô[Oÿù]€èèŸ]èò
Köõ⁄[ä	… H	œ€\‹œHô\⁄õÿ\ôY[\Hèìô[ö[XH[ô	ôX⁄\òŒ€ò⁄XH‹\òX⁄[€ò[Y€‹òKè‹âŒ√Bà€€ú›YŸ[ôSX\ö›\HŸ\ùöXŸ\Àú€XŸJ
KõX\

][K[ô^
HOàù]€à€\‹œHô\⁄õÿ\ôXYŸ[ôKZ][Hà]KY\⁄õÿ\ô[‹ô\èHâ⁄[ô^Hèè‹[à€\‹œHô\⁄õÿ\ôXYŸ[ôK][YHèâ⁄][Kù[YKúô\XŸJ	—[ùòYH	À	… _O‹‹[èè‹[à€\‹œHô\⁄õÿ\ôXYŸ[ôKX€‹Hèèèâ⁄][Kò€Y[ùOÿèè€X[â⁄][KùôZX€Kú‹]
	»0‡∞≠»	 VÃ_H0≠»	ŸŸ]Ÿ\ùöXŸTô\Ÿ[ù][€ä[ô^
KõXô[O‹€X[è‹‹[èè‹[à€\‹œHô\⁄õÿ\ôX\úõ›»èêXúö\è‹‹[èèÿù]€èò
Köõ⁄[ä	… H	œ€\‹œHô\⁄õÿ\ôY[\Hèìô[ö[H][ô[Y[ù»ÿY\›òYÀè‹âŒ√Bà€‹ö‹‹XŸKö[õô\íSH]à€\‹œHô\⁄õÿ\ô]€‹öÀY‹öYèè\ùX€H€\‹œHô\⁄õÿ\ô\[ô[èè]à€\‹œHô\⁄õÿ\ô\[ô[ZXY[ô»èè]èè€\‹œHô^YXúõ›»èì‘ë–SíVêIêÿŸY[…ê][N”œ‹èèî[ô	ôX⁄\òŒ€ò⁄X\»H⁄ôO⁄èèŸ]èè‹[à€\‹œHô\⁄õÿ\ôX€›[ùèâ›\⁄‹Àõ[ô›O‹‹[èèŸ]èè€\‹œHõ]]YèîâõÿX›]Nﬁ[X\»IòÿŸY[…õ›[NŸ\»\òHH\]Z\Hâò][N€»\ô\àô[ö[Hô]‹õõÀè‹è]à€\‹œHô\⁄õÿ\ô]\⁄À[\›èâ›\⁄”X\ö›\OŸ]èèÿ\ùX€Oè\ùX€H€\‹œHô\⁄õÿ\ô\[ô[èè]à€\‹œHô\⁄õÿ\ô\[ô[ZXY[ô»èè]èè€\‹œHô^YXúõ›»èïíT…ê][N”»âêXX›]N‘QO‹èèì‹ô[ú»[HX€€\[ö[Y[ùœ⁄èèŸ]èè‹[à€\‹œHô\⁄õÿ\ôX€›[ùèâÿ€›[ùÀù›[O‹‹[èèŸ]èè€\‹œHõ]]YèêXŸ\‹ŸH[XH‹ô[H\ô][Y[ùHŸ[Hõÿ›\ò\àòH\›YŸ[Kè‹è]à€\‹œHô\⁄õÿ\ôXYŸ[ôK[\›èâÿYŸ[ôSX\ö›\OŸ]èèÿ\ùX€OèŸ]èè\ùX€H€\‹œHô\⁄õÿ\ô\[ô[\⁄õÿ\ô\⁄‹ù›]À\[ô[èè]à€\‹œHô\⁄õÿ\ô\[ô[ZXY[ô»èè]èè€\‹œHô^YXúõ›»èîì’SêHH‘TêIêÿŸY[…ê][N”œ‹èèê][‹»H‹ôÿ[ö^òIòÿŸY[…ò][N€œ⁄èèŸ]èèŸ]èè]à€\‹œHô\⁄õÿ\ô\⁄‹ù›]»èèù]€à€\‹œHô\⁄õÿ\ô\⁄‹ù›]à]KY\⁄õÿ\ô[[Ÿ[HúŸ\ùöXŸK[[Ÿ[èè‹[èåO‹‹[èèèîôY⁄\›ò\à][ô[Y[ùœÿèè€X[êXúòH[XHõ›òH‹ô[HH]öXùXH[Hô\‹€ú…òXX›]N›ô[è‹€X[èÿù]€èèù]€à€\‹œHô\⁄õÿ\ô\⁄‹ù›]à]KY\⁄õÿ\ô[[Ÿ[Hõô]ÀX€Y[ù[[Ÿ[èè‹[èåè‹‹[èèèêÿY\›ò\à€Y[ùOÿèè€X[êYX⁄[€ôH€Y[ùHHôIöXX›]Nÿ›[»\òHHâõÿX›]Nﬁ[XH[ùòYKè‹€X[èÿù]€èèù]€à€\‹œHô\⁄õÿ\ô\⁄‹ù›]à]KY\⁄õÿ\ô\ŸX›[€èHòYŸ[ôHèè‹[èåœ‹‹[èèèïô\àYŸ[ôOÿèè€X[ê€€ôö\òH[ùòY\»Hô]\òY\»ô]ö\›\Àè‹€X[èÿù]€èèù]€à€\‹œHô\⁄õÿ\ô\⁄‹ù›]à]KY\⁄õÿ\ô\õ€OHô[\ﬁYYHèè‹[èå‹‹[èèèêXúö\àZ[ô[H\]Z\Oÿèè€X[ïôZòH\ôYò\»HôXŸ\	òÿŸY[…ò][N€»HôY⁄\›ôH[XH[ùôYÿKè‹€X[èÿù]€èèŸ]èèÿ\ùX€Oè‹ŸX›[€èò√Bà€‹ö‹‹XŸKú]Y\ûTŸ[X›‹ê[
	÷Ÿ]KY\⁄õÿ\ô[‹ô\óI Kôõ‹ëXX⁄

ù]€äHOàù]€ãòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà‹[ë\⁄õÿ\ô‹ô\äù[Xô\äù]€ãô]\Ÿ]ô\⁄õÿ\ô‹ô\äJJJN√Bà€‹ö‹‹XŸKú]Y\ûTŸ[X›‹ê[
	÷Ÿ]KY\⁄õÿ\ô[[Ÿ[I Kôõ‹ëXX⁄

ù]€äHOàù]€ãòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà‹[ì[Ÿ[
ù]€ãô]\Ÿ]ô\⁄õÿ\ô[Ÿ[
JJN√Bà€‹ö‹‹XŸKú]Y\ûTŸ[X›‹ê[
	÷Ÿ]KY\⁄õÿ\ô\ŸX›[€óI Kôõ‹ëXX⁄

ù]€äHOàù]€ãòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà⁄›‘ŸX›[€äù]€ãô]\Ÿ]ô\⁄õÿ\ôŸX›[€äJJN√Bà€‹ö‹‹XŸKú]Y\ûTŸ[X›‹ê[
	÷Ÿ]KY\⁄õÿ\ô\õ€WI Kôõ‹ëXX⁄

ù]€äHOàù]€ãòY]ô[ù\›[ô\ä	ÿ€X⁄…À

HOà⁄›‘õ€Tÿ‹ôY[äù]€ãô]\Ÿ]ô\⁄õÿ\ôõ€JJJN√BüCBúﬁ[ò‘›YŸJ
N√Bôù[ò›[€à⁄›’ÿ\›
Y\‹ÿYŸJH»€€ú›ÿ\›Hÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»›ÿ\›	 N»ÿ\›ù^€€ù[ùHY\‹ÿYŸN»ÿ\›ò€\‹”\›úô[[›ôJ	⁄Y[â N»ÿ\›ò€\‹”\›òY
	‹⁄›… N»Ÿ][Y[›]


HOàÿ\›ò€\‹”\›òY
	⁄Y[â KÃå
N»CBôÿ›[Y[ùú]Y\ûTŸ[X›‹ê[
	Àõ[Ÿ[XòX⁄Ÿõ‹	 Kôõ‹ëXX⁄

òX⁄Ÿõ‹
HOàòX⁄Ÿõ‹òY]ô[ù\›[ô\ä	ÿ€X⁄…À
]ô[ù
HOà»Yà
]ô[ùù\ôŸ]OOHòX⁄Ÿõ‹
HòX⁄Ÿõ‹ò€\‹”\›òY
	⁄Y[â N»JJN¬ôÿ›[Y[ùòY]ô[ù\›[ô\ä	€]ôKY]K\ôXYIÀ
]ô[ù
HOà¬à€€ú›»Ÿ\ùöXŸ\Œà]ôTŸ\ùöXŸ\À€Y[ùŒà]ôP€Y[ùÀ›]\»HH]ô[ùô]Z[¬àŸ\ùöXŸ\Àú‹XŸJŸ\ùöXŸ\Àõ[ô›ããõ]ôTŸ\ùöXŸ\ N¬à€Y[ùÀú‹XŸJ€Y[ùÀõ[ô›ããõ]ôP€Y[ù N¬àŸ\ùöXŸT›]\Àú‹XŸJŸ\ùöXŸT›]\Àõ[ô›ããú›]\ N¬àŸ\ùöXŸQ\›[X]\Àú‹XŸJŸ\ùöXŸQ\›[X]\Àõ[ô›ããõ]ôTŸ\ùöXŸ\ÀõX\


HOà
»]Nà	…À[YNà	…»JJJN¬àŸ\ùöXŸSZ[\›€ô\Àú‹XŸJŸ\ùöXŸSZ[\›€ô\Àõ[ô›ããõ]ôTŸ\ùöXŸ\ÀõX\


HOà
»ôXŸZ]ôYà	…À]ò[X]Yà	…»JJJN¬àŸ\ùöXŸT›‹Àú‹XŸJŸ\ùöXŸT›‹Àõ[ô›ããõ]ôTŸ\ùöXŸ\ÀõX\


HOà◊JJN¬àôYúô\⁄Ÿ\ùöXŸS\›

N¬àôYúô\⁄€ÿò[€›[ù 
N¬àYà
ÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ÿ€Y[ùÀ\ŸX›[€éõõ›
öY[äI JHô[ô\ê€Y[ù 
N¬à€€ú›Ÿ[ô\öX–X›[€àHÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ŸŸ[ô\öXÀXX›[€â N¬àYà
ÿ›[Y[ùú]Y\ûTŸ[X›‹ä	»ŸŸ[ô\öXÀ\ŸX›[€éõõ›
öY[äI H	âà…Ÿò]\ò[Y[ù…À	‹ô[]‹ö[‹…◊Kö[ò€Y\ Ÿ[ô\öX–X›[€èÀô]\Ÿ]õ[Ÿ[JJHô[ô\ì[Ÿ[JŸ[ô\öX–X›[€ãô]\Ÿ]õ[Ÿ[JN¬àYà
€ÿò[\Àó◊ÿX›]ôTõ€HOOH	Ÿ[\ﬁYYI H⁄›‘õ€Tÿ‹ôY[ä	Ÿ[\ﬁYYI N¬üJN¬