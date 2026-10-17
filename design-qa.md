# Diagnóstico de Wi-Fi — verificação visual e funcional

**final result: passed**

## Referências e comparação

Referências fornecidas pelo usuário: `C:/Users/Pichau/Desktop/windows.png`, `C:/Users/Pichau/AppData/Local/Temp/codex-clipboard-c9e15537-96d0-439c-a5a5-6b992ebe0480.png`, `C:/Users/Pichau/AppData/Local/Temp/codex-clipboard-22d42aaa-018d-46e6-b6ff-9cde26c3876e.png` e a referência posterior `C:/Users/Pichau/AppData/Local/Temp/codex-clipboard-0a1955c4-1bc3-4dae-994b-3f2d11bd5810.png`.

As capturas originais são escuras. A conversão para modo claro e o uso de redes escolares fictícias foram pedidos explicitamente. A comparação avalia geometria e controles, sem exigir igualdade de pixels entre paletas e textos diferentes.

- Comparação focada, lado a lado, em escala de um pixel de imagem por pixel CSS: `qa-evidence/wifi/19-comparacao-final.png`. Recorte da referência posterior: 360 × 335, origem (14,6); recorte da implementação: 360 × 335, origem (1548,685) da captura 1920 × 1080.
- Tela completa do painel: `qa-evidence/wifi/14-quick-final-1920.png`.
- Lista de redes: `qa-evidence/wifi/15-redes-final-1920.png`.
- Propriedades: `qa-evidence/wifi/16-propriedades-final-1920.png`.
- Chromebook: `qa-evidence/wifi/24-quick-1366.png` e `qa-evidence/wifi/26-fluxo-teclado-1366.png`, 1366 × 768.
- Celular: `qa-evidence/wifi/22-sinal-mobile-full.png` e `qa-evidence/wifi/23-quick-mobile.png`, 390 × 844.

Foram usadas capturas completas para os viewports emulados; o recorte direto do navegador e capturas normais após resize produziram escala incorreta e não foram usados para aprovação. A avaliação em viewports emulados usou também teclado e medidas do DOM, evitando a distorção de coordenadas do clique da ferramenta de captura.

## Histórico de correções

1. **P2 — grade e separadores:** inicialmente os botões mediam aproximadamente 95,33 × 48 e o painel 360 × 333. Ajustados padding, espaço das legendas e seções. A versão final mede 360 × 335, botões 96 × 48, margem esquerda de 24 e superior de 23, intervalos horizontais de 12 e distância vertical entre inícios das linhas de 96. Área de volume: 73; rodapé: 48. Evidências antes/depois: `05-comparacao-antes.png`, `19-comparacao-final.png` e `quick-final-metrics.json`.
2. **P2 — ícones e setas:** centralizados os ícones, acrescentada a seta de acessibilidade e os indicadores laterais; trocado o CC genérico pelo glifo oficial de legendas internacionais. O ícone ilustrado conserva cores e transparência.
3. **P1 — painel fechando ao selecionar:** interrompida a propagação de cliques dos controles que atualizam a lista. Repetidos conexão, erro de autenticação, seleção e avanço pelas dez missões.
4. **P2 — robô sobre o mapa:** o laboratório ocupa a área ao lado do assistente no desktop; no celular, o conteúdo termina antes do robô, com rolagem independente. Medidas em 390 × 844: conteúdo até y=538; robô a partir de y=540, altura máxima 250. O botão de rede permanece acessível no celular.

## Superfícies avaliadas

- **Tipografia:** superfícies Windows com fonte de sistema, títulos de 28 px e texto de controles de 12–14 px; trilha e robô reutilizam a tipografia educacional existente.
- **Espaçamento:** grade, linhas, separadores, margens, bordas e rodapé comparados no recorte focado. Propriedades usam conteúdo de até 1000 px e a navegação de Configurações existente.
- **Cores:** superfícies claras, azul de destaque, texto escuro e feedback vermelho/verde com rótulos textuais.
- **Assets:** arquivos locais, SVGs das fontes registradas, glifos oficiais, PNG ilustrado com alpha e QR gerado dos dados exibidos. A comparação de cores do screenshot escuro é uma diferença intencional.
- **Conteúdo:** rótulos em português com acentuação; SSIDs e senhas fictícios; feedback explica a ação realizada e a alternativa selecionada.

## Cenários executados

As dez missões foram percorridas pela interface até **10/10 e 100/100 pontos**, incluindo senha incorreta, senha com QR, envio incorreto/correto das propriedades, esquecer e reconectar, conexão automática, mudança de posição por Enter e conexão limitada. Evidência: `qa-evidence/wifi/12-dez-missoes-concluidas.png`.

Foram verificados resposta errada/correta, bloqueio antes do acerto, próxima missão, pausa, retomada e recarga durante a pergunta final. Os testes automatizados cobrem ainda reinício, repetição sem pontos duplicados, restauração de rede, sequenciamento e compatibilidade das chamadas antigas.

A recarga com o servidor HTTP de QA desligado preservou a entrada, os arquivos e a missão, comprovada em `qa-evidence/wifi/27-offline-reload.png`. A procura assíncrona por atualização do Service Worker gerava uma rejeição nesse cenário; ela agora é tratada sem retirar o estado de aplicativo pronto offline. Há um teste de regressão específico para essa falha, totalizando dez cenários na suíte Wi-Fi/PWA.

Não houve overflow horizontal em 1920 × 1080, 1366 × 768 ou 390 × 844. O acesso final limpo no servidor local de QA não apresentou erros de console. Registros de uma origem anterior de desenvolvimento com múltiplos caches/versões foram excluídos dessa conclusão; as correções foram verificadas em uma origem nova.

## Refinamentos opcionais

Os nomes de rede e o estado dos controles mudam conforme o cenário; a primeira referência tem SSID mais longo e quebrado em duas linhas. O layout reserva a mesma altura para a legenda. A simulação de sinal usa posições e obstáculos representados didaticamente, e não uma medição física de radiofrequência.
