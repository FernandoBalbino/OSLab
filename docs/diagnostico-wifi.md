# Diagnóstico de Wi-Fi

Abra **Diagnóstico de Wi-Fi** na área de trabalho ou no Menu Iniciar. A rota direta é `index.html?app=wifilab`, inclusive sob `/OSLab/`.

São dez missões sequenciais, em três unidades: ativação e conexão; propriedades e perfis; sinal e consumo. Cada missão exige ações observadas na interface e, em seguida, uma resposta correta entre três alternativas no robô. O erro recebe feedback vermelho e explicação, sem revelar a alternativa correta. O acerto fica verde e libera o avanço. Cada missão vale 10 pontos; dicas e novas tentativas não descontam pontos; repetições não acumulam pontuação.

O assistente mostra as etapas, três dicas progressivas, reinício, pausa e ferramentas. As respostas da missão de propriedades são enviadas explicitamente por **Verificar informações**. Os controles do Windows, as propriedades da rede, a senha e seu QR Code são interfaces interativas e locais. Todas as redes e senhas são fictícias; não há acesso à configuração real do dispositivo.

## Organização

- `js/wifi/`: catálogo, cenários, armazenamento e motor da trilha.
- `js/apps/wifi-lab-app.js`: percurso, assistente e laboratório de sinal.
- `js/apps/wifi-ui.js`: configurações rápidas, redes, propriedades e janela de senha.
- `css/wifi.css`: superfícies Windows 11 em modo claro e adaptação da trilha.
- `assets/wifi/`: ícone ilustrado, ícones locais, licenças e gerador QR offline.
- `tests/wifi-lab.test.mjs`: fluxo das dez missões, bloqueios, pontuação, persistência e compatibilidade.

O domínio `OSLab.network` continua compartilhado com VPN, navegador e exercícios. `connectWifi(ssid, { password, autoConnect })` estende a chamada antiga de um argumento, preservando as redes conhecidas legadas. Há ações para desconectar, esquecer, alterar propriedades e revelar a senha. Os eventos `network:changed` permanecem; eventos `wifi:*` registram ações específicas da nova trilha.

`OSLab.wifiLab` fornece `getMissions`, `getProgress`, `start`, `stop`, `finish`, `restart`, `answer`, `verifyProperties`, `useHint`, `reset`, `initialize` e `subscribe`. O progresso fica em `oslab.wifi.missions.v1`. O motor suspende avaliação durante preparação e restauração. Pausar salva o cenário e restaura a rede anterior; retomar recupera a tentativa, inclusive a pergunta e seu feedback. O coordenador suspende a trilha ao iniciar outra atividade.

## Validação

```powershell
node tests/run-tests.js
node --test tests/wifi-lab.test.mjs
node --test tests/digital-life.test.mjs
git diff --check
```

A simulação de sinal usa quatro posições determinísticas: 24%, 43%, 61% e 91%, representando distância e obstáculos. Clique ou Tab/Enter move o computador. A conclusão exige a consulta ao laboratório e uma nova posição com pelo menos 70%. O modelo é didático e não realiza medição de rádio.

Os controles avançados de IP/DNS permanecem em **Configurações avançadas de rede** para os exercícios antigos. A trilha de Wi-Fi não exige comandos, IP manual, DNS ou gateway. Funções externas às missões, como firewall e limite numérico de dados, apresentam explicações locais.

Veja `diagnostico-wifi-assets.md` para fontes e prompt do ícone e `../design-qa.md` para as evidências de comparação visual.
