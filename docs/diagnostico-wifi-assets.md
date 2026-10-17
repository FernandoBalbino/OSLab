# Assets do Diagnóstico de Wi-Fi

Todos os arquivos usados durante a execução são locais e estão no precache.

## Fontes

- **win11-svelte**, revisão `5dfd1f834e520825936da63675f917e063ae07b7`: `public/img/icon/ui/` fornece Wi-Fi, avião, acessibilidade, voltar, atualizar, cadeado, alto-falante, brilho, Bluetooth e economia. Fonte: https://github.com/yashash-pugalia/win11-svelte. Licença MIT em `assets/wifi/LICENSE-win11-svelte.txt`.
- **Microsoft Fluent System Icons**, revisão `a347af95478f989038cccbf085978865264c048a`: SVGs de informações, chave, configurações, folha, seta, roteador, computador, ferramentas e mais opções. Fonte: https://github.com/microsoft/fluentui-system-icons. Licença MIT em `assets/wifi/LICENSE-Fluent.txt`.
- **Microsoft Windows developer documentation**: imagens dos glifos `ClosedCaptionsInternational` (F15F) e `SettingsDisplaySound` (E7F3), usadas em `captions.png` e `audio-output.png`. Fonte: https://github.com/MicrosoftDocs/windows-dev-docs/tree/docs/hub/apps/design/iconography/images/segoe-fluent-icons. Licença da documentação em `assets/wifi/LICENSE-MicrosoftDocs.txt`. Catálogo: https://learn.microsoft.com/windows/apps/design/iconography/segoe-fluent-icons-font.
- **win11React**, revisão já utilizada no OSLab `afb02e797106c208314abbf837ec11bf50da9d62`: fonte de ícones, categorias de Configurações e referências de superfícies Windows existentes. Fonte: https://github.com/blueedgetechno/win11React. Créditos e CC0 já registrados em `THIRD_PARTY_NOTICES.md`.
- **QR Code Generator**, Kazuhiko Arase, revisão `83b7e8fe3fddd3b0368dbafd6ce56995bd25e3c8`: `js/dist/qrcode.js`, sem dependências de execução. Fonte: https://github.com/kazuhikoarase/qrcode-generator. Licença MIT em `assets/wifi/vendor/LICENSE-qrcode.txt`. O QR é gerado dos dados fictícios efetivamente exibidos, com escape de caracteres do formato Wi-Fi.

## Ícone ilustrado original

`assets/wifi/trail-icon.png`: PNG 1254 × 1254, com transparência, gerado com a ferramenta integrada de imagens da OpenAI para este projeto em 17/10/2026. Foi inspecionado antes da integração. Referência de estilo: ícone existente de Usuários e Permissões; sem reutilização de marca ou logotipo.

Prompt utilizado:

> Use case: stylized-concept. Asset type: transparent raster desktop application icon for an educational Windows 11 simulator, recognizable at 48 px and 64 px. Primary request: a polished Fluent-inspired 3D illustration for Wi-Fi diagnosis and maintenance. Subject: three broad rounded blue/cyan Wi-Fi arcs above a small rounded blue/violet wireless router, with a simple metallic silver maintenance wrench overlapping one lower corner. Style: sculpted translucent glasslike rounded surfaces, blue-to-cyan gradients with a restrained violet accent, crisp bright beveled edges, soft studio highlights, simple coherent silhouette. Match the existing blue/cyan/violet glasslike OSLab users-and-permissions app icon palette and finish. Composition: square canvas, one centered balanced group, modest 8 percent transparent padding on every side, clearly separated forms that remain legible at small sizes. Scene/backdrop: genuinely transparent background, preserving alpha. Constraints: no text, letters, numbers, logos, watermark, square app tile, frame, scene background, external glow, or scattered decorative details. Use only Wi-Fi arcs, router, and wrench.
