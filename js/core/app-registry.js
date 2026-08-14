(function createAppRegistry(global) {
  "use strict";

  const OSLab = global.OSLab = global.OSLab || {};
  const definitions = {
    computer: { title: "Computador", icon: "assets/icons/computer.png", address: "Este Computador", task: "explorer", pinned: true },
    explorer: { title: "Explorador de Arquivos", shortTitle: "Explorador", icon: "assets/icons/explorer.png", address: "Início", task: "explorer", pinned: true },
    recycle: { title: "Lixeira", icon: "assets/icons/recycle-bin.png", address: "Lixeira", task: "explorer", pinned: true },
    google: { title: "Google", icon: "assets/icons/google.png", address: "https://www.google.com.br", task: "google", pinned: true },
    settings: { title: "Configurações", icon: "assets/icons/settings.png", address: "Configurações", task: "settings", pinned: true },
    terminal: { title: "Terminal", icon: "assets/icons/terminal.png", address: "Terminal", task: "terminal" },
    taskmanager: { title: "Gerenciador de Tarefas", icon: "assets/icons/taskmanager.png", address: "Processos", task: "taskmanager" },
    missions: { title: "Missões", icon: "assets/learning/icons/target_arrow.svg", address: "Trilha de Missões", task: "missions", pinned: true },
    exercises: { title: "Exercícios", icon: "assets/learning/icons/wrench.svg", address: "Trilha de Exercícios", task: "exercises", pinned: true },
    texteditor: { title: "Editor de Texto", icon: "assets/icons/notepad.png", address: "Documento sem título", task: "texteditor" },
  };

  function get(id) { return definitions[id] ? { id, ...definitions[id] } : null; }
  function list() { return Object.entries(definitions).map(([id, definition]) => ({ id, ...definition })); }
  function register(id, definition) {
    if (!id || !definition?.title) throw new Error("Aplicativo inválido");
    definitions[id] = { ...definitions[id], ...definition };
    OSLab.events.emit("app:registered", { appId: id, app: get(id) }, "appRegistry");
    return get(id);
  }

  function synchronizeStaticEntries(scope = document) {
    scope.querySelectorAll("[data-app]").forEach((entry) => {
      const app = definitions[entry.dataset.app];
      if (!app) return;
      const image = entry.querySelector("img");
      if (image) {
        image.src = app.icon;
        OSLab.icons.fallbackImage(image, "app");
      }
    });
  }

  OSLab.apps = { definitions, get, list, register, synchronizeStaticEntries };
})(window);
