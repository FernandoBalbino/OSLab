(function createDigitalLifeTrail(global) {
  'use strict';
  const O = global.OSLab;
  const rows = [
    ['Primeiro Gmail', 'google', 'Pesquise Criar Gmail, escolha Para uso pessoal e crie sua conta fictícia. Leia a mensagem inicial.', ['search', 'registered', 'message-read']],
    ['Seu endereço Outlook', 'outlook', 'Pesquise Outlook, crie seu endereço e sua senha e abra a caixa de entrada.', ['search', 'registered', 'inbox-view']],
    ['Yahoo Mail', 'yahoo', 'Crie sua terceira conta. Faça a confirmação fictícia e abra a caixa de entrada.', ['registered', 'inbox-view']],
    ['Uma conta Netflix', 'netflix', 'Abra uma nova aba, pesquise Netflix e escolha o primeiro resultado. Confirme o código recebido no Gmail, escolha sua senha, um plano, o cartão de demonstração e entre no perfil.', ['new-tab', 'search', 'first-result', 'email-verified', 'registered', 'plan', 'payment', 'profile']],
    ['Sua música no Spotify', 'spotify', 'Cadastre seu Gmail com uma senha própria do Spotify. Escolha uma música e adicione aos favoritos.', ['registered', 'song-open', 'favorite']],
    ['Comunidade no Discord', 'discord', 'Cadastre-se com seu Gmail. Personalize seu nome de exibição e entre na Comunidade OSLab.', ['registered', 'display-name', 'community']],
    ['Seu perfil no YouTube', 'youtube', 'Entre com a mesma conta Google do Gmail. Abra seu perfil pelo botão no canto superior.', ['profile-view']],
    ['Organize o Google Drive', 'drive', 'Use a mesma conta Google e crie a pasta Meus Documentos.', ['folder']],
    ['Retorno ao Outlook', 'outlook', 'Saia da conta se necessário. Pesquise Outlook Entrar, autentique-se com sua conta e leia a mensagem inicial.', ['search', 'login', 'message-read']],
    ['Retorno ao Yahoo', 'yahoo', 'Saia da conta se necessário. Digite o endereço e depois a senha para abrir a caixa correta.', ['login', 'inbox-view']],
    ['Retorno à Netflix', 'netflix', 'Saia da conta, entre com sua senha Netflix e selecione o perfil que você criou.', ['login', 'profile']],
    ['Retorno ao Spotify', 'spotify', 'Saia, entre com sua senha Spotify e abra a música que você favoritou. Complete sua primeira vida digital!', ['login', 'open-favorite']],
  ];
  const labels = { search: 'Pesquisar o serviço', registered: 'Criar a conta', 'message-read': 'Ler a mensagem inicial', 'inbox-view': 'Abrir a caixa de entrada', 'new-tab': 'Abrir uma nova aba', 'first-result': 'Acessar o primeiro resultado', 'email-verified': 'Verificar o e-mail pelo Gmail', plan: 'Escolher um plano fictício', payment: 'Adicionar o cartão de demonstração', profile: 'Entrar no perfil', 'song-open': 'Abrir uma música demonstrativa', favorite: 'Favoritar uma música', 'display-name': 'Personalizar o nome', community: 'Entrar na Comunidade OSLab', 'profile-view': 'Visualizar o perfil Google', folder: 'Criar Meus Documentos', login: 'Fazer um novo login', 'open-favorite': 'Abrir o favorito preservado' };
  const catalog = rows.map(([title, service, instruction, actions], index) => ({ id: 'digital-' + (index + 1), order: index + 1, title, service, instruction, description: instruction, icon: 'assets/learning/icons/' + (index > 7 ? 'arrow_reset' : 'globe_search') + '.svg', objectives: actions.map(id => ({ id, label: labels[id] })) }));
  const listeners = new Set();
  let progress = O.digitalLife.progress();
  function publish() { O.digitalLife.progress(progress); listeners.forEach(fn => fn()); }
  function getMissions() { return catalog.map((m, i) => ({ ...m, status: progress.completed[m.id] ? 'completed' : progress.active?.id === m.id ? 'active' : !i || progress.completed[catalog[i - 1].id] ? 'available' : 'locked' })); }
  function isPracticing(order) { return progress.active?.id === 'digital-' + order && !progress.active.suspended && progress.active.phase !== 'completed'; }
  function start(id) {
    const mission = getMissions().find(m => m.id === id);
    if (!mission || mission.status === 'locked' || mission.status === 'completed') return { ok: false };
    O.activityCoordinator.claim('digital-life');
    if (progress.active?.id !== id) progress.active = { id, checklist: {}, baseline: O.digitalLife.serial(), startedAt: Date.now(), phase: 'practice', suspended: false, hint: false };
    progress.active.suspended = false;
    const created = O.digitalLife.account(mission.service);
    if (created && progress.active.startedAt && created.createdAt >= progress.active.startedAt && mission.objectives.some(o => o.id === "registered")) progress.active.checklist.registered = true;
    publish();
    O.shell?.openApp?.('google');
    return { ok: true };
  }
  function stop() { if (progress.active) { progress.active.suspended = true; publish(); } O.activityCoordinator.release('digital-life'); }
  function next() { const current = catalog.find(m => m.id === progress.active?.id); if (current && progress.completed[current.id] && current.order < 12) return start('digital-' + (current.order + 1)); O.shell?.openApp?.('digitallife'); }
  function accept(action, service, detail = {}) {
    const active = progress.active, mission = catalog.find(m => m.id === active?.id);
    if (!mission || active.suspended || active.phase === 'completed') return;
    const ownService = O.digitalLife.identity(mission.service);
    if (service && O.digitalLife.identity(service) !== ownService) return;
    if (mission.order >= 9 && action !== 'search' && action !== 'logout' && action !== 'login' && !active.checklist.login) return;
    if (action === 'login' && detail.serial <= active.baseline) return;
    if (action === 'message-read' && detail.kind !== 'welcome') return;
    if (action === 'folder' && detail.value !== 'Meus Documentos') return;
    if (action === 'first-result' && !active.checklist.search) return;
    if (mission.order === 4 && action === 'search' && !active.checklist['new-tab']) return;
    if (mission.objectives.some(o => o.id === action)) active.checklist[action] = true;
    if (mission.objectives.every(o => active.checklist[o.id]) && O.digitalLife.session(mission.service)) {
      progress.completed[mission.id] = { at: Date.now(), title: mission.title };
      active.phase = 'completed';
    }
    publish();
  }
  O.events.subscribe('digital-life:action', event => accept(event.detail.action, event.detail.service, event.detail));
  O.events.subscribe('browser:action', event => {
    const d = event.detail;
    const mission = catalog.find(m => m.id === progress.active?.id);
    if (!mission) return;
    if (d.action === 'new-tab') accept('new-tab');
    const term = String(d.query || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const alias = mission.service === 'google' ? 'gmail' : mission.service;
    if ((d.action === 'search' || (d.url || '').startsWith('search:')) && term.includes(alias) && (mission.order !== 9 || term.includes('entrar'))) accept('search');
    if (d.action === 'first-result' && (d.url || '').startsWith(mission.service + '.oslab.local')) accept('first-result');
  });
  O.events.subscribe('digital-life:reset', () => { progress = O.digitalLife.progress(); O.activityCoordinator.release('digital-life'); publish(); });
  O.activityCoordinator.register('digital-life', { isActive: () => Boolean(progress.active && !progress.active.suspended), stop });
  O.digitalLifeTrail = { catalog, getMissions, getProgress: () => JSON.parse(JSON.stringify(progress)), start, stop, next, isPracticing, observe: (action, service, detail = {}) => { if (['inbox-view','song-open','open-favorite','profile-view'].includes(action) && O.digitalLife.session(service)) accept(action, service, detail); }, hint: () => { if (progress.active) { progress.active.hint = !progress.active.hint; publish(); } }, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); } };
})(window);
