(function createZapStory(global) {
  "use strict";

  // Enredo da trilha Segurança Digital: 20 contatos chegam no WhatsApp, um por minuto.
  // Mensagem: texto ou { t: "image" | "audio" | "file" | "link" | "pix" | "location" | "deleted" | "system" | "sticker" | "call" }.
  // Opção: { label, text, send, reply, go, stay, end, lesson, attach, verify, effect } — sempre 3 por etapa.
  const O = global.OSLab = global.OSLab || {};
  const P = "assets/whatsapp/people/";
  const M = "assets/whatsapp/media/";
  const norm = (value) => String(value || "").toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  const ATTACH = "📎 Anexar arquivo do computador";

  const contacts = [
    {
      id: "rafael", name: "Rafael Souza", avatar: P + "rafael.webp", about: "Analista · escritório", phone: "+55 11 98421-3307", kind: "learn",
      skill: "Encontrar a senha do Wi-Fi conectado nas Configurações do Windows",
      steps: {
        start: {
          say: ["Fala! Tudo certo? 😅", "Tô na sala de reunião e meu notebook não quer conectar no Wi-Fi do escritório", "Você que já tá conectado aí: consegue ver a senha da rede no seu Windows e me passar?"],
          options: [
            { text: "Claro! Vou procurar aqui nas Configurações", reply: ["Valeu!! Fico no aguardo 🙏"], go: "task" },
            { text: "Pergunta pro pessoal do TI", reply: ["O TI só volta amanhã 😩", "Dá uma olhada aí, vai! Deve estar nas Configurações de rede"], go: "task" },
            { text: "Usa o 4G do celular", reply: ["Meu plano acabou ontem kkkk 💀", "Me salva aí, por favor"], go: "task" },
          ],
        },
        task: {
          say: ["E aí, achou a senha?"],
          options: (ctx) => {
            const wifi = ctx.wifi();
            const wrong = ["Hmm, deu “senha incorreta” aqui 😕", "Procura de novo: Configurações → Rede e Internet → Wi-Fi → propriedades da rede conectada → Exibir senha"];
            return ctx.shuffle([
              { text: `A senha é ${wifi.password}`, reply: ["CONECTOU!!! ✅", "Te devo um café ☕ Valeu demais!"], end: "good", lesson: "rafael" },
              { text: `A senha é ${wifi.ssid}`, reply: ["Isso aí é o NOME da rede kkkk 😅", "Preciso da senha. Ela aparece quando você clica em Exibir senha nas propriedades do Wi-Fi"], stay: true },
              { text: `A senha é ${wifi.password === "12345678" ? "senha123" : "12345678"}`, reply: wrong, stay: true },
            ], "rafael");
          },
        },
      },
    },
    {
      id: "marta", name: "Dona Marta (Chefe)", avatar: P + "marta.webp", about: "Gerente administrativa", phone: "+55 11 99760-1188", kind: "learn",
      skill: "Restaurar um arquivo da Lixeira e enviar um anexo",
      seed: (ctx) => ctx.seedTrashedFile("marta", { parent: "documents", name: "Orçamento 2026.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes: 48128, content: "Planilha de orçamento 2026 · OSLab" }),
      steps: {
        start: {
          say: ["Bom dia! Preciso URGENTE da planilha “Orçamento 2026” para a reunião das 10h", "Ela estava na pasta Documentos do seu computador, mas acho que alguém apagou sem querer 😬", "Recupera e me manda aqui, por favor"],
          options: [
            { label: ATTACH, attach: { check: (file) => norm(file.name) === norm("Orçamento 2026.xlsx") ? { ok: true, reply: ["Isso! Era essa mesma 🙌", "Você salvou minha reunião. Obrigada!"], end: "good", lesson: "marta" } : { ok: false, reply: [`Esse aí é “${file.name}” 🤔`, "Preciso da planilha Orçamento 2026. Se ela foi apagada, deve estar na Lixeira!"] } } },
            { text: "Onde ela pode estar?", reply: ["Quando a gente apaga um arquivo, ele vai para a Lixeira 🗑️", "Abre a Lixeira na Área de Trabalho, clica no arquivo e escolhe Restaurar. Ele volta para Documentos"], stay: true },
            { text: "Agora não posso, tô ocupado(a)", reply: ["Ocupado com o quê? 🤨", "A reunião é daqui a pouco! Por favor"], stay: true },
          ],
        },
      },
    },
    {
      id: "hacker", name: "+55 21 97007-0666", avatar: P + "hacker.webp", about: "Disponível", phone: "+55 21 97007-0666", kind: "scam", unknown: true,
      steps: {
        start: {
          say: ["⚠️ ATENÇÃO ⚠️", "Eu invadi o seu notebook. Tenho acesso total à sua câmera e tirei FOTOS suas sem você perceber 📸", "Se não mandar um PIX de R$ 100 em 24 horas, eu envio as fotos para TODOS os seus contatos", "Chave PIX: cobranca.urgente@pix.com"],
          options: [
            { label: "💸 Pagar o PIX de R$ 100", send: { t: "pix", amount: "R$ 100,00", to: "cobranca.urgente@pix.com" }, reply: ["Recebido 😈", "Mudei de ideia. Agora são R$ 500. Senão vazo tudo."], go: "more" },
            { label: "🚫 Bloquear e denunciar", effect: "block", end: "good", lesson: "hacker-good" },
            { text: "Kkkk então manda uma foto, quero ver", reply: ["Tá duvidando? 😡", { t: "image", src: M + "webcam-pug.webp", caption: "olha você aí 📸 kkkk" }], go: "bluff" },
          ],
        },
        more: {
          say: [],
          options: [
            { label: "💸 Pagar mais R$ 500", send: { t: "pix", amount: "R$ 500,00", to: "cobranca.urgente@pix.com" }, reply: ["Hahaha 😈 agora são R$ 2.000", "Você vai pagar pra sempre"], effect: "block", end: "bad", lesson: "hacker-paid" },
            { label: "🚫 Bloquear e denunciar", effect: "block", end: "bad", lesson: "hacker-paid" },
            { text: "Vou contar para um adulto de confiança", reply: ["…"], effect: "block", end: "bad", lesson: "hacker-paid" },
          ],
        },
        bluff: {
          say: [],
          options: [
            { text: "Esse aí é um cachorro de óculos 😂", reply: [{ t: "deleted" }, "…foi engano", "MAS EU TENHO OUTRAS"], go: "bluff2" },
            { label: "🚫 Bloquear e denunciar", effect: "block", end: "good", lesson: "hacker-good" },
            { label: "💸 Pagar o PIX mesmo assim", send: { t: "pix", amount: "R$ 100,00", to: "cobranca.urgente@pix.com" }, reply: ["Hehehe obrigado 😈 agora são R$ 500"], effect: "block", end: "bad", lesson: "hacker-paid" },
          ],
        },
        bluff2: {
          say: [],
          options: [
            { label: "🚫 Bloquear e denunciar", effect: "block", end: "good", lesson: "hacker-good" },
            { text: "Manda então 🙄", reply: [{ t: "deleted" }, "esquece"], effect: "block", end: "good", lesson: "hacker-good" },
            { text: "Vou mostrar essa conversa para a professora", reply: ["…", "esquece, número errado"], effect: "block", end: "good", lesson: "hacker-good" },
          ],
        },
      },
    },
    {
      id: "tadeu", name: "Prof. Tadeu", avatar: P + "tadeu.webp", about: "Professor de Informática 👨‍🏫", phone: "+55 11 98112-4520", kind: "learn",
      skill: "Pesquisar um arquivo perdido no Explorador de Arquivos",
      seed: (ctx) => ctx.seedNestedFile("tadeu", { parent: "downloads", folders: ["Nova pasta (2)", "backup antigo"], name: "trabalho-final.docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", sizeBytes: 31744, content: "Trabalho final · Sistemas Operacionais" }),
      steps: {
        start: {
          say: ["Boa tarde! Aqui é o professor Tadeu", "Você me mandou o arquivo trabalho-final.docx semana passada, mas eu perdi no meu pendrive 🤦‍♂️", "Ele ainda está no seu computador? Me reenvia por aqui?"],
          options: [
            { label: ATTACH, attach: { check: (file) => norm(file.name) === "trabalho-final.docx" ? { ok: true, reply: ["Recebido! 📄 Agora não perco mais", "Dica de professor: organize suas pastas 😉"], end: "good", lesson: "tadeu" } : { ok: false, reply: [`Hmm, esse é “${file.name}”`, "Procura o trabalho-final.docx. Use a caixa de pesquisa do Explorador de Arquivos!"] } } },
            { text: "Não lembro onde salvei 😬", reply: ["Sem problema! Abre o Explorador de Arquivos 📁", "No canto de cima tem a caixa de pesquisa: digita “trabalho” e ele procura em todas as pastas"], stay: true },
            { text: "O cachorro comeu meu trabalho", reply: ["Essa desculpa é mais velha que o disquete 😂", "Procura aí, que ele deve estar nos Downloads"], stay: true },
          ],
        },
      },
    },
    {
      id: "cleiton", name: "Cleiton", avatar: P + "cleiton.webp", about: "Vida loka só de moto 🏍️", phone: "+55 31 99211-0742", kind: "scam", unknown: true,
      steps: {
        start: {
          say: ["Oi, tudo bem? Você não me conhece", "Vi uma foto sua com a Júlia no Insta 😍😍", "Ela é solteira? Me passa o número dela? Prometo que sou gente boa kkkk"],
          options: [
            { text: "Passo sim: (11) 98765-4321", reply: ["VALEU!!! 😍😍😍", "…", "Ela me bloqueou em 4 segundos 😭 você acha que foi a foto da moto?"], end: "bad", lesson: "cleiton-bad" },
            { text: "Não passo o contato de ninguém sem permissão", reply: ["Poxa 😢", "E se eu mandar um áudio cantando pra ela? Você mostra?", { t: "audio", dur: "0:47", transcript: "🎵 Júliaaaa, você é o sol da minha manhã, o feijão do meu arroz… 🎵" }], go: "song" },
            { text: "Quem é você? Como conseguiu meu número?", reply: ["Sou o Cleiton, amigo do primo do vizinho dela 🤝", "Tá todo mundo no grupo do bairro"], stay: true },
          ],
        },
        song: {
          say: [],
          options: [
            { text: "Vou perguntar se ELA quer falar com você", reply: ["Fechou! Se ela quiser, ela me chama 🙏", "Você é uma pessoa justa, viu"], end: "good", lesson: "cleiton-good" },
            { text: "Não mostro, e para de pedir 🙄", reply: ["Tá bom, tá bom… 😔"], end: "good", lesson: "cleiton-good" },
            { label: "🚫 Bloquear", effect: "block", end: "good", lesson: "cleiton-good" },
          ],
        },
      },
    },
    {
      id: "bia", name: "Bia (prima)", avatar: P + "bia.webp", about: "📚 Biologia é vida", phone: "+55 11 97455-0021", kind: "learn",
      skill: "Pesquisar e salvar uma imagem do Google e enviá-la",
      steps: {
        start: {
          say: ["SOCORRO 😭", "Meu trabalho de Biologia é sobre capivaras 🦫 e eu esqueci de colocar uma foto", "Pesquisa “capivara” no Google, salva uma imagem no computador e me manda aqui? A impressão é hoje!!"],
          options: [
            { label: ATTACH, attach: { check: (file) => file.sourceId === "zap-image" && norm(file.content).includes("capivara") ? { ok: true, reply: ["QUE FOFAAA 😍🦫", "Já coloquei no trabalho. Vou tirar 10! Obrigadaaa"], end: "good", lesson: "bia" } : /^image\//.test(file.mime || "") ? { ok: false, reply: ["Isso não é uma capivara kkkkk", "Pesquisa “capivara” no Google, clica em Imagens e salva uma"] } : { ok: false, reply: [`“${file.name}” não é uma imagem 😅`, "Preciso de uma FOTO de capivara"] } } },
            { text: "Como eu salvo imagem do Google?", reply: ["No Chrome: pesquisa “capivara” e vai na aba Imagens", "Clica na foto e depois em “Salvar imagem”. Ela vai para a pasta Downloads 📥"], stay: true },
            { text: "Pesquisa você, ué", reply: ["Tô no ônibus com 2% de bateria 🪫", "Por favorzinho 🥺"], stay: true },
          ],
        },
      },
    },
    {
      id: "mae", name: "Mãe ❤️ (número novo)", avatar: P + "mae.webp", about: "Deus é fiel 🙏", phone: "+55 11 93120-5544", kind: "scam", unknown: true,
      steps: {
        start: {
          say: ["Oi, meu amor! Esse é meu número novo, salva aí ❤️", "O outro celular caiu na pia 😩", "Tô com um problema no banco e preciso pagar um boleto HOJE. Faz um PIX de R$ 1.250 pra mim? Amanhã te devolvo", "Chave: maria.pagamentos2026@email.com"],
          options: [
            { label: "📞 Ligar para o número antigo da mãe", effect: ["call", "block"], reply: [{ t: "call", text: "Você ligou para Mãe (número antigo) · 0:14" }, { t: "system", text: "Mãe no telefone: “PIX? Que PIX?! Eu tô na feira comprando banana 🍌 Meu celular está aqui comigo. NÃO MANDA NADA!”" }], end: "good", lesson: "mae-good" },
            { label: "💸 Fazer o PIX de R$ 1.250", send: { t: "pix", amount: "R$ 1.250,00", to: "maria.pagamentos2026@email.com" }, reply: ["Obrigada, filho(a) ❤️", "Faz mais um de R$ 800? É a segunda parcela"], go: "paid" },
            { text: "Manda um áudio pra eu ter certeza que é você", reply: ["Tô sem microfone, esse celular é emprestado 😥", "Faz logo, por favor, o banco fecha às 16h!"], stay: true },
          ],
        },
        paid: {
          say: [],
          options: [
            { label: "📞 Ligar para o número antigo da mãe", effect: ["call", "block"], reply: [{ t: "call", text: "Você ligou para Mãe (número antigo) · 0:21" }, { t: "system", text: "Mãe no telefone: “Que PIX, menino(a)?! Eu não troquei de número! Isso é GOLPE!”" }], end: "bad", lesson: "mae-bad" },
            { label: "💸 Fazer mais um PIX de R$ 800", send: { t: "pix", amount: "R$ 800,00", to: "maria.pagamentos2026@email.com" }, reply: ["❤️❤️", { t: "system", text: "Este número parou de responder." }], end: "bad", lesson: "mae-bad" },
            { text: "Mãe, qual é o nome do nosso cachorro?", reply: ["Ahn… Rex?", "Faz o PIX, amor, rápido!"], stay: true },
          ],
        },
      },
    },
    {
      id: "rose", name: "Tia Rose", avatar: P + "rose.webp", about: "Família é tudo 🌷", phone: "+55 11 98007-3196", kind: "learn",
      skill: "Criar e salvar um documento no Word e enviá-lo",
      steps: {
        start: {
          say: ["Oi, querido(a)! 🌷", "O chá de bebê da sua prima é sábado 👶🎀", "Faz pra tia uma lista de presentes no WORD e me manda o arquivo? Tem que ter: fraldas, lenço umedecido e mamadeira"],
          options: [
            { label: ATTACH, attach: { check: (file) => {
              const text = norm(file.content);
              if (!/\.docx$/i.test(file.name)) return { ok: false, reply: [`“${file.name}” não é um arquivo do Word 🤔`, "O arquivo do Word termina com .docx"] };
              const missing = [["fralda", "fraldas"], ["lenco", "lenço umedecido"], ["mamadeira", "mamadeira"]].filter(([key]) => !text.includes(key)).map(([, label]) => label);
              return missing.length ? { ok: false, reply: ["Recebi! Mas faltou na lista: " + missing.join(", ") + " 🍼", "Abre o Word de novo, completa e salva"] } : { ok: true, reply: ["Que lista linda! 😍", "Vou imprimir e levar. Obrigada, meu bem 🎀"], end: "good", lesson: "rose" };
            } } },
            { text: "Não sei usar o Word 😬", reply: ["É fácil! Abre o Word pelo menu Iniciar ou pela pesquisa", "Escreve a lista, dá um nome ao arquivo e clica em Salvar. Ele vai para Documentos 📄", "Se o seu computador não tiver Word, pesquisa “pacote office” no Google e instala"], stay: true },
            { text: "Manda áudio que é mais fácil, tia", reply: ["Tia não sabe mandar áudio, tia quer ARQUIVO 😂"], stay: true },
          ],
        },
      },
    },
    {
      id: "vovo", name: "Vovó Cida", avatar: P + "vovo.webp", about: "Bom dia, grupo! 🌻", phone: "+55 11 3456-7788", kind: "scam",
      steps: {
        start: {
          say: [{ t: "image", src: M + "bomdia.webp", caption: "🌻 BOM DIA!!! Que Deus abençoe seu dia 🙏🌻" }, "URGENTE!!! A partir de amanhã o WhatsApp vai COBRAR R$ 0,37 por mensagem!!! 😱😱", "Repasse para 10 grupos senão sua conta será DESATIVADA!!! Deu no jornal!!!"],
          options: [
            { text: "Repassei pros meus grupos, vó!", reply: ["Ai, que bom, meu anjo! 🙏", "Já mandei também pro grupo da igreja, do bingo e da hidroginástica"], end: "bad", lesson: "vovo-bad" },
            { text: "Vó, isso é corrente falsa ❤️", reply: ["Mas foi a Neide que mandou! A Neide não mente 😳"], go: "convince" },
            { label: "🌻 Mandar figurinha de bom dia", send: { t: "sticker", emoji: "🌻" }, reply: ["Que lindo!! 🥰", "Mas e a mensagem? Já repassou?"], stay: true },
          ],
        },
        convince: {
          say: [],
          options: [
            { text: "Pesquisei: não existe cobrança, é fake antiga. Não repassa, tá?", reply: ["Ah é? Ainda bem que você me avisou!", "Vou falar pra Neide parar de mandar essas coisas 😤"], end: "good", lesson: "vovo-good" },
            { text: "Tá bom, vó, vou repassar então", reply: ["Isso, meu anjo! 🙏🌻"], end: "bad", lesson: "vovo-bad" },
            { text: "A Neide também disse que chá de boldo cura celular 😂", reply: ["Kkkkk ela disse mesmo!", "Então vou desconfiar. O que eu faço?"], stay: true },
          ],
        },
      },
    },
    {
      id: "davi", name: "Davi 🎮", avatar: P + "davi.webp", about: "GG", phone: "+55 11 96610-8083", kind: "learn",
      skill: "Ver o espaço livre do disco em Este Computador",
      steps: {
        start: {
          say: ["Mano, vou te passar um jogo pelo pendrive 🎮", "Mas antes: quanto espaço LIVRE tem no seu disco C:?", "Não quero lotar teu PC kkkk"],
          options: (ctx) => {
            const disk = ctx.disk();
            return ctx.shuffle([
              { text: `Tem ${disk.free} livres`, reply: ["Suave! Dá pra instalar 👊", "Valeu por conferir antes 😎"], end: "good", lesson: "davi" },
              { text: `Tem ${disk.total}`, reply: ["Isso é o TAMANHO do disco inteiro 😅", "Abre o Explorador → Este Computador. Embaixo do Disco Local (C:) aparece “X livres de Y”: preciso do X"], stay: true },
              { text: `Tem ${disk.used} livres`, reply: ["Tem certeza? Isso parece o espaço USADO 🤔", "No Disco Local (C:), olha o número antes de “livres”"], stay: true },
            ], "davi");
          },
        },
      },
    },
    {
      id: "promo", name: "PromoPrêmios Oficial 🎁", avatar: P + "promo.svg", about: "Sorteios todos os dias!", phone: "+55 91 92200-1919", kind: "scam", unknown: true,
      steps: {
        start: {
          say: ["🎉 PARABÉNS!!! 🎉", "Seu número foi SORTEADO na Promoção de Aniversário e você ganhou um iPhone 16 Pro! 📱", "Para receber, pague apenas o frete de R$ 19,90 no link abaixo em até 30 minutos ⏰", { t: "link", url: "www.magaz1ne-premios.xyz/resgate", title: "Resgate seu prêmio 🎁", domain: "magaz1ne-premios.xyz", open: "phish" }],
          options: [
            { label: "🔗 Clicar no link do prêmio", effect: "phish", reply: ["Ótimo! Agora digite os dados do seu cartão para o frete 💳"], go: "clicked" },
            { label: "🚩 Ignorar e denunciar como spam", effect: "block", end: "good", lesson: "promo-good" },
            { text: "Posso trocar por um PS5? 🎮", reply: ["Claro!!! 🎮 Também é só pagar o frete de R$ 19,90 no link"], stay: true },
          ],
        },
        clicked: {
          say: [],
          options: [
            { text: "Espera… eu nem participei de sorteio nenhum", reply: ["…", { t: "system", text: "Este contato foi denunciado por outros usuários." }], effect: "block", end: "good", lesson: "promo-mid" },
            { label: "💳 Mandar os dados do cartão", send: "Cartão final 4821 😬", reply: ["Pagamento aprovado! ✅", "(o iPhone nunca chegou… e apareceram 3 compras na fatura)"], effect: "block", end: "bad", lesson: "promo-bad" },
            { label: "🚩 Fechar e denunciar", effect: "block", end: "good", lesson: "promo-mid" },
          ],
        },
      },
    },
    {
      id: "carol", name: "Carol 💜", avatar: P + "carol.webp", about: "Viciada em séries 📺", phone: "+55 11 99814-6627", kind: "learn",
      skill: "Trocar a senha de um serviço e desconectar todos os aparelhos",
      steps: {
        start: {
          say: ["Amigaaa(o), socorro 😭", "Tem alguém usando minha Netflix! Apareceu um perfil chamado “HACKER 😈” e assistiram 8 temporadas de novela turca 🇹🇷", "Tô no trabalho e não consigo entrar. Você troca a senha pra mim?"],
          options: [
            { text: "Pode deixar! Me passa o login", reply: ["Ai, obrigada!! 💜", "E-mail: carol.martins@gmail.com", "Senha atual: Carol@2010", "Coloca a senha nova: Carol#Segura26 e depois clica em “Sair de todos os aparelhos” pro hacker cair!", { t: "link", url: "netflix.com/login", title: "Netflix — Entrar", domain: "netflix.com", open: "browser" }], go: "task" },
            { text: "Não é seguro me passar sua senha 😬", reply: ["Eu sei!! Depois eu mesma troco de novo, prometo", "É emergência 😭"], stay: true },
            { text: "Novela turca? kkkkkk", reply: ["NÃO RI 😤", "8 TEMPORADAS!!! Me ajuda logo"], stay: true },
          ],
        },
        task: {
          say: [],
          options: [
            { text: "Pronto! Troquei a senha e saí de todos os aparelhos ✅", verify: (ctx) => ctx.netflixCheck("carol"), okReply: ["AAAA o perfil do hacker sumiu da minha tela! 🙌", "Vou ativar uma senha diferente pra cada site agora. Te amo 💜"], end: "good", lesson: "carol" },
            { text: "Não consegui entrar 😕", reply: ["Abre o Chrome e vai em netflix.com/login", "E-mail: carol.martins@gmail.com · Senha: Carol@2010", "Depois vai em Conta → Alterar senha"], stay: true },
            { text: "Qual era a senha nova mesmo?", reply: ["Carol#Segura26", "Com C maiúsculo, # e o número 26 😉"], stay: true },
          ],
        },
      },
    },
    {
      id: "larissa", name: "Larissa 💕", avatar: P + "larissa.webp", about: "☀️ 17 anos · SP", phone: "+55 61 98101-2233", kind: "scam", unknown: true,
      steps: {
        start: {
          say: ["Oiii 🥰", "Vi seu perfil no Insta e achei você muito legal", "Em qual escola você estuda? Me manda sua localização em tempo real pra gente se conhecer 😘"],
          options: [
            { label: "📍 Enviar localização em tempo real", send: { t: "location" }, reply: ["Aaaa pertinho 😍", { t: "audio", dur: "0:04", transcript: "(voz grossa) — Ô MARQUINHO, DESLIGA O FOGO QUE O FEIJÃO TÁ QUEIMANDO!" }, { t: "deleted" }, "kkkk era minha tia 😅"], go: "reveal" },
            { text: "Não passo minha escola nem localização pra quem não conheço", reply: ["Aff, que chato 😒", "Todo mundo passa…"], go: "safe" },
            { text: "Manda uma foto segurando um papel com meu nome?", reply: ["Ahh tô sem câmera 😥", "Mas manda a sua localização primeiro, vai"], stay: true },
          ],
        },
        reveal: {
          say: [],
          options: [
            { text: "Tia de voz grossa? 🤨 Vou parar a localização", reply: ["…", { t: "system", text: "Larissa 💕 apagou a conta." }], end: "bad", lesson: "larissa-bad" },
            { label: "🚫 Bloquear e denunciar", effect: "block", end: "bad", lesson: "larissa-bad" },
            { text: "Fala com o Marquinho que o feijão queimou 😂", reply: ["…", { t: "system", text: "Larissa 💕 apagou a conta." }], end: "bad", lesson: "larissa-bad" },
          ],
        },
        safe: {
          say: [],
          options: [
            { label: "🚫 Bloquear e denunciar", effect: "block", end: "good", lesson: "larissa-good" },
            { text: "Então não sou todo mundo 😉", reply: [{ t: "audio", dur: "0:03", transcript: "(voz grossa) — Ah, desisto. MARQUINHO, CADÊ O CONTROLE?" }, { t: "deleted" }], end: "good", lesson: "larissa-good" },
            { text: "Vou contar pra minha família sobre essa conversa", reply: ["…", { t: "system", text: "Larissa 💕 apagou a conta." }], end: "good", lesson: "larissa-good" },
          ],
        },
      },
    },
    {
      id: "antonio", name: "Seu Antônio (vizinho)", avatar: P + "antonio.webp", about: "Aposentado e feliz 🎣", phone: "+55 11 3311-2046", kind: "learn",
      skill: "Criar um perfil para outra pessoa em um serviço de streaming",
      steps: {
        start: {
          say: ["Boa tarde, jovem! Aqui é o Antônio, do 102 👴", "Meu neto disse que você entende de computador", "Assinei essa tal de Netflix. Você cria um perfil com o meu nome, “Antônio”? Aí eu assisto meus filmes de faroeste 🤠"],
          options: [
            { text: "Claro, Seu Antônio! Qual é o login?", reply: ["E-mail: antonio.vizinho@gmail.com", "Senha: Antonio1955", "Lá já tem o perfil do meu neto. Tem que criar o meu!", { t: "link", url: "netflix.com/login", title: "Netflix — Entrar", domain: "netflix.com", open: "browser" }], go: "task" },
            { text: "Por que o senhor não pede pro seu neto?", reply: ["Ele mora em Portugal agora 😢", "Só fala comigo por vídeo e sempre trava"], stay: true },
            { text: "O que o senhor quer assistir?", reply: ["Faroeste! Bang-bang! 🤠", "E novela das nove, mas não conta pra ninguém"], stay: true },
          ],
        },
        task: {
          say: [],
          options: [
            { text: "Pronto, Seu Antônio! O perfil “Antônio” está criado ✅", verify: (ctx) => ctx.netflixCheck("antonio"), okReply: ["Apareceu aqui! Com meu nome! 😄", "Você é um gênio. Vou te dar um pote de doce de abóbora 🎃"], end: "good", lesson: "antonio" },
            { text: "Não consegui entrar 😕", reply: ["Meu neto disse: abre o Chrome e digita netflix.com/login", "E-mail: antonio.vizinho@gmail.com · Senha: Antonio1955", "Depois tem um botão de “Gerenciar perfis”"], stay: true },
            { text: "Qual nome eu coloco mesmo?", reply: ["Antônio! Com chapéu no ô 🤠"], stay: true },
          ],
        },
      },
    },
    {
      id: "suporte", name: "Suporte WhatsApp ✔️", avatar: P + "suporte.svg", about: "Central de Segurança", phone: "+55 48 99000-1234", kind: "scam", unknown: true,
      onRelease: (ctx) => ctx.sms("Seu código do WhatsApp: 482-913. Não compartilhe este código com ninguém."),
      steps: {
        start: {
          say: ["⚠️ Suporte WhatsApp: detectamos um acesso suspeito na sua conta", "Enviamos um código de 6 dígitos por SMS para o seu celular", "Responda com o código para confirmar que é você. Sem isso, sua conta será BLOQUEADA em 10 minutos ⏳"],
          options: [
            { text: "O código é 482-913", effect: "hijack", reply: [{ t: "system", text: "Simulação: sua conta foi aberta no celular do golpista. Seus contatos começaram a receber pedidos de PIX em seu nome." }], end: "bad", lesson: "suporte-bad" },
            { text: "Nunca passo código. Vou ativar a confirmação em duas etapas", reply: ["…", { t: "system", text: "Este contato foi denunciado." }], effect: "block", end: "good", lesson: "suporte-good" },
            { text: "Suporte do WhatsApp manda mensagem por aqui? 🤔", reply: ["Sim, somos o suporte OFICIAL ✔️", "Mande o código AGORA para evitar o bloqueio"], stay: true },
          ],
        },
      },
    },
    {
      id: "fernanda", name: "Fernanda (RH)", avatar: P + "fernanda.webp", about: "Recursos Humanos", phone: "+55 11 97330-9054", kind: "learn",
      skill: "Criar uma pasta e mover um arquivo para dentro dela",
      seed: (ctx) => ctx.seedFile("fernanda", { parent: "downloads", name: "curriculo-joao.pdf", mime: "application/pdf", sizeBytes: 125440, content: "Currículo de João Pereira · OSLab" }),
      steps: {
        start: {
          say: ["Oi! Tudo bem? 😊", "Preciso que você organize uma coisa no seu computador:", "Cria uma pasta chamada “Currículos” na Área de Trabalho e coloca dentro dela o arquivo curriculo-joao.pdf (ele está em Downloads)"],
          options: [
            { text: "Feito! Pasta criada e arquivo dentro ✅", verify: (ctx) => ctx.folderCheck(), okReply: ["Perfeito, muito organizado! 📁", "Assim ninguém perde nada. Obrigada!"], end: "good", lesson: "fernanda" },
            { text: "Como eu crio uma pasta?", reply: ["Clica com o botão direito num espaço vazio da Área de Trabalho", "Novo → Pasta, e digita o nome “Currículos” 📁"], stay: true },
            { text: "Como eu coloco o arquivo dentro da pasta?", reply: ["Abre Downloads, clica com o botão direito no arquivo e escolhe Recortar ✂️", "Depois abre a pasta Currículos e cola (botão direito → Colar)"], stay: true },
          ],
        },
      },
    },
    {
      id: "jorge", name: "Seu Jorge", avatar: P + "jorge.webp", about: "Festa no sábado 🎉", phone: "+55 62 98877-1020", kind: "fun", unknown: true,
      steps: {
        start: {
          say: ["Bom dia!! É da Pamonharia Sabor da Roça? 🌽", "Quero 30 pamonhas doces e 10 de queijo pra festa do meu neto no sábado", { t: "image", src: M + "milho.webp", caption: "Igual a essa da foto do Instagram de vocês" }],
          options: [
            { text: "Número errado, Seu Jorge 😂", reply: ["Eita! Desculpa, filho(a)", "É que o número é quase igual 🤦‍♂️"], go: "wrong" },
            { text: "Pamonha de queijo acabou, só tem de doce", reply: ["Ah não! O neto só come de queijo 😩", "Faz um desconto então? Pago no PIX agora!"], go: "wrong" },
            { text: "Quanto o senhor paga? 🤑", reply: ["R$ 3 cada! Mas tem que entregar quentinha", "Me passa seu nome completo e CPF pra nota fiscal"], go: "cpf" },
          ],
        },
        wrong: {
          say: [],
          options: [
            { text: "Sem problema! O número certo deve estar no Instagram deles", reply: ["Vou olhar lá! Obrigado 🙏", "Se quiser, aparece no sábado: vai ter pamonha 🌽😄"], end: "good", lesson: "jorge" },
            { text: "Não sou da pamonharia, mas boa festa! 🎉", reply: ["Obrigado! Deus abençoe 🙏🌽"], end: "good", lesson: "jorge" },
            { label: "🌽 Mandar figurinha de milho", send: { t: "sticker", emoji: "🌽" }, reply: ["Kkkkkk 🌽🌽🌽", "Desculpa o engano!"], end: "good", lesson: "jorge" },
          ],
        },
        cpf: {
          say: [],
          options: [
            { text: "Brincadeira! Número errado. E não passo meu CPF 😉", reply: ["Kkkk você me pegou!", "Tá certo, CPF não se passa pra qualquer um. Boa sorte! 🌽"], end: "good", lesson: "jorge" },
            { text: "Meu CPF é 123.456.789-00", reply: ["Anotado! 📝", "…mas eu nem sou da pamonharia kkkk, e você passou seu CPF pra um desconhecido 🤦‍♂️"], end: "bad", lesson: "jorge-cpf" },
            { text: "Mandei errado, aqui não é pamonharia", reply: ["Ah, desculpa! Obrigado 🙏🌽"], end: "good", lesson: "jorge" },
          ],
        },
      },
    },
    {
      id: "lucas", name: "Lucas (sala 2ºB)", avatar: P + "lucas.webp", about: "📚 2ºB", phone: "+55 11 95501-7714", kind: "learn",
      skill: "Atalhos do Windows: captura de tela e Gerenciador de Tarefas",
      steps: {
        start: {
          say: ["Ei! Como tira PRINT da tela no PC?? 🖥️", "Apareceu um erro aqui e o professor pediu pra mandar a imagem"],
          options: [
            { text: "Aperta Windows + Shift + S", reply: ["FUNCIONOU! Apareceu a ferramenta de recorte ✂️", "E outra: quando um programa trava e não fecha, faço o quê?"], go: "frozen" },
            { text: "Aperta Ctrl + P", reply: ["Abriu a tela de IMPRIMIR kkkk 🖨️", "Não é isso! Outro atalho?"], stay: true },
            { text: "Aperta Alt + F4", reply: ["MANO, FECHOU TUDO 😭😭", "Perdi o que tava escrevendo… outro atalho, por favor"], stay: true },
          ],
        },
        frozen: {
          say: [],
          options: [
            { text: "Ctrl + Shift + Esc, seleciona o programa e clica em Finalizar tarefa", reply: ["Abriu o Gerenciador de Tarefas e fechou o programa travado! 🙌", "Você devia dar aula kkkk valeu!"], end: "good", lesson: "lucas" },
            { text: "Tira o computador da tomada", reply: ["Aí desliga TUDO e pode perder arquivo 😱", "Tem jeito melhor, né?"], stay: true },
            { text: "Dá um tapa no monitor", reply: ["Kkkkkk isso só funcionava na TV da vó 📺", "Fala sério, qual é o atalho?"], stay: true },
          ],
        },
      },
    },
    {
      id: "vaga", name: "Agência TopJobs 💰", avatar: P + "vaga.svg", about: "Trabalhe de casa!", phone: "+44 7700 900123", kind: "scam", unknown: true,
      steps: {
        start: {
          say: ["Olá! 👋 Somos a Agência TopJobs", "Pagamos R$ 50 por cada vídeo que você CURTIR 💸 Ganhe até R$ 800 por dia sem sair de casa!", "Para começar, pague só a taxa de ativação de R$ 60 e receba suas primeiras tarefas 🚀"],
          options: [
            { label: "💸 Pagar a taxa de R$ 60", send: { t: "pix", amount: "R$ 60,00", to: "topjobs.ativacao@pix.com" }, reply: ["Parabéns! Você ganhou R$ 150 de bônus 🤑 (não dá pra sacar ainda)", "Para liberar o saque, pague o nível VIP: R$ 300"], go: "vip" },
            { text: "Empresa séria não cobra pra eu trabalhar. Não, obrigado(a)", reply: ["Você vai perder essa chance única!!! 😡"], effect: "block", end: "good", lesson: "vaga-good" },
            { text: "Qual é o CNPJ da empresa?", reply: ["CNPJ é coisa de empresa antiga 😎", "Nós somos modernos. Paga a taxa e começa hoje!"], stay: true },
          ],
        },
        vip: {
          say: [],
          options: [
            { label: "💸 Pagar o VIP de R$ 300", send: { t: "pix", amount: "R$ 300,00", to: "topjobs.vip@pix.com" }, reply: [{ t: "system", text: "Você foi removido(a) do grupo de tarefas." }], effect: "block", end: "bad", lesson: "vaga-bad" },
            { text: "Quero meu dinheiro de volta", reply: ["Só depois do nível VIP 😇"], effect: "block", end: "bad", lesson: "vaga-bad" },
            { label: "🚫 Bloquear e denunciar", effect: "block", end: "bad", lesson: "vaga-bad" },
          ],
        },
      },
    },
    {
      id: "junior", name: "Júnior (primo)", avatar: P + "junior.webp", about: "🏍️⚽", phone: "+55 11 94477-6612", kind: "learn",
      skill: "Recuperar uma conta: apagar post, trocar senha e ativar dois fatores",
      steps: {
        start: {
          say: ["Primo(a)!!! HACKEARAM MEU FACEBOOK 😱", "Tá postando propaganda de óculos a R$ 49 no meu perfil e minha tia já comprou 🤦‍♂️", "Entra lá e me ajuda? Apaga o post, troca a senha e ativa a autenticação de dois fatores"],
          options: [
            { text: "Bora! Me passa o login", reply: ["E-mail: junior.silva@gmail.com", "Senha: junior123 (eu sei, é fraca 😭)", "Coloca uma senha nova forte, com letras e números!", { t: "link", url: "facebook.com", title: "Facebook — Entrar ou cadastrar-se", domain: "facebook.com", open: "browser" }], go: "task" },
            { text: "Você clicou em algum link estranho?", reply: ["Talvez num teste “Qual personagem você seria?” 🙈", "Pediu pra eu entrar com meu Facebook…"], stay: true },
            { text: "O que é autenticação de dois fatores?", reply: ["Pelo que li: além da senha, o site pede um código que chega no celular 📲", "Aí mesmo que roubem a senha, não conseguem entrar!"], stay: true },
          ],
        },
        task: {
          say: [],
          options: [
            { text: "Pronto: apaguei o post, troquei a senha e ativei os dois fatores ✅", verify: (ctx) => ctx.facebookCheck(), okReply: ["UFA!!! Meu perfil voltou ao normal 🙌", "Agora com dois fatores ninguém entra mais. Te devo uma! 🍕"], end: "good", lesson: "junior" },
            { text: "Não consegui entrar 😕", reply: ["Abre o Chrome e vai em facebook.com", "E-mail: junior.silva@gmail.com · Senha: junior123", "Depois clica no menu ⚙️ Configurações → Segurança"], stay: true },
            { text: "Onde ativo os dois fatores?", reply: ["Em Configurações → Segurança e login → Autenticação de dois fatores", "Vai chegar um código, aí é só digitar"], stay: true },
          ],
        },
      },
    },
  ];

  const lessons = {
    rafael: { tone: "good", title: "Você encontrou a senha do Wi-Fi", text: "Configurações → Rede e Internet → Wi-Fi → propriedades da rede → Exibir senha. Só passe a senha para quem pode usar a rede." },
    marta: { tone: "good", title: "Você recuperou um arquivo da Lixeira", text: "Arquivo apagado vai para a Lixeira. Restaurar devolve ele para a pasta de onde saiu. Esvaziar a Lixeira apaga de vez." },
    tadeu: { tone: "good", title: "Você usou a pesquisa do Explorador", text: "Digitar parte do nome na caixa de pesquisa encontra arquivos escondidos em pastas dentro de pastas." },
    bia: { tone: "good", title: "Você salvou uma imagem da internet", text: "Na aba Imagens do Google, “Salvar imagem” guarda o arquivo em Downloads. Em trabalhos, cite a fonte da imagem." },
    rose: { tone: "good", title: "Você criou um documento no Word", text: "Escrever, dar nome ao arquivo e salvar em Documentos: o arquivo .docx pode ser anexado em qualquer conversa ou e-mail." },
    davi: { tone: "good", title: "Você conferiu o espaço livre do disco", text: "Em Este Computador, o Disco Local (C:) mostra “X livres de Y”. Antes de instalar algo grande, confira o X." },
    carol: { tone: "good", title: "Você protegeu uma conta invadida", text: "Trocar a senha e “sair de todos os aparelhos” expulsa quem entrou sem permissão. Use uma senha diferente para cada site." },
    antonio: { tone: "good", title: "Você criou um perfil para outra pessoa", text: "Perfis separam o histórico e as recomendações de cada pessoa que usa a mesma conta." },
    fernanda: { tone: "good", title: "Você organizou arquivos em pastas", text: "Botão direito → Novo → Pasta cria a pasta. Recortar e Colar move o arquivo sem fazer cópia." },
    lucas: { tone: "good", title: "Você ensinou dois atalhos", text: "Windows + Shift + S tira print de uma parte da tela. Ctrl + Shift + Esc abre o Gerenciador de Tarefas para finalizar o que travou." },
    junior: { tone: "good", title: "Você recuperou uma conta hackeada", text: "Apagar o conteúdo falso, trocar a senha e ativar a autenticação de dois fatores: com o código no celular, a senha sozinha não basta." },
    "hacker-good": { tone: "good", title: "Golpe da extorsão: você não caiu! 🛡️", text: "Essas mensagens são enviadas para milhares de pessoas e quase sempre são blefe. Ele não tinha foto nenhuma.", tips: ["Nunca pague: quem paga recebe novas cobranças", "Não responda, bloqueie e denuncie", "Conte para um adulto de confiança", "Denuncie também na SaferNet Brasil"] },
    "hacker-paid": { tone: "bad", title: "Você pagou o golpista 😬", text: "Na extorsão, pagar nunca encerra a chantagem: o valor só aumenta. E ele nem tinha as fotos (lembra do cachorro de óculos?).", tips: ["Nunca pague e não negocie", "Guarde prints, bloqueie e denuncie", "Converse com um adulto de confiança", "Troque suas senhas e tampe a webcam se ficar com medo"] },
    "cleiton-good": { tone: "good", title: "Você protegeu os dados da sua amiga 🛡️", text: "Telefone é dado pessoal. Pela LGPD, dados de uma pessoa só devem ser compartilhados com permissão dela." },
    "cleiton-bad": { tone: "bad", title: "Você passou o número de outra pessoa 😬", text: "Telefone é dado pessoal. Pergunte para a pessoa antes: ela decide com quem quer falar.", tips: ["Não passe telefone, endereço ou escola de ninguém", "Peça permissão: “Posso passar seu número para fulano?”"] },
    "mae-good": { tone: "good", title: "Golpe do número novo: você não caiu! 🛡️", text: "Ligar para o número antigo desmascarou o golpista na hora. Ele usou a foto da sua mãe para parecer real.", tips: ["Desconfie de pedido de dinheiro com pressa", "Ligue para o número que você já conhecia", "Faça uma pergunta que só a pessoa saberia"] },
    "mae-bad": { tone: "bad", title: "Você caiu no golpe do número novo 😬", text: "Foto de perfil igual e pedido urgente de PIX: é o golpe mais comum do WhatsApp. PIX enviado é muito difícil de recuperar.", tips: ["Antes de qualquer PIX, ligue para o número antigo", "Se cair, avise o banco na hora e registre boletim de ocorrência"] },
    "vovo-good": { tone: "good", title: "Você parou uma notícia falsa 🛡️", text: "LETRAS MAIÚSCULAS, urgência e “repasse para todos” são sinais de corrente falsa.", tips: ["Pesquise em agências de checagem antes de repassar", "Explique com carinho: quem repassa quase sempre quer ajudar"] },
    "vovo-bad": { tone: "bad", title: "A corrente falsa se espalhou 😬", text: "A mensagem da cobrança do WhatsApp é uma notícia falsa antiga. Cada repasse ajuda o boato a chegar mais longe.", tips: ["Desconfie de MAIÚSCULAS, urgência e “repasse”", "Pesquise antes: se fosse verdade, estaria nos jornais"] },
    "promo-good": { tone: "good", title: "Você reconheceu o phishing 🛡️", text: "Prêmio de sorteio que você nem participou + link estranho + taxa para receber = golpe.", tips: ["Repare no endereço: magaz1ne-premios.xyz imita uma loja real com um número no lugar da letra", "Lojas não pedem pagamento para entregar prêmio"] },
    "promo-mid": { tone: "info", title: "Você clicou, mas parou a tempo ⚠️", text: "Abrir um link de golpe já é arriscado: a página pode pedir dados ou baixar arquivos. Você não enviou nada — ótimo.", tips: ["Antes de clicar, leia o endereço com calma", "Na dúvida, entre direto pelo site oficial da loja"] },
    "promo-bad": { tone: "bad", title: "Você entregou os dados do cartão 😬", text: "O site falso só queria o número do cartão. Ligue para o banco e bloqueie o cartão imediatamente.", tips: ["Prêmio que pede frete é golpe", "Confira o endereço do site letra por letra"] },
    "larissa-good": { tone: "good", title: "Você não caiu no perfil falso 🛡️", text: "Perfis falsos usam fotos bonitas para conquistar confiança e pedir localização, escola ou fotos.", tips: ["Nunca envie localização em tempo real para quem não conhece pessoalmente", "Desconfie de quem tem pressa para saber onde você está", "Conte para um adulto de confiança"] },
    "larissa-bad": { tone: "bad", title: "Você mandou sua localização para um perfil falso 😬", text: "A “Larissa” era o Marquinho (ou alguém pior). Localização em tempo real mostra onde você está agora.", tips: ["Pare de compartilhar a localização na hora", "Bloqueie, denuncie e conte para um adulto de confiança"] },
    "suporte-good": { tone: "good", title: "Você protegeu sua conta 🛡️", text: "O código do SMS é a chave da sua conta. O WhatsApp de verdade nunca pede esse código por mensagem.", tips: ["Ative a confirmação em duas etapas: Configurações → Conta", "Ninguém precisa do seu código: nem suporte, nem amigo"] },
    "suporte-bad": { tone: "bad", title: "Você entregou o código da sua conta 😬", text: "Com o código, o golpista abre o seu WhatsApp no celular dele e pede PIX para todos os seus contatos.", tips: ["Nunca passe códigos recebidos por SMS", "Ative a confirmação em duas etapas", "Se acontecer, reinstale o WhatsApp e avise seus contatos"] },
    jorge: { tone: "info", title: "Número errado acontece 🌽", text: "Responder com educação está ótimo. Só não passe dados pessoais para quem você não conhece." },
    "jorge-cpf": { tone: "bad", title: "Você passou seu CPF para um desconhecido 😬", text: "Com CPF e nome completo, golpistas fazem cadastros e compras em seu nome.", tips: ["CPF só em sites oficiais e quando for realmente necessário"] },
    "vaga-good": { tone: "good", title: "Golpe da tarefa: você não caiu! 🛡️", text: "Emprego de verdade não cobra taxa. “Ganhe muito curtindo vídeos” é isca.", tips: ["Desconfie de dinheiro fácil", "Pesquise o nome da empresa e o CNPJ"] },
    "vaga-bad": { tone: "bad", title: "Você caiu no golpe da tarefa 😬", text: "O bônus que não pode ser sacado e o “nível VIP” servem para tirar cada vez mais dinheiro.", tips: ["Empresa séria não cobra para você trabalhar", "Se pagou, avise o banco e registre ocorrência"] },
  };

  const order = ["rafael", "marta", "hacker", "tadeu", "cleiton", "bia", "mae", "rose", "vovo", "davi", "promo", "carol", "larissa", "antonio", "suporte", "fernanda", "jorge", "lucas", "vaga", "junior"];

  const guide = {
    id: "oslab", name: "OSLab Dicas 🤖", avatar: "assets/learning/mascot/oslab-mascot-neutral.png", about: "Sua trilha de Segurança Digital", phone: "OSLab",
    welcome: [
      "Oi! Eu sou o robô do OSLab 🤖",
      "Esta é a trilha Segurança Digital. A cada minuto, uma pessoa nova vai te mandar mensagem.",
      "Algumas precisam da sua ajuda no Windows e na internet. Outras… não são quem dizem ser 👀",
      "Você sempre terá 3 respostas para escolher. Leia com calma antes de responder. Boa sorte! 🛡️",
    ],
  };

  O.zapStory = { contacts, lessons, order, guide, norm };
})(window);
