(function createBrowserApp(global) {
  "use strict";

  const OSLab = global.OSLab = global.OSLab || {};
  const records = new Set();
  const knownHosts = ["google.com", "netflix.com", "meuip.com", "portal.empresa.local", "bancoos.com", "speedtest.os", "meet.os", "admin.escola.local"];
  const movies = [
    ["Supernatural", "15 temporadas", ["Séries", "Terror", "Em alta"]], ["Horizonte de Aço", "Filme", ["Ação", "Populares"]], ["Código Aurora", "2 temporadas", ["Séries", "Ficção científica"]], ["Depois da Névoa", "Filme", ["Terror", "Em alta"]], ["Rota 2049", "Filme", ["Ficção científica", "Ação"]],
    ["Vozes do Vale", "3 temporadas", ["Séries", "Populares"]], ["O Último Farol", "Filme", ["Terror", "Filmes"]], ["Linha de Fuga", "Filme", ["Ação", "Em alta"]], ["Além do Gelo", "1 temporada", ["Séries", "Ficção científica"]], ["Cidade Submersa", "Filme", ["Ficção científica", "Filmes"]],
    ["Ponto de Retorno", "Filme", ["Ação", "Populares"]], ["Arquivo Sete", "4 temporadas", ["Séries", "Terror"]], ["Montanha Vermelha", "Filme", ["Filmes", "Em alta"]], ["Sinal Perdido", "2 temporadas", ["Séries", "Ficção científica"]], ["O Eco da Sala 13", "Filme", ["Terror", "Populares"]],
    ["Expresso Noturno", "Filme", ["Ação", "Filmes"]], ["Ponte para Ontem", "1 temporada", ["Séries", "Em alta"]], ["Órbita Zero", "Filme", ["Ficção científica", "Populares"]], ["Cerco Digital", "Filme", ["Ação", "Em alta"]], ["Maré Silenciosa", "3 temporadas", ["Séries", "Terror"]],
  ].map(([title, meta, categories], index) => ({ id: `title-${index + 1}`, title, meta, categories, poster: `assets/vpn/posters/poster-${String(index + 1).padStart(2, "0")}.jpg` }));
  const categories = ["Populares", "Séries", "Filmes", "Ação", "Terror", "Ficção científica", "Em alta"];

  function safe(value) { return OSLab.ui.escapeHtml(value); }
  function icon(name) { return OSLab.learningPath.icon(name); }
  function hostFrom(value) {
    const clean = String(value || "").trim().toLocaleLowerCase("pt-BR").replace(/^https?:\/\//, "").split("/")[0];
    if (knownHosts.includes(clean)) return clean;
    if (clean.includes("netflix")) return "netflix.com";
    if (clean.includes("meu ip") || clean.includes("meuip")) return "meuip.com";
    if (clean.includes("speed")) return "speedtest.os";
    if (clean.includes("empresa")) return "portal.empresa.local";
    if (clean.includes("banco")) return "bancoos.com";
    if (clean.includes("escola") || clean.includes("admin")) return "admin.escola.local";
    return clean && !clean.includes(" ") ? clean : "google.com";
  }
  function pageState() { return { vpn: OSLab.vpn.getSnapshot(), network: OSLab.network.getSnapshot(), loadedAt: new Date().toISOString() }; }
  function errorCopy(reason) {
    return ({ disconnected: ["Sem conexão", "Verifique se o Wi-Fi está ativo ou se o cabo Ethernet está conectado."], "local-network": ["Rede local indisponível", "O endereço IP atual não consegue comunicar-se com o gateway."], internet: ["Sem acesso à internet", "A conexão local existe, mas o gateway não oferece acesso externo."], dns: ["Não foi possível localizar o site", "O computador está conectado, mas a resolução de nomes falhou."] })[reason] || ["Página indisponível", "Revise as configurações de rede e tente novamente."];
  }
  function netflixAvailable(state) { return state.vpn.country === "US"; }
  function portalAllowed(state) { return state.vpn.connected && state.vpn.corporateNetwork === "empresa-os"; }
  function schoolAllowed(state) { return state.vpn.connected && state.vpn.currentIp === "203.0.113.50" && state.vpn.corporateNetwork === "escola-admin"; }
  function bankAllowed(state) { return state.vpn.country === "BR"; }
  function speedMetrics(state, jitter = 0) {
    const ping = Math.max(10, Math.round((state.vpn.connected ? state.vpn.latency : 22) + Number(jitter || 0)));
    const base = !state.vpn.connected ? [320, 120] : state.vpn.serverId === "br" ? [280, 105] : state.vpn.serverId === "us" ? [180, 80] : state.vpn.serverId === "de" ? [135, 60] : state.vpn.serverId === "jp" ? [90, 35] : [165, 72];
    return { ping, download: Math.max(20, Math.round(base[0] - Math.abs(jitter) * 2)), upload: Math.max(10, Math.round(base[1] - Math.abs(jitter))) };
  }
  function emit(record, action, detail = {}) {
    const state = record.browserPageState || pageState();
    OSLab.events.emit("vpn-browser:action", { host: record.browserHost, action, vpn: state.vpn, wifi: state.network.connectedSsid, ...detail }, "browser");
  }
  function ensureHistory(record) {
    record.browserHistory = record.browserHistory || [];
    record.browserHistoryIndex = Number.isInteger(record.browserHistoryIndex) ? record.browserHistoryIndex : -1;
  }
  function load(record, value, options = {}) {
    ensureHistory(record);
    const host = hostFrom(value);
    if (options.push !== false) {
      record.browserHistory = record.browserHistory.slice(0, record.browserHistoryIndex + 1);
      record.browserHistory.push(host);
      record.browserHistoryIndex = record.browserHistory.length - 1;
    }
    record.browserHost = host;
    record.browserResult = OSLab.network.browse(host);
    record.browserPageState = pageState();
    if (host === "speedtest.os") record.speedResult = null;
    if (host === "meet.os") record.meetJoined = false;
    record.browserLoading = true;
    render(record);
    global.setTimeout(() => { if (!record.element?.isConnected) return; record.browserLoading = false; render(record); observe(record); }, 260);
    return record.browserResult;
  }
  function observe(record) {
    const state = record.browserPageState;
    if (!record.browserResult?.ok || !state) return;
    if (record.browserHost === "netflix.com" && String(record.netflixSearch || "").trim().toLocaleLowerCase("pt-BR") === "supernatural") {
      emit(record, netflixAvailable(state) ? "netflix-supernatural-us" : state.vpn.country === "BR" ? "netflix-unavailable-br" : "netflix-unavailable");
    }
    if (record.browserHost === "portal.empresa.local") emit(record, portalAllowed(state) ? "portal-open" : "portal-denied");
    if (record.browserHost === "meuip.com") emit(record, state.vpn.country === "DE" ? "myip-view-de" : state.vpn.country === "BR" ? "myip-view-br" : "myip-view");
    if (record.browserHost === "bancoos.com") emit(record, bankAllowed(state) ? "bank-authorized-br" : state.vpn.country === "JP" ? "bank-blocked-jp" : "bank-blocked");
    if (record.browserHost === "admin.escola.local" && !schoolAllowed(state)) emit(record, "school-denied");
  }
  function toolbar(record) {
    ensureHistory(record);
    record.toolbar.classList.remove("is-hidden");
    record.toolbar.classList.add("vpn-browser-toolbar");
    record.toolbar.innerHTML = `<button type="button" data-browser-nav="back" aria-label="Voltar" ${record.browserHistoryIndex <= 0 ? "disabled" : ""}><img src="assets/icons/ui/left.png" alt="" /></button><button type="button" data-browser-nav="forward" aria-label="Avançar" ${record.browserHistoryIndex >= record.browserHistory.length - 1 ? "disabled" : ""}><img src="assets/icons/ui/right.png" alt="" /></button><button type="button" data-browser-nav="refresh" aria-label="Atualizar"><img src="assets/icons/ui/refresh.png" alt="" /></button><form data-browser-address-form><span class="browser-lock">OS</span><input name="address" value="${safe(record.browserHost || "google.com")}" aria-label="Barra de endereço" spellcheck="false" /><button type="submit">Ir</button></form>${record.browserLoading ? `<span class="browser-loading" aria-label="Carregando"></span>` : ""}`;
  }
  function posterCard(movie) { return `<article class="netflix-card"><img src="${movie.poster}" alt="Capa fictícia de ${safe(movie.title)}" /><span><strong>${safe(movie.title)}</strong><small>${safe(movie.meta)}</small></span></article>`; }
  function browserHome() {
    const shortcuts = [
      ["netflix.com", "Netflix", "play"], ["meuip.com", "Meu IP", "globe_search"], ["speedtest.os", "SpeedTest", "top_speed"], ["portal.empresa.local", "Empresa OS", "building"], ["bancoos.com", "Banco OS", "lock_closed"], ["admin.escola.local", "Admin Escola", "shield_checkmark"],
    ];
    return `<section class="vpn-browser-home"><div class="browser-home-brand"><img src="${icon("globe_search")}" alt="" /><small>Navegador offline do OSLab</small><h1>Para onde vamos?</h1><p>Todos os sites abaixo são simulações locais e reagem ao estado do laboratório.</p></div><div class="browser-shortcuts">${shortcuts.map(([host, label, iconName]) => `<button type="button" data-browser-go="${host}"><img src="${icon(iconName)}" alt="" /><span>${label}</span><small>${host}</small></button>`).join("")}</div></section>`;
  }
  function netflix(record, state) {
    const region = state.vpn.countryName;
    if (!record.netflixProfile) {
      const profiles = [["Fernando", "assets/icons/avatar.webp"], ["Aluno", "assets/learning/mascot/oslab-mascot-neutral.png"], ["Professor", "assets/learning/mascot/oslab-mascot-help.png"], ["Convidado", "assets/learning/mascot/oslab-mascot-celebrate.png"]];
      return `<section class="netflix-site netflix-profiles"><div class="netflix-wordmark">NETFLIX <small>simulação educacional</small></div><h1>Quem está assistindo?</h1><div>${profiles.map(([name, asset]) => `<button type="button" data-netflix-profile="${name}"><img src="${asset}" alt="" /><span>${name}</span></button>`).join("")}</div></section>`;
    }
    const query = String(record.netflixSearch || "").trim();
    const supernatural = query.toLocaleLowerCase("pt-BR") === "supernatural";
    const available = netflixAvailable(state);
    const searchResult = supernatural ? available ? `<article class="netflix-feature-result"><img src="${movies[0].poster}" alt="Capa fictícia de Supernatural" /><div><small>15 temporadas · Terror e fantasia</small><h2>Supernatural</h2><p>Dois irmãos cruzam estradas misteriosas investigando fenômenos sobrenaturais nesta simulação educacional.</p><button type="button" data-netflix-watch>Assistir</button><button type="button" data-netflix-info>Informações</button></div></article>` : `<div class="netflix-empty"><h2>Nenhum resultado encontrado</h2><p>Este título não está disponível na sua região.</p><small>Região detectada: ${safe(region)}</small></div>` : "";
    return `<section class="netflix-site"><header><div class="netflix-wordmark">NETFLIX <small>simulação</small></div><form data-netflix-search><input name="query" value="${safe(query)}" placeholder="Buscar filmes e séries" aria-label="Buscar na Netflix" /><button type="submit"><img src="assets/icons/search.png" alt="" />Buscar</button></form><span>Perfil: ${safe(record.netflixProfile)}</span></header><div class="netflix-hero"><div><small>Região detectada: ${safe(region)}</small><h1>Histórias para explorar</h1><p>O catálogo desta simulação muda quando a página consulta uma nova região.</p></div></div>${searchResult || categories.map((category) => `<section class="netflix-row"><h2>${category}</h2><div>${movies.filter((movie) => movie.categories.includes(category) && (movie.title !== "Supernatural" || available)).slice(0, 6).map(posterCard).join("")}</div></section>`).join("")}</section>`;
  }
  function portal(record, state) {
    if (!portalAllowed(state)) return `<section class="access-denied"><img src="${icon("lock_closed")}" alt="" /><small>403 — ACESSO NEGADO</small><h1>Portal interno indisponível</h1><p>Este sistema está disponível apenas para dispositivos conectados à rede corporativa.</p><dl><div><dt>Origem atual</dt><dd>Internet pública</dd></div><div><dt>IP observado</dt><dd>${safe(state.vpn.currentIp)}</dd></div></dl></section>`;
    if (record.portalTicket === "1542") return `<section class="corporate-site"><header><img src="${icon("building")}" alt="" /><span><small>Empresa OS</small><strong>Portal interno</strong></span></header><main><button type="button" class="site-back" data-portal-back>← Voltar aos chamados</button><article class="ticket-detail"><small>CHAMADO #1542</small><h1>Computador do laboratório sem conexão à rede</h1><p>Status: <strong>Em atendimento</strong></p><dl><div><dt>Setor</dt><dd>Laboratório de Informática</dd></div><div><dt>Prioridade</dt><dd>Média</dd></div><div><dt>Responsável</dt><dd>Equipe de Redes</dd></div></dl></article></main></section>`;
    return `<section class="corporate-site"><header><img src="${icon("building")}" alt="" /><span><small>Empresa OS</small><strong>Portal interno</strong></span><em>Rede corporativa</em></header><main><h1>Bem-vindo ao portal</h1><div class="corporate-modules"><button type="button" data-portal-ticket="1542"><img src="${icon("list_bar")}" alt="" /><span><strong>Chamados</strong><small>3 em atendimento</small></span></button><button type="button"><img src="${icon("apps")}" alt="" /><span><strong>Funcionários</strong><small>Diretório interno</small></span></button><button type="button"><img src="${icon("folder_search")}" alt="" /><span><strong>Documentos</strong><small>Políticas e manuais</small></span></button><button type="button"><img src="${icon("hard_drive")}" alt="" /><span><strong>Inventário</strong><small>Ativos da empresa</small></span></button></div><article class="ticket-row"><span><strong>#1542</strong><small>Computador do laboratório sem conexão à rede</small></span><em>Em atendimento</em><button type="button" data-portal-ticket="1542">Abrir</button></article></main></section>`;
  }
  function myIp(record, state) {
    const isGermany = state.vpn.country === "DE";
    return `<section class="myip-site"><header><img src="${icon("globe_search")}" alt="" /><span>MEU IP <small>simulação local</small></span></header><main><small>Qual é o meu IP?</small><h1>${safe(state.vpn.currentIp)}</h1><div class="myip-country">${state.vpn.server?.flag ? `<img src="${state.vpn.server.flag}" alt="" />` : `<img src="assets/vpn/flags/br.svg" alt="" />`}<span><strong>${safe(state.vpn.countryName)}</strong><small>${state.vpn.connected ? "Conexão: VPN" : "Provedor: OS Telecom"}</small></span></div><dl><div><dt>Localização aproximada</dt><dd>${isGermany ? "Frankfurt — DE" : state.vpn.country === "BR" ? "Maceió — AL" : safe(state.vpn.countryName)}</dd></div><div><dt>Tipo</dt><dd>${state.vpn.connected ? state.vpn.type === "corporate" ? "VPN corporativa" : "VPN comercial" : "Conexão direta"}</dd></div></dl>${isGermany ? `<form data-myip-quiz><h2>Confira o que mudou</h2><fieldset><legend>Seu computador foi fisicamente para a Alemanha?</legend><label><input type="radio" name="physical" value="yes" required /> Sim</label><label><input type="radio" name="physical" value="no" required /> Não</label></fieldset><fieldset><legend>O que mudou para o site?</legend><label><input type="radio" name="changed" value="public-ip" required /> O endereço IP público aparente</label><label><input type="radio" name="changed" value="private-ip" required /> O IP privado do computador</label><label><input type="radio" name="changed" value="mac" required /> O endereço MAC</label></fieldset><button type="submit">Conferir respostas</button>${record.myIpQuizResult === false ? `<p>Revise: o site observa o IP público aparente, não o hardware do computador.</p>` : record.myIpQuizResult ? `<p class="is-correct">Respostas corretas.</p>` : ""}</form>` : ""}</main></section>`;
  }
  function bank(state) {
    if (!bankAllowed(state)) return `<section class="bank-site is-blocked"><header><span>BANCO <strong>OS</strong></span><small>Ambiente demonstrativo</small></header><main><img src="${icon("lock_closed")}" alt="" /><h1>Acesso temporariamente bloqueado</h1><p>Detectamos uma tentativa de acesso de uma localização incomum.</p><dl><div><dt>Local detectado</dt><dd>${safe(state.vpn.countryName)}</dd></div><div><dt>IP aparente</dt><dd>${safe(state.vpn.currentIp)}</dd></div></dl><small>Por segurança, tente novamente através de sua localização habitual.</small></main></section>`;
    return `<section class="bank-site"><header><span>BANCO <strong>OS</strong></span><small>Ambiente demonstrativo</small></header><main><div class="bank-approved"><img src="${icon("checkmark_circle")}" alt="" /><span><small>Acesso autorizado</small><strong>Localização detectada: Brasil</strong></span></div><section class="bank-balance"><small>Saldo fictício</small><h1>R$ 2.480,00</h1><p>Conta de demonstração · Nenhum dado bancário real</p></section><div class="bank-actions"><button>Extrato</button><button>Cartão virtual</button><button>Pagamentos</button></div></main></section>`;
  }
  function speedTest(record, state) {
    const result = record.speedResult;
    return `<section class="speed-site"><header><img src="${icon("top_speed")}" alt="" /><span><strong>SpeedTest OS</strong><small>Medição totalmente simulada</small></span></header><main><div class="speed-server"><span><small>Saída atual</small><strong>${safe(state.vpn.connected ? state.vpn.countryName : "Brasil — conexão direta")}</strong></span><span><small>VPN</small><strong>${state.vpn.connected ? "Ligada" : "Desligada"}</strong></span></div>${result ? `<div class="speed-gauges"><span><small>Ping</small><strong>${result.ping}</strong><em>ms</em></span><span><small>Download</small><strong>${result.download}</strong><em>Mbps</em></span><span><small>Upload</small><strong>${result.upload}</strong><em>Mbps</em></span></div><p>${result.ping > 200 ? "Conexão ruim para chamadas em tempo real." : result.ping >= 100 ? "Conexão aceitável, mas com atraso perceptível." : result.ping < 60 ? "Conexão excelente para videoconferência." : "Conexão boa."}</p><button type="button" data-browser-go="meet.os">Abrir OS Meet</button>` : `<div class="speed-start"><span>${state.vpn.latency}</span><small>latência estimada</small><button type="button" data-speed-run>Iniciar teste</button></div>`}</main></section>`;
  }
  function meet(record, state) {
    const ping = speedMetrics(state, 0).ping;
    const grade = ping > 200 ? ["red", "Conexão ruim"] : ping >= 100 ? ["amber", "Conexão aceitável"] : ping < 60 ? ["green", "Conexão excelente"] : ["blue", "Conexão boa"];
    return `<section class="meet-site"><header><img src="${icon("apps")}" alt="" /><span><strong>OS Meet</strong><small>Sala: Reunião Empresa OS</small></span></header><main><div class="meet-preview"><img src="assets/learning/mascot/oslab-mascot-neutral.png" alt="Prévia do participante" /><span>Fernando · câmera simulada</span></div><aside><span class="meet-quality is-${grade[0]}"><i></i>${grade[1]}</span><h1>Pronto para participar?</h1><p>Ping atual: <strong>${ping} ms</strong></p><p>${state.vpn.connected ? `VPN ativa em ${safe(state.vpn.countryName)}` : "A VPN está desligada"}</p><button type="button" data-meet-join ${!state.vpn.connected ? "disabled" : ""}>Participar agora</button>${record.meetJoined ? `<strong class="meet-joined">Você entrou na chamada.</strong>` : ""}</aside></main></section>`;
  }
  function school(record, state) {
    if (!schoolAllowed(state)) return `<section class="access-denied school-denied"><img src="${icon("shield_checkmark")}" alt="" /><small>403 — IP NÃO AUTORIZADO</small><h1>Painel administrativo restrito</h1><p>Este endereço IP não está na lista de endereços autorizados.</p><dl><div><dt>IP atual</dt><dd>${safe(state.vpn.currentIp)}</dd></div><div><dt>Conexão</dt><dd>${state.vpn.connected ? safe(state.vpn.countryName) : "Internet pública"}</dd></div></dl></section>`;
    if (record.schoolView === "lab02") return `<section class="school-site"><header><img src="${icon("shield_checkmark")}" alt="" /><span><small>Escola OS</small><strong>Painel Administrativo</strong></span></header><main><button class="site-back" data-school-view="labs">← Laboratórios</button><article class="school-lab-detail"><small>REDE ACADÊMICA</small><h1>Laboratório 02</h1><div><span><strong>20</strong>Computadores</span><span><strong>18</strong>Online</span><span><strong>2</strong>Offline</span></div><dl><dt>Gateway</dt><dd>192.168.20.1</dd></dl></article></main></section>`;
    const labButton = `<button type="button" data-school-view="lab02"><img src="${icon("apps")}" alt="" /><span><strong>Laboratório 02</strong><small>20 computadores · 18 online</small></span></button>`;
    return `<section class="school-site"><header><img src="${icon("shield_checkmark")}" alt="" /><span><small>IP autorizado</small><strong>Escola OS · Painel Administrativo</strong></span></header><main><h1>${record.schoolView === "labs" ? "Laboratórios" : "Bem-vindo ao painel"}</h1>${record.schoolView === "labs" ? `<div class="school-labs">${labButton}<button><img src="${icon("apps")}" alt="" /><span><strong>Laboratório 01</strong><small>24 computadores · 24 online</small></span></button></div>` : `<div class="corporate-modules"><button><img src="${icon("hard_drive")}" alt="" /><span><strong>Computadores</strong><small>Inventário</small></span></button><button><img src="${icon("wifi_1")}" alt="" /><span><strong>Rede</strong><small>Gateways e switches</small></span></button><button data-school-view="labs"><img src="${icon("apps")}" alt="" /><span><strong>Laboratórios</strong><small>Salas e estações</small></span></button><button><img src="${icon("list_bar")}" alt="" /><span><strong>Chamados</strong><small>Suporte técnico</small></span></button></div>`}</main></section>`;
  }
  function site(record) {
    const state = record.browserPageState || pageState();
    if (!record.browserResult) return browserHome();
    if (!record.browserResult.ok) { const copy = errorCopy(record.browserResult.reason); return `<section class="offline-browser-error"><span>!</span><h2>${copy[0]}</h2><p>${copy[1]}</p><button type="button" data-browser-nav="refresh">Tentar novamente</button></section>`; }
    if (record.browserHost === "google.com" || record.browserHost === "www.google.com") return browserHome();
    if (record.browserHost === "netflix.com") return netflix(record, state);
    if (record.browserHost === "portal.empresa.local") return portal(record, state);
    if (record.browserHost === "meuip.com") return myIp(record, state);
    if (record.browserHost === "bancoos.com") return bank(state);
    if (record.browserHost === "speedtest.os") return speedTest(record, state);
    if (record.browserHost === "meet.os") return meet(record, state);
    if (record.browserHost === "admin.escola.local") return school(record, state);
    return `<section class="offline-browser-success"><span class="browser-secure">● Conexão simulada segura</span><h2>${safe(record.browserHost)}</h2><p>A página foi carregada corretamente pelo navegador virtual.</p></section>`;
  }
  function render(record) {
    records.add(record);
    toolbar(record);
    record.address.textContent = record.browserHost ? `https://${record.browserHost}` : "Navegador do OSLab";
    record.content.innerHTML = `<section class="offline-browser vpn-browser-shell">${site(record)}</section>`;
    if (!record.browserWired) {
      record.browserWired = true;
      record.toolbar.addEventListener("submit", (event) => { const form = event.target.closest("[data-browser-address-form]"); if (!form) return; event.preventDefault(); load(record, new FormData(form).get("address")); });
      const navigateClick = (event) => {
        const nav = event.target.closest("[data-browser-nav]")?.dataset.browserNav;
        if (!nav) return;
        if (nav === "refresh") load(record, record.browserHost || "google.com", { push: false });
        if (nav === "back" && record.browserHistoryIndex > 0) { record.browserHistoryIndex -= 1; load(record, record.browserHistory[record.browserHistoryIndex], { push: false }); }
        if (nav === "forward" && record.browserHistoryIndex < record.browserHistory.length - 1) { record.browserHistoryIndex += 1; load(record, record.browserHistory[record.browserHistoryIndex], { push: false }); }
      };
      record.toolbar.addEventListener("click", navigateClick);
      record.content.addEventListener("click", (event) => {
        navigateClick(event);
        const go = event.target.closest("[data-browser-go]")?.dataset.browserGo; if (go) load(record, go);
        const profile = event.target.closest("[data-netflix-profile]")?.dataset.netflixProfile; if (profile) { record.netflixProfile = profile; render(record); emit(record, "netflix-profile", { profile }); }
        const ticket = event.target.closest("[data-portal-ticket]")?.dataset.portalTicket; if (ticket) { record.portalTicket = ticket; render(record); if (ticket === "1542") emit(record, "portal-ticket-1542", { ticket }); }
        if (event.target.closest("[data-portal-back]")) { record.portalTicket = null; render(record); }
        if (event.target.closest("[data-speed-run]")) { const jitter = (Date.now() % 9) - 4; record.speedResult = speedMetrics(record.browserPageState, jitter); render(record); emit(record, "speed-result", { ...record.speedResult, vpnConnected: record.browserPageState.vpn.connected }); }
        if (event.target.closest("[data-meet-join]")) { record.meetJoined = true; render(record); const ping = speedMetrics(record.browserPageState, 0).ping; emit(record, ping < 60 ? "meet-joined-green" : "meet-joined", { ping }); }
        const schoolView = event.target.closest("[data-school-view]")?.dataset.schoolView; if (schoolView) { record.schoolView = schoolView; render(record); if (schoolView === "lab02") emit(record, "school-lab-02"); }
        if (event.target.closest("[data-netflix-watch]")) OSLab.ui.notify("Netflix simulada", "Reprodução fictícia iniciada. Nenhum vídeo real é transmitido.", "info");
      });
      record.content.addEventListener("submit", (event) => {
        const netflixForm = event.target.closest("[data-netflix-search]");
        const ipQuiz = event.target.closest("[data-myip-quiz]");
        if (netflixForm) { event.preventDefault(); record.netflixSearch = String(new FormData(netflixForm).get("query") || "").trim(); render(record); if (record.netflixSearch.toLocaleLowerCase("pt-BR") === "supernatural") emit(record, netflixAvailable(record.browserPageState) ? "netflix-supernatural-us" : record.browserPageState.vpn.country === "BR" ? "netflix-unavailable-br" : "netflix-unavailable"); }
        if (ipQuiz) { event.preventDefault(); const values = new FormData(ipQuiz); const correct = values.get("physical") === "no" && values.get("changed") === "public-ip"; record.myIpQuizResult = correct; render(record); if (correct) emit(record, "myip-quiz-correct"); }
      });
    }
  }
  function navigate(record, value) { return load(record, value); }

  OSLab.vpnSites = { netflixAvailable, portalAllowed, schoolAllowed, bankAllowed, speedMetrics, movies: movies.map((movie) => ({ ...movie })) };
  OSLab.browserApp = { render, navigate, refresh(record) { return load(record, record.browserHost || "google.com", { push: false }); } };
})(window);
