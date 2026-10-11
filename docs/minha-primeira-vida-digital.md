# Minha Primeira Vida Digital

Trilha de 12 missões sequenciais no navegador virtual do OSLab. HTML, CSS e JavaScript puro, sem servidor de contas ou serviços externos.

## Começar e retomar

1. Abra o OSLab e entre no perfil Aluno com a senha de demonstração `alunos2026`.
2. Abra **Minha Primeira Vida Digital** na Área de Trabalho, no Menu Iniciar ou na pesquisa. O atalho do manifesto também abre a trilha após o login.
3. Selecione a primeira missão disponível e clique em **Iniciar missão**. As próximas são liberadas em ordem.
4. Pratique no Google Chrome virtual. Pesquise o serviço e abra o resultado local; todas as páginas exibem “Simulação educacional — OSLab”.
5. Use o assistente para acompanhar o próximo objetivo, abrir a trilha, pausar ou consultar uma dica opcional.

A sessão é local por navegador e dispositivo. Reabrir a trilha permite retomar a tentativa. Trocar de atividade suspende a validação desta trilha. Conclusões e contas continuam salvas. Os quatro retornos exigem um login realizado depois do início da missão.

## Serviços e identidades

| Serviço | Endereço interno | Conta |
|---|---|---|
| Gmail | gmail.oslab.local | Google |
| Outlook | outlook.oslab.local | Outlook própria |
| Yahoo Mail | yahoo.oslab.local | Yahoo própria |
| Netflix | netflix.oslab.local | Gmail como endereço, senha Netflix própria |
| Spotify | spotify.oslab.local | Gmail como endereço, senha Spotify própria |
| Discord | discord.oslab.local | Gmail como endereço, senha Discord própria |
| YouTube | youtube.oslab.local | Mesma identidade e sessão Google |
| Google Drive | drive.oslab.local | Mesma identidade e sessão Google |

Os endereços são digitados dentro do navegador virtual, não no navegador real. A Netflix `netflix.com` das atividades VPN mantém seu catálogo regional separado.

## Percurso

| Missão | Resultado |
|---|---|
| 01 | Criar Gmail para uso pessoal e ler a mensagem inicial |
| 02 | Criar Outlook e abrir a caixa |
| 03 | Criar Yahoo com confirmação fictícia e abrir a caixa |
| 04 | Nova aba, pesquisa, primeiro resultado Netflix, código no Gmail, senha, plano, cartão de demonstração e perfil |
| 05 | Criar Spotify, abrir música e favoritar |
| 06 | Criar Discord, personalizar nome e entrar na Comunidade OSLab |
| 07 | Usar Google e visualizar o perfil YouTube |
| 08 | Criar “Meus Documentos” no Drive |
| 09 | Pesquisar “Outlook Entrar”, fazer novo login e ler a mensagem inicial |
| 10 | Fazer novo login Yahoo e abrir a caixa correta |
| 11 | Fazer novo login Netflix e selecionar o perfil salvo |
| 12 | Fazer novo login Spotify e abrir o favorito salvo |

## Código Netflix e pagamento

Somente a missão 04 envia uma mensagem para o Gmail criado na missão 01. Seu assunto é **Código de verificação da Netflix** e o corpo contém somente seis dígitos. Leia a mensagem, selecione o texto ou clique em **Copiar código** e volte à aba Netflix para colar. A etapa e o endereço são preservados entre abas. O código não expira durante o cadastro, não é duplicado por novos cliques e é consumido após confirmação. A mensagem inicial continua na caixa. O login da missão 11 não envia código.

Escolha um plano fictício e clique em **Usar cartão de demonstração**. Os campos são somente leitura; a confirmação mostra a animação e informa que não existe cobrança. A missão termina após entrar no perfil.

Netflix tem 20 títulos e YouTube tem 12 vídeos fictícios. Pesquisa, categorias, detalhes e controles de reprodução funcionam localmente. Os players mostram início, pausa e progresso simulados. Spotify tem seis músicas fictícias e favoritos persistentes.

## Novo aluno

Abra a trilha e clique em **Novo aluno**. Revise a confirmação e confirme para limpar contas, sessões, caixas de e-mail, códigos, rascunhos, referências nas abas e progresso desta trilha. Cancelar conserva a sessão. Dados dos outros laboratórios permanecem.

## Dados locais e offline

Use nomes, datas, endereços e senhas fictícios. Formulários são processados no OSLab e não enviam dados a Google, Netflix ou outros serviços. A chave versionada é `oslab.digital-life.v1`. Senhas de treinamento usam PBKDF2-SHA256 com salt individual e 120.000 iterações; não são guardadas em texto puro. Eventos, URLs e rascunhos persistentes excluem senhas. Campos sensíveis permanecem somente em memória enquanto a janela está aberta; após recarregar é necessário digitá-los novamente.

Após a primeira abertura online e instalação do cache, o OSLab, as telas e imagens podem ser recarregados offline. A versão desta entrega é `oslab-offline-v24`.

## Desenvolvimento e testes

Execute um servidor estático na raiz (por exemplo, `python -m http.server 8000`) e abra `http://localhost:8000`. WebCrypto e Service Worker exigem localhost ou HTTPS.

```sh
node tests/run-tests.js
node --test tests/digital-life.test.mjs
```

Interfaces: `OSLab.digitalLife` centraliza dados e contas; `OSLab.digitalSites` resolve rotas, telas e rascunhos por aba; `OSLab.digitalLifeTrail` valida objetivos e progresso pelo barramento e pelo coordenador de atividades.

Veja [créditos](digital-life-credits.md) e [relatório de verificação](../qa-evidence/digital-life/report.md).
