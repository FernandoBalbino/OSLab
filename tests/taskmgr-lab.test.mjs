import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** OSLab mínimo: eventos, processos reais, janelas simuladas e armazenamento compartilhável (para "reiniciar") */
function fixture(saved = new Map()) {
  const handlers = new Map(), windows = new Set(), configured = [];
  const O = { events: {
    subscribe(type, fn) { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(fn); return () => handlers.get(type).delete(fn); },
    emit(type, detail = {}, source = "test") { const event = { type, detail, source }; [...handlers.get(type) || [], ...handlers.get("oslab:event") || []].forEach((fn) => fn(event)); },
  }, assistantRobot: { render() {}, expand() {} }, systemState: { configure: (patch) => configured.push(patch) } };
  O.shell = {
    openApp(id, options = {}) { if (!windows.has(id)) { windows.add(id); O.processManager.createProcess({ appId: id, windowId: id, name: id, missionId: options.missionId || null }); O.events.emit("app:opened", { appId: id }); } return { appId: id }; },
    closeApp(id) { if (windows.delete(id)) { const p = O.processManager.getProcesses().find((x) => x.windowId === id); if (p) O.processManager.endByWindow(id, { silent: true }); O.events.emit("app:closed", { appId: id }); } },
    isWindowOpen: (id) => windows.has(id),
    openTextEditor(options) { return O.shell.openApp("texteditor", options); },
    closeMissionWindows() {},
  };
  O.windowManager = { forceCloseById(id) { if (windows.delete(id)) O.events.emit("app:closed", { appId: id, force: true }); } };
  const window = { OSLab: O, localStorage: { getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) }, setTimeout: (fn) => fn() };
  const context = vm.createContext({ window, console });
  for (const file of ["js/core/process-manager.js", "js/core/activity-coordinator.js", "js/taskmgr/taskmgr-missions.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  const emit = (type, detail) => O.events.emit(type, detail);
  const pm = O.processManager, byApp = (appId) => pm.getProcesses().find((p) => p.appId === appId);
  const boot = (reason = "restart") => {
    const apps = pm.getStartupApps().filter((a) => a.enabled && !a.protected).map((a) => a.id);
    emit("system:booted", { reason, startupApps: apps, seconds: pm.estimateBootTime(), restarted: true });
  };
  return { O, saved, windows, configured, emit, pm, byApp, boot, lab: O.taskLab };
}

function solve(f, order) {
  const { emit, pm, byApp, boot, lab } = f;
  if (order === 1) { emit("taskbar:context-menu", { empty: true }); emit("taskbar:task-manager"); }
  if (order === 2) { f.O.shell.openApp("google"); f.O.shell.openApp("explorer"); f.O.shell.openApp("taskmanager"); lab.verifyRecord({ chrome: "Aplicativos", antimalware: "Processos em segundo plano", dwm: "Processos do Windows" }); }
  if (order === 3) {
    emit("window:close-blocked", { appId: "texteditor" }); f.O.shell.openApp("taskmanager");
    ["texteditor", "google", "explorer", "settings", "terminal"].forEach((id) => assert.equal(pm.endProcess(byApp(id).pid).ok, true, id));
  }
  if (order === 4) { emit("taskmanager:search", { query: String(lab.PID) }); emit("taskmanager:nav", { page: "details" }); pm.endProcess(lab.PID); }
  if (order === 5) { emit("start:glitch-click"); pm.restartProcess(byApp("explorer-system").pid); emit("start:opened"); }
  if (order === 6) { emit("taskmanager:nav", { page: "performance" }); emit("taskmanager:sorted", { key: "cpu" }); pm.endProcess(byApp("taskmgr-cpu").pid); emit("taskmanager:nav", { page: "performance" }); }
  if (order === 7) { emit("app:launch-blocked", { appId: "google" }); emit("taskmanager:sorted", { key: "memory" }); pm.endProcess(byApp("taskmgr-mem").pid); f.O.shell.openApp("google"); }
  if (order === 8) { const p = byApp("taskmgr-eff"); emit("process:selected", { appId: p.appId, pid: p.pid }); emit("process:efficiency", { appId: p.appId, pid: p.pid, efficient: true }); }
  if (order === 9) { emit("taskmanager:perf-view", { view: "cpu" }); emit("taskmanager:perf-view", { view: "memory" }); lab.verifyRecord({ cpu: "Intel(R) Celeron(R) N4500", memory: "4,0 GB", disk: "SSD" }); }
  if (order === 10) { boot(); pm.setStartupEnabled("discord", false); boot("shutdown"); }
  if (order === 11) { emit("taskmanager:nav", { page: "startup" }); ["discord", "spotify", "cloud-sync", "game-launcher", "meeting-app"].forEach((id) => pm.setStartupEnabled(id, false)); boot(); }
  if (order === 12) {
    const hung = byApp("texteditor"); pm.updateProcess(hung.pid, { status: "Não respondendo" });
    pm.endProcess(hung.pid); pm.endProcess(byApp("taskmgr-cpu2").pid); pm.setStartupEnabled("spotify", false); boot();
  }
}
const reach = (f, order) => { for (let i = 1; i < order; i++) { f.lab.start(`taskmgr-${i}`); solve(f, i); f.lab.answer(f.O.taskMgrMissionCatalog[i - 1].quiz.correct); f.lab.finish("return"); } return f.lab.start(`taskmgr-${order}`); };

test("as 12 missões abrem em ordem, exigem prática e resposta e somam 120 pontos", () => {
  const f = fixture(), lab = f.lab;
  assert.equal(lab.TOTAL, 12);
  assert.equal(lab.getMissions()[1].status, "locked");
  for (let order = 1; order <= 12; order++) {
    assert.equal(lab.start(`taskmgr-${order}`).ok, true, `missão ${order}`);
    const quiz = f.O.taskMgrMissionCatalog[order - 1].quiz;
    assert.equal(lab.answer(quiz.correct).ok, false, "não responde antes da prática");
    solve(f, order);
    assert.equal(lab.getProgress().active.phase, "question", `prática da missão ${order}`);
    assert.equal(lab.answer((quiz.correct + 1) % 3).correct, false);
    assert.equal(lab.answer(quiz.correct).correct, true);
    lab.finish("return");
  }
  assert.equal(lab.getProgress().totalScore, 120);
});

test("missão 1 só vale pelo espaço vazio da barra de tarefas", () => {
  const f = fixture(); f.lab.start("taskmgr-1");
  f.emit("taskbar:context-menu", { empty: false, appId: "google" });
  assert.match(f.lab.getProgress().active.notice, /espaço VAZIO/);
  f.emit("taskbar:task-manager");
  assert.equal(f.lab.getProgress().active.checklist.open, undefined, "abrir sem o menu certo não conta");
});

test("missão 3: cinco programas abertos e o Editor trava no X", () => {
  const f = fixture(); reach(f, 3);
  assert.deepEqual([...f.windows].filter((id) => id !== "tasklab").sort(), ["explorer", "google", "settings", "terminal", "texteditor"]);
  f.emit("window:close-blocked", { appId: "texteditor" });
  assert.equal(f.lab.getProgress().active.checklist.x, true);
  f.O.shell.closeApp("google");
  assert.equal(f.lab.getProgress().active.phase, "practice", "ainda faltam programas");
});

test("missão 4: finalizar o PID errado avisa e devolve o processo", () => {
  const f = fixture(); reach(f, 4);
  f.pm.endProcess(f.lab.DECOY);
  assert.match(f.lab.getProgress().active.notice, /PID 7430/);
  assert.ok(f.pm.getProcessByPid(f.lab.DECOY), "o processo volta para a lista");
  assert.notEqual(f.lab.getProgress().active.phase, "question");
});

test("missão 8: finalizar em vez de usar Modo de eficiência cancela o download", () => {
  const f = fixture(); reach(f, 8);
  f.pm.endProcess(f.byApp("taskmgr-eff").pid);
  assert.match(f.lab.getProgress().active.notice, /Modo de eficiência/);
  assert.ok(f.byApp("taskmgr-eff"));
});

test("missão 10: precisa ver o Discord abrir antes de desabilitar; Sair não conta como reiniciar", () => {
  const f = fixture(); reach(f, 10);
  assert.equal(f.pm.getStartupApps().find((a) => a.id === "discord").enabled, true);
  f.pm.setStartupEnabled("discord", false);
  assert.match(f.lab.getProgress().active.notice, /Primeiro reinicie/);
  assert.equal(f.pm.getStartupApps().find((a) => a.id === "discord").enabled, true, "volta a ficar habilitado");
  f.emit("session:signed-out");
  assert.match(f.lab.getProgress().active.notice, /Sair só troca de conta/);
  f.boot();
  assert.deepEqual(Object.keys(f.lab.getProgress().active.checklist).sort(), ["boot1", "saw"]);
});

test("reiniciar no meio de uma missão de processo prepara o problema de novo", () => {
  const f = fixture(); reach(f, 6);
  f.emit("taskmanager:nav", { page: "performance" });
  f.pm.reset(); // reiniciar apaga os processos
  f.boot();
  assert.ok(f.byApp("taskmgr-cpu"), "o Conversor de Vídeo volta");
  assert.equal(Object.keys(f.lab.getProgress().active.checklist).length, 0);
  assert.match(f.lab.getProgress().active.notice, /reiniciou no meio/);
});

test("a missão ativa e os programas de inicialização sobrevivem ao recarregar a página", () => {
  const saved = new Map();
  const f = fixture(saved); reach(f, 10); f.boot();
  const again = fixture(saved);
  const a = again.lab.getProgress().active;
  assert.equal(a.id, "taskmgr-10");
  assert.equal(a.checklist.saw, true);
  assert.equal(again.pm.getStartupApps().find((x) => x.id === "discord").enabled, true);
});

test("Gerenciador: Windows Explorer reinicia, processos protegidos não finalizam", () => {
  const { pm, byApp } = fixture();
  assert.equal(pm.endProcess(byApp("system").pid).reason, "protected");
  const explorer = byApp("explorer-system");
  assert.equal(pm.restartProcess(explorer.pid).ok, true);
  assert.ok(byApp("explorer-system"), "voltou com outro PID");
  assert.equal(pm.isExplorerRunning(), true);
  assert.deepEqual(["app", "background", "windows"].filter((k) => pm.getProcesses().some((p) => p.kind === k)), ["background", "windows"]);
});
