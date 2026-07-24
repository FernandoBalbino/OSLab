(function defineExerciseCatalog(global) {
  "use strict";

  const OSLab = global.OSLab = global.OSLab || {};
  const GB = 1024 ** 3;
  const MB = 1024 ** 2;
  const exerciseTag = (id) => `exercise:${id}`;
  const exerciseFile = (id, input) => OSLab.fileSystem.create({ ...input, createdByExercise: true, exerciseId: id });

  const catalog = [
    {
      id: "storage-full", order: 1, title: "Armazenamento cheio", category: "Sistema", difficulty: "Fácil",
      description: "Um download importante não inicia porque o computador informa que não há espaço disponível.",
      goal: "Descobrir o que ocupa o disco e liberar espaço suficiente.",
      initialSpeech: "Estou tentando baixar um arquivo, mas o computador diz que não há espaço suficiente. Será que existe alguma coisa ocupando muito armazenamento?",
      hint: "O sistema mostra quanto espaço cada local utiliza. Lembre que arquivos na Lixeira ainda continuam ocupando o disco.",
      success: "Agora o download terminou! Você encontrou o que estava ocupando o armazenamento e liberou espaço suficiente.",
      cause: "Arquivos grandes e itens mantidos na Lixeira deixaram menos espaço livre que o download precisava.", tool: "Configurações de Armazenamento, Explorador e Lixeira",
      setup(ctx) {
        const folder = exerciseFile(ctx.id, { parentId: OSLab.fileSystem.roots.documents, kind: "folder", name: "Projetos arquivados" });
        [
          ["captura-aula-01.mp4", 1.55 * GB], ["material-antigo.iso", 1.4 * GB], ["backup-fotos.zip", 1.2 * GB],
          ["leia-me.txt", 18 * 1024], ["cronograma.pdf", 620 * 1024],
        ].forEach(([name, sizeBytes]) => exerciseFile(ctx.id, { parentId: folder.id, kind: "file", name, sizeBytes }));
        const total = 237 * GB;
        const reserved = Math.max(0, total - OSLab.fileSystem.usedBytes() - 420 * MB);
        OSLab.systemState.configure({ storageTotalBytes: total, systemReservedBytes: reserved, requiredDownloadBytes: 2 * GB });
        ctx.shell.refreshDesktop();
        ctx.shell.notify("Armazenamento insuficiente", "Não foi possível concluir o download de suporte-offline.zip.", "warning");
        return { folderId: folder.id, requiredBytes: 2 * GB };
      },
      isReady(ctx) { return OSLab.systemState.getStorage().freeBytes >= ctx.scenario.requiredBytes; },
      test(ctx) { return ctx.shell.tryDiagnosticDownload(ctx.scenario.requiredBytes, ctx.id); },
    },
    {
      id: "frozen-program", order: 2, title: "Programa travado", category: "Sistema", difficulty: "Fácil",
      description: "Um aplicativo congelou, exibe 'Não respondendo' e não fecha normalmente.",
      goal: "Identificar e encerrar somente o processo travado.",
      initialSpeech: "O Editor de Texto congelou e o botão fechar não funciona. Preciso recuperar o computador sem encerrar processos importantes.",
      hint: "Uma ferramenta do Windows permite visualizar processos em execução e finalizar um aplicativo que deixou de responder.",
      success: "O programa finalmente fechou. Você identificou o processo travado e encerrou a tarefa correta.",
      cause: "O processo do Editor de Texto parou de responder.", tool: "Gerenciador de Tarefas",
      setup(ctx) { const record = ctx.shell.openTextEditor({ missionId: exerciseTag(ctx.id), title: "Editor de Texto", frozen: true }); return { pid: record.pid, windowId: record.windowId }; },
      isReady(ctx) { return !OSLab.processManager.getProcessByPid(ctx.scenario.pid); },
      test(ctx) { return !OSLab.processManager.getProcessByPid(ctx.scenario.pid) && !ctx.shell.isWindowOpen(ctx.scenario.windowId); },
    },
    {
      id: "high-cpu", order: 3, title: "Computador muito lento", category: "Sistema", difficulty: "Média",
      description: "Janelas e aplicativos estão demorando porque algum processo usa quase toda a CPU.",
      goal: "Localizar o maior consumo de CPU e encerrar o processo responsável.",
      initialSpeech: "Tudo ficou muito lento de repente. Parece que algum programa está usando recursos demais.",
      hint: "No Gerenciador de Tarefas, compare ou ordene os valores da coluna CPU para encontrar o consumo fora do normal.",
      success: "O computador voltou ao normal. O processo que estava consumindo quase toda a CPU foi encerrado.",
      cause: "O Sincronizador de Mídia ficou preso usando 96% da CPU.", tool: "Gerenciador de Tarefas",
      setup(ctx) {
        const process = OSLab.processManager.createProcess({ appId: "media-sync", name: "Sincronizador de Mídia", icon: "assets/icons/settings-rows/video.png", cpu: 96, memory: 186, missionId: exerciseTag(ctx.id) });
        OSLab.systemState.configure({ slowMode: true }); return { pid: process.pid };
      },
      isReady(ctx) { return !OSLab.processManager.getProcessByPid(ctx.scenario.pid); },
      test(ctx) { const ok = !OSLab.processManager.getProcessByPid(ctx.scenario.pid) && OSLab.systemState.getPerformance().cpuPercent < 30; if (ok) OSLab.systemState.configure({ slowMode: false }); return ok; },
    },
    {
      id: "low-memory", order: 4, title: "Memória RAM insuficiente", category: "Sistema", difficulty: "Média",
      description: "Vários aplicativos estão abertos e o navegador não consegue iniciar por falta de memória.",
      goal: "Liberar RAM sem finalizar processos essenciais e abrir o navegador.",
      initialSpeech: "Preciso abrir o navegador, mas aparece uma mensagem de memória insuficiente. Alguns programas podem estar consumindo RAM demais.",
      hint: "Aplicativos e processos continuam usando memória mesmo minimizados. Compare a coluna Memória no Gerenciador de Tarefas.",
      success: "O aplicativo abriu corretamente. Você liberou memória fechando os programas que estavam consumindo recursos.",
      cause: "Três aplicativos auxiliares consumiam quase toda a RAM disponível.", tool: "Gerenciador de Tarefas",
      setup(ctx) {
        ctx.shell.closeApp("google");
        const pids = ["Editor de Vídeo", "Biblioteca de Fotos", "Sincronizador de Backup"].map((name, index) => OSLab.processManager.createProcess({ appId: `memory-hog-${index}`, name, icon: "assets/settings/Apps.webp", cpu: 1 + index, memory: 1120, missionId: exerciseTag(ctx.id) }).pid);
        OSLab.systemState.configure({ blockedAppId: "google", requiredAppMemoryMb: 650 });
        ctx.shell.notify("Memória insuficiente", "O Google não pode ser iniciado enquanto houver pouca memória disponível.", "warning");
        return { pids, targetApp: "google" };
      },
      isReady() { return OSLab.systemState.getPerformance().memoryFreeMb >= 650; },
      test(ctx) { const record = ctx.shell.openApp(ctx.scenario.targetApp, { missionId: exerciseTag(ctx.id) }); return Boolean(record && ctx.shell.isWindowOpen(ctx.scenario.targetApp)); },
    },
    {
      id: "slow-startup", order: 5, title: "Inicialização lenta", category: "Sistema", difficulty: "Média",
      description: "O computador demora muito para iniciar por causa de vários aplicativos automáticos.",
      goal: "Reduzir o impacto da inicialização mantendo o serviço essencial ativo.",
      initialSpeech: "Toda vez que ligo o computador preciso esperar muito. Muitos programas parecem iniciar junto com o Windows.",
      hint: "O Gerenciador de Tarefas possui uma seção que mostra os aplicativos executados na inicialização e o impacto de cada um.",
      success: "O computador iniciou muito mais rápido. Você reduziu a quantidade de programas executados automaticamente.",
      cause: "Aplicativos de alto impacto estavam configurados para iniciar automaticamente.", tool: "Aplicativos de inicialização do Gerenciador de Tarefas",
      setup(ctx) {
        OSLab.processManager.getStartupApps().forEach((app) => { if (!app.protected) OSLab.processManager.setStartupEnabled(app.id, true); });
        const before = OSLab.processManager.estimateBootTime(); OSLab.systemState.configure({ lastBootSeconds: before });
        ctx.shell.openApp("taskmanager"); return { before, targetSeconds: 18 };
      },
      isReady(ctx) { const apps = OSLab.processManager.getStartupApps(); return apps.find((app) => app.id === "windows-security")?.enabled && OSLab.processManager.estimateBootTime() <= ctx.scenario.targetSeconds; },
      test(ctx) { const seconds = ctx.shell.simulateRestart(); return seconds < ctx.scenario.before && seconds <= ctx.scenario.targetSeconds; },
    },
    {
      id: "wifi-disabled", order: 6, title: "Wi-Fi desativado", category: "Rede", difficulty: "Fácil",
      description: "Nenhuma rede sem fio aparece e as páginas não carregam.",
      goal: "Ativar o adaptador, escolher uma rede e restabelecer o acesso.",
      initialSpeech: "Nenhuma rede aparece e o navegador diz que estou desconectado. O adaptador sem fio pode estar desligado.",
      hint: "Quando nenhuma rede aparece, verifique primeiro se o Wi-Fi está realmente ativado nas Configurações ou na bandeja.",
      success: "A internet voltou! O adaptador Wi-Fi estava desativado e agora a conexão foi restabelecida.",
      cause: "O adaptador Wi-Fi estava desligado.", tool: "Configurações de Rede e Internet",
      setup() { OSLab.network.restoreSnapshot({ ...OSLab.network.defaults, wifiEnabled: false, connectedSsid: null, airplaneMode: false, connectionType: "wifi" }); return {}; },
      isReady() { const net = OSLab.network.getSnapshot(); return net.wifiEnabled && net.connectedSsid === "REDE_OSLAB" && net.internetAvailable; },
      test() { return OSLab.network.browse("google.com").ok; },
    },
    {
      id: "airplane-mode", order: 7, title: "Modo avião ativado", category: "Rede", difficulty: "Fácil",
      description: "Todas as conexões sem fio desapareceram e o ícone de avião está ativo.",
      goal: "Desativar o modo avião e reconectar o Wi-Fi.",
      initialSpeech: "O computador perdeu as conexões sem fio de uma vez. Vi um ícone diferente perto do relógio.",
      hint: "Existe uma configuração que desativa todas as conexões sem fio. Observe os controles próximos ao relógio.",
      success: "O modo avião estava bloqueando as conexões. Agora o computador está conectado novamente.",
      cause: "O modo avião desligou o adaptador Wi-Fi.", tool: "Configurações rápidas",
      setup() { OSLab.network.restoreSnapshot({ ...OSLab.network.defaults, airplaneMode: true, wifiEnabled: false, connectedSsid: null, connectionType: "wifi" }); return {}; },
      isReady() { const net = OSLab.network.getSnapshot(); return !net.airplaneMode && net.wifiEnabled && Boolean(net.connectedSsid) && net.internetAvailable; },
      test() { return OSLab.network.browse("google.com").ok; },
    },
    {
      id: "ethernet-cable", order: 8, title: "Cabo de rede desconectado", category: "Rede", difficulty: "Fácil",
      description: "A conexão Ethernet informa que o cabo está desconectado.",
      goal: "Reconectar o cabo virtual e receber as configurações da rede.",
      initialSpeech: "Este computador usa cabo, mas a rede mostra 'Cabo desconectado'. Você pode verificar a ligação?",
      hint: "Uma conexão Ethernet depende da ligação física entre o computador e o equipamento de rede.",
      success: "O cabo foi conectado e o computador recebeu as configurações da rede.",
      cause: "O cabo Ethernet virtual estava fora da porta.", tool: "Painel Ethernet",
      setup() { OSLab.network.restoreSnapshot({ ...OSLab.network.defaults, connectionType: "ethernet", ethernetCableConnected: false, connectedSsid: null }); return {}; },
      isReady() { const net = OSLab.network.getSnapshot(); return net.connectionType === "ethernet" && net.ethernetCableConnected && net.internetAvailable; },
      test() { return OSLab.network.browse("google.com").ok; },
    },
    {
      id: "wrong-ip", order: 9, title: "Configuração IP incorreta", category: "Rede", difficulty: "Média",
      description: "O computador parece conectado, mas não consegue comunicar-se com o roteador.",
      goal: "Colocar o computador na mesma rede do gateway usando DHCP ou configuração manual.",
      initialSpeech: "A conexão está ativa, mas não consigo alcançar o roteador. Talvez alguma configuração do endereço esteja diferente.",
      hint: "Compare o endereço IP e a máscara do computador com o endereço do roteador. Eles precisam pertencer à mesma rede.",
      success: "O computador agora está na mesma rede do roteador e conseguiu se comunicar com ele.",
      cause: "O endereço 192.168.2.100 estava em outra sub-rede em relação ao gateway 192.168.1.1.", tool: "Propriedades IP e comando ping",
      setup() { OSLab.network.restoreSnapshot({ ...OSLab.network.defaults, dhcpEnabled: false, ip: "192.168.2.100", mask: "255.255.255.0", gateway: "192.168.1.1" }); return {}; },
      isReady() { const net = OSLab.network.getSnapshot(); return net.localNetworkAvailable; },
      test() { return OSLab.network.ping("192.168.1.1").ok; },
    },
    {
      id: "dns-failure", order: 10, title: "Problema de DNS", category: "Rede", difficulty: "Difícil",
      description: "Endereços numéricos respondem, mas sites não abrem quando o nome é digitado.",
      goal: "Identificar a falha de resolução de nomes e configurar um DNS válido.",
      initialSpeech: "Consigo acessar endereços numéricos, mas nenhum site abre pelo nome. A conexão parece existir.",
      hint: "Existe um serviço responsável por transformar nomes de sites em endereços IP. Compare testes por número e por nome.",
      success: "O computador voltou a localizar os sites pelos nomes. O problema estava na configuração de resolução de endereços.",
      cause: "O servidor DNS configurado era inválido, embora a internet por IP continuasse funcionando.", tool: "Terminal, propriedades DNS e navegador",
      setup() { OSLab.network.restoreSnapshot({ ...OSLab.network.defaults, dnsAutomatic: false, dns: "203.0.113.99" }); return {}; },
      isReady() { const net = OSLab.network.getSnapshot(); return net.internetByIpAvailable && net.dnsResolutionAvailable; },
      test() { return OSLab.network.ping("8.8.8.8").ok && OSLab.network.ping("google.com").ok && OSLab.network.browse("google.com").ok; },
    },
  ];

  catalog.forEach((exercise) => Object.freeze(exercise));
  OSLab.exerciseCatalog = Object.freeze(catalog);
})(window);
