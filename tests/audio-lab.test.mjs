import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function fixture(saved = new Map()) {
  const handlers = new Map(), downloads = {};
  const O = { events: {
    subscribe(type, fn) { if (!handlers.has(type)) handlers.set(type, new Set()); handlers.get(type).add(fn); return () => handlers.get(type).delete(fn); },
    emit(type, detail = {}, source = "test") { const event = { type, detail, source }; [...handlers.get(type) || [], ...handlers.get("oslab:event") || []].forEach(fn => fn(event)); },
  }, assistantRobot: { render() {}, expand() {} }, shell: { openApp() {}, closeApp() {} },
  software: { getDownload: id => downloads[id] || null, completeDownload: id => { downloads[id] = { status: "completed" }; }, clearDownloads: f => Object.keys(downloads).filter(f).forEach(id => delete downloads[id]) } };
  const window = { OSLab: O, localStorage: { getItem: key => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) } };
  const context = vm.createContext({ window, console });
  for (const file of ["js/core/activity-coordinator.js", "js/drivers/driver-state.js", "js/audio/audio-state.js", "js/audio/audio-missions.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  return { O, saved, emit: (type, detail) => O.events.emit(type, detail) };
}
function solve({ O, emit }, order) {
  const A = O.audio, C = A.CORRECT, lab = O.audioLab;
  if (order === 1) { emit("audio:aula-opened"); assert.equal(A.test().audible, false); emit("audio:tray-read", { tray: A.get().tray }); }
  if (order === 2) { emit("drivers:devmgr-opened"); emit("devmgr:properties", { id: "aud-unknown", code: 28 }); }
  if (order === 3) { emit("devmgr:properties", { id: "cam", code: 22 }); emit("devmgr:properties", { id: "aud-unknown", code: 28 }); lab.verifyRecord({ triangle: "28", arrow: "22" }); }
  if (order === 4) { emit("drivers:sysinfo-opened"); lab.verifyRecord({ brand: "Vertex", model: "Note 14", system: "Windows 11 (64 bits)" }); }
  if (order === 5) { emit("audio:search", { term: "Vertex Note 14 driver de áudio", ok: true }); emit("audio:result-opened", { official: true }); emit("audio:os-selected", { product: "vn14", os: "win64" }); emit("install:download-started", { installerId: C }); }
  if (order === 6) { emit("audio:installer-opened", { fileId: C }); assert.equal(A.install(C).ok, true); assert.equal(A.get().reason, "restart"); A.restart(); A.test(); }
  if (order === 7) { emit("drivers:devmgr-opened"); A.setEnabled("codec", true); A.test(); }
  if (order === 8) { emit("audio:settings-opened", { page: "sound-devices" }); A.setEnabled("spk", true, "settings"); A.test(); }
  if (order === 9) { assert.equal(A.micTest().mic, false); A.setEnabled("mic", true); A.micTest(); }
  if (order === 10) { emit("audio:tray-read", { tray: A.get().tray }); A.setSystem(60, false); A.test(); }
  if (order === 11) { emit("audio:settings-opened", { page: "sound-mixer" }); A.setAppMuted(false); A.test(); }
  if (order === 12) { assert.equal(A.test().reason, "wrong-output"); A.setOutput("speakers"); A.test(); }
}
const reach = (f, order) => { for (let i = 1; i < order; i++) { f.O.audioLab.start(`audio-${i}`); solve(f, i); f.O.audioLab.answer(f.O.audioMissionCatalog[i - 1].quiz.correct); } f.O.audioLab.start(`audio-${order}`); };

test("as 12 missões abrem em ordem, exigem prática e resposta e somam 120 pontos", () => {
  const f = fixture(), lab = f.O.audioLab;
  assert.equal(lab.TOTAL, 12);
  assert.equal(lab.getMissions()[1].status, "locked");
  for (let order = 1; order <= 12; order++) {
    assert.equal(lab.start(`audio-${order}`).ok, true, `missão ${order}`);
    assert.equal(lab.answer(f.O.audioMissionCatalog[order - 1].quiz.correct).ok, false, "não responde antes da prática");
    solve(f, order);
    assert.equal(lab.getProgress().active.phase, "question", `prática da missão ${order}`);
    const quiz = f.O.audioMissionCatalog[order - 1].quiz;
    assert.equal(lab.answer((quiz.correct + 1) % 3).correct, false);
    assert.equal(lab.answer(quiz.correct).correct, true);
  }
  assert.equal(lab.getProgress().totalScore, 120);
});

test("cada missão prepara uma causa diferente para o mesmo sintoma", () => {
  const { O } = fixture(), A = O.audio;
  const reasons = [1, 7, 8, 10, 11, 12].map((order) => { A.prepare(order); return [A.get().reason, A.get().tray]; });
  assert.deepEqual(reasons, [["nodriver", "nodevice"], ["disabled", "nodevice"], ["spk-disabled", "nodevice"], ["muted", "muted"], ["app-muted", "ok"], ["wrong-output", "ok"]]);
  A.prepare(9); assert.equal(A.get().audible, true); assert.equal(A.get().mic, false);
  A.prepare(3); assert.equal(A.get().camDisabled, true);
});

test("só o driver de áudio do Note 14 para 64 bits instala; depois precisa reiniciar", () => {
  const { O } = fixture(), A = O.audio;
  A.prepare(6);
  assert.deepEqual(["aud-vn14pro-w11", "aud-vn14-w10x86", "app-vn14-console", "vid-vn14-w11", "bios-vn14", "aud-vb14-w11"].map((id) => A.install(id).reason), ["model", "bits", "app", "video", "bios", "model"]);
  assert.equal(A.get().reason, "nodriver");
  A.install(A.CORRECT); assert.equal(A.get().reason, "restart"); assert.equal(A.get().tray, "nodevice");
  A.restart(); assert.equal(A.get().audible, true);
});

test("consertar a coisa errada não conclui: o teste precisa sair som", () => {
  const f = fixture(), lab = f.O.audioLab, A = f.O.audio;
  reach(f, 7);
  f.emit("drivers:devmgr-opened"); A.setSystem(80, false); A.test();
  assert.equal(lab.getProgress().active.phase, "practice");
  assert.match(lab.getProgress().active.notice, /desabilitado/);
  A.setEnabled("codec", true); A.test();
  assert.equal(lab.getProgress().active.phase, "question");
});

test("escolhas erradas no site viram aviso do robô", () => {
  const f = fixture(), lab = f.O.audioLab;
  reach(f, 5);
  f.emit("audio:search", { term: "notebook sem som", ok: false });
  assert.match(lab.getProgress().active.notice, /Vertex Note 14 driver de áudio/);
  f.emit("audio:product-opened", { product: "vn14pro" });
  assert.match(lab.getProgress().active.notice, /Pro/);
  f.emit("install:download-started", { installerId: "app-vn14-console" });
  assert.match(lab.getProgress().active.notice, /aplicativo|Console|driver/i);
  assert.equal(lab.getProgress().active.checklist.download, undefined);
});

test("progresso sobrevive ao recarregar e pode ser redefinido", () => {
  const f = fixture(); f.O.audioLab.start("audio-1"); solve(f, 1); f.O.audioLab.answer(0);
  const again = fixture(new Map([["oslab.audio.missions.v1", JSON.stringify(f.O.audioLab.getProgress())]]));
  assert.equal(again.O.audioLab.getProgress().totalScore, 10);
  assert.equal(again.O.audioLab.getMissions()[1].status, "available");
  again.O.audioLab.reset(); assert.equal(again.O.audioLab.getProgress().totalScore, 0);
});
