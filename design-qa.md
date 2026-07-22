# Design QA — Gerenciador de Tarefas, menus de item e Lixeira

## Artefatos

- Fonte visual — Gerenciador de Tarefas: `C:\Users\Pichau\AppData\Local\Temp\codex-clipboard-a1e30991-ade4-4c35-abdc-b2f241b19e70.png` (`1288 × 584`).
- Fonte visual — menu de arquivo/pasta: `C:\Users\Pichau\AppData\Local\Temp\codex-clipboard-f1cdcf3c-1e6a-4971-a911-95ee1dfc1c21.png` (`313 × 356`).
- Fonte visual — menu da barra de tarefas: `C:\Users\Pichau\AppData\Local\Temp\codex-clipboard-e4ba38d4-710b-440a-bc18-930f80e1e63f.png` (`521 × 98`).
- Implementação final do Gerenciador: `qa/taskmanager-implementation-handoff.png` (`1280 × 720`).
- Implementação final da Lixeira: `qa/recycle-implementation-final.png` (`1936 × 1048`).
- Implementação do menu de item: `qa/item-context-implementation.png` (`1936 × 1048`).
- Comparação final do Gerenciador: `qa/taskmanager-comparison-final-v2.png`.
- Comparação focada do menu de item: `qa/item-context-comparison-focus.png`.

## Viewport e normalização

- Viewport final do navegador interno: `1280 × 720` CSS px; captura `1280 × 720` pixels; densidade observada `1:1`.
- Para comparar o Gerenciador, a implementação foi recortada para a região superior `1280 × 584` e redimensionada apenas `0,625%` para `1288 × 584`, igualando a fonte.
- Para o menu, a implementação foi recortada em `313 × 367`; a fonte permaneceu em `313 × 356`. A comparação mantém a largura nativa e evidencia a diferença de altura causada pela remoção intencional de **Abrir com Code**.
- Estado comparado: Gerenciador maximizado, aba **Processos** ativa, pesquisa vazia, nenhuma linha selecionada e ações dependentes de seleção desabilitadas.

## Evidência de tela completa

- `qa/taskmanager-comparison-final-v2.png` mostra a busca central no título, sidebar de `238 px`, barra de comandos, cabeçalhos e colunas de uso alinhadas ao Windows 11.
- Os valores da implementação são deliberadamente menores e a lista contém apenas processos do Windows, conforme pedido.
- A Lixeira foi verificada com um item e depois vazia. A região `.recycle-main` terminou com `scrollWidth = clientWidth = 668`, sem barra horizontal.

## Evidência focada

- `qa/item-context-comparison-focus.png` confirma largura, superfície translúcida, divisórias, atalhos e faixa inferior com **Recortar**, **Copiar**, **Renomear** e **Excluir**.
- O item **Abrir com Code** foi removido intencionalmente. O menu final permanece mais curto e contém somente ações relevantes ao OSLab.
- `qa/taskmanager-comparison-detail.png` foi usado para revisar tipografia, largura da sidebar e trilhas das colunas antes da captura final.

## Superfícies de fidelidade

- Tipografia: Segoe UI/fallback do sistema, título de `13 px`, busca de `14 px`, linhas de processo de `11,5 px` e hierarquia equivalente à referência.
- Espaçamento e layout: busca integrada ao título, sidebar fixa, conteúdo encostado à navegação, colunas de Nome/Status/CPU/Memória/Disco/Rede com larguras compatíveis e linhas compactas de `32 px`.
- Cores e tokens: fundo `#f7f7f7`, cartões brancos, azul claro nas métricas, azul de seleção e menus claros translúcidos.
- Imagens e ícones: assets raster reais do win11React e dos ícones já usados no OSLab; nenhum emoji, SVG artesanal ou desenho CSS foi introduzido.
- Conteúdo: interface em português; processos fictícios restritos ao Windows; consumos baixos; Microsoft 365, OneDrive e VS Code ausentes.
- Estados: busca, seleção, botão desabilitado/habilitado, finalização, item selecionado na Lixeira, restauração, exclusão permanente e estado vazio testados.

## Achados

- Nenhum P0, P1 ou P2 permanece.
- [P3] Alguns ícones raster têm traço e cor ligeiramente diferentes dos ícones monocromáticos do Windows nativo. São assets reais, reconhecíveis e consistentes com o restante do simulador.
- Diferenças intencionais: lista menor e exclusivamente Windows, valores baixos de recursos, ausência de contagem de grupos/aplicativos externos, ausência de **Abrir com Code** e identidade `Aluno`.

## Histórico de comparação

1. Primeira passagem:
   - [P1] A busca aparecia em uma linha extra abaixo do título e as colunas de recursos eram empurradas para a borda direita em telas largas.
   - [P2] A tabela da Lixeira produzia barra de rolagem horizontal na janela padrão.
   - [P2] O menu de item ainda não estava ligado a renomear/excluir e à Lixeira.
2. Correções:
   - A busca foi movida para o título da janela; a grade recebeu trilhas fixas equivalentes à referência; os PIDs deixaram de ser exibidos na linha.
   - As larguras mínimas da tabela da Lixeira foram reduzidas e as colunas recalibradas.
   - As ações passaram a operar sobre arquivos e pastas persistentes, enviando os itens para a Lixeira.
3. Segunda passagem:
   - [P2] A densidade das linhas de processo estava maior que a referência.
   - Correção: altura reduzida de `39 px` para `32 px` e tipografia ajustada.
4. Passagem final:
   - `qa/taskmanager-comparison-final-v2.png`, `qa/item-context-comparison-focus.png` e `qa/recycle-implementation-final.png` não mostram diferenças acionáveis P0/P1/P2.

## Interações e execução

- Login com `alunos2026`.
- Clique direito na barra de tarefas e abertura do Gerenciador.
- Busca por `WMI`, seleção e finalização do processo filtrado.
- Clique direito em pasta e validação das ações inferiores.
- Criação e renomeação de `Teste Lixeira.txt`.
- Exclusão de pasta, restauração, exclusão do arquivo temporário e remoção permanente.
- Recarga da página e confirmação da persistência de **Atividades de SO** e da Lixeira vazia.
- Console do navegador: `[]` para erros.
- `node --check script.js`, verificação de assets e HTTP `200` concluídos.

## Checklist final

- [x] Gerenciador visualmente alinhado à referência.
- [x] Processos fictícios do Windows com valores baixos.
- [x] Busca, seleção e finalização funcionando.
- [x] Menu de item com renomear e excluir.
- [x] Arquivos, pastas e Lixeira persistidos no `localStorage`.
- [x] Restaurar e excluir permanentemente funcionando.
- [x] Sem overflow horizontal na Lixeira.
- [x] Sem erros no console.

final result: passed

## Validação complementar — desktop responsivo e missões

- A grade de ícones ocupa somente o espaço entre o topo e a barra de tarefas.
- Os itens preenchem cada coluna de cima para baixo e criam novas colunas automaticamente quando a altura acaba.
- Os modos de ícone grande, médio e pequeno preservam o mesmo limite da barra de tarefas.
- O aplicativo Missões, o widget de missão ativa e as janelas simultâneas foram verificados no fluxo integrado.
- O estado do cenário final não pode ser concluído durante a preparação e o aplicativo obrigatório é reconstruído após recarregar a página.

Status final: aprovado.
