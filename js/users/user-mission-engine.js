(function createUserMissionEngine(global) {
  "use strict";
  const O = global.OSLab;
  const listeners = new Set();
  const catalog = O.userMissionCatalog;
  let progress = O.userMissionStorage.load();

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function publish(reason = "changed") { O.userMissionStorage.save(progress); listeners.forEach((fn) => fn(clone(progress), reason)); O.assistantRobot?.render?.(); }
  function normalizedCompleted() {
    const clean = {};
    catalog.forEach((mission, index) => { if (!index || clean[catalog[index - 1].id]) { if (progress.completed[mission.id]) clean[mission.id] = progress.completed[mission.id]; } });
    progress.completed = clean;
    progress.totalScore = Object.values(clean).reduce((sum, item) => sum + Number(item.score || 0), 0);
  }
  normalizedCompleted();
  function getMissions() { return catalog.map((mission, index) => ({ ...mission, status: progress.completed[mission.id] ? "completed" : progress.active?.id === mission.id ? "active" : !index || progress.completed[catalog[index - 1].id] ? "available" : "locked" })); }
  function start(id) {
    const mission = getMissions().find((entry) => entry.id === id);
    if (!mission || mission.status === "locked") return { ok: false, reason: "locked" };
    O.activityCoordinator?.claim?.("users-permissions");
    const resume = progress.active?.id === id && progress.active.suspended && progress.active.phase !== "completed";
    if (resume) progress.active.suspended = false;
    else progress.active = { id, checklist: {}, facts: {}, hintsUsed: 0, mistakes: 0, startedAt: Date.now(), phase: "practice", suspended: false };
    progress.lastMissionId = id;
    publish("started");
    O.assistantRobot?.expand?.();
    if (mission.tool) O.shell?.openApp?.(mission.tool, mission.tool === "settings" ? { settingsView: "accounts" } : {});
    return { ok: true };
  }
  function complete() {
    const active = progress.active;
    const mission = catalog.find((entry) => entry.id === active?.id);
    if (!mission || active.phase === "completed") return;
    const score = Math.max(40, 100 - active.hintsUsed * 10 - active.mistakes * 5);
    const result = { missionId: mission.id, title: mission.title, concept: mission.success, score, mistakes: active.mistakes, hintsUsed: active.hintsUsed, completedAt: Date.now() };
    progress.completed[mission.id] = result;
    progress.totalScore = Object.values(progress.completed).reduce((sum, item) => sum + Number(item.score || 0), 0);
    active.phase = "completed";
    publish("completed");
    O.events.emit("users-mission:completed", { result }, "userMissionEngine");
    O.ui?.notify?.("Missão concluída", `${mission.title}: ${score} pontos.`, "success", 5200);
  }
  function mark(objective, detail = {}) {
    const active = progress.active;
    const mission = catalog.find((entry) => entry.id === active?.id);
    if (!mission || active.suspended || active.phase === "completed" || !mission.objectives.some((item) => item.id === objective)) return;
    active.checklist[objective] = true;
    active.facts[objective] = detail;
    if (mission.objectives.every((item) => active.checklist[item.id])) complete(); else publish("objective");
  }
  function mistake(reason) { if (!progress.active || progress.active.phase === "completed") return; progress.active.mistakes += 1; progress.active.lastMistake = reason; publish("mistake"); }
  function useHint() {
    const active = progress.active;
    const mission = catalog.find((entry) => entry.id === active?.id);
    if (!active || !mission) return null;
    const index = Math.min(active.hintsUsed, mission.hints.length - 1);
    if (active.hintsUsed < mission.hints.length) active.hintsUsed += 1;
    active.lastHint = { title: `Dica ${index + 1}`, intro: mission.hints[index], steps: mission.hints.slice(0, index + 1), check: mission.objectives.find((item) => !active.checklist[item.id])?.label || mission.success };
    publish("hint");
    return clone(active.lastHint);
  }
  function finish(action = "return") {
    const active = progress.active;
    const mission = catalog.find((entry) => entry.id === active?.id);
    if (!active || !mission) return { ok: false, reason: "no-active-mission" };
    if (action === "next" && active.phase !== "completed") return { ok: false, reason: "not-completed" };
    const missionId = mission.id;
    progress.active = null;
    O.activityCoordinator?.release?.("users-permissions");
    publish("finished");
    if (action === "repeat") return start(missionId);
    if (action === "next") {
      const next = catalog.find((entry) => entry.order === mission.order + 1);
      if (next) return start(next.id);
    }
    O.shell?.openApp?.("userspermissions");
    return { ok: true };
  }
  function evaluateFinal() {
    if (progress.active?.id !== "users-7") return;
    const users = O.users.list();
    const software = O.software?.getInstalledPrograms?.() || [];
    const publicItems = O.fileSystem?.list?.(O.fileSystem.roots.public) || [];
    if (users.filter((user) => user.role === "administrator").length >= 1 && users.filter((user) => user.role === "standard").length >= 2) mark("accounts-ready");
    const distinctWalls = new Set(users.map((user) => O.users.getProfile(user.id)?.preferences?.wallpaperId).filter(Boolean));
    if (distinctWalls.size >= 2 && users.some((user) => (O.users.getProfile(user.id)?.privateFileSystem?.items || []).length)) mark("profiles-ready");
    if (software.some((program) => program.scope === "all") && publicItems.some((item) => item.permission === "modify")) mark("lab-ready");
  }
  O.events.subscribe("oslab:event", (event) => {
    const { type, detail } = event;
    const activeId = progress.active?.id;
    if (!activeId) return;
    if (type === "settings:other-users-opened") mark("opened-accounts", detail);
    if (type === "account:created") { mark("created", detail); if (detail.role === "standard") mark("standard", detail); }
    if ((type === "session:signed-in" || type === "session:switched") && detail.userId !== "user-aluno") mark("signed-in", detail);
    if (type === "profile:updated") mark("profile", detail);
    if (type === "wallpaper:changed" && O.users.getCurrent()?.id !== "user-aluno") mark("wallpaper", detail);
    if (type === "file:created" && detail.parentFolderId === O.fileSystem?.roots?.documents) mark("private-file", detail);
    if (type === "file:other-home-opened") mark("other-home", detail);
    if (type === "file:access-denied") mark("denied", detail);
    if (type === "install:completed" && detail.scope === "user") mark("user-install", detail);
    if (type === "install:completed" && detail.scope === "all") mark("all-install", detail);
    if (type === "app:data-saved") mark("app-data", detail);
    if (type === "elevation:denied") mark("uac-denied", detail);
    if (type === "elevation:granted") mark("uac-granted", detail);
    if (type === "account:type-changed") mark("role-changed", detail);
    if (type === "file:created" && detail.parentFolderId === O.fileSystem?.roots?.public) mark("public-file", detail);
    if (type === "file:permission-changed" && detail.permission === "read") mark("read", detail);
    if (type === "file:permission-changed" && detail.permission === "modify") mark("modify", detail);
    if (["account:created", "account:type-changed", "wallpaper:changed", "install:completed", "file:created", "file:permission-changed", "session:switched", "session:signed-in"].includes(type)) evaluateFinal();
    if ((type === "account:create-rejected" || type === "file:write-denied" || type === "elevation:invalid-credentials") && activeId) mistake(type);
  });
  function reset() { progress = O.userMissionStorage.reset(); O.activityCoordinator?.release?.("users-permissions"); publish("reset"); }
  function stop() { if (progress.active) { progress.active.suspended = true; publish("suspended"); } O.activityCoordinator?.release?.("users-permissions"); }
  O.activityCoordinator?.register?.("users-permissions", { isActive: () => Boolean(progress.active && !progress.active.suspended), stop });
  O.userMissions = { catalog, getMissions, getProgress: () => clone(progress), start, finish, complete, mark, mistake, useHint, evaluateFinal, reset, stop, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); } };
})(window);
