# OSLab

Laboratório virtual estático para alunos praticarem conceitos de Sistemas Operacionais em uma interface inspirada no Windows 11. O projeto funciona somente com HTML, CSS e JavaScript puro, sem backend ou etapa de compilação, e é compatível com GitHub Pages.

## Versão publicada

- Aplicação: <https://fernandobalbino.github.io/OSLab/>
- Código-fonte: <https://github.com/FernandoBalbino/OSLab>

## Principais recursos

- entrada direta na tela de login do perfil **Aluno**, sem tela de carregamento;
- solicitação de tela cheia após uma ação do usuário;
- área de trabalho limpa;
- Computador, Lixeira, Explorador de Arquivos, Google e Configurações;
- menu Iniciar, pesquisa, barra de tarefas, relógio e painel de configurações rápidas inspirado no original do win11React;
- várias janelas abertas ao mesmo tempo, com foco independente e controles para mover, redimensionar, minimizar, maximizar, restaurar e fechar;
- aplicativo Configurações em português, com telas próprias para Sistema, Bluetooth e dispositivos, Rede e Internet, Personalização, Aplicativos e Hora e idioma;
- aplicativo Missões com 12 atividades reais, progressão linear, dicas, pontuação, medalhas, checklist, retomada e limpeza de cenários;
- Gerenciador de Tarefas inspirado no Windows 11, com processos dinâmicos, pesquisa por nome/PID, seleção, ordenação, grupos, modo de eficiência e encerramento de tarefas;
- menu de contexto inspirado no Windows 11, com submenus de exibição, classificação e criação;
- menu de contexto próprio para arquivos e pastas, com ações de abrir, renomear, copiar caminho e excluir;
- sistema de arquivos hierárquico em Área de Trabalho, Documentos, Downloads e Imagens, com criar, renomear, recortar, copiar, colar, mover e pesquisa recursiva;
- Lixeira funcional para árvores de pastas, com restauração, exclusão permanente e esvaziamento;
- sete papéis de parede selecionáveis, aplicados imediatamente e preservados no navegador;
- distribuição automática dos ícones da área de trabalho em novas colunas, sempre limitada à região acima da barra de tarefas;
- persistência versionada do sistema e do progresso das missões no `localStorage`.

## Missões

As 12 missões cobrem abertura de aplicativos, controle de janelas, criação/renomeação/movimentação/cópia/restauração/pesquisa de arquivos, personalização, volume, encerramento de aplicativo travado e organização integrada do computador.

O ciclo real é: o motor prepara o cenário, o aluno age nos aplicativos do simulador, o barramento recebe o evento depois da alteração de estado e a missão valida o resultado final. Uma missão ativa aparece em um widget flutuante acima da barra de tarefas.

## Acesso

- Perfil: `Aluno`
- Senha: `alunos2026`

A senha é validada apenas no navegador. Como o projeto é totalmente estático e destinado ao GitHub Pages, esse login é uma simulação visual e não deve ser tratado como autenticação segura.

Os navegadores só permitem entrar em tela cheia depois de um clique ou envio de formulário. O OSLab solicita esse modo ao confirmar a senha e também oferece o botão **Abrir em tela cheia** na tela de login. Se o navegador negar a permissão, a interface continua ocupando toda a área disponível da guia.

## Personalização

Abra **Configurações → Personalização → Plano de fundo** para escolher entre `bg.png` e `bg2.jpg` até `bg7.jpg`. A seleção é salva no `localStorage`, portanto continua ativa após atualizar ou reabrir o site no mesmo navegador.

## Arquivos, pastas e Lixeira

Clique com o botão direito na área de trabalho e escolha **Novo → Pasta** ou **Novo → Documento de Texto**. O nome entra em edição imediatamente; confirme clicando fora ou pressionando **Enter**. Pastas podem ser abertas no Explorador e arquivos de texto possuem uma área de edição com salvamento automático.

Ao clicar com o botão direito em um item, use **Renomear** ou **Excluir**. A exclusão envia o item para a Lixeira. Dentro da Lixeira, selecione o item para habilitar **Restaurar** e **Excluir permanentemente**.

As preferências, a árvore de arquivos e a Lixeira ficam reunidas na chave versionada `oslab-state-v1`. Estados antigos são migrados para a árvore hierárquica sem descartar os itens existentes. O progresso pedagógico usa a chave separada `oslab.missions.progress`.

## Gerenciador de Tarefas

Clique com o botão direito na barra de tarefas e escolha **Gerenciador de Tarefas**. A lista usa processos fictícios do Windows com consumo baixo e adiciona em tempo real os aplicativos abertos. Processos essenciais são protegidos; aplicativos podem ser finalizados e têm sua janela encerrada pelo controlador central.

## Arquitetura

- `js/core`: eventos, registro de aplicativos, sistema de arquivos e processos;
- `js/apps`: Missões e Gerenciador de Tarefas;
- `js/missions`: catálogo, motor e persistência;
- `js/ui`: notificações, confirmações, widget e modal de conclusão;
- `script.js`: integração com o shell, as janelas e os aplicativos existentes;
- `css/missions.css` e `css/task-manager.css`: estilos das novas superfícies.

Para adicionar uma missão, inclua uma entrada em `js/missions/mission-catalog.js` com dados, objetivos, dicas e as funções `setup`, `validate`, `cleanup` e `reset`. A validação deve consultar o estado real e reagir aos eventos de `OSLab.events`.

## Executar localmente

Abra um servidor HTTP na raiz do projeto. Um exemplo com Python:

```powershell
python -m http.server 4173
```

Depois, acesse `http://localhost:4173`.

Execute as verificações automatizadas com:

```powershell
node tests/run-tests.js
```

## Publicação no GitHub Pages

O projeto usa somente caminhos relativos e não exige etapa de compilação. A raiz da branch `main` é publicada diretamente pelo GitHub Pages. O arquivo `.nojekyll` evita processamento desnecessário pelo Jekyll.

## Créditos

Parte dos ícones e da referência de interação foi adaptada do projeto [blueedgetechno/win11React](https://github.com/blueedgetechno/win11React), disponibilizado sob licença CC0-1.0. A cópia da licença está em `LICENSE-win11React.txt`.
