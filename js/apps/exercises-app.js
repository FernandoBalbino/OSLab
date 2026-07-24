(function createExercisesApp(global) {
  "use strict";
  const OSLab = global.OSLab = global.OSLab || {};
  const records = new Set();
  let selectedId = null;
  let category = "Todos";

  function safe(value) { return OSLab.ui.escapeHtml(value); }
  function statusLabel(status) { return status === "completed" ? "Concluído" : status === "active" ? "Em andamento" : "Não iniciado"; }
  function actionLabel(status) { return status === "completed" ? "Refazer" : status === "active" ? "Continuar" : "Iniciar"; }

  function render(record) {
    records.add(record);
    const exercises = OSLab.exercises.getExercises();
    const progress = OSLab.exercises.getProgress();
    const session = OSLab.exercises.getSession();
    if (session?.id) selectedId = session.id;
    if (!selectedId || !exercises.some((exercise) => exercise.id === selectedId)) selectedId = progress.lastExerciseId || exercises[0].id;
    const selected = exercises.find((exercise) => exercise.id === selectedId) || exercises[0];
    const visible = exercises.filter((exercise) => category === "Todos" || exercise.category === category);
    const completed = Object.keys(progress.completed).length;
    record.address.textContent = "Exercícios de Diagnóstico";
    record.content.innerHTML = `<section class="exercises-page">
      <header class="exercises-hero"><div><span class="exercises-kicker">OSLab · Laboratório prático</span><h1>Exercícios de Diagnóstico</h1><p>Investigue sintomas, use as ferramentas do sistema e confirme a correção com um teste real.</p></div><div class="exercises-overall"><strong>${completed}/10</strong><span>concluídos</span><div><i style="width:${progress.overallProgress}%"></i></div><small>${progress.overallProgress}% do percurso</small></div></header>
      <nav class="exercise-filters" aria-label="Filtrar exercícios">${["Todos", "Sistema", "Rede"].map((item) => `<button type="button" class="${category === item ? "is-active" : ""}" data-exercise-filter="${item}">${item}</button>`).join("")}</nav>
      <div class="exercises-workspace"><div class="exercise-card-grid">${visible.map((exercise) => `<article class="exercise-card is-${exercise.status} ${selected.id === exercise.id ? "is-selected" : ""}" data-exercise-card="${exercise.id}">
        <button type="button" class="exercise-card-select" data-exercise-select="${exercise.id}"><span class="exercise-number">${String(exercise.order).padStart(2, "0")}</span><span class="exercise-card-copy"><strong>${safe(exercise.title)}</strong><small>${safe(exercise.description)}</small></span><span class="exercise-status">${statusLabel(exercise.status)}</span></button>
        <footer><span class="exercise-chip">${safe(exercise.category)}</span><span class="exercise-chip is-difficulty">${safe(exercise.difficulty)}</span><button type="button" data-exercise-start="${exercise.id}">${actionLabel(exercise.status)}</button></footer>
      </article>`).join("")}</div>
      <aside class="exercise-detail"><header><span>${String(selected.order).padStart(2, "0")}</span><div><small>${safe(selected.category)} · ${safe(selected.difficulty)}</small><h2>${safe(selected.title)}</h2></div></header><p>${safe(selected.description)}</p><h3>Objetivo geral</h3><p>${safe(selected.goal)}</p><div class="exercise-detail-note"><strong>Investigue antes de agir</strong><span>A solução não será revelada. O robô acompanhará mudanças reais no sistema.</span></div><button class="exercise-primary-action" type="button" data-exercise-start="${selected.id}">${actionLabel(selected.status)}</button></aside></div>
    </section>`;

    if (!record.exercisesWired) {
      record.exercisesWired = true;
      record.content.addEventListener("click", async (event) => {
        const filter = event.target.closest("[data-exercise-filter]")?.dataset.exerciseFilter;
        const select = event.target.closest("[data-exercise-select]")?.dataset.exerciseSelect;
        const startId = event.target.closest("[data-exercise-start]")?.dataset.exerciseStart;
        if (filter) { category = filter; render(record); return; }
        if (select) { selectedId = select; render(record); return; }
        if (!startId) return;
        const exercise = OSLab.exercises.getExercises().find((item) => item.id === startId);
        if (exercise.status === "active") { OSLab.shell.closeFlyouts?.(); return; }
        if (exercise.status === "completed" && !await OSLab.ui.confirm({ title: "Refazer exercício?", message: "Um novo ambiente será preparado e a tentativa anterior continuará no histórico.", confirmLabel: "Refazer" })) return;
        OSLab.exercises.start(startId); renderAll();
      });
    }
  }
  function renderAll() { records.forEach((record) => record.element?.isConnected ? render(record) : records.delete(record)); }
  OSLab.exercises.subscribe(renderAll);
  OSLab.exercisesApp = { render, renderAll };
})(window);
