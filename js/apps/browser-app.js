(function createBrowserApp(global) {
  "use strict";
  const OSLab = global.OSLab = global.OSLab || {};
  const records = new Set();
  function safe(value) { return OSLab.ui.escapeHtml(value); }
  function hostFrom(value) {
    const clean = String(value || "").trim().toLocaleLowerCase("pt-BR");
    if (!clean || clean.includes(" ")) return "google.com";
    return clean.replace(/^https?:\/\//, "").split("/")[0] || "google.com";
  }
  function errorCopy(reason) {
    return ({ disconnected: ["Sem conexão", "Verifique se o Wi-Fi está ativo ou se o cabo Ethernet está conectado."], "local-network": ["Rede local indisponível", "O endereço IP atual não consegue comunicar-se com o gateway."], internet: ["Sem acesso à internet", "A conexão local existe, mas o gateway não oferece acesso externo."], dns: ["Não foi possível localizar o site", "O computador está conectado, mas a resolução de nomes falhou."] })[reason] || ["Página indisponível", "Revise as configurações de rede e tente novamente."];
  }
  function navigate(record, value) { record.browserHost = hostFrom(value); record.browserResult = OSLab.network.browse(record.browserHost); render(record); return record.browserResult; }
  function render(record) {
    records.add(record); record.address.textContent = record.browserHost ? `https://${record.browserHost}` : "Navegador do OSLab";
    const result = record.browserResult;
    const main = !result ? `<div class="offline-browser-home"><img class="google-logo" src="assets/icons/google.png" alt="" /><h2>Google</h2><p>Pesquisa simulada e totalmente offline para o laboratório.</p></div>` : result.ok ? `<div class="offline-browser-success"><span class="browser-secure">● Conexão simulada segura</span><h2>${safe(record.browserHost)}</h2><p>A página foi carregada corretamente pelo navegador virtual.</p><div class="browser-result-card"><strong>OSLab · Diagnóstico concluído</strong><span>A rede local, o acesso por IP e a resolução de nomes estão funcionando.</span></div></div>` : (() => { const copy = errorCopy(result.reason); return `<div class="offline-browser-error"><span>!</span><h2>${copy[0]}</h2><p>${copy[1]}</p><button type="button" data-browser-retry>Tentar novamente</button></div>`; })();
    record.content.innerHTML = `<section class="offline-browser"><form data-browser-form><img src="assets/icons/search.png" alt="" /><input name="q" value="${safe(record.browserHost || "")}" placeholder="Digite um site ou pesquisa" aria-label="Endereço" /><button type="submit">Acessar</button></form>${main}</section>`;
    if (!record.browserWired) {
      record.browserWired = true;
      record.content.addEventListener("submit", (event) => { const form = event.target.closest("[data-browser-form]"); if (!form) return; event.preventDefault(); navigate(record, new FormData(form).get("q")); });
      record.content.addEventListener("click", (event) => { if (event.target.closest("[data-browser-retry]")) navigate(record, record.browserHost || "google.com"); });
    }
  }
  OSLab.network.subscribe(() => records.forEach((record) => { if (record.element?.isConnected && record.browserHost) { record.browserResult = OSLab.network.browse(record.browserHost); render(record); } }));
  OSLab.browserApp = { render, navigate };
})(window);
