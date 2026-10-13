(function createSoftwareState(global) {
  "use strict";

  const OSLab = global.OSLab = global.OSLab || {};
  const STORAGE_KEY = "oslab.software.state.v1";
  const DOWNLOAD_DURATION_MS = 60000;
  const listeners = new Set();
  const timers = new Map();

  const programs = Object.freeze({
    appjavafx: Object.freeze({ id: "appjavafx", name: "AppJavaFX", icon: "assets/programs/appjavafx.svg", version: "1.0.0", publisher: "OSLAB Software", size: "80 MB" }),
    word: Object.freeze({ id: "word", name: "Word", icon: "assets/programs/word.svg", version: "2026.1", publisher: "OSLAB Educação", size: "146 MB" }),
    excel: Object.freeze({ id: "excel", name: "Excel", icon: "assets/programs/excel.svg", version: "2026.1", publisher: "OSLAB Educação", size: "138 MB" }),
    slides: Object.freeze({ id: "slides", name: "Apresentações Slides", icon: "assets/programs/slides.svg", version: "2026.1", publisher: "OSLAB Educação", size: "121 MB" }),
  });

  const installers = Object.freeze({
    appjavafx: Object.freeze({ id: "appjavafx", productName: "AppJavaFX", fileName: "AppJavaFX-Setup.exe", totalMb: 80, programIds: ["appjavafx"], icon: "assets/programs/appjavafx.svg" }),
    office: Object.freeze({ id: "office", productName: "Pacote Office", fileName: "OfficeSetup.exe", totalMb: 420, programIds: ["word", "excel", "slides"], icon: "assets/programs/office.svg" }),
  });

  function blankProgram(program) {
    return { ...program, installed: false, desktopShortcut: false, startMenuShortcut: false, installDate: null, scope: null, ownerUserId: null, installations: { all: false, users: {} }, shortcutsByUser: {}, dataByUser: {} };
  }

  function defaults() {
    return {
      version: 1,
      downloads: {},
      installedPrograms: Object.fromEntries(Object.values(programs).map((program) => [program.id, blankProgram(program)])),
      openedPrograms: {},
      searches: [],
      sitesVisited: {},
      installersOpened: {},
      lastUpdatedAt: null,
    };
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function normalize(value) { return String(value || "").trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " "); }
  function load() {
    try {
      const parsed = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || typeof parsed !== "object") return defaults();
      const base = defaults();
      Object.keys(programs).forEach((id) => {
        base.installedPrograms[id] = { ...base.installedPrograms[id], ...(parsed.installedPrograms?.[id] || {}) };
        const saved = parsed.installedPrograms?.[id] || {};
        base.installedPrograms[id].installations = saved.installations && typeof saved.installations === "object"
          ? { all: Boolean(saved.installations.all), users: { ...(saved.installations.users || {}) } }
          : { all: Boolean(saved.installed), users: {} };
        base.installedPrograms[id].shortcutsByUser = { ...(saved.shortcutsByUser || {}) };
        base.installedPrograms[id].dataByUser = { ...(saved.dataByUser || {}) };
      });
      base.downloads = parsed.downloads && typeof parsed.downloads === "object" ? parsed.downloads : {};
      base.openedPrograms = parsed.openedPrograms && typeof parsed.openedPrograms === "object" ? parsed.openedPrograms : {};
      base.searches = Array.isArray(parsed.searches) ? parsed.searches.slice(-40) : [];
      base.sitesVisited = parsed.sitesVisited && typeof parsed.sitesVisited === "object" ? parsed.sitesVisited : {};
      base.installersOpened = parsed.installersOpened && typeof parsed.installersOpened === "object" ? parsed.installersOpened : {};
      base.lastUpdatedAt = parsed.lastUpdatedAt || null;
      return base;
    } catch (_error) { return defaults(); }
  }

  let state = load();

  function save() {
    state.lastUpdatedAt = new Date().toISOString();
    try { global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_error) { /* O laboratório continua em memória. */ }
  }

  function notify(reason, detail = {}) {
    save();
    const current = clone(state);
    listeners.forEach((listener) => listener(current, reason, clone(detail)));
    OSLab.events?.emit?.("software:changed", { reason, state: current, ...detail }, "softwareState");
    OSLab.shell?.refreshPrograms?.();
    return current;
  }

  function finishDownload(installerId) {
    const download = state.downloads[installerId];
    if (!download || download.status === "completed") return download || null;
    global.clearInterval(timers.get(installerId));
    timers.delete(installerId);
    download.status = "completed";
    download.progress = 100;
    download.downloadedMb = download.totalMb;
    download.completedAt = new Date().toISOString();
    notify("download-completed", { installerId, download: clone(download) });
    OSLab.events.emit("install:download-completed", { installerId, fileName: download.fileName, durationMs: DOWNLOAD_DURATION_MS }, "softwareState");
    OSLab.ui?.notify?.("Download concluído", `${download.fileName} está pronto para abrir.`, "success", 5200);
    return clone(download);
  }

  function updateDownload(installerId) {
    const download = state.downloads[installerId];
    if (!download || download.status !== "downloading") return;
    const elapsed = Math.max(0, Date.now() - Number(download.startedAt || Date.now()));
    if (elapsed >= DOWNLOAD_DURATION_MS) { finishDownload(installerId); return; }
    download.progress = Math.min(99, Math.floor(elapsed / DOWNLOAD_DURATION_MS * 100));
    download.downloadedMb = Math.min(download.totalMb, Number((download.totalMb * elapsed / DOWNLOAD_DURATION_MS).toFixed(1)));
    notify("download-progress", { installerId, progress: download.progress });
  }

  function ensureTimer(installerId) {
    if (timers.has(installerId)) return;
    timers.set(installerId, global.setInterval(() => updateDownload(installerId), 500));
    updateDownload(installerId);
  }

  function resumeDownloads() {
    Object.values(state.downloads).forEach((download) => {
      if (download.status !== "downloading") return;
      if (Date.now() - Number(download.startedAt || 0) >= DOWNLOAD_DURATION_MS) finishDownload(download.installerId);
      else ensureTimer(download.installerId);
    });
  }

  function startDownload(installerId) {
    const installer = installers[installerId];
    if (!installer) return { ok: false, reason: "missing" };
    const current = state.downloads[installerId];
    if (current?.status === "downloading") { ensureTimer(installerId); return { ok: true, download: clone(current), existing: true }; }
    if (current?.status === "completed") return { ok: true, download: clone(current), existing: true };
    state.downloads[installerId] = {
      id: `download-${installerId}`,
      installerId,
      fileName: installer.fileName,
      totalMb: installer.totalMb,
      downloadedMb: 0,
      progress: 0,
      status: "downloading",
      startedAt: Date.now(),
      completedAt: null,
    };
    notify("download-started", { installerId, download: clone(state.downloads[installerId]) });
    OSLab.events.emit("install:download-started", { installerId, fileName: installer.fileName, durationMs: DOWNLOAD_DURATION_MS }, "softwareState");
    ensureTimer(installerId);
    return { ok: true, download: clone(state.downloads[installerId]) };
  }

  function recordSearch(query) {
    const term = normalize(query);
    if (!term) return null;
    state.searches.push({ term, searchedAt: new Date().toISOString() });
    state.searches = state.searches.slice(-40);
    notify("search", { term });
    OSLab.events.emit("install:search", { term }, "softwareState");
    return term;
  }

  function visitSite(siteId) {
    if (!installers[siteId]) return false;
    state.sitesVisited[siteId] = new Date().toISOString();
    notify("site-visited", { siteId });
    OSLab.events.emit("install:site-visited", { siteId }, "softwareState");
    return true;
  }

  function openInstaller(installerId) {
    const installer = installers[installerId];
    const download = state.downloads[installerId];
    if (!installer || download?.status !== "completed") return { ok: false, reason: "download-incomplete" };
    state.installersOpened[installerId] = new Date().toISOString();
    notify("installer-opened", { installerId });
    OSLab.events.emit("install:installer-opened", { installerId, fileName: installer.fileName }, "softwareState");
    OSLab.shell?.closeApp?.("installer");
    const record = OSLab.shell?.openApp?.("installer", { installerId });
    return { ok: Boolean(record), record };
  }

  function installBundle(installerId, options = {}) {
    const installer = installers[installerId];
    if (!installer) return { ok: false, reason: "missing" };
    const userId = OSLab.users?.getCurrent?.()?.id || "user-aluno";
    const scope = options.scope === "user" ? "user" : "all";
    if (scope === "all" && OSLab.users && !OSLab.users.isAdministrator() && !options.elevated) return { ok: false, reason: "elevation-required" };
    const installDate = new Date().toLocaleDateString("pt-BR");
    installer.programIds.forEach((programId) => {
      const previous = state.installedPrograms[programId];
      const installations = { all: Boolean(previous.installations?.all), users: { ...(previous.installations?.users || {}) } };
      if (scope === "all") installations.all = true;
      else installations.users[userId] = true;
      state.installedPrograms[programId] = {
        ...previous,
        installed: true,
        desktopShortcut: programId === "appjavafx" ? Boolean(options.desktopShortcut) : false,
        startMenuShortcut: true,
        installDate,
        scope,
        ownerUserId: scope === "user" ? userId : null,
        installations,
        shortcutsByUser: { ...(previous.shortcutsByUser || {}), [userId]: { desktop: programId === "appjavafx" ? Boolean(options.desktopShortcut) : false, start: true } },
      };
    });
    notify("installed", { installerId, programIds: [...installer.programIds], desktopShortcut: Boolean(options.desktopShortcut), scope, ownerId: scope === "user" ? userId : null });
    OSLab.events.emit("install:completed", { installerId, programIds: [...installer.programIds], desktopShortcut: Boolean(options.desktopShortcut), scope, actorUserId: userId, ownerId: scope === "user" ? userId : null }, "softwareState");
    return { ok: true, programIds: [...installer.programIds], scope };
  }

  function markOpened(programId) {
    const program = effectiveProgram(programId);
    if (!program?.installed) return false;
    const userId = OSLab.users?.getCurrent?.()?.id || "user-aluno";
    state.openedPrograms[`${userId}:${programId}`] = new Date().toISOString();
    notify("program-opened", { programId });
    OSLab.events.emit("install:program-opened", { programId }, "softwareState");
    return true;
  }

  function uninstall(programId, options = {}) {
    const program = state.installedPrograms[programId];
    const userId = OSLab.users?.getCurrent?.()?.id || "user-aluno";
    if (!effectiveProgram(programId)?.installed) return { ok: false, reason: "not-installed" };
    const scope = options.scope || (program.installations?.users?.[userId] && !program.installations?.all ? "user" : "all");
    if (scope === "all" && OSLab.users && !OSLab.users.isAdministrator() && !options.elevated) return { ok: false, reason: "elevation-required" };
    if (scope === "user") { delete program.installations.users[userId]; delete program.shortcutsByUser?.[userId]; }
    else { program.installations.all = false; program.shortcutsByUser = {}; }
    const stillInstalled = program.installations.all || Object.values(program.installations.users).some(Boolean);
    state.installedPrograms[programId] = { ...program, installed: Boolean(stillInstalled), desktopShortcut: false, startMenuShortcut: Boolean(stillInstalled), installDate: stillInstalled ? program.installDate : null };
    delete state.openedPrograms[`${userId}:${programId}`];
    OSLab.shell?.closeApp?.(programId);
    notify("uninstalled", { programId, scope, ownerId: scope === "user" ? userId : null });
    OSLab.events.emit("install:uninstalled", { programId, scope, ownerId: scope === "user" ? userId : null, removedFromDesktop: true, removedFromStartMenu: true }, "softwareState");
    return { ok: true };
  }

  function effectiveProgram(programId) {
    const program = state.installedPrograms[programId];
    if (!program) return null;
    const userId = OSLab.users?.getCurrent?.()?.id || "user-aluno";
    const all = Boolean(program.installations?.all);
    const own = Boolean(program.installations?.users?.[userId]);
    const shortcut = program.shortcutsByUser?.[userId] || {};
    return { ...clone(program), installed: all || own, scope: all ? "all" : own ? "user" : null, ownerUserId: own && !all ? userId : null, desktopShortcut: Boolean(shortcut.desktop || (all && program.desktopShortcut)), startMenuShortcut: Boolean(shortcut.start || (all && program.startMenuShortcut)) };
  }
  function saveAppPreference(programId, key, value) {
    const program = state.installedPrograms[programId];
    const userId = OSLab.users?.getCurrent?.()?.id || "user-aluno";
    if (!program || !effectiveProgram(programId)?.installed) return false;
    program.dataByUser = program.dataByUser || {};
    program.dataByUser[userId] = { ...(program.dataByUser[userId] || {}), [String(key)]: value };
    notify("app-data", { programId, userId, key: String(key) });
    OSLab.events.emit("app:data-saved", { programId, userId, key: String(key) }, "softwareState");
    return true;
  }
  function isInstalled(programId) { return Boolean(effectiveProgram(programId)?.installed); }
  function installedList() { return Object.keys(state.installedPrograms).map(effectiveProgram).filter((program) => program?.installed); }
  function reset() {
    timers.forEach((timer) => global.clearInterval(timer));
    timers.clear();
    Object.keys(programs).forEach((id) => OSLab.shell?.closeApp?.(id));
    OSLab.shell?.closeApp?.("installer");
    state = defaults();
    try { global.localStorage.removeItem(STORAGE_KEY); } catch (_error) { /* Sem persistência, a sessão ainda é redefinida. */ }
    notify("reset");
    OSLab.events.emit("install:reset", {}, "softwareState");
    return clone(state);
  }

  resumeDownloads();

  OSLab.software = {
    storageKey: STORAGE_KEY,
    DOWNLOAD_DURATION_MS,
    programs,
    installers,
    getState: () => clone(state),
    getProgram: effectiveProgram,
    getDownload: (id) => state.downloads[id] ? clone(state.downloads[id]) : null,
    getInstalledPrograms: installedList,
    isInstalled,
    startDownload,
    recordSearch,
    visitSite,
    openInstaller,
    installBundle,
    markOpened,
    uninstall,
    saveAppPreference,
    reset,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
})(window);
