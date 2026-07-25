(function createAssistantRobot(global) {
  "use strict";
  const OSLab = global.OSLab = global.OSLab || {};
  let root = null;

  function safe(value) { return OSLab.ui.escapeHtml(value); }
  function ensure() {
    if (root) return root;
    root = document.createElement("aside"); root.className = "assistant-robot is-hidden"; root.setAttribute("aria-live", "polite");
    document.querySelector("#desktop")?.appendChild(root); return root;
  }
  function robotSvg() {
    return `<svg viewBox="0 0 96 110" role="img" aria-label="Robô assistente"><path class="robot-antenna" d="M48 18V8"/><circle class="robot-signal" cx="48" cy="6" r="4"/><rect class="robot-head" x="14" y="19" width="68" height="55" rx="22"/><rect class="robot-face" x="23" y="30" width="50" height="32" rx="14"/><circle class="robot-eye" cx="37" cy="46" r="5"/><circle class="robot-eye" cx="59" cy="46" r="5"/><path class="robot-mouth" d="M39 56h18"/><rect class="robot-body" x="25" y="72" width="46" height="30" rx="14"/><path class="robot-arm" d="M25 81 10 91M71 81l15 10"/></svg>`;
  }
  function phaseLabel(phase) { return ({ preparing: "Preparando ambiente", investigating: "Investigando", partial: "Progresso detectado", "awaiting-test": "Pronto para testar", testing: "Testando", completed: "Concluído" })[phase] || phase; }
  function render() {
    ensure();
    const session = OSLab.exercises.getSession();
    if (!session) { root.classList.add("is-hidden"); root.innerHTML = ""; return; }
    const exercise = OSLab.exerciseCatalog.find((item) => item.id === session.id);
    root.className = `assistant-robot mood-${session.mood || "waiting"} phase-${session.phase}`;
    const completed = session.phase === "completed";
    const hint = session.hint;
    const hintMarkup = hint && !completed ? `<section class="robot-hint"><header><small>Dica passo a passo</small><strong>${safe(hint.title)}</strong></header><p>${safe(hint.intro)}</p><ol>${hint.steps.map((step) => `<li>${safe(step)}</li>`).join("")}</ol><div><strong>Como conferir</strong><span>${safe(hint.check)}</span></div></section>` : "";
    root.innerHTML = `<div class="robot-speech"><header><span><small>${phaseLabel(session.phase)}</small><strong>${safe(exercise.title)}</strong></span><button type="button" data-robot-toggle aria-label="Recolher ajudante">−</button></header><p>${safe(session.speech)}</p>${hintMarkup}${completed ? `<section class="robot-result"><span><strong>Causa</strong>${safe(session.result.cause)}</span><span><strong>Ferramenta</strong>${safe(session.result.tool)}</span><span><strong>Dica</strong>${session.result.hintUsed ? "Utilizada" : "Não utilizada"}</span></section>` : ""}<footer>${completed ? `<button type="button" data-robot-action="return">Voltar</button><button type="button" data-robot-action="repeat">Refazer</button><button class="is-primary" type="button" data-robot-action="next">Próximo</button>` : `<button type="button" data-robot-action="hint" ${session.hintUsed ? "disabled" : ""}>${session.hintUsed ? "Dica utilizada" : "Dica"}</button><button type="button" data-robot-action="repeat-speech">Repetir fala</button><button class="is-primary" type="button" data-robot-action="test">Testar novamente</button><button type="button" data-robot-action="restart">Reiniciar</button><button type="button" data-robot-action="exit">Sair</button>`}</footer></div><div class="robot-character">${robotSvg()}</div>`;
    root.querySelector("[data-robot-toggle]")?.addEventListener("click", () => root.classList.toggle("is-collapsed"));
    root.querySelectorAll("[data-robot-action]").forEach((button) => button.addEventListener("click", async () => {
      const action = button.dataset.robotAction;
      if (action === "hint") OSLab.exercises.useHint();
      if (action === "repeat-speech") { const copy = OSLab.exercises.repeatSpeech(); if (copy) OSLab.ui.notify("Robô assistente", copy, "info", 5200); }
      if (action === "test") OSLab.exercises.runTest();
      if (action === "restart" && await OSLab.ui.confirm({ title: "Reiniciar exercício?", message: "O ambiente será restaurado e o problema preparado novamente.", confirmLabel: "Reiniciar" })) OSLab.exercises.restart();
      if (action === "exit" && await OSLab.ui.confirm({ title: "Sair do exercício?", message: "O sistema voltará exatamente ao estado anterior.", confirmLabel: "Sair" })) OSLab.exercises.exit();
      if (["return", "repeat", "next"].includes(action)) OSLab.exercises.finish(action);
    }));
  }
  document.addEventListener("DOMContentLoaded", render);
  OSLab.exercises.subscribe(render);
  OSLab.assistantRobot = { render };
})(window);
