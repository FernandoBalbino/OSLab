import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** loja + trilha com relógio controlado: os downloads terminam quando o teste manda */
function fixture(saved = new Map()) {
  const handlers = new Map(), timers = new Map(), windows = new Set();
  let now = 1000, seq = 0;
  const O = { events: {
    subscribe(type, fn) { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(fn); return () => handlers.get(type).delete(fn); },
    emit(type, detail = {}, source = "test") { const event = { type, detail, source }; [...handlers.get(type) || [], ...handlers.get("oslab:event") || []].forEach((fn) => fn(event)); },
  }, assistantRobot: { render() {}, expand() {} }, ui: { notify() {} },
  shell: { openApp(id) { windows.add(id); O.events.emit("app:opened", { appId: id }); }, closeApp(id) { windows.delete(id); }, isWindowOpen: (id) => windows.has(id) },
  storeApps: { resets: [], resetApp(id) { this.resets.push(id); }, CREDENTIALS: { spotify: {}, netflix: {}, discord: {} } } };
  const window = { OSLab: O, localStorage: { getItem: (k) => saved.get(k) ?? null, setItem: (k, v) => saved.set(k, v) },
    setInterval: (fn) => { const id = ++seq; timers.set(id, fn); return id; }, clearInterval: (id) => timers.delete(id), setTimeout: (fn) => fn() };
  const Date = class extends globalThis.Date { static now() { return now; } };
  const context = vm.createContext({ window, console, Date });
  for (const file of ["js/core/activity-coordinator.js", "js/store/store-catalog.js", "js/store/store-state.js", "js/store/store-missions.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  const tick = (ms = 10000) => { now += ms; [...timers.values()].forEach((fn) => fn()); };
  const emit = (type, detail) => O.events.emit(type, detail);
  return { O, saved, windows, tick, emit, lab: O.storeLab, store: O.store };
}
function install(f, id) { assert.equal(f.store.install(id).ok, true, `instalar ${id}`); f.tick(); f.tick(); assert.equal(f.store.isInstalled(id), true); }
function solve(f, order) {
  const { emit, lab } = f;
  if (order === 1) { f.O.shell.openApp("msstore"); emit("store:nav", { page: "apps" }); emit("store:nav", { page: "games" }); }
  if (order === 2) { emit("store:search", { query: "ChatGPT" }); emit("store:product", { id: "chatgpt" }); lab.verifyRecord({ publisher: "OpenAI", price: "Gratuito", rating: "4,0" }); }
  if (order === 3) { install(f, "chatgpt"); emit("store:open-app", { id: "chatgpt", app: "chatgpt" }); emit("chatgpt:message", { text: "oi" }); }
  if (order === 4) { install(f, "spotify"); emit("storeapp:login", { app: "spotify", ok: true }); emit("spotify:play", { track: "x" }); }
  if (order === 5) { install(f, "netflix"); emit("storeapp:login", { app: "netflix", ok: true }); emit("netflix:profile", { profile: "Aluno" }); emit("netflix:play", { title: "x" }); }
  if (order === 6) { install(f, "discord"); emit("storeapp:login", { app: "discord", ok: true }); emit("discord:message", { channel: "geral", text: "oi" }); }
  if (order === 7) { install(f, "brave"); install(f, "opera"); emit("start:app-opened", { appId: "brave" }); emit("browser:action", { action: "search", browserId: "brave" }); }
  if (order === 8) { install(f, "ibispaint"); emit("ibis:draw"); emit("ibis:saved", { name: "desenho.png" }); }
  if (order === 9) { emit("store:category", { category: "Produtividade" }); install(f, "todo"); emit("todo:added", { count: 1 }); emit("todo:added", { count: 2 }); emit("todo:done"); }
  if (order === 10) { emit("store:product", { id: "forza" }); emit("store:product", { id: "minecraft" }); lab.verifyRecord({ forza: "R$ 99,60", minecraft: "14 anos" }); }
  if (order === 11) { emit("store:nav", { page: "library" }); f.store.updateAll(); for (let i = 0; i < 6; i++) f.tick(1500); emit("store:open-app", { id: "spotify" }); }
  if (order === 12) { emit("settings:installed-apps-opened"); f.store.uninstall("opera"); emit("start:opened"); }
}

test("as 12 missões da loja abrem em ordem, exigem prática e resposta e somam 120 pontos", () => {
  const f = fixture(), lab = f.lab;
  assert.equal(lab.TOTAL, 12);
  assert.equal(lab.getMissions()[1].status, "locked");
  for (let order = 1; order <= 12; order++) {
    assert.equal(lab.start(`store-${order}`).ok, true, `missão ${order}`);
    const quiz = f.O.storeMissionCatalog[order - 1].quiz;
    assert.equal(lab.answer(quiz.correct).ok, false, "não responde antes da prática");
    solve(f, order);
    assert.equal(lab.getProgress().active.phase, "question", `prática da missão ${order}`);
    assert.equal(lab.answer((quiz.correct + 1) % 3).correct, false);
    assert.equal(lab.answer(quiz.correct).correct, true);
    lab.finish("return");
  }
  assert.equal(lab.getProgress().totalScore, 120);
});

test("instalar mostra porcentagem e só termina no fim do download", () => {
  const f = fixture(), seen = [];
  f.O.events.subscribe("store:progress", ({ detail }) => seen.push(detail.progress));
  f.store.install("spotify");
  assert.equal(f.store.isInstalled("spotify"), false);
  f.tick(1500);
  assert.ok(f.store.download("spotify").progress > 0 && f.store.download("spotify").progress < 100);
  f.tick(); f.tick();
  assert.equal(f.store.isInstalled("spotify"), true);
  assert.ok(seen.length > 0);
});

test("aplicativo que ainda não existe no OSLab não instala", () => {
  const f = fixture();
  assert.equal(f.store.install("instagram").reason, "not-available");
  assert.equal(f.store.install("forza").reason, "not-available");
  assert.equal(f.store.isInstalled("whatsapp"), true, "o WhatsApp já vem instalado");
});

test("Reiniciar missão volta a loja ao começo da missão (desinstala o que foi instalado)", () => {
  const f = fixture(), lab = f.lab;
  const done = {}; for (let i = 1; i <= 3; i++) done[`store-${i}`] = { score: 10 };
  f.saved.set("oslab.store.missions.v1", JSON.stringify({ version: 1, completed: done, active: null, totalScore: 30 }));
  const g = fixture(f.saved);
  g.lab.start("store-4"); install(g, "spotify"); g.emit("storeapp:login", { app: "spotify", ok: true });
  assert.equal(g.lab.getProgress().active.checklist.login, true);
  g.lab.restart();
  assert.equal(g.store.isInstalled("spotify"), false, "o Spotify volta a ficar desinstalado");
  assert.ok(g.O.storeApps.resets.includes("spotify"), "a conta sai");
  assert.equal(Object.keys(g.lab.getProgress().active.checklist).length, 0);
  void lab;
});

test("senha errada no login vira aviso com a senha certa", () => {
  const f = fixture();
  const done = {}; for (let i = 1; i <= 4; i++) done[`store-${i}`] = { score: 10 };
  f.saved.set("oslab.store.missions.v1", JSON.stringify({ version: 1, completed: done, active: null, totalScore: 40 }));
  const g = fixture(f.saved);
  g.lab.start("store-5"); install(g, "netflix");
  g.emit("storeapp:login", { app: "netflix", ok: false });
  assert.match(g.lab.getProgress().active.notice, /Filmes2026/);
});

test("a missão de desinstalar só aceita o Opera e Configurações abertas", () => {
  const f = fixture();
  const done = {}; for (let i = 1; i <= 11; i++) done[`store-${i}`] = { score: 10 };
  f.saved.set("oslab.store.missions.v1", JSON.stringify({ version: 1, completed: done, active: null, totalScore: 110 }));
  const g = fixture(f.saved);
  g.lab.start("store-12");
  assert.equal(g.store.isInstalled("opera"), true, "a missão instala o Opera para poder desinstalar");
  install(g, "calculator"); g.store.uninstall("calculator");
  assert.match(g.lab.getProgress().active.notice, /Opera/);
});
