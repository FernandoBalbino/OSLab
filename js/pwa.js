(function prepareOfflineApp() {
  "use strict";
  let installPrompt = null;
  let reloadingForUpdate = false;

  function standalone() {
    return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  }
  function updateConnectionState() { document.documentElement.dataset.connection = navigator.onLine ? "online" : "offline"; }
  function updateInstallButtons() {
    document.querySelectorAll("[data-pwa-install]").forEach((button) => {
      const installed = standalone();
      button.dataset.installed = String(installed);
      button.querySelector("span").textContent = installed ? "OSLab instalado e pronto offline" : "Instalar para usar offline";
      button.disabled = installed;
    });
  }
  function message(title, copy, kind = "info") { window.OSLab?.ui?.notify?.(title, copy, kind, 6500); }
  async function install() {
    if (standalone()) { message("OSLab já instalado", "O laboratório pode ser aberto e utilizado sem internet.", "success"); return; }
    if (!installPrompt) {
      message("Instalar o OSLab", "No Chrome, abra o menu do navegador e escolha Instalar OSLab ou Criar atalho. O primeiro acesso completo prepara os arquivos offline.");
      return;
    }
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") message("Instalação iniciada", "O OSLab ficará disponível como aplicativo neste dispositivo.", "success");
    installPrompt = null; updateInstallButtons();
  }

  updateConnectionState(); updateInstallButtons();
  window.addEventListener("online", updateConnectionState);
  window.addEventListener("offline", updateConnectionState);
  window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); installPrompt = event; document.documentElement.dataset.installAvailable = "true"; updateInstallButtons(); });
  window.addEventListener("appinstalled", () => { installPrompt = null; document.documentElement.dataset.installed = "true"; updateInstallButtons(); message("OSLab instalado", "A interface e os exercícios estão disponíveis offline.", "success"); });
  document.addEventListener("click", (event) => { if (event.target.closest("[data-pwa-install]")) void install(); });
  window.matchMedia("(display-mode: standalone)").addEventListener?.("change", updateInstallButtons);

  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (reloadingForUpdate) window.location.reload(); });

  // Ao ligar o OSLab: baixa tudo na primeira vez e procura uma versão nova antes de liberar o login.
  // onProgress recebe { phase: "install" | "update", done, total }. A promessa termina com o status final.
  const progressListeners = new Set();
  navigator.serviceWorker.addEventListener("message", (event) => { if (event.data?.type === "precache-progress") progressListeners.forEach((fn) => fn(event.data)); });
  navigator.serviceWorker.startMessages?.(); // sem isto as mensagens de progresso ficam presas na fila até o fim do carregamento
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  function settled(worker, limit) {
    return new Promise((resolve) => {
      if (!worker || ["installed", "activated", "redundant"].includes(worker.state)) { resolve(worker?.state); return; }
      const timer = window.setTimeout(() => resolve("timeout"), limit);
      worker.addEventListener("statechange", () => { if (["installed", "activated", "redundant"].includes(worker.state)) { window.clearTimeout(timer); resolve(worker.state); } });
    });
  }
  function markReady() {
    document.documentElement.dataset.offlineReady = "true";
    window.dispatchEvent(new CustomEvent("oslab:offline-ready"));
  }
  let pending = null;
  async function run(onProgress) {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let registration;
    try {
      registration = await navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" });
    } catch (error) {
      console.error("Não foi possível preparar o OSLab para uso offline.", error);
      message("Modo offline indisponível", "Recarregue a página quando houver conexão para preparar os arquivos locais.", "warning");
      return { status: "unavailable" };
    }
    // a versão instalada continua valendo quando não há rede para procurar outra
    try { await Promise.race([registration.update(), wait(8000)]); } catch (_) { markReady(); return { status: "offline" }; }
    const worker = registration.installing || registration.waiting;
    if (!worker) { await navigator.serviceWorker.ready; markReady(); return { status: "latest" }; }
    const phase = hadController ? "update" : "install";
    onProgress?.({ phase, done: 0, total: 0 });
    const state = await settled(worker, 90000);
    if (state === "redundant" || state === "timeout") { markReady(); return { status: "failed" }; }
    if (!hadController) { await navigator.serviceWorker.ready; markReady(); return { status: "installed" }; }
    // nova versão baixada: ativa e recarrega já na versão mais recente
    document.documentElement.dataset.updateReady = "true";
    reloadingForUpdate = true;
    worker.postMessage("SKIP_WAITING");
    return { status: "updating" };
  }
  window.OSLabPWA = {
    check(onProgress) {
      if (onProgress) progressListeners.add((data) => onProgress({ phase: navigator.serviceWorker.controller ? "update" : "install", ...data }));
      return (pending ||= run(onProgress));
    },
  };
  window.addEventListener("load", () => window.OSLabPWA.check());
})();
