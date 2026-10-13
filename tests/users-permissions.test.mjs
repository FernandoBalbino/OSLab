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
assert.equal(OSLab.userMissions.getProgress().active.phase, "practice", "um evento de uma conta inexistente não conclui a missão");
const missionStudent = await OSLab.users.createAccount({ displayName: "Bia Teste", password: "bia2026" });
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

// Exercise the complete progression using real local state and adverse events.
OSLab.events.emit("profile:updated", { userId: created.account.id }, "test");
assert.equal(OSLab.userMissions.getProgress().active.checklist.profile, undefined);
await OSLab.users.authenticate(missionStudent.account.id, "bia2026");
OSLab.users.updateProfile({ displayName: "Bia Aluna" });
sharedState.wallpaperId = "3";
OSLab.users.captureSystemState(sharedState);
OSLab.events.emit("wallpaper:changed", { wallpaperId: "3" }, "test");
assert.equal(OSLab.userMissions.getProgress().active.phase, "completed");
OSLab.userMissions.finish("next");
const privateDocument = OSLab.fileSystem.create({ parentId: OSLab.fileSystem.roots.documents, kind: "file", name: "Pessoal.txt" });
OSLab.userMissions.stop();
const paused = OSLab.userMissions.getProgress();
OSLab.events.emit("file:other-home-opened", { targetUserId: "user-aluno", actorUserId: missionStudent.account.id });
assert.equal(OSLab.userMissions.getProgress().active.checklist["other-home"], undefined);
OSLab.userMissions.start("users-3");
assert.equal(OSLab.userMissions.getProgress().active.startedAt, paused.active.startedAt);
assert.equal(OSLab.userMissions.getProgress().active.facts["private-file"].fileId, privateDocument.id);
OSLab.events.emit("file:other-home-opened", { targetUserId: "user-aluno", actorUserId: missionStudent.account.id });
OSLab.events.emit("file:access-denied", { targetUserId: created.account.id });
assert.equal(OSLab.userMissions.getProgress().active.phase, "practice");
OSLab.events.emit("file:access-denied", { targetUserId: "user-aluno" });
assert.equal(OSLab.userMissions.getProgress().active.phase, "completed");
OSLab.userMissions.finish("next");
assert.equal(openedApps.at(-1).id, "google", "instalação usa ferramenta sem iniciar outra trilha");
OSLab.software.installBundle("appjavafx", { scope: "user" });
OSLab.software.installBundle("office", { scope: "all", elevated: true });
OSLab.events.emit("app:data-saved", { programId: "word", userId: created.account.id });
assert.equal(OSLab.userMissions.getProgress().active.phase, "practice");
OSLab.software.saveAppPreference("word", "document", "Minha preferência");
assert.equal(OSLab.userMissions.getProgress().active.phase, "completed");
OSLab.userMissions.finish("next");
const targetUser = created.account.id;
OSLab.events.emit("elevation:denied", { action: "install-all", actorUserId: missionStudent.account.id, targetUserId: targetUser });
assert.equal(OSLab.userMissions.getProgress().active.checklist["uac-denied"], undefined);
OSLab.events.emit("elevation:denied", { action: "change-account-type", actorUserId: missionStudent.account.id, targetUserId: targetUser });
OSLab.events.emit("elevation:granted", { action: "change-account-type", actorUserId: missionStudent.account.id, targetUserId: "user-aluno", authorizationId: "wrong" });
assert.equal(OSLab.userMissions.getProgress().active.checklist["uac-granted"], undefined);
OSLab.events.emit("elevation:granted", { action: "change-account-type", actorUserId: missionStudent.account.id, targetUserId: targetUser, authorizationId: "test-operation" });
OSLab.users.setRole(targetUser, "administrator", { authorizationId: "test-operation" });
assert.equal(OSLab.userMissions.getProgress().active.phase, "completed");
OSLab.userMissions.finish("next");
const trackedFile = OSLab.fileSystem.create({ parentId: OSLab.fileSystem.roots.public, kind: "file", name: "Aula.txt" });
const otherFile = OSLab.fileSystem.create({ parentId: OSLab.fileSystem.roots.public, kind: "file", name: "Outro.txt" });
OSLab.fileSystem.setPermission(otherFile.id, "read");
OSLab.fileSystem.setPermission(otherFile.id, "modify");
assert.equal(OSLab.userMissions.getProgress().active.checklist.read, undefined);
OSLab.fileSystem.setPermission(trackedFile.id, "read");
OSLab.fileSystem.setPermission(trackedFile.id, "modify");
assert.equal(OSLab.userMissions.getProgress().active.phase, "completed");
OSLab.users.setRole(targetUser, "standard");
await OSLab.users.authenticate(targetUser, "ana2026");
sharedState.wallpaperId = "4";
OSLab.fileSystem.create({ parentId: OSLab.fileSystem.roots.documents, kind: "file", name: "Ana.txt" });
OSLab.users.captureSystemState(sharedState);
sharedState.theme = "dark";
OSLab.users.captureSystemState(sharedState);
assert.equal(OSLab.users.getProfile(targetUser).preferences.theme, "light");
await OSLab.users.authenticate(missionStudent.account.id, "bia2026");
assert.equal(sharedState.theme, "light", "preferências antigas são normalizadas para claro");
OSLab.userMissions.finish("next");
assert.equal(OSLab.userMissions.getProgress().active.phase, "completed", "desafio final avalia configuração existente no início");
assert.equal(Object.keys(OSLab.userMissions.getProgress().completed).length, 7);
await OSLab.users.authenticate(targetUser, "ana2026");
assert.equal(sharedState.theme, "light", "trocar de perfil mantém somente o tema claro");
const accountCount = OSLab.users.list().length;
OSLab.userMissions.reset();
assert.equal(OSLab.users.list().length, accountCount, "redefinir trilha preserva contas");
assert.ok(OSLab.fileSystem.get(trackedFile.id), "redefinir trilha preserva documentos");
window.OSLab.ui.escapeHtml = value => String(value);
load("js/ui/learning-path.js");
const markup = OSLab.learningPath.renderSections(OSLab.userMissionCatalog.map(m => ({ ...m, status: "available" })), [{ slug: "users", orders: [1], title: "Contas", kicker: "Unidade 1", description: "" }], "users-1", "users-mission");
assert.match(markup, /data-users-mission-select/);
assert.match(markup, /aria-label="Missão 1/);
assert.doesNotMatch(markup, /data-exercise-select/);
const summary = OSLab.learningPath.renderSteps(OSLab.userMissionCatalog[0], { checklist: { "opened-accounts": true } });
assert.match(summary, /Passo a passo/);
assert.match(summary, /is-current/);
assert.match(summary, /is-done/);
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const windowsCss = fs.readFileSync(path.join(root, "css/windows-theme.css"), "utf8");
assert.doesNotMatch(html, /data-quick-action="theme"/);
assert.doesNotMatch(windowsCss, /data-theme="dark"/);
assert.match(windowsCss, /color-scheme: light/);
console.log("OK  sete missões completas, isolamento de contexto, pausa, tema claro, resumo e seletor correto");
