import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const values = new Map();
const emitted = [];
const eventListeners = new Map();
const openedApps = [];
const OSLab = {
  events: {
    emit(type, detail = {}, source = "test") {
      const envelope = { type, detail, source };
      emitted.push(envelope);
      (eventListeners.get(type) || []).forEach((listener) => listener(envelope));
      (eventListeners.get("oslab:event") || []).forEach((listener) => listener(envelope));
      return envelope;
    },
    subscribe(type, listener) {
      if (!eventListeners.has(type)) eventListeners.set(type, new Set());
      eventListeners.get(type).add(listener);
      return () => eventListeners.get(type)?.delete(listener);
    },
  },
  shell: {
    refreshPrograms() {}, closeApp() {},
    openApp(id, options = {}) { openedApps.push({ id, options }); return { appId: id }; },
  },
  activityCoordinator: { claim() {}, release() {}, register() {} },
  assistantRobot: { expand() {}, render() {} },
  ui: { notify() {} },
};
const window = {
  OSLab,
  localStorage: {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  },
  setInterval() { return 1; }, clearInterval() {},
};

function load(relative) {
  vm.runInNewContext(fs.readFileSync(path.join(root, relative), "utf8"), { window, console, Uint8Array, Math, Date, JSON, String, Number, Boolean, Array, Object, Set, Map, TextEncoder });
}

load("js/users/user-state.js");
const sharedState = {
  version: 3, wallpaperId: "1", desktopFolders: [], desktopFiles: [], recycleBin: [], lastSettingsPage: "home", desktopView: "medium", desktopSort: "manual", lastRename: null,
  fileSystem: { version: 2, items: [] },
};
OSLab.users.bindSystemState(sharedState);

assert.equal((await OSLab.users.authenticate("user-aluno", "senha errada")).ok, false);
assert.equal((await OSLab.users.authenticate("user-aluno", "alunos2026")).ok, true);
const created = await OSLab.users.createAccount({ displayName: "Ana Laboratório", password: "ana2026", role: "standard" });
assert.equal(created.ok, true);
assert.equal(created.account.role, "standard");
assert.equal(values.get(OSLab.users.storageKey).includes("ana2026"), false, "a senha não pode ser persistida em texto puro");

sharedState.wallpaperId = "2";
sharedState.fileSystem.items.push({ id: "private-aluno", parentId: "root-documents", kind: "file", name: "aluno.txt", ownerId: "user-aluno", permission: "private" });
OSLab.users.captureSystemState(sharedState);
OSLab.users.signOut();
OSLab.users.selectUser(created.account.id);
assert.equal((await OSLab.users.authenticate(created.account.id, "ana2026")).ok, true);
assert.equal(sharedState.fileSystem.items.some((item) => item.id === "private-aluno"), false, "o novo perfil não pode herdar arquivos privados");
assert.equal(sharedState.wallpaperId, "1", "o novo perfil começa com preferências próprias");

load("js/core/file-system.js");
OSLab.fileSystem.bind(sharedState, () => OSLab.users.captureSystemState(sharedState));
const publicFile = OSLab.fileSystem.create({ parentId: OSLab.fileSystem.roots.public, kind: "file", name: "Avisos.txt", mime: "text/plain" });
assert.equal(publicFile.ownerId, created.account.id);
assert.equal(OSLab.fileSystem.setPermission(publicFile.id, "modify").ok, true);
assert.equal(OSLab.fileSystem.get(publicFile.id).permission, "modify");

load("js/install/software-state.js");
assert.equal(OSLab.software.installBundle("appjavafx", { scope: "user" }).ok, true, "usuário padrão pode instalar no próprio perfil");
assert.equal(OSLab.software.getProgram("appjavafx").scope, "user");
assert.equal(OSLab.software.installBundle("office", { scope: "all" }).reason, "elevation-required");
assert.equal(OSLab.software.installBundle("office", { scope: "all", elevated: true }).ok, true);
assert.ok(OSLab.software.getInstalledPrograms().some((program) => program.id === "word" && program.scope === "all"));

load("js/users/user-mission-catalog.js");
assert.equal(OSLab.userMissionCatalog.length, 7);
assert.deepEqual(Array.from(OSLab.userMissionCatalog, (mission) => mission.order), [1, 2, 3, 4, 5, 6, 7]);
OSLab.userMissionCatalog.forEach((mission) => {
  assert.equal(mission.objectives.length, 3);
  assert.equal(mission.hints.length, 3);
  assert.ok(mission.instruction && mission.goal && mission.success);
});

load("js/users/user-mission-storage.js");
load("js/users/user-mission-engine.js");
assert.equal(OSLab.userMissions.start("users-1").ok, true);
const blockedAdvance = OSLab.userMissions.finish("next");
assert.equal(blockedAdvance.ok, false, "não deve avançar antes de concluir");
assert.equal(blockedAdvance.reason, "not-completed");
OSLab.events.emit("settings:other-users-opened", {}, "test");
OSLab.events.emit("account:created", { userId: "user-regression", role: "standard" }, "test");
const firstMission = OSLab.userMissions.getProgress();
assert.equal(firstMission.active.id, "users-1");
assert.equal(firstMission.active.phase, "completed");
assert.equal(OSLab.userMissions.getMissions().find((mission) => mission.id === "users-2").status, "available");
assert.equal(OSLab.userMissions.finish("next").ok, true);
const secondMission = OSLab.userMissions.getProgress();
assert.equal(secondMission.active.id, "users-2");
assert.equal(secondMission.active.phase, "practice");
assert.equal(JSON.parse(values.get("oslab.users.missions.v1")).version, 1, "o formato persistido continua na versão 1");
assert.ok(openedApps.some((entry) => entry.id === "settings" && entry.options.settingsView === "accounts"));

assert.ok(emitted.some((event) => event.type === "account:created"));
assert.ok(emitted.some((event) => event.type === "file:permission-changed"));
assert.ok(emitted.some((event) => event.type === "install:completed" && event.detail.scope === "user"));

console.log("OK  7 missões, progressão real, contas locais, isolamento, ACLs, escopos e senhas sem texto puro");
