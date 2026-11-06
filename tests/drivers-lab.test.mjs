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
  for (const file of ["js/core/activity-coordinator.js", "js/drivers/driver-state.js", "js/drivers/driver-missions.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  return { O, downloads, emit: (type, detail) => O.events.emit(type, detail) };
}
function solve({ O, emit }, order) {
  const D = O.drivers, C = D.CORRECT, lab = O.driversLab;
  if (order === 1) { emit("drivers:printer-opened"); emit("drivers:label-viewed"); }
  if (order === 2) { assert.equal(D.testPrint(), "no-driver"); emit("drivers:devmgr-opened"); emit("drivers:devmgr-unknown"); }
  if (order === 3) { emit("drivers:sysinfo-opened"); lab.verifyRecord({ brand: "Printix", model: "InkJet 2350", system: "Windows 11 (64 bits)" }); }
  if (order === 4) emit("drivers:search", { term: "Printix InkJet 2350 driver", ok: true });
  if (order === 5) emit("drivers:result-opened", { official: true });
  if (order === 6) { emit("drivers:site-search"); emit("drivers:product-opened", { product: D.LAB }); }
  if (order === 7) emit("drivers:os-selected", { product: D.LAB, os: "win64" });
  if (order === 8) { emit("install:download-started", { installerId: C }); emit("install:download-completed", { installerId: C }); }
  if (order === 9) { emit("drivers:installer-opened", { fileId: C }); D.connectUsb(); assert.equal(D.install(C).ok, true); }
  if (order === 10) { emit("drivers:devmgr-opened"); emit("drivers:devmgr-properties", { tab: "driver" }); lab.verifyRecord({ version: "3.1.0" }); }
  if (order === 11) assert.equal(D.testPrint(), "ok");
  if (order === 12) { assert.equal(D.testPrint(), "garbled"); assert.equal(D.rollback().ok, true); assert.equal(D.testPrint(), "ok"); }
}

test("as 12 missões abrem em ordem, exigem prática e resposta e somam 120 pontos", () => {
  const f = fixture(), lab = f.O.driversLab;
  assert.equal(lab.TOTAL, 12);
  assert.equal(lab.getMissions()[1].status, "locked");
  for (let order = 1; order <= 12; order++) {
    assert.equal(lab.start(`driver-${order}`).ok, true, `missão ${order}`);
    assert.equal(lab.answer(f.O.driverMissionCatalog[order - 1].quiz.correct).ok, false, "não responde antes da prática");
    solve(f, order);
    assert.equal(lab.getProgress().active.phase, "question", `prática da missão ${order}`);
    const wrong = (f.O.driverMissionCatalog[order - 1].quiz.correct + 1) % 3;
    assert.equal(lab.answer(wrong).correct, false);
    assert.equal(lab.answer(f.O.driverMissionCatalog[order - 1].quiz.correct).correct, true);
  }
  assert.equal(lab.getProgress().totalScore, 120);
});

test("escolhas erradas viram aviso do robô e não concluem a etapa", () => {
  const f = fixture(), lab = f.O.driversLab;
  const reach = (order) => { for (let i = 1; i < order; i++) { lab.start(`driver-${i}`); solve(f, i); lab.answer(f.O.driverMissionCatalog[i - 1].quiz.correct); } lab.start(`driver-${order}`); };
  reach(4); f.emit("drivers:search", { term: "impressora não funciona", ok: false });
  assert.match(lab.getProgress().active.notice, /marca \+ modelo \+ driver/);
  lab.start("driver-4"); solve(f, 4); lab.answer(1);
  lab.start("driver-5"); f.emit("drivers:result-opened", { official: false });
  assert.equal(lab.getProgress().active.checklist.official, undefined);
  solve(f, 5); lab.answer(1);
  lab.start("driver-6"); f.emit("drivers:site-search"); f.emit("drivers:product-opened", { product: "inkjet-2350-pro" });
  assert.match(lab.getProgress().active.notice, /2350 Pro/);
  solve(f, 6); lab.answer(1);
  lab.start("driver-7"); f.emit("drivers:os-selected", { product: "inkjet-2350", os: "win32" });
  assert.equal(lab.getProgress().active.phase, "practice");
  solve(f, 7); lab.answer(1);
  lab.start("driver-8"); f.emit("install:download-started", { installerId: "drv-ij2350-fw" });
  assert.match(lab.getProgress().active.notice, /firmware/i);
});

test("só o driver da InkJet 2350 para 64 bits instala", () => {
  const { O } = fixture(), D = O.drivers;
  assert.deepEqual(["drv-ij2350pro-full", "drv-ij2350-basic32", "drv-ij2350-fw", "drv-ij2350-mac", "drv-ij2530-full"].map(id => D.install(id).reason), ["model", "bits", "firmware", "mac", "model"]);
  assert.equal(D.get().driver, null);
  assert.equal(D.install(D.CORRECT).ok, true);
  assert.equal(D.get().driver.version, "3.1.0");
  D.prepare(9); assert.equal(D.get().usb, false); assert.equal(D.testPrint(), "no-usb");
});

test("progresso sobrevive ao recarregar e pode ser redefinido", () => {
  const f = fixture(); f.O.driversLab.start("driver-1"); solve(f, 1); f.O.driversLab.answer(0);
  const again = fixture(new Map([["oslab.drivers.missions.v1", JSON.stringify(f.O.driversLab.getProgress())]]));
  assert.equal(again.O.driversLab.getProgress().totalScore, 10);
  assert.equal(again.O.driversLab.getMissions()[1].status, "available");
  again.O.driversLab.reset(); assert.equal(again.O.driversLab.getProgress().totalScore, 0);
});
