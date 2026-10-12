import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const values = new Map();
const emitted = [];
const OSLab = {
  events: { emit(type, detail = {}, source = "test") { emitted.push({ type, detail, source }); return { type, detail, source }; } },
  shell: { refreshPrograms() {}, closeApp() {} },
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

assert.ok(emitted.some((event) => event.type === "account:created"));
assert.ok(emitted.some((event) => event.type === "file:permission-changed"));
assert.ok(emitted.some((event) => event.type === "install:completed" && event.detail.scope === "user"));

console.log("OK  7 missões, contas locais, isolamento, ACLs, escopos de instalação e senhas sem texto puro");
