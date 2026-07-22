(function defineMissionCatalog(global) {
  "use strict";

  const OSLab = global.OSLab = global.OSLab || {};
  const roots = () => OSLab.fileSystem.roots;
  const missionItem = (missionId, input) => OSLab.fileSystem.create({ ...input, createdByMission: true, missionId });
  const item = (id) => OSLab.fileSystem.get(id);
  const eventType = (event, type) => event?.type === type;

  function folderPath(parentId, names, missionId) {
    let current = parentId;
    names.forEach((name) => {
      const existing = OSLab.fileSystem.find(current, name, "folder");
      current = existing?.id || missionItem(missionId, { parentId: current, kind: "folder", name }).id;
    });
    return current;
  }

  const catalog = [
    {
      id: "open-first-app", order: 1, title: "Abrindo seu primeiro aplicativo", categories: ["Primeiros passos", "Aplicativos", "Atalhos"],
      description: "Encontre e abra o Explorador de Arquivos usando o menu Iniciar.", concept: "Menu Iniciar e abertura de aplicativos",
      objectives: [{ id: "start", label: "Abrir o menu Iniciar" }, { id: "explorer", label: "Abrir o Explorador de Arquivos" }],
      hints: ["Use o botão Iniciar no centro da barra de tarefas.", "No menu Iniciar, procure o Explorador de Arquivos."],
      setup(ctx) { ctx.shell.closeApp("explorer"); return {}; },
      validate(event, ctx) {
        if (eventType(event, "start:opened")) ctx.fact("start", true);
        if (eventType(event, "app:opened") && event.detail.appId === "explorer") {
          if (ctx.fact("start")) ctx.fact("explorer", true); else ctx.mistake();
        }
        return [ctx.fact("start") && "start", ctx.fact("explorer") && "explorer"].filter(Boolean);
      },
    },
    {
      id: "window-control", order: 2, title: "Controlando uma janela", categories: ["Primeiros passos", "Aplicativos"],
      description: "Minimize e restaure a mesma janela pela barra de tarefas.", concept: "Gerenciamento de janelas",
      objectives: [{ id: "minimize", label: "Minimizar o Editor de Texto" }, { id: "restore", label: "Restaurar pela barra de tarefas" }],
      hints: ["Use o botão de minimizar no canto superior direito.", "Depois clique no ícone do Editor de Texto na barra de tarefas."],
      setup(ctx) { const record = ctx.shell.openTextEditor({ missionId: ctx.id, title: "Editor de Texto" }); return { windowId: record?.windowId || "texteditor" }; },
      validate(event, ctx) {
        if (event.detail.windowId !== ctx.scenario.windowId) return ctx.completed();
        if (eventType(event, "window:minimized")) ctx.fact("minimize", true);
        if (eventType(event, "window:restored") && ctx.fact("minimize")) ctx.fact("restore", true);
        return [ctx.fact("minimize") && "minimize", ctx.fact("restore") && "restore"].filter(Boolean);
      },
    },
    {
      id: "create-folder", order: 3, title: "Criando uma pasta", categories: ["Arquivos e pastas"],
      description: "Crie uma pasta chamada Atividades Escolares dentro de Documentos.", concept: "Criação e localização de diretórios",
      objectives: [{ id: "folder", label: "Criar Atividades Escolares em Documentos" }],
      hints: ["No Explorador, abra Documentos e use Novo > Pasta.", "Digite exatamente Atividades Escolares."],
      setup(ctx) { const old = OSLab.fileSystem.find(roots().documents, "Atividades Escolares", "folder"); if (old?.missionId === ctx.id) OSLab.fileSystem.delete(old.id); ctx.shell.openFolder(roots().documents); return {}; },
      validate(event, ctx) {
        const found = OSLab.fileSystem.find(roots().documents, "Atividades Escolares", "folder");
        // O Windows cria primeiro "Nova pasta" e só então confirma o nome.
        // Só uma renomeação confirmada incorreta conta como tentativa relevante.
        if (eventType(event, "file:renamed") && !found && event.detail.parentFolderId === roots().documents) ctx.mistake();
        return found ? ["folder"] : [];
      },
    },
    {
      id: "rename-document", order: 4, title: "Renomeando um documento", categories: ["Arquivos e pastas"],
      description: "Renomeie o documento criado pelo laboratório sem substituí-lo.", concept: "Identidade de arquivos e renomeação",
      objectives: [{ id: "rename", label: "Renomear para Atividade de Informática.txt" }],
      hints: ["Selecione documento-novo.txt e use Renomear.", "Mantenha a extensão .txt no final."],
      setup(ctx) { const file = missionItem(ctx.id, { parentId: roots().documents, kind: "file", name: "documento-novo.txt", mime: "text/plain" }); ctx.shell.openFolder(roots().documents); return { fileId: file.id }; },
      validate(event, ctx) {
        const target = item(ctx.scenario.fileId);
        if (eventType(event, "file:renamed") && event.detail.fileId === ctx.scenario.fileId && event.detail.name !== "Atividade de Informática.txt") ctx.mistake();
        return target && target.parentId === roots().documents && target.name === "Atividade de Informática.txt" ? ["rename"] : [];
      },
    },
    {
      id: "move-file", order: 5, title: "Colocando o arquivo no lugar correto", categories: ["Arquivos e pastas"],
      description: "Mova o arquivo da Área de Trabalho para Documentos/Informática.", concept: "Mover arquivos entre diretórios",
      objectives: [{ id: "move", label: "Mover pesquisa-informatica.docx para Informática" }],
      hints: ["Recorte o arquivo na Área de Trabalho.", "Abra Documentos/Informática e use Colar."],
      setup(ctx) { const file = missionItem(ctx.id, { parentId: roots().desktop, kind: "file", name: "pesquisa-informatica.docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }); const folder = missionItem(ctx.id, { parentId: roots().documents, kind: "folder", name: "Informática" }); ctx.shell.refreshDesktop(); ctx.shell.openFolder(roots().desktop); return { fileId: file.id, folderId: folder.id }; },
      validate(event, ctx) {
        const target = item(ctx.scenario.fileId);
        if (eventType(event, "file:copied") && event.detail.sourceId === ctx.scenario.fileId) ctx.mistake();
        return target && !target.trashedAt && target.parentId === ctx.scenario.folderId ? ["move"] : [];
      },
    },
    {
      id: "copy-file", order: 6, title: "Criando uma cópia de segurança", categories: ["Arquivos e pastas", "Segurança"],
      description: "Copie o trabalho final para Backup sem remover o original.", concept: "Cópias de segurança",
      objectives: [{ id: "copy", label: "Manter o original e criar uma cópia em Backup" }],
      hints: ["Copie trabalho-final.pdf, não recorte.", "Cole a cópia dentro da pasta Backup."],
      setup(ctx) { const file = missionItem(ctx.id, { parentId: roots().documents, kind: "file", name: "trabalho-final.pdf", mime: "application/pdf", content: "OSLab PDF" }); const backup = missionItem(ctx.id, { parentId: roots().documents, kind: "folder", name: "Backup" }); ctx.shell.openFolder(roots().documents); return { fileId: file.id, backupId: backup.id }; },
      validate(event, ctx) {
        const original = item(ctx.scenario.fileId);
        const copy = OSLab.fileSystem.list(ctx.scenario.backupId).find((entry) => entry.sourceId === ctx.scenario.fileId && entry.name === "trabalho-final.pdf");
        if (eventType(event, "file:moved") && event.detail.fileId === ctx.scenario.fileId) ctx.mistake();
        return original?.parentId === roots().documents && copy ? ["copy"] : [];
      },
    },
    {
      id: "restore-file", order: 7, title: "Recuperando um arquivo apagado", categories: ["Arquivos e pastas", "Segurança"],
      description: "Restaure o arquivo importante pelo mecanismo real da Lixeira.", concept: "Exclusão segura e recuperação",
      objectives: [{ id: "restore", label: "Restaurar atividade-importante.docx" }],
      hints: ["Abra a Lixeira e selecione atividade-importante.docx.", "Use o botão Restaurar."],
      setup(ctx) { const file = missionItem(ctx.id, { parentId: roots().documents, kind: "file", name: "atividade-importante.docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }); OSLab.fileSystem.delete(file.id); ctx.shell.openRecycleBin(); return { fileId: file.id, originalParentId: roots().documents }; },
      validate(event, ctx) {
        const target = item(ctx.scenario.fileId);
        if (eventType(event, "recycle:restored") && event.detail.fileId !== ctx.scenario.fileId) ctx.mistake();
        return target && !target.trashedAt && target.parentId === ctx.scenario.originalParentId ? ["restore"] : [];
      },
    },
    {
      id: "search-file", order: 8, title: "Encontrando um documento perdido", categories: ["Arquivos e pastas", "Atalhos"],
      description: "Use a pesquisa recursiva do Explorador para encontrar um arquivo profundo.", concept: "Pesquisa e caminhos de arquivos",
      objectives: [{ id: "search", label: "Pesquisar relatorio-final.pdf" }, { id: "select", label: "Selecionar o resultado correto" }],
      hints: ["Use a caixa Pesquisar no canto superior direito do Explorador.", "Pesquise por relatorio-final e selecione o resultado."],
      setup(ctx) { const deep = folderPath(roots().documents, ["Escola", "Informática"], ctx.id); missionItem(ctx.id, { parentId: roots().documents, kind: "file", name: "anotacoes.txt", mime: "text/plain" }); const file = missionItem(ctx.id, { parentId: deep, kind: "file", name: "relatorio-final.pdf", mime: "application/pdf" }); ctx.shell.openFolder(roots().documents); return { fileId: file.id }; },
      validate(event, ctx) {
        if (eventType(event, "file:searched") && event.detail.resultIds?.includes(ctx.scenario.fileId)) ctx.fact("search", true);
        if (eventType(event, "file:selected") && event.detail.fileId === ctx.scenario.fileId && ctx.fact("search")) ctx.fact("select", true);
        return [ctx.fact("search") && "search", ctx.fact("select") && "select"].filter(Boolean);
      },
    },
    {
      id: "change-wallpaper", order: 9, title: "Personalizando o computador", categories: ["Personalização"],
      description: "Troque o plano de fundo para Windows 11 claro.", concept: "Personalização do ambiente",
      objectives: [{ id: "wallpaper", label: "Aplicar o papel de parede Windows 11 claro" }],
      hints: ["Abra Configurações > Personalização.", "Selecione a terceira imagem de plano de fundo."],
      setup(ctx) { ctx.shell.setWallpaper("1"); ctx.shell.openSettings("personalization"); return { targetWallpaperId: "3" }; },
      validate(event, ctx) { return eventType(event, "wallpaper:changed") && event.detail.wallpaperId === ctx.scenario.targetWallpaperId ? ["wallpaper"] : ctx.completed(); },
    },
    {
      id: "adjust-volume", order: 10, title: "Diminuindo o volume da sala", categories: ["Primeiros passos", "Personalização"],
      description: "O som está alto. Ajuste-o para aproximadamente 20%.", concept: "Controle de recursos do sistema",
      objectives: [{ id: "volume", label: "Definir volume entre 18% e 22%, sem mudo" }],
      hints: ["Clique nos ícones de rede e som no canto da barra de tarefas.", "Arraste o volume para perto de 20%."],
      setup(ctx) { ctx.shell.setVolume(100, false); ctx.shell.notify("Som muito alto", "Diminua o volume da sala para 20%.", "warning"); return {}; },
      validate(event, ctx) { const audio = ctx.shell.getAudioState(); return eventType(event, "volume:changed") && audio.volume >= 18 && audio.volume <= 22 && !audio.muted ? ["volume"] : ctx.completed(); },
    },
    {
      id: "close-frozen-app", order: 11, title: "Fechando um programa travado", categories: ["Aplicativos", "Diagnóstico"],
      description: "Encerre um Editor de Texto que não está respondendo.", concept: "Diagnóstico e encerramento de processos",
      objectives: [{ id: "open", label: "Abrir o Gerenciador de Tarefas" }, { id: "locate", label: "Localizar o Editor de Texto" }, { id: "select", label: "Selecionar o processo" }, { id: "end", label: "Finalizar a tarefa" }],
      hints: ["Abra o Gerenciador de Tarefas e procure um processo Não respondendo.", "Selecione Editor de Texto e use Finalizar tarefa."],
      setup(ctx) { const record = ctx.shell.openTextEditor({ missionId: ctx.id, title: "Editor de Texto", frozen: true }); return { windowId: record?.windowId || "texteditor", pid: record?.pid || null }; },
      validate(event, ctx) {
        if (eventType(event, "app:opened") && event.detail.appId === "taskmanager") ctx.fact("open", true);
        if (eventType(event, "process:located") && event.detail.pid === ctx.scenario.pid) ctx.fact("locate", true);
        if (eventType(event, "process:selected") && event.detail.pid === ctx.scenario.pid) ctx.fact("select", true);
        if (eventType(event, "process:ended")) {
          if (event.detail.pid === ctx.scenario.pid && event.detail.reason === "task-manager") ctx.fact("end", !ctx.shell.isWindowOpen(ctx.scenario.windowId));
          else if (event.detail.reason === "task-manager") ctx.mistake();
        }
        return ["open", "locate", "select", "end"].filter((id) => ctx.fact(id));
      },
    },
    {
      id: "organize-school", order: 12, title: "Organizando o computador da escola", categories: ["Arquivos e pastas", "Segurança", "Diagnóstico"],
      description: "Organize arquivos, volume, Lixeira e aplicativos em uma missão final.", concept: "Organização e administração integrada do sistema",
      objectives: [
        { id: "math", label: "Mover trabalho-matematica.pdf" }, { id: "computing", label: "Mover pesquisa-informatica.docx" },
        { id: "pictures", label: "Mover foto-passeio.jpg" }, { id: "volume", label: "Diminuir o volume para 20%" },
        { id: "recycle", label: "Esvaziar a Lixeira" }, { id: "app", label: "Fechar o aplicativo desnecessário" },
      ],
      hints: ["Use Recortar e Colar para organizar cada arquivo.", "Depois ajuste o volume, esvazie a Lixeira e feche o Google."],
      setup(ctx) {
        const school = folderPath(roots().documents, ["Escola"], ctx.id);
        const math = folderPath(school, ["Matemática"], ctx.id); const computing = folderPath(school, ["Informática"], ctx.id); const pictures = folderPath(school, ["Imagens"], ctx.id);
        const mathFile = missionItem(ctx.id, { parentId: roots().desktop, kind: "file", name: "trabalho-matematica.pdf", mime: "application/pdf" });
        const computingFile = missionItem(ctx.id, { parentId: roots().desktop, kind: "file", name: "pesquisa-informatica.docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const pictureFile = missionItem(ctx.id, { parentId: roots().desktop, kind: "file", name: "foto-passeio.jpg", mime: "image/jpeg" });
        const temp = missionItem(ctx.id, { parentId: roots().desktop, kind: "file", name: "temporario.tmp", mime: "application/octet-stream" }); OSLab.fileSystem.delete(temp.id);
        ctx.shell.setVolume(100, false); const app = ctx.shell.openApp("google", { missionId: ctx.id }); ctx.shell.refreshDesktop();
        return { math, computing, pictures, mathFile: mathFile.id, computingFile: computingFile.id, pictureFile: pictureFile.id, unnecessaryWindowId: app?.windowId || "google" };
      },
      validate(_event, ctx) {
        const ready = ctx.scenario.mathFile && ctx.scenario.computingFile && ctx.scenario.pictureFile
          && ctx.scenario.math && ctx.scenario.computing && ctx.scenario.pictures && ctx.scenario.unnecessaryWindowId;
        if (!ready) return ctx.completed();
        const audio = ctx.shell.getAudioState();
        return [
          item(ctx.scenario.mathFile)?.parentId === ctx.scenario.math && "math",
          item(ctx.scenario.computingFile)?.parentId === ctx.scenario.computing && "computing",
          item(ctx.scenario.pictureFile)?.parentId === ctx.scenario.pictures && "pictures",
          audio.volume >= 18 && audio.volume <= 22 && !audio.muted && "volume",
          OSLab.fileSystem.recycleItems().length === 0 && "recycle",
          !ctx.shell.isWindowOpen(ctx.scenario.unnecessaryWindowId) && "app",
        ].filter(Boolean);
      },
    },
  ];

  catalog.forEach((mission) => {
    mission.instructions = mission.description;
    mission.requirements = mission.order === 1 ? [] : [catalog[mission.order - 2]?.id].filter(Boolean);
    mission.cleanup ||= () => {};
    mission.reset ||= () => {};
  });

  OSLab.missionCatalog = Object.freeze(catalog);
})(window);
