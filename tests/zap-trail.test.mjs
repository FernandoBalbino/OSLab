import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Relógio falso: a trilha libera um contato por minuto e "digita" com atrasos; aqui tudo roda na hora.
function fixture(saved = new Map()) {
  let now = 1_800_000_000_000;
  let timers = [];
  let intervals = [];
  let seq = 0;
  const accounts = [{ username: "aluno", displayName: "Aluno", role: "administrator" }];
  let vpnOn = false;
  const window = {
    location: { search: "" },
    localStorage: { getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) },
    setTimeout: (fn, ms = 0) => { const id = ++seq; timers.push({ id, at: now + ms, fn }); return id; },
    clearTimeout: (id) => { timers = timers.filter((timer) => timer.id !== id); },
    setInterval: (fn) => { intervals.push(fn); return ++seq; },
    clearInterval: () => { intervals = []; },
  };
  const O = window.OSLab = {
    events: { emit() {} },
    users: { getCurrent: () => ({ id: "user-aluno" }), list: () => accounts },
    vpn: { getSnapshot: () => ({ connected: vpnOn }) },
    network: { getSnapshot: () => ({ connectedSsid: "REDE_OSLAB", knownNetworks: { REDE_OSLAB: { password: "oslab2026" } } }) },
    systemState: { getStorage: () => ({ totalBytes: 256 * 1024 ** 3, usedBytes: 98.4 * 1024 ** 3, freeBytes: 157.6 * 1024 ** 3 }) },
    systemTools: { formatBytes: (bytes) => `${(bytes / 1024 ** 3).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} GB` },
  };
  const context = vm.createContext({ window, console, Date: class extends Date { static now() { return now; } }, URLSearchParams });
  for (const file of ["js/core/file-system.js", "js/zap/zap-story.js", "js/zap/zap-engine.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  O.fileSystem.bind({ version: 2, desktopFolders: [], desktopFiles: [], recycleBin: [] }, () => {});
  function flush() {
    for (let guard = 0; timers.length && guard < 5000; guard += 1) {
      timers.sort((a, b) => a.at - b.at);
      const timer = timers.shift();
      now = Math.max(now, timer.at);
      timer.fn();
    }
  }
  function advance(ms) {
    for (let step = 0; step < ms; step += 1000) { now += 1000; intervals.forEach((fn) => fn()); flush(); }
  }
  return { O, Z: O.zap, flush, advance, saved, accounts, setVpn: (on) => { vpnOn = on; } };
}
const labels = (Z, id) => Z.chat(id).view.labels;
const pickWhere = (Z, id, predicate) => {
  const index = labels(Z, id).findIndex(predicate);
  assert.ok(index >= 0, `opção não encontrada em ${id}: ${labels(Z, id).join(" | ")}`);
  return Z.choose(id, index);
};
function arrive(f, id) {
  if (!f.Z.chat(id)) f.advance(61_000);
  f.flush();
  assert.ok(f.Z.chat(id), `${id} deveria ter chegado`);
  assert.equal(labels(f.Z, id).length, 3, `${id} começa com 3 respostas`);
}
const lastThem = (Z, id) => Z.chat(id).messages.filter((m) => m.from === "them").at(-1);

test("todas as etapas da história têm exatamente 3 respostas", () => {
  const { O } = fixture();
  const story = O.zapStory;
  assert.equal(story.order.length, 30);
  assert.equal(new Set(story.order).size, 30);
  assert.equal(story.contacts.length, 30);
  assert.equal(story.contacts.filter((c) => c.kind === "learn").length, 19, "11 + 8 pedidos de conhecimento");
  assert.ok(story.contacts.filter((c) => c.kind !== "learn").length >= 11, "9 + 2 contatos inesperados");
  const ctx = { wifi: () => ({ ssid: "REDE", password: "x1" }), disk: () => ({ free: "1 GB", total: "2 GB", used: "3 GB" }), net: () => ({ ip: "1", gateway: "2", mask: "3" }), shuffle: (items) => items };
  story.contacts.forEach((contact) => {
    assert.ok(story.order.includes(contact.id), contact.id);
    Object.entries(contact.steps).forEach(([step, def]) => {
      const options = typeof def.options === "function" ? def.options(ctx) : def.options;
      assert.equal(options.length, 3, `${contact.id}.${step}`);
      options.forEach((option) => {
        if (option.go) assert.ok(contact.steps[option.go], `${contact.id}.${step} → ${option.go}`);
        if (option.lesson) assert.ok(story.lessons[option.lesson], `lição ${option.lesson}`);
        assert.ok(option.go || option.stay || option.end || option.attach || option.verify, `${contact.id}.${step}: opção sem destino`);
      });
    });
  });
});

test("um contato por minuto, digitando, e as 30 conversas resolvidas no caminho seguro", () => {
  const f = fixture();
  const { O, Z } = f;
  // As respostas só podem aparecer com a fila vazia; senão a tela mostra "respondendo…" até reabrir o chat.
  const early = [];
  Z.subscribe((type, detail) => { if (type === "view" && Z.chat(detail.chatId).queue.length) early.push(detail.chatId); });
  assert.equal(Z.setProfile("  Maria   Clara "), true);
  assert.equal(Z.profile().name, "Maria Clara");
  assert.match(Z.profile().phone, /^\+55 82 9\d{4}-\d{4}$/, "número de Maceió");
  assert.equal(Z.setProfile("A"), false, "nome muito curto");
  assert.equal(Z.start(), true);
  assert.equal(Z.start(), false, "abrir de novo não reinicia");
  f.flush();
  assert.equal(Z.chat("oslab").messages.length, 6, "boas-vindas do robô com o convite para o grupo");
  assert.match(Z.chat("oslab").messages.map((m) => m.text).join(" "), /2º Técnico em Manutenção e Suporte de Informática/);
  assert.equal(Z.chat("rafael"), null);
  f.advance(8_000);
  assert.ok(Z.chat("rafael"), "Rafael chega logo depois das boas-vindas");
  f.advance(30_000);
  assert.equal(Z.chat("marta"), null, "a próxima pessoa espera 60 s");

  // 1. Rafael: senha do Wi-Fi conectado.
  arrive(f, "rafael");
  assert.equal(Z.chat("rafael").messages[0].text, "Fala, Maria! Tudo certo? 😅", "fala usa o nome do aluno");
  Z.choose("rafael", 0); f.flush();
  pickWhere(Z, "rafael", (label) => label.includes("REDE_OSLAB")); f.flush();
  assert.equal(Z.chat("rafael").status, "active", "nome da rede não é a senha");
  pickWhere(Z, "rafael", (label) => label.includes("oslab2026")); f.flush();
  assert.equal(Z.chat("rafael").outcome, "good");

  // 2. Dona Marta: a planilha está na Lixeira.
  arrive(f, "marta");
  const trashed = O.fileSystem.recycleItems().find((item) => item.name === "Orçamento 2026.xlsx");
  assert.ok(trashed, "planilha começa na Lixeira");
  assert.equal(Z.attach("marta", 0, trashed.id).ok, false, "arquivo na Lixeira não pode ser anexado");
  const wrong = O.fileSystem.create({ parentId: O.fileSystem.roots.documents, name: "foto-do-gato.jpg", kind: "file" });
  assert.equal(Z.attach("marta", 0, wrong.id).accepted, false); f.flush();
  O.fileSystem.restore(trashed.id);
  assert.equal(Z.attach("marta", 0, trashed.id).accepted, true); f.flush();
  assert.equal(Z.chat("marta").outcome, "good");

  // 3. Hacker: bloquear.
  arrive(f, "hacker");
  pickWhere(Z, "hacker", (label) => label.includes("Bloquear")); f.flush();
  assert.equal(Z.chat("hacker").blocked, true);
  assert.equal(Z.chat("hacker").outcome, "good");

  // 4. Prof. Tadeu: arquivo escondido em pastas.
  arrive(f, "tadeu");
  const work = O.fileSystem.search("trabalho-final")[0];
  assert.ok(work && O.fileSystem.pathLabel(work.parentId).includes("backup antigo"));
  Z.attach("tadeu", 0, work.id); f.flush();
  assert.equal(Z.chat("tadeu").outcome, "good");

  // 5. Cleiton: não passar o contato da amiga.
  arrive(f, "cleiton");
  Z.choose("cleiton", 1); f.flush();
  assert.equal(lastThem(Z, "cleiton").t, "audio");
  Z.choose("cleiton", 0); f.flush();
  assert.equal(Z.chat("cleiton").outcome, "good");

  // 6. Bia: imagem salva do Google.
  arrive(f, "bia");
  const photo = O.fileSystem.create({ parentId: O.fileSystem.roots.downloads, name: "capivara-2.webp", kind: "file", mime: "image/webp", content: "assets/whatsapp/media/capivara-2.webp", sourceId: "zap-image" });
  Z.attach("bia", 0, photo.id); f.flush();
  assert.equal(Z.chat("bia").outcome, "good");
  assert.equal(Z.chat("bia").messages.find((m) => m.from === "me").t, "image", "imagem vai como foto");

  // 7. Mãe (número novo): ligar para o número antigo.
  arrive(f, "mae");
  pickWhere(Z, "mae", (label) => label.includes("Ligar")); f.flush();
  assert.equal(Z.chat("mae").outcome, "good");

  // 8. Tia Rose: documento do Word com os 3 itens.
  arrive(f, "rose");
  const partial = O.fileSystem.create({ parentId: O.fileSystem.roots.documents, name: "Lista.docx", kind: "file", content: "fraldas\nmamadeira" });
  Z.attach("rose", 0, partial.id); f.flush();
  assert.match(Z.chat("rose").messages.filter((m) => m.from === "them").map((m) => m.text).join(" "), /lenço umedecido/);
  const full = O.fileSystem.create({ parentId: O.fileSystem.roots.documents, name: "Chá de bebê.docx", kind: "file", content: "Fraldas P\nLenço umedecido\nMamadeira" });
  Z.attach("rose", 0, full.id); f.flush();
  assert.equal(Z.chat("rose").outcome, "good");

  // 9. Vovó: corrente falsa.
  arrive(f, "vovo");
  Z.choose("vovo", 1); f.flush();
  Z.choose("vovo", 0); f.flush();
  assert.equal(Z.chat("vovo").outcome, "good");

  // 10. Davi: espaço livre do disco.
  arrive(f, "davi");
  pickWhere(Z, "davi", (label) => label.includes("256 GB")); f.flush();
  assert.equal(Z.chat("davi").status, "active", "tamanho total não é espaço livre");
  pickWhere(Z, "davi", (label) => label.includes("157,6 GB")); f.flush();
  assert.equal(Z.chat("davi").outcome, "good");

  // 11. Promoção falsa: denunciar.
  arrive(f, "promo");
  Z.choose("promo", 1); f.flush();
  assert.equal(Z.chat("promo").outcome, "good");

  // 12. Carol: senha nova e sair de todos os aparelhos.
  arrive(f, "carol");
  Z.choose("carol", 0); f.flush();
  assert.equal(lastThem(Z, "carol").t, "link");
  assert.equal(Z.netflixWanted(), true);
  Z.choose("carol", 0); f.flush();
  assert.equal(Z.chat("carol").status, "active", "sem trocar a senha não conclui");
  const carol = Object.values(Z.site("netflix").accounts).find((account) => account.owner === "carol");
  carol.password = "Carol#Segura26";
  Z.choose("carol", 0); f.flush();
  assert.match(lastThem(Z, "carol").text, /Sair de todos os aparelhos/);
  carol.devicesOut = true;
  Z.choose("carol", 0); f.flush();
  assert.equal(Z.chat("carol").outcome, "good");

  // 13. Larissa: não mandar localização.
  arrive(f, "larissa");
  Z.choose("larissa", 1); f.flush();
  Z.choose("larissa", 0); f.flush();
  assert.equal(Z.chat("larissa").outcome, "good");

  // 14. Seu Antônio: perfil novo.
  arrive(f, "antonio");
  Z.choose("antonio", 0); f.flush();
  Z.choose("antonio", 0); f.flush();
  assert.equal(Z.chat("antonio").status, "active");
  Object.values(Z.site("netflix").accounts).find((account) => account.owner === "antonio").profiles.push("Antônio");
  Z.choose("antonio", 0); f.flush();
  assert.equal(Z.chat("antonio").outcome, "good");
  assert.equal(Z.netflixWanted(), false, "Netflix dos amigos some depois das duas conversas");

  // 15. Suporte falso: não passar o código.
  arrive(f, "suporte");
  Z.choose("suporte", 1); f.flush();
  assert.equal(Z.chat("suporte").outcome, "good");

  // 16. Fernanda: pasta Currículos com o PDF dentro.
  arrive(f, "fernanda");
  Z.choose("fernanda", 0); f.flush();
  assert.equal(Z.chat("fernanda").status, "active");
  const folder = O.fileSystem.create({ parentId: O.fileSystem.roots.desktop, name: "Currículos", kind: "folder" });
  O.fileSystem.move(O.fileSystem.search("curriculo-joao")[0].id, folder.id);
  Z.choose("fernanda", 0); f.flush();
  assert.equal(Z.chat("fernanda").outcome, "good");

  // 17. Seu Jorge: número errado.
  arrive(f, "jorge");
  Z.choose("jorge", 0); f.flush();
  Z.choose("jorge", 0); f.flush();
  assert.equal(Z.chat("jorge").outcome, "good");

  // 18. Lucas: atalhos.
  arrive(f, "lucas");
  pickWhere(Z, "lucas", (label) => label.includes("Alt + F4")); f.flush();
  assert.equal(Z.chat("lucas").step, "start");
  pickWhere(Z, "lucas", (label) => label.includes("Shift + S")); f.flush();
  pickWhere(Z, "lucas", (label) => label.includes("Esc")); f.flush();
  assert.equal(Z.chat("lucas").outcome, "good");

  // 19. Vaga falsa: recusar.
  arrive(f, "vaga");
  Z.choose("vaga", 1); f.flush();
  assert.equal(Z.chat("vaga").outcome, "good");

  // 20. Júnior: post apagado, senha nova e dois fatores.
  arrive(f, "junior");
  Z.choose("junior", 0); f.flush();
  const fb = Z.site("facebook");
  fb.spamDeleted = true;
  Z.choose("junior", 0); f.flush();
  assert.match(Z.chat("junior").messages.filter((m) => m.from === "them").map((m) => m.text).join(" "), /dois fatores/);
  fb.passwordChanged = true; fb.twoFactor = true;
  Z.choose("junior", 0); f.flush();
  assert.equal(Z.chat("junior").outcome, "good");

  // 21. Gabriel: duas etapas e privacidade no próprio WhatsApp.
  arrive(f, "gabriel");
  Z.choose("gabriel", 0); f.flush();
  assert.equal(Z.chat("gabriel").status, "active");
  Z.setSetting("twoStep", true); Z.setSetting("lastSeen", "contacts"); Z.setSetting("photo", "nobody");
  assert.equal(Z.setSetting("photo", "qualquer"), false);
  Z.choose("gabriel", 0); f.flush();
  assert.equal(Z.chat("gabriel").outcome, "good");

  // 22. Rei do Tigrinho: recusar.
  arrive(f, "tigrinho");
  Z.choose("tigrinho", 1); f.flush();
  assert.equal(Z.chat("tigrinho").outcome, "good");

  // 23. Seu Paulo: .exe disfarçado precisa ir para a Lixeira.
  arrive(f, "paulo");
  const exe = O.fileSystem.search("comprovante_pix")[0];
  assert.equal(exe.name, "comprovante_pix.pdf.exe");
  Z.choose("paulo", 0); f.flush();
  assert.equal(Z.chat("paulo").status, "active");
  O.fileSystem.delete(exe.id);
  Z.choose("paulo", 0); f.flush();
  assert.equal(Z.chat("paulo").outcome, "good");

  // 24. Ana Clara: abrir o arquivo que trava e fechar pelo Gerenciador.
  arrive(f, "anaclara");
  Z.choose("anaclara", 0); f.flush();
  assert.equal(Z.chat("anaclara").step, "task");
  Z.choose("anaclara", 0); f.flush();
  assert.equal(Z.chat("anaclara").outcome, "good");

  // 25. Marcos: IPv4 do ipconfig (o gateway não vale).
  arrive(f, "marcos");
  pickWhere(Z, "marcos", (label) => label.includes("192.168.1.1") && !label.includes("100")); f.flush();
  assert.equal(Z.chat("marcos").status, "active");
  pickWhere(Z, "marcos", (label) => label.includes("192.168.1.100")); f.flush();
  assert.equal(Z.chat("marcos").outcome, "good");

  // 26. Thiago: não repassar o meme.
  arrive(f, "thiago");
  Z.choose("thiago", 1); f.flush();
  assert.equal(Z.chat("thiago").outcome, "good");

  // 27. Júlia: VPN ligada.
  arrive(f, "julia");
  Z.choose("julia", 0); f.flush();
  assert.equal(Z.chat("julia").status, "active");
  f.setVpn(true);
  Z.choose("julia", 0); f.flush();
  assert.equal(Z.chat("julia").outcome, "good");

  // 28. Madrinha Célia: conta Pedro como usuário padrão.
  arrive(f, "celia");
  f.accounts.push({ username: "pedro", displayName: "Pedro", role: "administrator" });
  Z.choose("celia", 0); f.flush();
  assert.match(lastThem(Z, "celia").text, /Usuário padrão/);
  f.accounts.at(-1).role = "standard";
  Z.choose("celia", 0); f.flush();
  assert.equal(Z.chat("celia").outcome, "good");

  // 29. Kauã: esvaziar a Lixeira.
  arrive(f, "kaua");
  assert.ok(O.fileSystem.recycleItems().some((item) => item.name === "gravacao-live-antiga.mp4"));
  Z.choose("kaua", 0); f.flush();
  assert.equal(Z.chat("kaua").status, "active");
  O.fileSystem.emptyRecycleBin();
  Z.choose("kaua", 0); f.flush();
  assert.equal(Z.chat("kaua").outcome, "good");

  // 30. Seu Osvaldo: atendimento calmo e diagnóstico simples.
  arrive(f, "osvaldo");
  Z.choose("osvaldo", 1); f.flush();
  assert.equal(Z.chat("osvaldo").step, "start", "jargão não resolve");
  Z.choose("osvaldo", 0); f.flush();
  Z.choose("osvaldo", 0); f.flush();
  assert.equal(Z.chat("osvaldo").outcome, "good");

  const summary = Z.summary();
  assert.deepEqual([summary.done, summary.helped, summary.fell], [30, 19, 0]);
  const guide = Z.chat("oslab").messages;
  assert.equal(guide.filter((m) => m.t === "lesson").length, 30, "uma dica por conversa");
  assert.equal(guide.at(-1).t, "report", "relatório final no robô");
  f.advance(120_000);
  assert.equal(Z.get().released, 30, "não libera além de 30");
  assert.deepEqual(early, [], "respostas sempre aparecem com a fila vazia");
});

test("pagar o hacker termina mal, com a dica certa no robô", () => {
  const f = fixture();
  const { Z } = f;
  Z.start();
  ["rafael", "marta", "hacker"].forEach((id) => arrive(f, id));
  pickWhere(Z, "hacker", (label) => label.includes("Pagar o PIX")); f.flush();
  assert.equal(Z.chat("hacker").messages.find((m) => m.from === "me").t, "pix");
  pickWhere(Z, "hacker", (label) => label.includes("500")); f.flush();
  assert.equal(Z.chat("hacker").outcome, "bad");
  assert.equal(Z.chat("oslab").messages.at(-1).title, "Você pagou o golpista 😬");
  assert.equal(Z.summary().fell, 1);
});

test("estado fica salvo e a fila continua depois de recarregar", () => {
  const saved = new Map();
  const first = fixture(saved);
  first.Z.start();
  first.advance(8_000);
  first.Z.choose("rafael", 0);
  const second = fixture(saved);
  second.Z.resume();
  second.flush();
  assert.equal(second.Z.chat("rafael").step, "task", "a resposta pendente do Rafael continua após recarregar");
  second.Z.reset();
  assert.equal(second.Z.isStarted(), false);
  assert.equal(second.Z.profile(), null, "próximo aluno escolhe o próprio nome");
  assert.equal(second.O.fileSystem.recycleItems().length, 0);
});
