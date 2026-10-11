(function createDigitalSites(global) {
  'use strict';
  const O = global.OSLab, D = O.digitalLife;
  const safe = value => O.ui.escapeHtml(String(value ?? ''));
  const defs = {
    gmail: { name: 'Google', word: 'Google', tagline: 'Use sua Conta do Google', domain: 'gmail.com', account: 'google' },
    outlook: { name: 'Outlook', word: 'Microsoft', tagline: 'Uma conta. Todas as suas ideias.', domain: 'outlook.com', account: 'outlook' },
    yahoo: { name: 'Yahoo Mail', word: 'yahoo!', tagline: 'A vida organizada em uma caixa de entrada.', domain: 'yahoo.com', account: 'yahoo' },
    netflix: { name: 'Netflix', word: 'NETFLIX', tagline: 'Histórias para descobrir. Um mundo para explorar.', account: 'netflix' },
    spotify: { name: 'Spotify', word: 'Spotify', tagline: 'Música para cada descoberta.', account: 'spotify' },
    discord: { name: 'Discord', word: 'Discord', tagline: 'Seu lugar para conversar e aprender.', account: 'discord' },
    youtube: { name: 'YouTube', word: 'YouTube', tagline: 'Explore. Aprenda. Descubra.', account: 'google' },
    drive: { name: 'Google Drive', word: 'Drive', tagline: 'Tudo o que você precisa, organizado.', account: 'google' },
  };
  const records = new Set(), transient = new WeakMap(), volatileForms = new WeakMap();
  function resolve(value) {
    try {
      const url = new URL('https://' + String(value || '').replace(/^https?:\/\//, ''));
      const service = url.hostname.replace('.oslab.local', '');
      if (url.hostname !== service + '.oslab.local' || !defs[service]) return null;
      return { service, path: url.pathname.replace(/^\//, '') || 'home', params: url.searchParams, url: url.hostname + (url.pathname === '/' ? '' : url.pathname) + url.search };
    } catch (_) { return null; }
  }
  function url(service, path = '') { return service + '.oslab.local' + (path ? '/' + path : ''); }
  const go = (service, path, label, cls = '') => '<button type="button" class="' + cls + '" data-browser-go="' + safe(url(service, path)) + '">' + label + '</button>';
  const button = (action, label, value = '', cls = '') => '<button type="button" class="' + cls + '" data-digital-action="' + action + '" data-value="' + safe(value) + '">' + label + '</button>';
  const primary = label => '<button type="submit" class="dl-primary">' + label + '</button>';
  function brand(service) {
    if (service === 'gmail') return '<span class="dl-google-word" aria-label="Google"><i>G</i><i>o</i><i>o</i><i>g</i><i>l</i><i>e</i></span>';
    if (service === 'outlook') return '<span class="dl-ms-grid" aria-hidden="true"></span> Microsoft';
    if (service === 'youtube') return '<span class="dl-youtube-logo"><img src="assets/digital/youtube/mark.svg" alt=""><img src="assets/digital/youtube/wordmark.svg" alt="YouTube"></span>';
    if (service === 'drive') return '<span class="dl-drive-mark">▲</span> Drive';
    if (service === 'spotify') return '<span class="dl-spotify-mark">≋</span> Spotify';
    if (service === 'discord') return '<span aria-hidden="true">◕‿◕</span> Discord';
    return safe(defs[service].word);
  }
  function key(record, service) { return record.appId + ':' + O.browserState.active(record.browserState).id + ':' + service; }
  function draft(record, service) { return D.getDraft(key(record, service)); }
  function field(name, label, value = '', type = 'text', extra = '') {
    return '<label class="dl-field"><span>' + label + '</span><input name="' + name + '" type="' + type + '" value="' + (type === 'password' ? '' : safe(value)) + '" autocomplete="off" ' + extra + '></label>';
  }
  function form(kind, body, submit, extra = '') { return '<form data-digital-form="' + kind + '" novalidate>' + body + '<p class="dl-error" role="alert" tabindex="-1"></p><div class="dl-form-actions">' + extra + primary(submit) + '</div></form>'; }
  function auth(record, route) {
    const { service, path } = route, def = defs[service], values = draft(record, service);
    const sharedGoogle = ['youtube','drive'].includes(service);
    if (sharedGoogle && path.startsWith('signup')) return '<div class="dl-empty"><h1>Use sua Conta do Google</h1><p>Entre com a conta criada no Gmail.</p>' + go(service,'login','Fazer login') + go('gmail','login','Criar Conta do Google') + '</div>';
    let title = 'Faça login', subtitle = sharedGoogle ? 'Use sua Conta do Google' : def.tagline, body = '', mode = 'login';
    const password = field('password', 'Senha de treinamento', '', 'password', 'required minlength="8" maxlength="128"') + field('confirmation', 'Confirmar senha', '', 'password', 'required');
    const show = '<label class="dl-check"><input type="checkbox" data-digital-show-password> Mostrar senha</label>';
    const next = 'Avançar';
    if (path === 'login' || path === 'login/password') {
      if (path === 'login/password') {
        subtitle = values.email || 'Informe primeiro seu endereço.';
        body = form('login-password', field('password', 'Senha de treinamento', '', 'password', 'required') + show, 'Entrar', go(service, 'login', 'Usar outra conta'));
      } else {
        title = service === 'netflix' ? 'Entrar' : service === 'yahoo' ? 'Entrar no Yahoo Mail' : service === 'spotify' ? 'Entrar no Spotify' : title;
        body = form('login-email', field('email', 'E-mail', values.email, 'email', 'required'), next, service === 'gmail' ? button('create-menu', 'Criar conta') : sharedGoogle ? go('gmail','login','Criar Conta do Google') : go(service, 'signup', 'Criar conta'));
        if (transient.get(record)?.createMenu) body += '<div class="dl-create-menu">' + go(service, 'signup/name', 'Para uso pessoal') + button('notice', 'Para uma criança', 'Neste exercício, escolha Para uso pessoal.') + button('notice', 'Para trabalho ou empresa', 'Neste exercício, escolha Para uso pessoal.') + '</div>';
      }
    } else if (path === 'signup' || path === 'signup/email') {
      mode = 'signup'; title = service === 'netflix' ? 'Vamos começar' : 'Crie sua conta';
      subtitle = def.domain ? 'Escolha seu novo endereço de e-mail.' : 'Use o Gmail que você criou no OSLab.';
      body = form('signup-email', field('email', def.domain ? 'Nome de usuário' : 'Seu Gmail', values.email, 'text', 'required') + (def.domain ? '<p class="dl-note">Endereço terminado em @' + def.domain + '</p>' : ''), service === 'netflix' ? 'Verificar meu e-mail' : next, go(service, 'login', 'Já tenho uma conta'));
    } else if (path === 'signup/name') {
      mode = 'signup'; title = 'Crie uma Conta do Google'; subtitle = 'Insira seu nome fictício';
      body = form('signup-name', field('name', 'Nome', values.name, 'text', 'required maxlength="60"') + field('surname', 'Sobrenome (opcional)', values.surname, 'text', 'maxlength="60"'), next);
    } else if (path === 'signup/basic') {
      mode = 'signup'; title = 'Informações básicas'; subtitle = 'Use informações fictícias nesta atividade.';
      const names = service !== 'gmail' ? field('name', 'Nome fictício', values.name, 'text', 'required maxlength="60"') + field('surname', 'Sobrenome (opcional)', values.surname) : '';
      const month = '<label class="dl-field"><span>Mês</span><select name="month" required><option value="">Mês</option>' + ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => '<option value="' + (i + 1) + '" ' + (Number(values.month) === i + 1 ? 'selected' : '') + '>' + m + '</option>').join('') + '</select></label>';
      body = form('signup-basic', names + '<div class="dl-date">' + field('day', 'Dia', values.day, 'number', 'min="1" max="31" required') + month + field('year', 'Ano', values.year, 'number', 'min="1900" max="2100" required') + '</div>' + '<label class="dl-field"><span>Gênero (opcional)</span><select name="gender">' + ['Prefiro não informar','Feminino','Masculino','Outro'].map(g => '<option ' + (values.gender === g ? 'selected' : '') + '>' + g + '</option>').join('') + '</select></label>' + (service === 'outlook' ? field('region', 'País ou região', values.region || 'Brasil') : ''), next);
    } else if (path === 'signup/phone') {
      mode = 'signup'; title = 'Confirme que é você'; subtitle = 'Confirmação fictícia de treinamento. Não é necessário um celular.';
      body = form('signup-phone', '<label class="dl-check"><input name="phoneConfirmed" type="checkbox" required> Confirmo minha conta de treinamento</label>', 'Confirmar');
    } else if (path === 'signup/verify') {
      mode = 'signup'; title = 'Verifique seu e-mail'; subtitle = 'Enviamos um código para ' + (values.email || 'seu Gmail') + '.';
      body = form('verify', '<p>Abra o Gmail em outra aba, leia a mensagem da Netflix e copie os seis dígitos. Depois volte a esta aba.</p>' + '<button type="button" data-browser-open-tab="gmail.oslab.local/inbox">Abrir Gmail em outra aba</button>' + field('code', 'Código de verificação', '', 'text', 'inputmode="numeric" maxlength="6" required'), 'Confirmar código');
    } else if (path === 'signup/password') {
      mode = 'signup'; title = 'Crie uma senha forte'; subtitle = service === 'gmail' ? 'Combine letras e números. Use uma senha somente para este treinamento.' : 'Crie uma senha própria para ' + def.name + '.';
      body = form('register', password + show, 'Criar conta', go(service, service === 'gmail' ? 'signup/email' : 'signup/basic', 'Voltar'));
    } else return null;
    return '<div class="dl-auth-stage dl-auth-' + (sharedGoogle ? 'gmail' : service) + '"><div class="dl-auth-card"><div class="dl-auth-heading"><div class="dl-brand">' + brand(sharedGoogle ? 'gmail' : service) + '</div><h1>' + title + '</h1><p>' + safe(subtitle) + '</p></div><div class="dl-auth-body">' + body + '</div></div><footer class="dl-auth-footer"><span>Português (Brasil)</span><span>Use apenas dados fictícios · ' + (mode === 'signup' ? 'Cadastro de treinamento' : 'Acesso local') + '</span></footer></div>';
  }
  function mailbox(record, route) {
    const { service, path } = route, account = D.session(service), messages = D.inbox(service);
    const selected = path.startsWith('message/') ? messages.find(m => m.id === path.slice(8)) : null;
    const q = route.params.get('q') || '';
    const filtered = messages.filter(m => (m.subject + m.from).toLowerCase().includes(q.toLowerCase()));
    const logo = service === 'gmail' ? '<img class="dl-gmail-logo" src="assets/digital/gmail/imgLogo.png" alt="Gmail">' : '<span class="dl-brand">' + (service === 'outlook' ? 'Outlook' : 'yahoo! mail') + '</span>';
    const search = form('mail-search', '<input name="search" aria-label="Pesquisar mensagens" placeholder="Pesquisar e-mail" value="' + safe(q) + '">', '⌕');
    const rows = filtered.map(m => '<button type="button" class="dl-mail-row ' + (!m.read ? 'is-unread' : '') + '" data-digital-action="message" data-value="' + m.id + '"><span class="dl-mail-star" aria-hidden="true">☆</span><strong>' + safe(m.from) + '</strong><span>' + safe(m.subject) + '</span><small>' + (m.read ? 'Lida' : 'Nova') + '</small></button>').join('');
    const content = selected ? '<article class="dl-message">' + go(service, 'inbox', '← Voltar à caixa de entrada') + '<h1>' + safe(selected.subject) + '</h1><p><strong>' + safe(selected.from) + '</strong><br><small>para ' + safe(selected.to) + '</small></p><div class="dl-message-body ' + (selected.kind === 'verification' ? 'dl-code' : '') + '">' + safe(selected.body) + '</div>' + (selected.kind === 'verification' ? button('copy-code', 'Copiar código', selected.id) + '<span class="dl-copy-status" role="status"></span>' : '') + '</article>' : '<div class="dl-inbox"><div class="dl-mail-tools"><strong>Caixa de entrada</strong><span>' + messages.length + ' mensagens</span>' + button('refresh-mail', '↻ Atualizar') + '</div><div class="dl-mail-tab">Principal</div>' + (rows || '<p>Nenhuma mensagem encontrada.</p>') + '</div>';
    return '<div class="dl-mail dl-mail-' + service + '"><header><span class="dl-mail-menu" aria-hidden="true">☰</span>' + logo + search + button('logout', 'Sair') + '</header><div class="dl-mail-layout"><aside>' + button('notice', '✎ Escrever', 'Nesta trilha, pratique a leitura das mensagens recebidas.', 'dl-compose') + go(service, 'inbox', '▣ Caixa de entrada (' + messages.filter(m => !m.read).length + ')', 'is-selected') + '<small>' + safe(account.email) + '</small><p>Seu e-mail de treinamento</p></aside><main>' + content + '</main></div></div>';
  }
  function mediaCard(service, item) {
    return '<button type="button" class="dl-media-card" data-browser-go="' + url(service, 'watch?id=' + item.id) + '"><span class="dl-thumbnail"><img src="' + item.image + '" alt="' + safe(item.title) + '" loading="lazy"><small>' + (service === 'netflix' ? item.category : Math.floor(item.duration / 60) + ':' + String(item.duration % 60).padStart(2, '0')) + '</small></span><strong>' + safe(item.title) + '</strong><span>' + safe(item.channel || item.artist || 'OSLAB ORIGINAL') + '</span></button>';
  }
  function mediaSearch(route, placeholder) {
    return '<form class="dl-media-search" data-digital-form="media-search"><input name="search" value="' + safe(route.params.get('q') || '') + '" placeholder="' + placeholder + '" aria-label="' + placeholder + '"><button type="submit" aria-label="Pesquisar">⌕</button></form>';
  }
  function player(record, route, item) {
    if (!item) return '<div class="dl-empty"><h1>Título não encontrado</h1>' + go(route.service, 'home', 'Voltar ao início') + '</div>';
    const cache = transient.get(record) || {}, state = cache.player?.id === item.id ? cache.player : { id: item.id, playing: false, elapsed: 0 };
    cache.player = state; transient.set(record, cache);
    return '<section class="dl-watch"><div class="dl-player" data-player-id="' + item.id + '" data-duration="' + item.duration + '"><img src="' + item.image + '" alt="' + safe(item.title) + '"><div class="dl-player-caption"><span>PLAYER SIMULADO</span><strong>' + safe(item.title) + '</strong><p>Use os controles para praticar.</p></div><div class="dl-player-controls">' + button('play', state.playing ? '❚❚ Pausar' : '▶ Reproduzir') + '<progress value="' + state.elapsed + '" max="' + item.duration + '" aria-label="Progresso da reprodução"></progress><output>' + Math.floor(state.elapsed) + ' / ' + item.duration + ' s</output>' + button('restart-player', '↺ Reiniciar') + '</div></div><h1>' + safe(item.title) + '</h1><div class="dl-watch-meta"><strong>' + safe(item.channel || item.artist || 'OSLab · ' + item.category) + '</strong><span>Conteúdo demonstrativo</span></div><p class="dl-description">' + safe(item.description) + '</p></section>';
  }
  function netflix(record, route) {
    const account = D.session('netflix'), path = route.path;
    const header = '<header class="dl-netflix-header"><span class="dl-brand">NETFLIX</span>' + (account ? go('netflix', 'home', 'Início') + go('netflix', 'profiles', 'Perfis') + mediaSearch(route, 'Títulos e categorias') + button('logout', 'Sair') : go('netflix', 'login', 'Entrar', 'dl-primary')) + '</header>';
    if (!account) return header + '<div class="dl-netflix-landing" style="--hero:url(../assets/digital/photos/940381.jpg)"><span class="dl-kicker">HISTÓRIAS QUE NOS CONECTAM</span><h1>Descubra seu próximo<br>grande momento.</h1><p>Filmes, séries e novas aventuras em um catálogo de treinamento.</p>' + go('netflix', 'signup/email', 'Vamos lá ›', 'dl-primary') + '<small>Planos fictícios. Nenhuma cobrança.</small></div>';
    const data = account.data;
    if (!data.plan || path === 'plans') return header + '<main class="dl-netflix-setup"><small>PASSO 1 DE 3</small><h1>Escolha o melhor plano para você</h1><p>Todos os planos são fictícios e não geram cobrança.</p><div class="dl-plans">' + ['Básico','Padrão','Premium'].map((name, i) => '<button type="button" data-digital-action="plan" data-value="' + name + '"><strong>' + name + '</strong><span>' + ['HD · 1 tela','Full HD · 2 telas','Ultra HD · 4 telas'][i] + '</span><b>R$ ' + [19,29,39][i] + ',90</b><small>Valor demonstrativo</small></button>').join('') + '</div></main>';
    if (!data.payment || path === 'payment') return header + '<main class="dl-netflix-setup"><small>PASSO 2 DE 3</small><h1>Adicione seu cartão de demonstração</h1><p>Plano ' + safe(data.plan) + '. Não digite dados de um cartão real.</p><div class="dl-demo-card"><span>CARTÃO OSLAB</span><strong>•••• •••• •••• 0000</strong><span>ALUNO DEMONSTRAÇÃO</span></div>' + form('payment', field('demoCard', 'Número demonstrativo', '', 'text', 'readonly placeholder="Use o botão abaixo"') + field('demoName', 'Nome impresso', '', 'text', 'readonly') + '<div class="dl-date">' + field('demoExpiry', 'Validade', '', 'text', 'readonly') + field('demoCvc', 'Código demonstrativo', '', 'text', 'readonly') + '</div>' + button('demo-card', 'Usar cartão de demonstração'), 'Confirmar demonstração') + '</main>';
    if (!data.profile || path === 'profiles' || !transient.get(record)?.netflixEntered) return header + '<main class="dl-profiles"><small>PASSO 3 DE 3</small><h1>Quem está assistindo?</h1>' + (data.profile ? '<button class="dl-profile-tile" type="button" data-digital-action="profile" data-value="' + safe(data.profile) + '"><img src="assets/digital/netflix/profile.png" alt=""><span>' + safe(data.profile) + '</span></button>' : form('profile', field('profile', 'Nome do perfil', account.profile.name, 'text', 'maxlength="30" required'), 'Entrar no perfil')) + '</main>';
    const items = O.digitalContent.movies;
    if (path === 'watch') return header + '<main class="dl-netflix-watch">' + player(record, route, items.find(i => i.id === route.params.get('id'))) + '</main>';
    const q = (route.params.get('q') || '').toLowerCase(), cat = route.params.get('category');
    const matches = items.filter(i => (!cat || i.category === cat) && (i.title + ' ' + i.category).toLowerCase().includes(q));
    return header + (!q && !cat ? '<section class="dl-netflix-hero" style="--hero:url(../' + items[0].image + ')"><span class="dl-kicker">N · OSLAB ORIGINAL</span><h1>ALÉM DAS<br>MONTANHAS</h1><p>Uma viagem muda tudo. Descubra caminhos, encontre amigos e vá além do horizonte.</p>' + go('netflix', 'watch?id=movie-1', '▶ Assistir', 'dl-light-button') + '</section>' : '') + '<main class="dl-netflix-catalog"><div class="dl-chips">' + ['Todos','Aventura','Séries','Documentários','Filmes'].map(c => go('netflix', c === 'Todos' ? 'home' : 'home?category=' + encodeURIComponent(c), c, (!cat && c === 'Todos') || cat === c ? 'is-selected' : '')).join('') + '</div><h2>' + safe(q ? 'Resultados para “' + q + '”' : cat || 'Sua próxima descoberta') + '</h2><div class="dl-media-grid">' + (matches.map(i => mediaCard('netflix', i)).join('') || '<p>Nenhum título encontrado. Tente outra pesquisa.</p>') + '</div></main>';
  }
  function youtube(record, route) {
    const account = D.session('youtube'), items = O.digitalContent.videos, q = (route.params.get('q') || '').toLowerCase(), cat = route.params.get('category');
    const profile = route.path === 'profile';
    const header = '<header class="dl-youtube-header">' + go('youtube', 'home', '☰', 'dl-menu') + '<span class="dl-brand">' + brand('youtube') + '</span>' + mediaSearch(route, 'Pesquisar') + (account ? button('youtube-profile', safe(account.profile.name[0].toUpperCase()), '', 'dl-avatar') : go('youtube', 'login', '◎ Fazer login', 'dl-outline')) + '</header>';
    const sidebar = '<aside class="dl-youtube-sidebar">' + go('youtube','home','⌂ Início','is-selected') + go('youtube','home?category=Tecnologia','▤ Tecnologia') + go('youtube','home?category=Natureza','▧ Natureza') + go('youtube','home?category=Aprender','▷ Aprender') + '<hr>' + '<p>Descubra novos assuntos no seu ritmo.</p>' + (account ? '<small>' + safe(account.email) + '</small>' + button('logout','Sair da conta') : go('youtube','login','Fazer login','dl-outline')) + '</aside>';
    if (profile && account) return header + '<main class="dl-youtube-profile"><span class="dl-avatar">' + safe(account.profile.name[0]) + '</span><h1>' + safe(account.profile.name) + '</h1><p>' + safe(account.email) + '</p><p>Sua identidade Google é a mesma do Gmail e do Drive.</p>' + go('youtube','home','Explorar vídeos') + button('logout','Sair') + '</main>';
    if (route.path === 'watch') return header + '<main class="dl-youtube-watch">' + player(record, route, items.find(i => i.id === route.params.get('id'))) + '<aside class="dl-suggestions"><h2>Próximos vídeos</h2>' + items.filter(i => i.id !== route.params.get('id')).slice(0,5).map(i => mediaCard('youtube',i)).join('') + '</aside></main>';
    const matches = items.filter(i => (!cat || i.category === cat) && (i.title + ' ' + i.category).toLowerCase().includes(q));
    return header + '<div class="dl-youtube-layout">' + sidebar + '<main><div class="dl-chips">' + ['Tudo','Tecnologia','Natureza','Aprender'].map(c => go('youtube', c === 'Tudo' ? 'home' : 'home?category=' + encodeURIComponent(c), c, cat === c || (!cat && c === 'Tudo') ? 'is-selected' : '')).join('') + '</div><div class="dl-media-grid">' + (matches.map(i => mediaCard('youtube', i)).join('') || '<p>Nenhum vídeo encontrado.</p>') + '</div></main></div>';
  }
  function spotify(record, route) {
    const account = D.session('spotify');
    if (!account) return '<div class="dl-spotify-welcome"><span class="dl-brand">' + brand('spotify') + '</span><h1>A trilha sonora<br>das suas descobertas.</h1><p>Crie sua conta de treinamento e monte sua biblioteca.</p>' + go('spotify','signup/email','Inscrever-se','dl-primary') + go('spotify','login','Entrar','dl-outline') + '</div>';
    const songs = O.digitalContent.songs, favorites = account.data.favorites || [];
    const q = (route.params.get('q') || '').toLowerCase();
    const header = '<header class="dl-spotify-header"><span class="dl-brand">' + brand('spotify') + '</span>' + mediaSearch(route,'O que você quer ouvir?') + '<span>' + safe(account.profile.name) + '</span>' + button('logout','Sair') + '</header>';
    const side = '<aside><h2>Sua Biblioteca</h2>' + go('spotify','home','⌂ Início') + go('spotify','library','♥ Músicas curtidas') + '<p>' + favorites.length + ' favoritos salvos</p></aside>';
    const item = songs.find(s => s.id === route.params.get('id'));
    const list = songs.filter(s => (route.path !== 'library' || favorites.includes(s.id)) && s.title.toLowerCase().includes(q));
    return header + '<div class="dl-spotify-layout">' + side + '<main><h1>' + (route.path === 'library' ? 'Músicas curtidas' : 'Feito para você') + '</h1>' + (route.path === 'watch' ? player(record, route, item) + (item ? button('favorite', favorites.includes(item.id) ? '♥ Curtida' : '♡ Curtir', item.id, 'dl-favorite') : '') : '<div class="dl-media-grid">' + list.map(s => '<article>' + mediaCard('spotify',s) + button('favorite', favorites.includes(s.id) ? '♥ Curtida' : '♡ Curtir', s.id, 'dl-favorite') + (favorites.includes(s.id) ? button('open-favorite','Abrir favorito',s.id) : '') + '</article>').join('') + (list.length ? '' : '<p>Explore as músicas e curta uma para começar sua biblioteca.</p>') + '</div>') + '</main></div>';
  }
  function discord(record, route) {
    const a = D.session('discord');
    if (!a) return '<div class="dl-discord-welcome"><span class="dl-brand">' + brand('discord') + '</span><h1>Imagine um lugar<br>para aprender junto.</h1><p>A Comunidade OSLab está esperando por você.</p>' + go('discord','signup/email','Criar conta','dl-primary') + go('discord','login','Entrar') + '</div>';
    return '<div class="dl-discord-layout"><aside class="dl-discord-servers"><span>◕‿◕</span><span>OS</span></aside><aside class="dl-discord-channels"><h2>Comunidade OSLab</h2>' + button('community','# boas-vindas') + '<p># primeiros-passos</p><footer>' + safe(a.data.displayName || a.profile.name) + button('logout','Sair') + '</footer></aside><main><header># boas-vindas</header><h1>Bem-vindo à comunidade!</h1><p>Um espaço de treinamento para conhecer servidores e canais.</p>' + form('display-name',field('displayName','Seu nome de exibição',a.data.displayName || a.profile.name,'text','maxlength="40" required'),'Salvar nome') + (a.data.community ? '<div class="dl-community-message"><strong>Equipe OSLab</strong><p>Olá, ' + safe(a.data.displayName) + '! Você entrou na Comunidade OSLab. Continue suas descobertas.</p></div>' : button('community','Entrar na Comunidade OSLab','','dl-primary')) + '</main></div>';
  }
  function drive(record) {
    const account = D.session('drive');
    if (!account) return '<div class="dl-empty"><span class="dl-brand">' + brand('drive') + '</span><h1>Seus arquivos, bem organizados</h1>' + go('drive','login','Entrar com Google','dl-primary') + '</div>';
    return '<header class="dl-drive-header"><span class="dl-brand">' + brand('drive') + '</span><span>' + safe(account.email) + '</span>' + button('logout','Sair') + '</header><div class="dl-drive-layout"><aside><span class="dl-drive-new">+ Novo</span><strong>Meu Drive</strong><p>Arquivos da sua conta Google</p></aside><main><h1>Meu Drive</h1>' + form('folder',field('folder','Nome da nova pasta','','text','required maxlength="60"'),'Criar pasta') + '<div class="dl-folder-grid">' + (account.data.folders || []).map(name => '<div class="dl-folder" tabindex="0"><span aria-hidden="true">📁</span><strong>' + safe(name) + '</strong></div>').join('') + '</div></main></div>';
  }
  function homeRoute(service) { return ['gmail','outlook','yahoo'].includes(service) ? 'inbox' : service === 'netflix' ? 'profiles' : 'home'; }
  function render(record) {
    const route = resolve(record.browserState?.currentUrl);
    if (!route) return null;
    records.add(record);
    let screen;
    if (route.path.startsWith('login') && ['youtube','drive'].includes(route.service)) {
      if (D.session(route.service)) screen = route.service === 'youtube' ? youtube(record,{...route,path:'profile'}) : drive(record);
      else screen = auth(record,route);
    } else if (route.path.startsWith('login') || route.path.startsWith('signup')) screen = auth(record,route);
    else if (['gmail','outlook','yahoo'].includes(route.service)) screen = D.session(route.service) ? mailbox(record,route) : auth(record,{...route,path:'login'});
    else if (route.service === 'netflix') screen = netflix(record,route);
    else if (route.service === 'youtube') screen = youtube(record,route);
    else if (route.service === 'spotify') screen = spotify(record,route);
    else if (route.service === 'discord') screen = discord(record,route);
    else screen = drive(record);
    return '<section class="dl-site dl-' + route.service + '" data-digital-site="' + route.service + '"><div class="dl-simulation"><span>Simulação educacional — OSLab</span><span>' + safe(url(route.service)) + '</span></div>' + (screen || '<div class="dl-empty"><h1>Página não encontrada</h1>' + go(route.service,'home','Ir ao início') + '</div>') + '</section>';
  }
  function searchResult(query) {
    const term = String(query).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const service = Object.keys(defs).find(s => term.includes(s) || (s === 'gmail' && term.includes('conta google')));
    if (!service) return null;
    const creating = /criar|cadastro|cadastrar|inscrever/.test(term), login = /entrar|login|acessar/.test(term);
    const path = creating ? (service === 'gmail' ? 'login' : 'signup') : login ? 'login' : 'home';
    const name = defs[service].name;
    return '<section class="google-results-page dl-google-search"><header><button type="button" class="google-mini-logo" data-browser-go="google.com">Google</button><form class="google-results-search" data-google-search><input name="query" value="' + safe(query) + '" aria-label="Pesquisar"><button type="submit">Pesquisar</button></form></header><nav><strong>Tudo</strong><span>Imagens</span><span>Vídeos</span><span>Notícias</span></nav><main><p class="google-result-count">Simulação educacional — OSLab</p><article class="google-result-card first-result"><div><span class="result-favicon">' + safe(name[0]) + '</span><span><strong>' + safe(name) + '</strong><small>' + url(service,path) + '</small></span></div><button type="button" data-browser-go="' + url(service,path) + '" data-browser-first-result>' + (creating ? 'Criar uma conta' : login ? 'Entrar' : 'Conheça') + ' — ' + safe(name) + '</button><p>' + safe(defs[service].tagline) + ' Pratique com sua conta local.</p></article><article class="google-result-card"><div><strong>OSLab — Ajuda</strong></div>' + go(service,'login','Acessar minha conta ' + safe(name)) + '<p>Use os dados fictícios criados durante esta trilha.</p></article></main></section>';
  }
  function capture(record) {
    const host = record.content.querySelector('[data-digital-site]');
    if (!host || !record.digitalRenderedKey) return;
    const data = D.getDraft(record.digitalRenderedKey);
    const forms = volatileForms.get(record) || new Map(), values = {};
    host.querySelectorAll('input[name],select[name]').forEach(input => { const value = input.type === 'checkbox' ? input.checked : input.value; values[input.name] = value; if (!['password','confirmation','code'].includes(input.name)) data[input.name] = value; });
    forms.set(record.digitalRenderedKey + ':' + record.digitalRenderedUrl, values);
    volatileForms.set(record,forms);
    D.setDraft(record.digitalRenderedKey,data);
  }
  function navigate(record, service, path) { capture(record); O.browserApp.navigate(record,url(service,path)); }
  function error(record, err) {
    const node = record.content.querySelector('.dl-error');
    if (node) { node.textContent = err.message; node.focus(); } else O.ui.notify('Confira os dados',err.message,'info');
  }
  function wire(record) {
    const route = resolve(record.browserState.currentUrl);
    record.digitalRenderedKey = route ? key(record,route.service) : null;
    record.digitalRenderedUrl = record.browserState.currentUrl;
    const values = volatileForms.get(record)?.get(record.digitalRenderedKey + ':' + record.digitalRenderedUrl);
    if (values) record.content.querySelectorAll('[data-digital-site] input[name],[data-digital-site] select[name]').forEach(input => { if (Object.hasOwn(values,input.name)) { if (input.type === 'checkbox') input.checked = Boolean(values[input.name]); else input.value = values[input.name]; } });
    if (route?.service === 'youtube' && ['profile','login'].includes(route.path) && D.session('youtube')) O.digitalLifeTrail.observe('profile-view','youtube');
    if (route && ['gmail','outlook','yahoo'].includes(route.service) && D.session(route.service) && !route.path.startsWith('login') && !route.path.startsWith('signup')) O.digitalLifeTrail.observe('inbox-view',route.service);
    if (route?.service === 'spotify' && route.path === 'watch' && D.session('spotify')) {
      const id = route.params.get('id');
      if (O.digitalContent.songs.some(song => song.id === id)) O.digitalLifeTrail.observe('song-open','spotify');
      if (D.account('spotify').data.favorites?.includes(id)) O.digitalLifeTrail.observe('open-favorite','spotify');
    }
    if (record.digitalWired) return;
    record.digitalWired = true;
    record.content.addEventListener('input', () => capture(record));
    record.content.addEventListener('change', event => {
      capture(record);
      if (event.target.matches('[data-digital-show-password]')) record.content.querySelectorAll('input[name=password],input[name=confirmation]').forEach(i => { i.type = event.target.checked ? 'text' : 'password'; });
    });
    record.content.addEventListener('submit', async event => {
      const target = event.target.closest('[data-digital-form]');
      if (!target) return;
      event.preventDefault();
      if (target.dataset.busy) return;
      const route = resolve(record.browserState.currentUrl);
      if (!route) return;
      const { service } = route, type = target.dataset.digitalForm, value = Object.fromEntries(new FormData(target));
      capture(record);
      const data = draft(record,service), oldTab = record.browserState.activeTab;
      const clearSecrets = () => { target.querySelectorAll('input[name=password],input[name=confirmation],input[name=code]').forEach(input => input.value = ''); };
      const move = path => { if (record.browserState.activeTab === oldTab && record.element.isConnected) navigate(record,service,path); };
      target.dataset.busy = 'true';
      target.querySelectorAll('button').forEach(b => b.disabled = true);
      try {
        if (type === 'login-email') {
          const address = String(value.email || '').trim().toLowerCase(), a = D.account(service);
          if (!a || address !== a.email) throw new Error('Conta não encontrada. Confira o endereço criado nesta trilha.');
          D.setDraft(key(record,service),{...data,email:address}); move('login/password');
        } else if (type === 'login-password') { await D.login(service,data.email,value.password); clearSecrets(); transient.set(record,{}); move(homeRoute(service)); }
        else if (type === 'signup-name') {
          if (!String(value.name || '').trim()) throw new Error('Informe seu nome fictício.');
          D.setDraft(key(record,service),{...data,use:'personal'}); move('signup/basic');
        } else if (type === 'signup-basic') {
          D.profileData(data);
          move(service === 'gmail' ? 'signup/email' : service === 'yahoo' ? 'signup/phone' : 'signup/password');
        } else if (type === 'signup-email') {
          const address = D.address(service,value.email);
          D.setDraft(key(record,service),{...data,email:address});
          if (service === 'netflix') {
            const status = D.requestNetflixCode(address);
            move(status.verified ? 'signup/password' : 'signup/verify');
          } else move(service === 'gmail' ? (data.name ? 'signup/password' : 'signup/name') : 'signup/basic');
        } else if (type === 'signup-phone') {
          if (!value.phoneConfirmed) throw new Error('Marque a confirmação fictícia para continuar.');
          D.setDraft(key(record,service),{...data,phoneConfirmed:true}); move('signup/password');
        } else if (type === 'verify') { D.verifyNetflixCode(data.email,value.code); clearSecrets(); move('signup/password'); }
        else if (type === 'register') {
          const profile = service === 'netflix' ? D.account('google')?.profile : {};
          await D.register(service,{...data,...profile,password:value.password,confirmation:value.confirmation});
          clearSecrets();
          transient.set(record,{}); move(homeRoute(service));
        } else if (type === 'payment') {
          if (!transient.get(record)?.demoCard) throw new Error('Clique em Usar cartão de demonstração antes de confirmar.');
          target.innerHTML = '<div class="dl-payment-progress" role="status">Confirmando cartão de demonstração…</div>';
          await new Promise(r => global.setTimeout(r,700));
          D.action('netflix','payment');
          if (record.browserState.activeTab === oldTab) {
            target.innerHTML = '<p class="dl-payment-success" role="status">Cartão de demonstração adicionado com sucesso. Nenhuma cobrança será realizada.</p>' + go('netflix','profiles','Continuar para o perfil','dl-primary');
          }
        } else if (type === 'profile') { D.action('netflix','profile',value.profile); transient.set(record,{netflixEntered:true}); move('home'); }
        else if (type === 'display-name') { D.action('discord','display-name',value.displayName); move('home'); }
        else if (type === 'folder') { D.action('drive','folder',value.folder); move('home'); }
        else if (type === 'media-search') move('home?q=' + encodeURIComponent(value.search || ''));
        else if (type === 'mail-search') move('inbox?q=' + encodeURIComponent(value.search || ''));
      } catch (err) { if (record.browserState.activeTab === oldTab) error(record,err); }
      finally { delete target.dataset.busy; target.querySelectorAll('button').forEach(b => b.disabled = false); }
    });
    record.content.addEventListener('click', async event => {
      const el = event.target.closest('[data-digital-action]');
      if (!el) return;
      const route = resolve(record.browserState.currentUrl);
      if (!route) return;
      const { service } = route, action = el.dataset.digitalAction, value = el.dataset.value;
      const cache = transient.get(record) || {}; transient.set(record,cache);
      try {
        if (action === 'logout') { D.logout(service); transient.set(record,{}); navigate(record,service,'login'); }
        if (action === 'create-menu') { cache.createMenu = !cache.createMenu; O.browserApp.render(record); }
        if (action === 'notice') O.ui.notify('Treinamento OSLab',value,'info');
        if (action === 'message') { D.readMessage(service,value); navigate(record,service,'message/' + value); }
        if (action === 'refresh-mail') navigate(record,service,'inbox');
        if (action === 'copy-code') {
          const message = D.inbox(service).find(m => m.id === value);
          if (message?.kind === 'verification') {
            try { await global.navigator.clipboard.writeText(message.body); record.content.querySelector('.dl-copy-status').textContent = ' Código copiado.'; }
            catch (_) { const selection = global.getSelection(), range = document.createRange(); range.selectNodeContents(record.content.querySelector('.dl-code')); selection.removeAllRanges(); selection.addRange(range); record.content.querySelector('.dl-copy-status').textContent = ' Código selecionado. Use Ctrl+C.'; }
          }
        }
        if (action === 'plan') { D.action('netflix','plan',value); navigate(record,service,'payment'); }
        if (action === 'demo-card') {
          cache.demoCard = true;
          const form = el.closest('form');
          form.elements.demoCard.value = 'DEMO 0000 0000 0000';
          form.elements.demoName.value = 'ALUNO DEMONSTRAÇÃO';
          form.elements.demoExpiry.value = '12/2099';
          form.elements.demoCvc.value = 'DEMO';
        }
        if (action === 'profile') { D.action('netflix','profile',value); cache.netflixEntered = true; navigate(record,service,'home'); }
        if (action === 'favorite') { D.action('spotify','favorite',value); O.browserApp.render(record); }
        if (action === 'open-favorite') { D.action('spotify','open-favorite',value); navigate(record,service,'watch?id=' + value); }
        if (action === 'community') { D.action('discord','community'); O.browserApp.render(record); }
        if (action === 'youtube-profile') { D.action('youtube','profile-view'); navigate(record,service,'profile'); }
        if (action === 'play' && cache.player) { cache.player.playing = !cache.player.playing; el.textContent = cache.player.playing ? '❚❚ Pausar' : '▶ Reproduzir'; }
        if (action === 'restart-player' && cache.player) { cache.player.elapsed = 0; cache.player.playing = false; O.browserApp.render(record); }
      } catch (err) { error(record,err); }
    });
  }
  global.setInterval(() => records.forEach(record => {
    if (!record.element.isConnected) { records.delete(record); return; }
    const player = record.content.querySelector('[data-player-id]'), state = transient.get(record)?.player;
    if (!player || !state?.playing || state.id !== player.dataset.playerId) return;
    state.elapsed = Math.min(Number(player.dataset.duration),state.elapsed + 1);
    player.querySelector('progress').value = state.elapsed;
    player.querySelector('output').textContent = state.elapsed + ' / ' + player.dataset.duration + ' s';
    if (state.elapsed >= Number(player.dataset.duration)) { state.playing = false; player.querySelector('[data-digital-action=play]').textContent = '▶ Reproduzir'; }
  }),1000);
  O.events.subscribe('digital-life:reset', () => {
    records.forEach(record => {
      transient.delete(record);
      volatileForms.delete(record);
      record.digitalRenderedKey = null;
      if (!record.element.isConnected) return;
      const state = record.browserState;
      const isTrailUrl = value => Boolean(resolve(value) || (String(value).startsWith('search:') && searchResult(decodeURIComponent(String(value).slice(7)))));
      const clean = item => { if (isTrailUrl(item.url)) { item.url = item.page = 'google.com'; item.title = 'Google'; } if (item.history) { item.history = item.history.filter(u => !isTrailUrl(u)); if (!item.history.length) item.history = ['google.com']; item.historyIndex = Math.min(item.historyIndex,item.history.length - 1); } };
      state.tabs.forEach(clean);
      state.closedTabs = state.closedTabs.filter(entry => !isTrailUrl(entry.tab.url));
      state.closedTabs.forEach(entry => clean(entry.tab));
      state.favorites = state.favorites.filter(entry => !isTrailUrl(entry.url));
      state.history = state.history.filter(entry => !isTrailUrl(entry.url));
      O.browserState.activate(state,state.activeTab);
      const active = O.browserState.active(state);
      state.currentUrl = active.url;
      O.browserApp.navigate(record,active.url);
    });
  });
  O.digitalSites = { resolve, render, wire, capture, searchResult, services: defs };
})(window);
