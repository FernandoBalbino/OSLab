"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const results = [];

function test(name, callback) {
  try { callback(); results.push({ name, ok: true }); }
  catch (error) { results.push({ name, ok: false, error }); }
}

function filesIn(directory, extension) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(target, extension) : entry.name.endsWith(extension) ? [target] : [];
  });
}

test("todos os JavaScripts passam no node --check", () => {
  const scripts = [path.join(root, "script.js"), ...filesIn(path.join(root, "js"), ".js")];
  scripts.forEach((file) => {
    const check = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    assert.equal(check.status, 0, `${path.relative(root, file)}: ${check.stderr}`);
  });
});

test("todas as referências raster estáticas existem", () => {
  const sources = [path.join(root, "index.html"), path.join(root, "styles.css"), ...filesIn(path.join(root, "css"), ".css"), path.join(root, "script.js"), ...filesIn(path.join(root, "js"), ".js")];
  const missing = new Set();
  const assetPattern = /(?:assets\/[A-Za-z0-9_./ -]+|bg\d*|logow11)\.(?:png|jpe?g|webp)/gi;
  sources.forEach((source) => {
    const contents = fs.readFileSync(source, "utf8");
    (contents.match(assetPattern) || []).forEach((reference) => {
      if (!fs.existsSync(path.join(root, reference.replaceAll("/", path.sep)))) missing.add(reference);
    });
  });
  assert.deepEqual([...missing], []);
});

test("catálogo possui 12 missões lineares e executáveis", () => {
  const context = { window: { OSLab: {} } };
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/missions/mission-catalog.js"), "utf8"), context);
  const catalog = context.window.OSLab.missionCatalog;
  assert.equal(catalog.length, 12);
  assert.deepEqual(Array.from(catalog, (mission) => mission.order), Array.from({ length: 12 }, (_, index) => index + 1));
  assert.equal(new Set(catalog.map((mission) => mission.id)).size, 12);
  catalog.forEach((mission) => {
    assert.ok(mission.title && mission.description && mission.concept);
    assert.ok(mission.objectives.length > 0 && mission.hints.length > 0);
    assert.equal(typeof mission.setup, "function");
    assert.equal(typeof mission.validate, "function");
  });
});

test("sistema de arquivos preserva ID ao mover e sourceId ao copiar", () => {
  const emitted = [];
  const context = { window: { OSLab: { events: { emit: (...args) => emitted.push(args) } } } };
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/core/file-system.js"), "utf8"), context);
  const api = context.window.OSLab.fileSystem;
  const state = { version: 2, desktopFolders: [], desktopFiles: [], recycleBin: [] };
  api.bind(state, () => {});
  const folder = api.create({ parentId: api.roots.documents, kind: "folder", name: "Informática" });
  const file = api.create({ parentId: api.roots.desktop, kind: "file", name: "atividade.docx" });
  const large = api.create({ parentId: api.roots.documents, kind: "file", name: "video.mp4", sizeBytes: 5000 });
  assert.equal(api.bytesForItem(large.id), 5000);
  const usedBeforeTrash = api.usedBytes();
  api.delete(large.id);
  assert.equal(api.usedBytes(), usedBeforeTrash, "mover para a Lixeira não libera espaço");
  api.emptyRecycleBin();
  assert.equal(api.usedBytes(), usedBeforeTrash - 5000, "esvaziar a Lixeira libera o tamanho do arquivo");
  assert.equal(api.move(file.id, folder.id).id, file.id);
  const copy = api.copy(file.id, api.roots.documents);
  assert.notEqual(copy.id, file.id);
  assert.equal(copy.sourceId, file.id);
  api.delete(folder.id);
  assert.ok(api.get(file.id).trashedAt);
  api.restore(folder.id);
  assert.equal(api.get(file.id).parentId, folder.id);
  assert.equal(api.search("atividade", api.roots.documents).length, 2);
  assert.ok(emitted.some(([type]) => type === "recycle:restored"));
});

test("processos essenciais são protegidos e aplicativos podem encerrar", () => {
  const emitted = []; const closed = [];
  const context = { window: { OSLab: {
    events: { emit: (...args) => emitted.push(args) }, icons: { get: () => "assets/icons/taskmanager/services.png" },
    windowManager: { forceCloseById: (id) => closed.push(id) },
  } } };
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/core/process-manager.js"), "utf8"), context);
  const api = context.window.OSLab.processManager;
  assert.ok(api.getProcesses().every((entry) => entry.icon && entry.memory < 100));
  assert.equal(api.endProcess(136).reason, "protected");
  const app = api.createProcess({ appId: "texteditor", windowId: "texteditor", name: "Editor de Texto" });
  assert.equal(api.endProcess(app.pid, { reason: "task-manager" }).ok, true);
  assert.deepEqual(closed, ["texteditor"]);
  assert.ok(emitted.some(([type, detail]) => type === "process:ended" && detail.pid === app.pid));
  const security = api.getStartupApps().find((entry) => entry.id === "windows-security");
  assert.equal(api.setStartupEnabled(security.id, false).reason, "protected");
  const cloud = api.getStartupApps().find((entry) => entry.id === "cloud-sync");
  const before = api.estimateBootTime();
  api.setStartupEnabled(cloud.id, true);
  assert.ok(api.estimateBootTime() > before);
});

test("catálogo possui os 10 exercícios de diagnóstico completos", () => {
  const context = { window: { OSLab: {} } };
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/exercises/exercise-catalog.js"), "utf8"), context);
  const catalog = context.window.OSLab.exerciseCatalog;
  assert.equal(catalog.length, 10);
  assert.deepEqual(Array.from(catalog, (exercise) => exercise.order), Array.from({ length: 10 }, (_, index) => index + 1));
  assert.equal(new Set(catalog.map((exercise) => exercise.id)).size, 10);
  catalog.forEach((exercise) => {
    assert.ok(exercise.title && exercise.description && exercise.goal && exercise.initialSpeech);
    assert.ok(["Sistema", "Rede"].includes(exercise.category));
    assert.equal(typeof exercise.hint, "string");
    assert.equal(typeof exercise.setup, "function");
    assert.equal(typeof exercise.isReady, "function");
    assert.equal(typeof exercise.test, "function");
  });
});

test("rede virtual respeita Wi-Fi, sub-rede, DHCP e DNS", () => {
  const emitted = [];
  const context = { window: { OSLab: { events: { emit: (...args) => emitted.push(args) } } } };
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/core/network-manager.js"), "utf8"), context);
  const network = context.window.OSLab.network;
  network.setWifi(false);
  assert.equal(network.getSnapshot().adapterConnected, false);
  network.setWifi(true); network.connectWifi("REDE_OSLAB");
  assert.equal(network.getSnapshot().internetAvailable, true);
  network.setIpConfig({ ip: "192.168.2.100", mask: "255.255.255.0", gateway: "192.168.1.1" });
  assert.equal(network.ping("192.168.1.1").ok, false);
  network.setDhcp(true);
  assert.equal(network.ping("192.168.1.1").ok, true);
  network.setDns("203.0.113.99", false);
  assert.equal(network.ping("8.8.8.8").ok, true);
  assert.equal(network.ping("google.com").ok, false);
  network.setDns("8.8.8.8", false);
  assert.equal(network.browse("google.com").ok, true);
  assert.ok(emitted.some(([type]) => type === "network:changed"));
});

test("motor de exercícios limita dica, troca sessão e restaura snapshot", () => {
  let saved; let restored = 0; let solved = false;
  const OSLab = {
    exerciseStorage: { load: () => ({ version: 1, completed: {}, attempts: {}, hints: {}, overallProgress: 0, lastExerciseId: null }), save: (value) => { saved = JSON.parse(JSON.stringify(value)); }, reset: () => ({ version: 1, completed: {}, attempts: {}, hints: {}, overallProgress: 0, lastExerciseId: null }) },
    exerciseCatalog: [1, 2].map((order) => ({ id: `ex-${order}`, order, title: `Ex ${order}`, hint: "Uma dica", initialSpeech: "Problema", cause: "Causa", tool: "Ferramenta", setup: () => ({}), isReady: () => solved, test: () => solved })),
    systemState: { beginEphemeral: () => ({ base: true }), endEphemeral: () => { restored += 1; } },
    activityCoordinator: { claim: () => {}, release: () => {}, register: () => {} },
    shell: { openApp: () => {} }, diagnostics: [],
    events: { subscribe: () => {}, emit: () => {} },
  };
  const context = { window: { OSLab } };
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/exercises/exercise-engine.js"), "utf8"), context);
  const engine = OSLab.exercises;
  engine.start("ex-1");
  assert.equal(engine.useHint(), "Uma dica");
  assert.equal(engine.useHint(), null);
  engine.start("ex-2");
  assert.equal(restored, 1);
  solved = true;
  assert.equal(engine.runTest().ok, true);
  assert.ok(saved.completed["ex-2"]);
  engine.finish("return");
  assert.equal(restored, 2);
});

test("precache inclui todos os recursos carregados pelo documento", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "precache-manifest.json"), "utf8"));
  const entries = new Set(manifest.map((entry) => entry.replace(/^\.\//, "")));
  manifest.forEach((entry) => assert.ok(fs.existsSync(path.join(root, entry.replace(/^\.\//, ""))), `ausente: ${entry}`));
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const runtime = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map((match) => match[1].replace(/^\.\//, "")).filter((entry) => /\.(?:js|css|png|jpe?g|webp|webmanifest)$/i.test(entry));
  runtime.forEach((entry) => assert.ok(entries.has(entry) || ["manifest.webmanifest", "assets/icons/pwa-192.png"].includes(entry), `fora do precache: ${entry}`));
});

test("retomada das missões não referencia persist inexistente", () => {
  const source = fs.readFileSync(path.join(root, "js/missions/mission-engine.js"), "utf8");
  assert.equal(/\bpersist\s*\(\s*\)/.test(source), false);
});

test("missão final não conclui durante a preparação do cenário", () => {
  const subscriptions = new Map();
  const eventTrace = [];
  const OSLab = { diagnostics: [] };
  OSLab.events = {
    subscribe(type, listener) { if (!subscriptions.has(type)) subscriptions.set(type, new Set()); subscriptions.get(type).add(listener); return () => subscriptions.get(type).delete(listener); },
    emit(type, detail = {}, source = "test") { const event = { eventId: `test-${Date.now()}`, type, occurredAt: new Date().toISOString(), source, detail }; eventTrace.push(type); subscriptions.get(type)?.forEach((listener) => listener(event)); subscriptions.get("oslab:event")?.forEach((listener) => listener(event)); return event; },
  };
  const context = { window: { OSLab } };
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/core/file-system.js"), "utf8"), context);
  const state = { version: 3, desktopFolders: [], desktopFiles: [], recycleBin: [] };
  OSLab.fileSystem.bind(state, () => {});
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/missions/mission-catalog.js"), "utf8"), context);
  const completed = Object.fromEntries(OSLab.missionCatalog.slice(0, 11).map((mission) => [mission.id, { score: 100 }]));
  let saved;
  OSLab.missionStorage = { load: () => ({ version: 1, active: null, completed, medals: [], totalScore: 1100 }), save: (value) => { saved = JSON.parse(JSON.stringify(value)); }, reset: () => ({ version: 1, active: null, completed: {}, medals: [], totalScore: 0 }) };
  const openWindows = new Set(); let volume = 20; let muted = false;
  OSLab.processManager = { resetMissionProcesses: () => [] };
  OSLab.shell = {
    getWallpaper: () => "3", getAudioState: () => ({ volume, muted }),
    setWallpaper: () => {}, setVolume(value, isMuted) { volume = value; muted = isMuted; OSLab.events.emit("volume:changed", { volume, muted }); },
    openApp(id) { openWindows.add(id); OSLab.events.emit("app:opened", { appId: id, windowId: id }); return { windowId: id }; },
    isWindowOpen: (id) => openWindows.has(id), refreshDesktop: () => {}, closeMissionWindows: () => {}, notify: () => {},
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/missions/mission-engine.js"), "utf8"), context);
  const result = OSLab.missions.start("organize-school");
  assert.equal(result.ok, true);
  const current = OSLab.missions.getProgress();
  assert.ok(current.active, JSON.stringify({ eventTrace, current }, null, 2));
  assert.equal(current.active.id, "organize-school");
  assert.equal(current.completed["organize-school"], undefined);
  assert.ok(saved.active.scenario.mathFile && saved.active.scenario.unnecessaryWindowId === "google");
  const scenario = current.active.scenario;
  OSLab.fileSystem.move(scenario.mathFile, scenario.math);
  OSLab.fileSystem.move(scenario.computingFile, scenario.computing);
  OSLab.fileSystem.move(scenario.pictureFile, scenario.pictures);
  OSLab.shell.setVolume(20, false);
  OSLab.fileSystem.emptyRecycleBin();
  openWindows.delete("google");
  OSLab.events.emit("app:closed", { appId: "google", windowId: "google" });
  const completedFinal = OSLab.missions.getProgress();
  assert.equal(completedFinal.active, null);
  assert.equal(completedFinal.completed["organize-school"].score, 100);
});

const failed = results.filter((result) => !result.ok);
results.forEach((result) => console.log(`${result.ok ? "OK" : "FALHA"}  ${result.name}${result.ok ? "" : `\n      ${result.error.stack}`}`));
console.log(`\n${results.length - failed.length}/${results.length} verificações aprovadas.`);
if (failed.length) process.exitCode = 1;
