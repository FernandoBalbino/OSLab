import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function fixture(saved = new Map()) {
  const handlers = new Map(), events = [];
  const O = { events: {
    subscribe(type, fn) { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(fn); return () => handlers.get(type).delete(fn); },
    emit(type, detail = {}, source = "test") { const event = { type, detail, source }; events.push(event); [...handlers.get(type) || [], ...handlers.get("oslab:event") || []].forEach(fn => fn(event)); },
  }, assistantRobot: { render() {}, expand() {} }, shell: { openApp() {} } };
  const window = { OSLab: O, localStorage: { getItem: key => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) } };
  const context = vm.createContext({ window, console });
  for (const file of ["js/core/network-manager.js", "js/core/activity-coordinator.js", "js/wifi/wifi-mission-catalog.js", "js/wifi/wifi-scenarios.js", "js/wifi/wifi-mission-storage.js", "js/wifi/wifi-mission-engine.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  return { O, saved, events, emit: (type, detail) => O.events.emit(type, detail) };
}
function solve(f, order) {
  const { O, emit } = f, n = O.network;
  if (order <= 2) { emit("wifi:quick-opened"); if (order === 2) n.setAirplaneMode(false); n.setWifi(true, "quickSettings"); }
  if (order === 3) { emit("wifi:list-opened"); emit("wifi:network-selected", { ssid: "Escola_Alunos" }); n.connectWifi("Escola_Alunos", { password: "Alunos2026!" }); }
  if (order === 4) { n.connectWifi("Escola_Alunos"); n.connectWifi("Escola_Alunos", { password: "Alunos2026!" }); }
  if ([5, 6, 8, 10].includes(order)) emit("wifi:page-opened", { page: "properties", ssid: "Escola_Alunos" });
  if (order === 5) n.revealPassword("Escola_Alunos");
  if (order === 6) O.wifiLab.verifyProperties("5 GHz", "WPA2-Personal");
  if (order === 7) { emit("wifi:page-opened", { page: "known" }); n.forgetWifi("Escola_Alunos"); n.connectWifi("Escola_Alunos", { password: "Alunos2026!" }); }
  if (order === 8) n.setWifiProperty("Escola_Alunos", "autoConnect", true);
  if (order === 9) { emit("wifi:page-opened", { page: "signal" }); n.setSignalPosition("near"); }
  if (order === 10) n.setWifiProperty("Escola_Alunos", "metered", true);
}
function reach(f, order) { for (let i = 1; i < order; i++) { f.O.wifiLab.start(`wifi-${i}`); solve(f, i); f.O.wifiLab.answer(f.O.wifiMissionCatalog[i - 1].quiz.correct); } f.O.wifiLab.start(`wifi-${order}`); }

test("as dez missões exigem prática, resposta correta e concedem exatamente 100 pontos", () => {
  const f = fixture(), lab = f.O.wifiLab;
  assert.equal(f.O.wifiMissionCatalog.length, 10);
  for (let i = 1; i <= 10; i++) {
    assert.equal(lab.start(`wifi-${i}`).ok, true);
    assert.equal(lab.getProgress().active.phase, "practice");
    assert.equal(lab.answer(0).ok, false);
    assert.equal(lab.finish("next").ok, false);
    solve(f, i);
    assert.equal(lab.getProgress().active.phase, "question", `prática da missão ${i}`);
    assert.equal(lab.getProgress().totalScore, (i - 1) * 10);
    const correct = f.O.wifiMissionCatalog[i - 1].quiz.correct;
    assert.equal(lab.answer((correct + 1) % 3).correct, false);
    assert.equal(lab.getProgress().active.feedback.correct, false);
    assert.ok(lab.getProgress().active.feedback.text.length > 15);
    assert.equal(lab.finish("next").ok, false);
    assert.equal(lab.answer(correct).correct, true);
    assert.equal(lab.getProgress().active.phase, "completed");
    assert.equal(lab.getProgress().totalScore, i * 10);
    assert.equal(lab.answer(correct).ok, false);
  }
  assert.equal(Object.keys(lab.getProgress().completed).length, 10);
  lab.finish("repeat"); solve(f, 10); lab.answer(0);
  assert.equal(lab.getProgress().totalScore, 100);
});
test("não aceita atalhos, rede errada nem senha incorreta", () => {
  const f = fixture(), lab = f.O.wifiLab;
  assert.equal(lab.start("wifi-10").ok, false);
  lab.start("wifi-1"); f.O.network.setWifi(true, "settings");
  assert.equal(lab.getProgress().active.phase, "practice");
  reach(f, 3);
  f.emit("wifi:list-opened"); f.emit("wifi:network-selected", { ssid: "Escola_Alunos" });
  assert.equal(f.O.network.connectWifi("Escola_Alunos", { password: "incorreta" }).ok, false);
  assert.equal(f.O.network.connectWifi("Escola_Visitantes", { password: "Visita2026!" }).ok, true);
  assert.equal(lab.getProgress().active.phase, "practice");
});
test("esquecer mantém a rede disponível e exige nova autenticação após remover o perfil", () => {
  const f = fixture(); reach(f, 7);
  f.emit("wifi:page-opened", { page: "known" });
  f.O.network.connectWifi("Escola_Alunos", { password: "Alunos2026!" });
  assert.equal(f.O.wifiLab.getProgress().active.phase, "practice");
  f.O.network.forgetWifi("Escola_Alunos");
  assert.equal(f.O.network.getSnapshot().knownNetworks.Escola_Alunos, undefined);
  assert.ok(f.O.network.getSnapshot().availableNetworks.some(n => n.ssid === "Escola_Alunos"));
  assert.equal(f.O.network.connectWifi("Escola_Alunos").ok, false);
  f.O.network.connectWifi("Escola_Alunos", { password: "Alunos2026!" });
  assert.equal(f.O.wifiLab.getProgress().active.phase, "question");
});
test("propriedades exigem consulta e envio explícito das informações corretas", () => {
  const f = fixture(); reach(f, 6);
  assert.equal(f.O.wifiLab.verifyProperties("5 GHz", "WPA2-Personal").ok, false);
  f.emit("wifi:page-opened", { page: "properties", ssid: "Escola_Alunos" });
  assert.equal(f.O.wifiLab.verifyProperties("2,4 GHz", "WPA3-Personal").ok, false);
  assert.equal(f.O.wifiLab.getProgress().active.phase, "practice");
  assert.equal(f.O.wifiLab.verifyProperties("5 GHz", "WPA2-Personal").ok, true);
});
test("pergunta volta à prática se a condição final deixar de ser verdadeira", () => {
  const f = fixture(); f.O.wifiLab.start("wifi-1"); solve(f, 1); f.O.network.setWifi(false);
  assert.equal(f.O.wifiLab.getProgress().active.phase, "practice");
  assert.equal(f.O.wifiLab.answer(0).ok, false);
});
test("pausa restaura a rede anterior, retoma o cenário e dicas não alteram os pontos", () => {
  const f = fixture(), baseline = JSON.stringify(f.O.network.getSnapshot());
  f.O.wifiLab.start("wifi-1");
  for (let i = 0; i < 5; i++) f.O.wifiLab.useHint();
  assert.equal(f.O.wifiLab.getProgress().active.hintsUsed, 3);
  f.O.wifiLab.stop();
  assert.equal(JSON.stringify(f.O.network.getSnapshot()), baseline);
  f.O.wifiLab.start("wifi-1"); assert.equal(f.O.network.getSnapshot().wifiEnabled, false);
  solve(f, 1); f.O.wifiLab.answer(0); assert.equal(f.O.wifiLab.getProgress().totalScore, 10);
  f.O.wifiLab.restart(); assert.equal(f.O.network.getSnapshot().wifiEnabled, false);
  assert.deepEqual(Object.keys(f.O.wifiLab.getProgress().active.checklist), []);
});
test("recarga conserva pergunta, erro e cenário; reset remove somente esta trilha", () => {
  const f = fixture(); f.O.wifiLab.start("wifi-1"); solve(f, 1); f.O.wifiLab.answer(1);
  const reloaded = fixture(f.saved); reloaded.O.wifiLab.initialize();
  assert.equal(reloaded.O.wifiLab.getProgress().active.phase, "question");
  assert.equal(reloaded.O.wifiLab.getProgress().active.feedback.correct, false);
  assert.equal(reloaded.O.network.getSnapshot().wifiEnabled, true);
  f.saved.set("oslab.users.missions.v1", "preservado");
  reloaded.O.wifiLab.reset();
  assert.equal(reloaded.O.wifiLab.getProgress().active, null);
  assert.equal(f.saved.get("oslab.users.missions.v1"), "preservado");
});
test("troca de atividade suspende a trilha e restaura a rede anterior", () => {
  const f = fixture(); f.O.wifiLab.start("wifi-1"); f.O.activityCoordinator.claim("outra-trilha");
  assert.equal(f.O.wifiLab.getProgress().active.suspended, true);
  assert.equal(f.O.network.getSnapshot().connectedSsid, "REDE_OSLAB");
});
test("legado de VPN, DHCP, DNS e conexão com redes conhecidas permanece compatível", () => {
  const f = fixture(), n = f.O.network, state = {};
  n.bind(state, () => {}); assert.equal(n.connectWifi("Casa_OS").ok, true);
  assert.equal(n.browse("google.com").ok, true);
  const reloaded = fixture(); reloaded.O.network.bind(state, () => {});
  assert.equal(reloaded.O.network.getSnapshot().connectedSsid, "Casa_OS");
  n.setAirplaneMode(true); assert.equal(n.getSnapshot().wifiEnabled, false);
  n.setWifi(true); assert.equal(n.getSnapshot().airplaneMode, true);
  assert.equal(n.connectWifi("Casa_OS").ok, true);
  assert.equal(n.getSnapshot().internetAvailable, true);
});
test("a falha de atualização offline mantém o aplicativo pronto sem rejeição não tratada", async () => {
  const listeners = new Map(), errors = [], emitted = [];
  const document = { documentElement: { dataset: {} }, querySelectorAll: () => [], addEventListener() {} };
  const window = { addEventListener: (type, fn) => listeners.set(type, fn), matchMedia: () => ({ matches: false, addEventListener() {} }), dispatchEvent: event => emitted.push(event.type), OSLab: { ui: { notify() {} } } };
  const navigator = { onLine: false, serviceWorker: { addEventListener() {}, ready: Promise.resolve(), register: async () => ({ addEventListener() {}, update: () => Promise.reject(new Error("offline")) }) } };
  vm.runInNewContext(fs.readFileSync(path.join(root, "js/pwa.js"), "utf8"), { window, document, navigator, location: { protocol: "http:", hostname: "127.0.0.1" }, console: { error: (...args) => errors.push(args) }, CustomEvent: class { constructor(type) { this.type = type; } } });
  await listeners.get("load")();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(document.documentElement.dataset.offlineReady, "true");
  assert.ok(emitted.includes("oslab:offline-ready"));
  assert.equal(errors.length, 0);
});
