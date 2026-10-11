# Verificação — Minha Primeira Vida Digital

Data: 11/10/2026. Branch: `codex/minha-primeira-vida-digital`. Cache: `oslab-offline-v24`.

## Testes automáticos

- `node tests/run-tests.js`: **24/24 aprovados**. Inclui sintaxe de todos os JavaScripts, referências de recursos, precache e regressões de navegador, instalação, VPN, missões e exercícios.
- `node --test tests/digital-life.test.mjs`: **7/7 aprovados**. Fluxo sequencial das 12 missões, bloqueio antecipado, novos logins, campos inválidos, endereços indisponíveis, conta inexistente, confirmação de senha, senha própria por serviço, código Netflix, persistência, suspensão e reset.
- `git diff --check`: sem erros de whitespace. Git informa apenas a conversão habitual LF/CRLF deste checkout Windows.

## Fluxo pela interface

As 12 missões foram realizadas no navegador do OSLab com um aluno fictício. O mapa mostrou **12/12 missões, 100% progresso**.

- Cadastro Google para uso pessoal em etapas; leitura da mensagem inicial.
- Outlook e Yahoo com endereços e senhas distintos; confirmação fictícia Yahoo.
- Nova aba Netflix, pesquisa e primeiro resultado; código entregue no Gmail; leitura, código incorreto com erro, cópia pelo botão, retorno à mesma etapa, confirmação correta, plano Padrão, cartão de demonstração, animação e entrada no perfil Ana.
- Spotify: cadastro com senha própria, abrir Um Novo Dia, reproduzir/pausar e favoritar.
- Discord: cadastro, nome de exibição e acesso à Comunidade OSLab.
- YouTube: sessão Google reaproveitada e perfil visível.
- Drive: pasta Meus Documentos visível.
- Retornos Outlook e Yahoo com novo login; leitura/abertura da caixa. Retorno Netflix após sair, novo login e perfil preservado sem código. Retorno Spotify após sair, novo login e abertura do favorito preservado.
- Recarregamento e reabertura conservaram abas, caminhos, parâmetros, contas e progresso. Senha de treinamento digitada, alternância para Gmail e retorno ao Spotify permitiram concluir o login sem redigitar; ela permanece somente em memória.
- Novo aluno: cancelar manteve as conquistas; confirmar retornou a 0/12, bloqueou missões 02–12 e removeu referências digitais das três abas abertas. Isolamento dos outros laboratórios e invalidação de operações criptográficas em andamento também verificados por teste automatizado.

## Layout, teclado e imagens

- Oito serviços medidos em **1366×768** e **1024×640**, janelas maximizadas e restauradas: **32 cenários sem overflow horizontal** no serviço ou no documento.
- Formulários Gmail (login, nome, informações básicas, endereço e senha) e verificação Netflix medidos em janela restaurada a 1024×640: sem overflow horizontal.
- Foco visível confirmado ao avançar pelo teclado para Confirmar código. Seleção/cópia e alternância de abas usadas no fluxo de verificação.
- Conferência visual do catálogo Netflix, Gmail e YouTube; imagens locais, marca e fontes carregadas. Corrigidos caminho do fundo Netflix e rolagem herdada da página anterior.
- Algumas capturas do navegador de testes apresentam margem preta do compositor após mudar a resolução; as dimensões do documento e medidas de overflow foram obtidas pelo DOM.

Evidências: [resultados de layout](visual-results.json), [formulários](auth-results.json), [Netflix](netflix-1366.png), [conclusão](completion-1366.png), [YouTube](youtube-1366-maximized.png), [Novo aluno](new-student.png).

## Offline e rede

O servidor HTTP local foi desligado e sua indisponibilidade confirmada. O OSLab recarregou pelo Service Worker, permitiu login no desktop, reabertura do navegador e acesso aos oito serviços. O mapa preservou 12/12 conclusões; contas, mensagens, pasta, perfil e favoritos foram mantidos. Marca e thumbnails visíveis do YouTube terminaram de carregar sem servidor.

Evidências: [resultados offline](offline-results.json), [conclusão offline](offline-completion.png), [YouTube offline](offline-youtube.png). A tentativa automática de atualizar o script do Service Worker registrou um erro esperado enquanto o servidor estava desligado; a aplicação e recursos locais funcionaram. Antes do desligamento, o console da aba final estava sem erros ou avisos.

Não há `fetch`, XHR ou envio de formulários nos módulos de contas e telas desta trilha. PBKDF2 com salts distintos foi confirmado; eventos e dados persistentes foram inspecionados pelos testes para ausência de senhas em texto puro. Código de verificação fica apenas na simulação local.

## Limitação das referências Figma

Formulário/perfis Netflix e barra lateral/cabeçalho YouTube extraídos, com capturas das telas completas como referência. A cota Starter bloqueou os componentes restantes, incluindo cartão de vídeo e player; a comparação integral com o Figma não foi concluída. Os planos, cadastro e pagamento foram compostos para o exercício. Consulte [créditos](../../docs/digital-life-credits.md).

## Publicação

A validação da URL pública e dos recursos será registrada em public-release.json após a conclusão do build de GitHub Pages.
