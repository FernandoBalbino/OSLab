# Design QA — Trilhas de Missões e Exercícios

## Artefatos

- Referência visual: `C:\Users\Pichau\AppData\Local\Temp\codex-clipboard-727e8369-9257-490a-88ee-1d71a4d1e9b8.png` (`6480 × 3600`).
- Implementação principal: `qa/learning-exercises-final-default.png` (`1936 × 1048`).
- Trilha de Missões: `qa/learning-missions-final-default.png` (`1936 × 1048`).
- Comparação lado a lado: `qa/learning-path-comparison.png` (`1960 × 620`).
- Viewports complementares: `qa/learning-exercises-1366x768-final.png`, `qa/learning-exercises-1024x640-final.png` e `qa/learning-exercises-restored-final.png`.

## Referência e intenção

- A referência do Duolingo foi usada para navegação, percurso em zigue-zague, leitura dos estados e sensação de avanço; não como cópia de marca.
- A implementação mantém a identidade azul do OSLab/Windows 11, separa Missões e Exercícios e usa mascote, textos e assets próprios.
- `qa/learning-path-comparison.png` reúne a fonte e a implementação na mesma imagem de comparação, como gate visual final.

## Viewport e normalização

- Comparação principal: captura do navegador interno em `1936 × 1048` CSS px e pixels, exibida integralmente no lado direito da composição.
- A fonte de `6480 × 3600` foi reduzida integralmente para o lado esquerdo. A diferença de produto é intencional: a fonte é um painel promocional; o alvo é um aplicativo educacional em um desktop simulado.
- Verificações adicionais por métricas DOM: `1366 × 768`, `1024 × 640` e janela restaurada de `860 × 580`.
- O recurso de captura com viewport sobrescrito do navegador interno desenhou a página em escala reduzida no canto da imagem; por isso, os screenshots menores são apoio visual e as medidas CSS/overflow foram lidas diretamente do DOM. A captura principal não apresenta esse artefato.

## Evidência de tela completa

- Em `1936 × 1048`, a trilha usa três áreas sem sobreposição: percurso, detalhes e assistente acoplado.
- Em `1366 × 768`, as colunas mediram `686 px / 350 px / 330 px`; não houve overflow horizontal nem título truncado.
- Em `1024 × 640`, o layout mediu `664 px / 360 px`, com detalhes e assistente dividindo duas linhas de `216 px`; não houve overflow horizontal nem título truncado.
- Na janela restaurada de `860 × 580`, a trilha, o painel de detalhes e o assistente passam para uma coluna rolável, funcionando como painel inferior.

## Evidência focada

- Nós grandes de `84 px` diferenciam disponível, em andamento, concluído e bloqueado; os bloqueados estão desabilitados de verdade.
- Cabeçalhos de unidade agrupam Sistema/Rede e as quatro áreas de Missões, preservando o percurso vertical em zigue-zague.
- O painel lateral mostra estado, título, categoria, dificuldade, objetivo, checklist e ações de iniciar, continuar ou refazer.
- O assistente usa o mascote raster correto, é recolhível, mantém a ação Dica e é acoplado à trilha quando ela está em foco; quando a trilha é minimizada, volta ao desktop acima da barra de tarefas.
- Dicas de exercícios aparecem apenas no assistente. Dicas de missão permanecem acessíveis nos detalhes e no assistente, sempre após ação explícita do aluno.

## Superfícies de fidelidade

- Tipografia: Nunito Sans local somente nas superfícies educacionais; Segoe UI preservada no sistema simulado. Hierarquia amigável, títulos sem truncamento e microtexto legível.
- Espaçamento e layout: cabeçalho, progresso, unidades, nós, painel de detalhes e assistente têm trilhas claras; alvos interativos têm ao menos `44 px` nas ações principais e `84 px` nos nós.
- Cores e tokens: azul OSLab como primária, verde para conclusão, amarelo para dica e cinza para bloqueio; contraste e foco visível em amarelo de `3 px`.
- Imagens e ícones: três mascotes raster próprios, ícones específicos do Microsoft Fluent UI System Icons e nenhuma coruja, emoji ou ícone genérico repetido.
- Conteúdo: português com acentos, objetivos reais do simulador e dicas em 4–6 passos concretos com abertura, clique, execução e conferência.
- Estados: entrada, seleção, pulso do atual, conclusão, dica revelada, recolhimento, desbloqueio sequencial e redução de movimento estão definidos.

## Interações verificadas

- Login e abertura de Missões e Exercícios.
- Início da missão 1, dica sob demanda, conclusão, medalha e desbloqueio somente da missão 2.
- Troca de uma missão ativa para um exercício pelo coordenador compartilhado.
- Início do exercício 1, fase inicial `Investigando`, dica com cinco passos e reabertura sem duplicação.
- Recolher e expandir o assistente; abrir a trilha novamente e acoplar o assistente sem cobrir o conteúdo.
- Seleção por teclado com `Enter`, foco preservado e outline visível.
- Bloqueios reais, ausência de overflow horizontal e ausência de títulos truncados nos três tamanhos.
- Console do navegador: nenhum erro ou aviso.
- `prefers-reduced-motion` presente no CSS.
- Suíte automatizada: `13/13` verificações aprovadas, incluindo engines, legado, assets e precache `oslab-offline-v5`.

## Histórico de comparação

1. Primeira passagem:
   - [P1] O assistente flutuante cobria parte do painel lateral ao abrir outra trilha durante uma atividade.
   - [P1] O assistente oculto ainda reservava uma terceira coluna vazia quando nenhuma atividade estava em andamento.
   - [P2] A dica de Exercícios aparecia simultaneamente no painel e no assistente.
   - [P2] Em `1024 × 640`, o painel de detalhes recebia somente `133 px` de altura.
   - [P2] Minimizar a trilha logo após iniciar um exercício mudava a fase para `Continue investigando` antes de qualquer ação do aluno.
2. Correções:
   - O assistente passou a ser acoplado como terceira área da trilha em telas largas e como área inferior responsiva em larguras menores.
   - A coluna do assistente passou a existir somente quando ele está visível; a trilha inativa volta a usar percurso e detalhes em duas áreas.
   - A dica de Exercícios passou a ser apresentada apenas pelo assistente.
   - O cabeçalho compacto e a divisão equilibrada de linhas deram `216 px` para detalhes e `216 px` para o assistente em `1024 × 640`.
   - O motor passou a considerar somente eventos reais do aluno ao avançar de `Investigando` para uma investigação parcial.
3. Passagem final:
   - `qa/learning-path-comparison.png` e as capturas complementares não mostram diferenças acionáveis P0, P1 ou P2.

## Checklist final

- [x] Percursos em zigue-zague e unidades claramente agrupadas.
- [x] Estados semânticos e progressão sequencial real.
- [x] Detalhes completos e títulos sem truncamento.
- [x] Dicas detalhadas somente após clique e penalização única nas Missões.
- [x] Assistente com mascote próprio, recolhível e sem sobreposição.
- [x] Ícones específicos, fonte local, créditos e precache atualizados.
- [x] Responsividade em 1366×768, 1024×640 e janela restaurada.
- [x] Teclado, foco visível e redução de movimento.
- [x] Sem erros no console e suíte automatizada aprovada.

final result: passed
