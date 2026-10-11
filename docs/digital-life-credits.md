# Créditos — Minha Primeira Vida Digital

## Interfaces de referência

- Google: capturas fornecidas pelo usuário para pesquisa e criação de conta em etapas, com tema escuro.
- Gmail: [Correio LAN](https://github.com/FernandoBalbino/correio-lan), de Fernando Balbino. Referência do cabeçalho, navegação lateral, caixa e leitura; commit consultado `39c244fd7b2fb64b114f3fe5de32dbc9ede8744c`. A adaptação usa dados locais do OSLab, sem o backend LAN.
- Netflix: [Netflix Design System 2024 — Website](https://www.figma.com/design/MeX5noDNCduKfZYtWHJPxB/Netflix-Design-System-2024--Website-ver.--Community-?node-id=0-1), arquivo fornecido pelo usuário. Contextos extraídos: formulário de entrada `212:21962`, perfis `90:2691`, cores, tipografia e metadados do kit. Avatar local extraído do componente.
- YouTube: [YouTube UI — Free UI Kit Recreated](https://www.figma.com/design/XUaWXtiDOft4IzVDuA6Ofe/Youtube-UI---Free-UI-Kit--Recreated---Community-?node-id=1-13485), arquivo fornecido pelo usuário. Telas de início `5:1670` e vídeo `5:25` inspecionadas; barra lateral `5:4322` e cabeçalho `5:4457` extraídos. Marca e wordmark SVG locais vêm do cabeçalho.

As referências foram convertidas para HTML/CSS/JavaScript puro. Os formulários de cadastro, planos e cartão de demonstração são composições educacionais do OSLab a partir dos componentes disponíveis. A cota Starter do conector Figma interrompeu a extração dos componentes restantes, incluindo cartão de vídeo e player. Portanto não foi possível concluir uma comparação integral de todos os componentes com o arquivo original. As capturas completas já obtidas foram usadas como referência visual.

Marcas e identidade dos serviços identificam as simulações educacionais. As contas e conteúdos desta trilha são fictícios. Não há vínculo, transmissão de dados ou autenticação com os serviços reais.

## Fontes

Roboto regular e negrito, obtidos dos recursos públicos do Correio LAN. Licença Apache 2.0 em [Roboto-LICENSE.txt](../assets/digital/gmail/Roboto-LICENSE.txt).

## Fotografias Pexels

Cada página abaixo foi consultada em 11/10/2026 e identificava o recurso como gratuito para uso sob a [licença Pexels](https://www.pexels.com/license/). Arquivos JPEG locais otimizados, largura até 960 px e qualidade 75. A imagem de banco não representa um filme ou vídeo real. Os títulos são fictícios e podem reutilizar uma fotografia.

| Arquivo local | Autor | Origem |
|---|---|---|
| 940381.jpg | Bogdan R. Anton | [Foto 940381](https://www.pexels.com/photo/mountain-940381/) |
| 1658583.jpg | Francesco Paggiaro | [Foto 1658583](https://www.pexels.com/photo/mountain-1658583/) |
| 1677338.jpg | Brian de Karma | [Foto 1677338](https://www.pexels.com/photo/mountain-1677338/) |
| 2212861.jpg | Lucas Pezeta | [Foto 2212861](https://www.pexels.com/photo/mountain-2212861/) |
| 3049304.jpg | JACK REDGATE | [Foto 3049304](https://www.pexels.com/photo/mountain-3049304/) |
| 13037919.jpg | Luis Daniel Castillo | [Foto 13037919](https://www.pexels.com/photo/a-view-of-a-city-at-night-from-a-forest-13037919/) |
| 325188.jpg | Summer Stock | [Foto 325188](https://www.pexels.com/photo/aerial-view-of-city-at-night-325188/) |
| 11034190.jpg | Megs Harrison | [Foto 11034190](https://www.pexels.com/photo/a-city-skyline-near-the-ocean-at-night-11034190/) |
| 4560543.jpg | Abet Llacer | [Foto 4560543](https://www.pexels.com/photo/night-cityscape-near-ocean-and-mountains-under-sky-at-sunset-4560543/) |
| 18353682.jpg | Stephen Leonardi | [Foto 18353682](https://www.pexels.com/photo/illuminated-city-on-sea-coast-at-night-18353682/) |
| 450035.jpg | Mateusz Dach | [Foto 450035](https://www.pexels.com/photo/computer-set-up-on-a-workspace-450035/) |
| 3747486.jpg | Polina Zimmerman | [Foto 3747486](https://www.pexels.com/photo/photo-of-computers-near-window-3747486/) |

Metadados e links de download em [photo-credits.json](../assets/digital/photo-credits.json). Mapeamento dos títulos em [digital-content.js](../js/digital/digital-content.js). Todas as fotografias, fontes e marcas utilizadas pela nova trilha estão no manifesto de cache.

## Marcas e ícones locais (11/10/2026)

- Spotify: símbolos branco e verde do [kit oficial](https://newsroom.spotify.com/media-kit/logo-and-brand-assets/).
- Discord: Clyde branco e Blurple da [página oficial de marcas](https://discord.com/branding).
- Google, Gmail e Drive: arquivos oficiais de branding servidos pelo Google em `www.gstatic.com/images/branding/product/2x/`.
- Outlook: SVG oficial do CDN Office/Fabric da Microsoft.
- Yahoo: ícone e marca da [página corporativa oficial](https://www.yahooinc.com/).
- Netflix: ícone oficial do CDN Netflix `assets.nflxext.com`.
- YouTube: SVGs locais extraídos do kit Figma fornecido, preservados.
- Controles de interface: [Fluent System Icons](https://github.com/microsoft/fluentui-system-icons), Microsoft, licença MIT incluída em `assets/digital/ui/LICENSE`.

As URLs exatas dos arquivos baixados estão em [sources.json](../assets/digital/brands/sources.json). As marcas mantêm a titularidade dos respectivos proprietários.

Ícone exclusivo da trilha: imagem gerada com a ferramenta imagegen integrada. Arquivo `assets/digital/trail-icon.png`, fundo transparente. [Prompt final e método](digital-life-icon-prompt.md).

## Netflix — novas referências de entrada e cadastro

A tela inicial segue a captura fornecida em 11/10/2026. Mosaico, wordmark e fontes Netflix Sans foram obtidos da página oficial https://www.netflix.com/br/ e salvos localmente para uso offline. URLs individuais e data de coleta: `assets/digital/netflix/landing-sources.json`. A imagem dos aparelhos (`devices.png`) foi fornecida pelo usuário. O cadastro conserva a verificação por código no Gmail, embora a referência visual use um link de inscrição.
