# Netflix — Design QA

final result: passed

Comparação visual conjunta: [netflix-comparison-final.jpg](qa-evidence/digital-life/improvements/netflix-comparison-final.jpg). Artefato reproduzível: [netflix-comparison.html](qa-evidence/digital-life/improvements/netflix-comparison.html).

## Referências e normalização

Fontes visuais: `qa-evidence/digital-life/improvements/netflix-reference.png` (1910×1027), `netflix-account-reference.png` (1902×932) e imagem dos aparelhos fornecida pelo usuário, salva em `assets/digital/netflix/devices.png`.

Implementação: `netflix-entry-release.jpg` e `netflix-account-release.jpg`. Viewport CSS 1910×1043, site de entrada 1910×907. A captura do navegador produziu 1662×1043 pixels e recortou a borda direita; a comparação aplica o mesmo recorte à fonte, removendo 120 pixels de Chrome da referência e 88 pixels da implementação. Não há comparação de diferenças causadas pela moldura nativa. Escala dos recortes idêntica, sem reamostragem de arquivos. O enquadramento focado usa a mesma região de título/textos/formulário em ambas as imagens.

Estado: Netflix sem sessão na entrada; cadastro por email no padrão claro. A referência de cadastro usa um link; o produto conserva o código exclusivo da missão 04 e a criação de senha, conforme solicitado anteriormente.

## Iterações

1. Conferência inicial: composição/tipografia e imagens corretas, mas enquadramento e ritmo do preço/formulário pediam ajuste. O painel grande de instruções também foi rejeitado pelo usuário.
2. Ajustes: espaçamento do preço e convite, largura de 664 pixels do formulário, enquadramento do mosaico, fonte Netflix Sans local, reset da rolagem ao navegar e retorno do assistente pequeno/flutuante.
3. Comparação final conjunta, incluindo recorte focado: nenhum problema P0/P1/P2 em aberto.

## Superfícies verificadas

- Tipografia: Netflix Sans oficial; título de 64 pixels no viewport de referência, peso 900, mesma quebra de linhas; preço de 20 pixels e convite de 16. Cadastro com título de 32 pixels, peso 700.
- Espaçamento/layout: wordmark de 150 pixels, cabeçalho centralizado, título e formulário centralizados; campos/botão de 56 pixels; cadastro em coluna de 475 pixels com cabeçalho separado e rodapé.
- Cores: fundo escuro com sobreposição no mosaico, texto branco e ação vermelha; cadastro cinza claro conforme a captura e texto preto. Foco visível nos controles.
- Imagens: mosaico e wordmark oficiais locais, fontes locais e aparelhos fornecidos. Nenhum logotipo foi substituído por emoji. Ícones de idioma/chevron em SVG local da biblioteca Fluent.
- Conteúdo: texto da entrada conforme a referência. Cadastro adapta Enviar link para Enviar código e inclui os aparelhos, preservando a atividade pelo Gmail.
- Responsividade: conferida nas quatro combinações 1366×768/1024×640 e maximizado/restaurado; sem transbordamento horizontal. Páginas longas têm rolagem vertical.

## Refinamentos não bloqueantes

P3: há pequenas diferenças de recorte do mosaico e de antialiasing entre a captura enviada e o navegador de teste. O ativo é o mesmo mosaico oficial; não se declara identidade de pixels. A borda direita não capturada contém apenas parte do fundo, sem controles.

## Checklist final

- [x] Entrada e cadastro comparados no mesmo artefato.
- [x] Tipografia, layout, cores, imagens e texto conferidos.
- [x] Verificação Gmail, cadastro, planos, cartão e perfil testados.
- [x] Assistente pequeno e minimizável restaurado.
- [x] Testes, layouts e recarregamento offline aprovados.
