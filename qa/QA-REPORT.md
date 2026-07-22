# Relatório de QA — OSLab Missões

## Escopo verificado

- login do perfil Aluno com a senha `alunos2026`;
- múltiplas janelas, minimizar e restaurar pela barra de tarefas;
- sistema de arquivos hierárquico, cópia por `sourceId`, movimento preservando ID, Lixeira e pesquisa recursiva;
- papéis de parede, volume, estado mudo e persistência;
- Gerenciador de Tarefas com processos dinâmicos e protegidos;
- progressão, pontuação, medalhas, reinício, abandono e retomada das missões;
- área de trabalho com fluxo automático por colunas e limite acima da barra de tarefas;
- caminhos relativos e `.nojekyll` para GitHub Pages.

## Verificações automatizadas

Comando: `node tests/run-tests.js`.

- todos os arquivos JavaScript passam em `node --check`;
- todas as referências raster estáticas existem;
- catálogo contém 12 missões lineares com os contratos esperados;
- mover preserva o ID e copiar cria novo ID com `sourceId`;
- processos do sistema são protegidos e aplicativos podem ser encerrados;
- a missão final não pode concluir antes de o cenário possuir todos os IDs.

Resultado final: **6/6 verificações aprovadas**.

## Testes manuais obrigatórios

1. Pasta com nome provisório/incorreto não conclui; renomear para `Atividades Escolares` conclui.
2. Copiar o DOCX não conclui a missão de mover; excluir a cópia e mover o original conclui com o mesmo ID.
3. Restaurar outro item não conclui; restaurar `atividade-importante.docx` ao local original conclui.
4. O X do Editor travado não fecha nem conclui; finalizar Configurações não conclui; finalizar o Editor no Gerenciador remove processo/janela e conclui.
5. Atualizar durante a missão de janelas recria o Editor e informa `Missão restaurada`.
6. Progresso concluído permaneceu após recarregar e realizar novo login.
7. O início/reinício limpa itens e processos da própria missão antes de preparar o novo cenário; há teste de regressão para duplicação.
8. A limpeza usa `missionId` e preserva itens sem `createdByMission`; o teste unitário cobre a separação da árvore normal.

## Caminhos de sucesso

As missões 1 a 11 foram executadas sequencialmente no navegador. A missão 12 foi validada com os três movimentos, volume em 20%, Lixeira vazia e Google fechado como estados simultâneos. Um defeito encontrado durante o teste — comparação de IDs ainda indefinidos — foi corrigido com uma barreira explícita de cenário pronto e ganhou teste de regressão.

## Ícones

Foram analisadas 152 imagens PNG/JPG/WebP: nenhuma inválida ou totalmente transparente. Todas as referências estáticas resolvem para arquivos existentes. Processos, aplicativos, arquivos, ações, categorias, estados e notificações usam ícones raster com fallback central e diagnóstico de falha.

## Limitações intencionais

- apenas a página Processos do Gerenciador de Tarefas é funcional; as demais páginas são informativas;
- o login e todo o estado são simulações locais, portanto não oferecem autenticação real entre dispositivos;
- a tela cheia depende da permissão concedida pelo navegador após interação do usuário.
