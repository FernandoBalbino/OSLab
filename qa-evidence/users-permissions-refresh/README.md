# Windows e Usuários e Permissões — 13/10/2026

Versão final com aparência somente clara, conforme a última orientação do usuário. A pesquisa Google simulada também usa fundo claro e o botão Pesquisar possui espaço próprio dentro da barra. O cache offline foi atualizado para `oslab-offline-v36`.

## Evidências anteriores à última correção do navegador

- Suíte existente ampliada: 25/25 verificações aprovadas, incluindo cenários negativos de conta, arquivo, UAC, retomada e migração para claro.
- Sete missões executadas pela interface com três contas fictícias: criação de conta padrão, personalização, isolamento de arquivos, instalações por usuário e compartilhada, UAC cancelado e autorizado, Leitura e Modificação no mesmo documento e desafio final. Resultado: 7/7, 700 pontos.
- Arraste à direita com assistente aberto e recolhido, minimização e maximização/restauração: posição preservada. A seleção de Missão 6 e o passo a passo na retomada foram observados pela interface.
- Novos testes e validações offline/visuais após a última correção do navegador não foram executados, por instrução do usuário para publicar imediatamente sem testes.

## Capturas

- [Sistema claro](01-sistema-claro.jpg)
- [Contas com os ícones originais](02-contas-claro.jpg)
- [Trilha concluída](03-trilha-concluida.jpg)
- [Resumo permanente no bot](04-bot-passo-a-passo.jpg)

## Referências e Figma

Os ícones de Configurações usam o arquivo original `SettingsIcons.woff2` e os códigos de `settingsData.json` do [win11React, commit afb02e7](https://github.com/blueedgetechno/win11React/tree/afb02e797106c208314abbf837ec11bf50da9d62). Outros ícones educacionais usam Microsoft Fluent; veja `THIRD_PARTY_NOTICES.md`.

O arquivo [OSLab — Windows 11 e Usuários e Permissões](https://www.figma.com/design/nQcOf5HJWpwz0QRx52iWZe) foi criado. A inserção dos componentes editáveis está pendente: a ferramenta Figma recusou a operação por limite de chamadas do plano Starter. O arquivo ainda não contém as telas.
