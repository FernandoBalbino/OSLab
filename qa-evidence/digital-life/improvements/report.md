# Conferência de Minha Primeira Vida Digital — 11/10/2026

Resultado: aprovado para publicação. Cache: `oslab-offline-v31`.

- `node tests/run-tests.js`: 24/24 verificações aprovadas.
- `node --test tests/digital-life.test.mjs`: 7/7 testes aprovados; incluem as 12 missões, credenciais derivadas, código exclusivo Netflix, abas, suspensão, persistência e Novo aluno.
- Fluxo manual das 12 missões concluído pelo aluno de teste. Evidência: `12-missions-complete.jpg`.
- O código Netflix exige leitura no Gmail; copiar funciona; antes da leitura e com código incorreto o avanço permanece bloqueado. O e-mail inicial foi conservado e a caixa manteve somente uma mensagem de verificação.
- As quatro missões de retorno exigiram sair/entrar, e o perfil Netflix e o favorito Spotify foram preservados. A pasta Meus Documentos permaneceu após recarregamento.
- Os oito serviços foram conferidos em 1366×768 e 1024×640, com janelas maximizadas e restauradas. Nenhum transbordamento horizontal. Logotipos locais, ícones de caixa de entrada, controles de reprodução, botões Sair com fundo e Favoritar/Favoritada conferidos. Medições em `responsive-measurements.json`.
- Painel das missões restaurado ao formato pequeno/flutuante, inicialmente recolhido. Expandir/recolher funciona e o texto completo não depende do botão Dica.
- Netflix: mosaico e fontes oficiais locais, wordmark, idioma, Entrar, Email e Vamos lá; cadastro claro com aparelhos fornecidos, confirmação por código, senha, planos e cartão. Comparação em `netflix-comparison-final.jpg`; detalhes em `/design-qa.md`.
- Console online sem avisos/erros na conferência final.
- Offline: o servidor local foi desligado; o documento recarregou, o progresso 12/12 e as sessões permaneceram, e os oito serviços abriram. A nova capa Netflix, fonte, logotipo e controles também renderizaram sem servidor. Evidências em `offline-netflix.jpg` e `offline-measurements.json`. As medições instantâneas distinguem imagens pendentes de falhas; imagens com carregamento lazy podem permanecer pendentes até entrar na área visível.
- Novo aluno: Cancelar preservou 12/12; confirmar voltou a 0/12 e eliminou as referências dos serviços nas abas abertas. Evidência: `trail-new-student.jpg`.
- Os 307 recursos do manifesto existem localmente. Formulários continuam locais; os campos de cartão continuam somente leitura e as senhas não entram em URL, eventos ou rascunhos persistentes.
