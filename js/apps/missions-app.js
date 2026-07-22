(function createMissionsApp(global) {
  "use strict";
  const OSLab = global.OSLab = global.OSLab || {};
  const records = new Set();
  let selectedId = null;
  let selectedCategory = "Todas";
  let lastActiveId = null;

  function safe(value) { return OSLab.ui.escapeHtml(value); }
  function statusLabel(status) { return ({ locked: "Bloqueada", available: "Disponível", active: "Em andamento", completed: "Concluída" })[status] || status; }
  function statusIcon(status) { return status === "completed" ? OSLab.icons.get("success") : status === "locked" ? "assets/icons/settings-rows/lock.png" : status === "active" ? OSLab.icons.get("warning") : OSLab.icons.get("mission"); }

  function render(record) {
    records.add(record);
    const missions = OSLab.missions.getMissions();
    const progress = OSLab.missions.getProgress();
    if (progress.active?.id && progress.active.id !== lastActiveId) selectedId = progress.active.id;
    lastActiveId = progress.active?.id || null;
    if (!selectedId || !missions.some((mission) => mission.id === selectedId)) selectedId = progress.active?.id || missions.find((mission) => mission.status === "available")?.id || missions[0].id;
    const selected = missions.find((mission) => mission.id === selectedId);
    const categories = ["Todas", "Primeiros passos", "Arquivos e pastas", "Personalização", "Aplicativos", "Atalhos", "Diagnóstico", "Segurança"];
    const visible = missions.filter((mission) => selectedCategory === "Todas" || mission.categories.includes(selectedCategory));
    const completedCount = Object.keys(progress.completed).length;
    record.address.textContent = "Missões";
    record.content.innerHTML = `<section class="missions-page">
      <aside class="missions-sidebar"><div class="missions-brand"><img src="${OSLab.icons.get("mission")}" alt="" /><span><strong>Missões</strong><small>Aprenda na prática</small></span></div><nav>${categories.map((category) => `<button type="button" class="${category === selectedCategory ? "is-active" : ""}" data-mission-category="${safe(category)}"><img src="${category === "Segurança" ? "assets/icons/settings-rows/lock.png" : category === "Personalização" ? "assets/icons/settings-rows/personalize.png" : category === "Diagnóstico" ? "assets/icons/settings-rows/troubleshoot.png" : OSLab.icons.get("checklist")}" alt="" /><span>${safe(category)}</span></button>`).join("")}</nav><button type="button" class="mission-reset-progress" data-mission-action="reset-progress"><img src="assets/icons/ui/refresh.png" alt="" /><span>Redefinir progresso</span></button></aside>
      <main class="missions-main"><header class="missions-header"><div><p>Laboratório OSLab</p><h1>Aprenda o sistema operacional na prática</h1><span>Conclua missões usando o computador simulado.</span></div><div class="missions-progress"><strong>${completedCount}/12</strong><small>missões concluídas</small><div><i style="width:${(completedCount / 12) * 100}%"></i></div></div></header>
      <section class="missions-medals"><span><img src="${OSLab.icons.get("medal")}" alt="" /><strong>Medalhas</strong></span>${progress.medals.length ? progress.medals.map((medal) => `<span class="mission-medal"><img src="${OSLab.icons.get("medal")}" alt="" />${safe(medal)}</span>`).join("") : `<small>Conclua missões para conquistar medalhas.</small>`}</section>
      <div class="missions-content"><section class="mission-card-grid">${visible.map((mission) => `<button type="button" class="mission-card is-${mission.status} ${mission.id === selected.id ? "is-selected" : ""}" data-mission-select="${mission.id}"><span class="mission-order">${String(mission.order).padStart(2, "0")}</span><img src="${statusIcon(mission.status)}" alt="" /><span><strong>${safe(mission.title)}</strong><small>${safe(mission.categories[0])}</small><em><img src="${statusIcon(mission.status)}" alt="" />${statusLabel(mission.status)}</em></span></button>`).join("")}</section>
      <aside class="mission-detail"><header><img src="${statusIcon(selected.status)}" alt="" /><span><small>Missão ${selected.order}</small><h2>${safe(selected.title)}</h2><em class="is-${selected.status}">${statusLabel(selected.status)}</em></span></header><p>${safe(selected.description)}</p><h3>Objetivos</h3><ul>${selected.objectives.map((objective) => `<li class="${progress.active?.id === selected.id && progress.active.checklist[objective.id] ? "is-done" : ""}"><img src="${progress.active?.id === selected.id && progress.active.checklist[objective.id] ? OSLab.icons.get("success") : OSLab.icons.get("checklist")}" alt="" /><span>${safe(objective.label)}</span></li>`).join("")}</ul><div class="mission-detail-actions">${selected.status === "active" ? `<button class="is-primary" type="button" data-mission-action="continue"><img src="${OSLab.icons.get("mission")}" alt="" />Continuar</button><button type="button" data-mission-action="hint"><img src="${OSLab.icons.get("info")}" alt="" />Ver dica</button><button type="button" data-mission-action="restart"><img src="assets/icons/ui/refresh.png" alt="" />Reiniciar</button>` : `<button class="is-primary" type="button" data-mission-action="start" ${selected.status === "locked" ? "disabled" : ""}><img src="${OSLab.icons.get("mission")}" alt="" />${selected.status === "completed" ? "Repetir missão" : "Iniciar missão"}</button>`}</div></aside></div></main>
    </section>`;

    if (!record.missionsWired) {
      record.missionsWired = true;
      record.content.addEventListener("click", async (event) => {
        const category = event.target.closest("[data-mission-category]")?.dataset.missionCategory;
        const select = event.target.closest("[data-mission-select]")?.dataset.missionSelect;
        const action = event.target.closest("[data-mission-action]")?.dataset.missionAction;
        if (category) { selectedCategory = category; render(record); }
        if (select) { selectedId = select; render(record); }
        if (!action) return;
        if (action === "start") { const selectedMission = OSLab.missions.getMissions().find((mission) => mission.id === selectedId); if (selectedMission.status === "completed" && !await OSLab.ui.confirm({ title: "Repetir missão?", message: "Um novo cenário será preparado.", confirmLabel: "Repetir" })) return; OSLab.missions.start(selectedId); renderAll(); }
        if (action === "continue") OSLab.shell.closeFlyouts?.();
        if (action === "hint") { const hint = OSLab.missions.useHint(); if (hint) OSLab.ui.notify("Dica da missão", hint, "info", 6500); }
        if (action === "restart" && await OSLab.ui.confirm({ title: "Reiniciar missão?", message: "O cenário atual será limpo.", confirmLabel: "Reiniciar" })) OSLab.missions.restart();
        if (action === "reset-progress" && await OSLab.ui.confirm({ title: "Redefinir todo o progresso?", message: "Pontuações, medalhas e cenários das missões serão removidos.", confirmLabel: "Redefinir" })) OSLab.missions.resetProgress();
      });
    }
  }

  function renderAll() { records.forEach((record) => { if (record.element?.isConnected) render(record); else records.delete(record); }); }
  OSLab.missions.subscribe(renderAll);
  OSLab.missionsApp = { render, renderAll };
})(window);
